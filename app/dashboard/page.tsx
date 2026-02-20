export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getStockPrices } from "@/lib/stock-api";
import {
  calculateCashTotal,
  calculateInvestmentValue,
  calculateInvestmentCost,
} from "@/lib/calculations";
import { saveSnapshot, getUserPreferences } from "@/lib/actions";
import { getExchangeRates, convertToBaseCurrency } from "@/lib/exchange-rates";
import type { ExchangeRates } from "@/lib/exchange-rates";
import { SummaryCards } from "@/components/summary-cards";
import { BaseCurrencySelector } from "@/components/base-currency-selector";
import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { GainsChart } from "@/components/charts/gains-chart";
import { ExpenseBreakdownChart } from "@/components/charts/expense-breakdown-chart";
import { HoldingsOverview } from "@/components/holdings-overview";
import type { Account, CashHolding, StockHolding, Expense } from "@/lib/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Get current month date range
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  // Fetch all user data in parallel
  const [accountsRes, snapshotsRes, expensesRes, preferences] = await Promise.all([
    supabase
      .from("accounts")
      .select("*, cash_holdings(*), stock_holdings(*)")
      .order("created_at"),
    supabase
      .from("net_worth_snapshots")
      .select("*")
      .order("snapshot_date", { ascending: true })
      .limit(90),
    supabase
      .from("expenses")
      .select("*")
      .gte("expense_date", currentMonthStart)
      .order("expense_date", { ascending: false }),
    getUserPreferences(),
  ]);

  const accounts = (accountsRes.data ?? []) as (Account & {
    cash_holdings: CashHolding[];
    stock_holdings: StockHolding[];
  })[];
  const snapshotsRaw = snapshotsRes.data ?? [];
  const currentMonthExpenses = (expensesRes.data ?? []) as Expense[];
  const baseCurrency = preferences.base_currency;

  // Fetch exchange rates for base currency
  const exchangeRates = await getExchangeRates(baseCurrency);

  // Collect all stock tickers and fetch prices
  const allStockHoldings = accounts.flatMap((a) => a.stock_holdings);
  const tickers = allStockHoldings.map((h) => h.ticker);
  const prices = tickers.length > 0 ? await getStockPrices(tickers) : {};

  // Separate accounts by type
  const cashAccounts = accounts.filter((a) => a.type === "cash");
  const investmentAccounts = accounts.filter((a) => a.type === "investment");
  const cpfAccounts = accounts.filter((a) => a.type === "cpf");
  const srsAccounts = accounts.filter((a) => a.type === "srs");

  // Calculate totals with currency conversion
  // Cash total (only from cash-type accounts)
  const cashOnlyHoldings = cashAccounts.flatMap((a) => a.cash_holdings);
  const cashTotal = calculateCashTotal(cashOnlyHoldings, baseCurrency, exchangeRates);

  // CPF total
  const cpfHoldings = cpfAccounts.flatMap((a) => a.cash_holdings);
  const cpfTotal = calculateCashTotal(cpfHoldings, baseCurrency, exchangeRates);

  // SRS total
  const srsHoldings = srsAccounts.flatMap((a) => a.cash_holdings);
  const srsTotal = calculateCashTotal(srsHoldings, baseCurrency, exchangeRates);

  // Stock prices include their native currency, convert to base currency
  const investmentValue = calculateInvestmentValue(
    allStockHoldings,
    prices,
    baseCurrency,
    exchangeRates
  );
  const investmentCost = calculateInvestmentCost(allStockHoldings);

  const totalNetWorth = cashTotal + investmentValue + cpfTotal + srsTotal;
  const totalGainLoss = investmentValue - investmentCost;
  const gainLossPercent =
    investmentCost > 0 ? (totalGainLoss / investmentCost) * 100 : 0;

  // Save today's snapshot (always in current base currency value)
  const today = new Date().toISOString().split("T")[0];
  if (accounts.length > 0) {
    try {
      await saveSnapshot(totalNetWorth, cashTotal, investmentValue, baseCurrency);
    } catch {
      // Snapshot save is best-effort
    }
  }

  // Convert historical snapshots to current base currency
  // and update today's snapshot with current calculated values
  const snapshots = snapshotsRaw.map((s) => {
    if (s.snapshot_date === today) {
      // Use current calculated values for today
      return {
        ...s,
        total_value: totalNetWorth,
        cash_value: cashTotal,
        investment_value: investmentValue,
        currency: baseCurrency,
      };
    }

    // Convert historical snapshots to current base currency
    const snapshotCurrency = s.currency || "USD";
    if (snapshotCurrency !== baseCurrency) {
      return {
        ...s,
        total_value: convertToBaseCurrency(
          Number(s.total_value), snapshotCurrency, baseCurrency, exchangeRates
        ),
        cash_value: convertToBaseCurrency(
          Number(s.cash_value), snapshotCurrency, baseCurrency, exchangeRates
        ),
        investment_value: convertToBaseCurrency(
          Number(s.investment_value), snapshotCurrency, baseCurrency, exchangeRates
        ),
        currency: baseCurrency,
      };
    }
    return s;
  });

  // If today's snapshot doesn't exist in the fetched data, add it
  const hasTodaySnapshot = snapshotsRaw.some((s) => s.snapshot_date === today);
  if (!hasTodaySnapshot && accounts.length > 0) {
    snapshots.push({
      id: "current",
      user_id: "",
      total_value: totalNetWorth,
      cash_value: cashTotal,
      investment_value: investmentValue,
      snapshot_date: today,
      currency: baseCurrency,
      created_at: new Date().toISOString(),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your financial overview</p>
        </div>
        <BaseCurrencySelector currentCurrency={baseCurrency} />
      </div>

      <SummaryCards
        totalNetWorth={totalNetWorth}
        cashTotal={cashTotal}
        investmentValue={investmentValue}
        cpfSrsTotal={cpfTotal + srsTotal}
        totalGainLoss={totalGainLoss}
        baseCurrency={baseCurrency}
      />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="min-w-0">
          <NetWorthChart snapshots={snapshots} baseCurrency={baseCurrency} />
        </div>
        <div className="min-w-0">
          <AllocationChart
            cashTotal={cashTotal}
            investmentValue={investmentValue}
            cpfTotal={cpfTotal}
            srsTotal={srsTotal}
            baseCurrency={baseCurrency}
          />
        </div>
        <div className="min-w-0">
          <ExpenseBreakdownChart
            expenses={currentMonthExpenses}
            title="This Month's Expenses"
            baseCurrency={baseCurrency}
          />
        </div>
      </div>

      {snapshots.length > 1 && (
        <GainsChart snapshots={snapshots} />
      )}

      <HoldingsOverview
        accounts={accounts}
        prices={prices}
        baseCurrency={baseCurrency}
        exchangeRates={exchangeRates}
      />
    </div>
  );
}
