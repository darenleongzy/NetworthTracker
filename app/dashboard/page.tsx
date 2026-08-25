export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getStockPrices } from "@/lib/stock-api";
import {
  calculateCashTotal,
  calculateInvestmentValue,
  calculateInvestmentCost,
  getCurrentMonthExpenses,
} from "@/lib/calculations";
import { getUserPreferences, saveAccountSnapshots, saveSnapshot } from "@/lib/actions";
import { getExchangeRates, convertToBaseCurrency } from "@/lib/exchange-rates";
import { SummaryCards } from "@/components/summary-cards";
import { BaseCurrencySelector } from "@/components/base-currency-selector";
import { NetWorthChart } from "@/components/charts/net-worth-chart";
import { AllocationChart } from "@/components/charts/allocation-chart";
import { GainsChart } from "@/components/charts/gains-chart";
import { ExpenseBreakdownChart } from "@/components/charts/expense-breakdown-chart";
import { HoldingsOverview } from "@/components/holdings-overview";
import { AccountTypeMonthlyChart } from "@/components/charts/account-type-monthly-chart";
import { DashboardAd } from "@/components/dashboard-ad";
import { logSlowOperation } from "@/lib/performance";
import { calculateAccountTotalValue } from "@/lib/account-history";
import type {
  Account,
  AccountValueSnapshot,
  AccountWithHoldings,
  CashHolding,
  StockHolding,
  Expense,
} from "@/lib/types";

export default async function DashboardPage() {
  const pageStartedAt = Date.now();
  const supabase = await createClient();

  // Fetch all user data in parallel
  const [accountsRes, snapshotsRes, expensesRes, preferences, accountSnapshotsRes] = await Promise.all([
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
      .order("expense_date", { ascending: false }),
    getUserPreferences(),
    supabase
      .from("account_value_snapshots")
      .select("*")
      .order("snapshot_date", { ascending: true }),
  ]);

  const accounts = (accountsRes.data ?? []) as (Account & {
    cash_holdings: CashHolding[];
    stock_holdings: StockHolding[];
  })[];
  const snapshotsRaw = snapshotsRes.data ?? [];
  const allExpenses = (expensesRes.data ?? []) as Expense[];
  const currentMonthExpenses = getCurrentMonthExpenses(allExpenses);
  const baseCurrency = preferences.base_currency;

  // Fetch exchange rates for base currency
  // Collect all stock tickers and fetch prices
  const allStockHoldings = accounts.flatMap((a) => a.stock_holdings);
  const tickers = allStockHoldings.map((h) => h.ticker);
  const [exchangeRates, prices] = await Promise.all([
    getExchangeRates(baseCurrency),
    tickers.length > 0 ? getStockPrices(tickers) : Promise.resolve({}),
  ]);

  // Separate accounts by type
  const cashAccounts = accounts.filter((a) => a.type === "cash");
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
  // Save today's snapshot (always in current base currency value)
  const today = new Date().toISOString().split("T")[0];
  // Use the current calculations for the chart so it stays fresh even when the
  // database query was made before today's snapshot upsert.
  const accountTypeSnapshotRows = (accountSnapshotsRes.data ?? []) as AccountValueSnapshot[];
  const currentAccountSnapshots: AccountValueSnapshot[] = accounts.map((account) => ({
    id: `current-${account.id}`,
    account_id: account.id,
    user_id: account.user_id,
    account_type: account.type,
    total_value: calculateAccountTotalValue(
      account as AccountWithHoldings,
      baseCurrency,
      exchangeRates,
      prices
    ),
    currency: baseCurrency,
    snapshot_date: today,
    created_at: new Date().toISOString(),
  }));
  const currentAccountIds = new Set(currentAccountSnapshots.map((snapshot) => snapshot.account_id));
  const accountTypeSnapshots = [
    ...accountTypeSnapshotRows.filter(
      (snapshot) =>
        snapshot.snapshot_date !== today || !currentAccountIds.has(snapshot.account_id)
    ),
    ...currentAccountSnapshots,
  ];

  if (accounts.length > 0) {
    const snapshotStartedAt = Date.now();
    try {
      await Promise.all([
        saveSnapshot(totalNetWorth, cashTotal, investmentValue, baseCurrency),
        saveAccountSnapshots(accounts, baseCurrency, exchangeRates, prices),
      ]);
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "dashboard_snapshot_save_failed",
          error: error instanceof Error ? error.message : String(error),
        })
      );
    } finally {
      logSlowOperation("dashboard_snapshot_save", snapshotStartedAt);
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

  logSlowOperation("dashboard_page_load", pageStartedAt, {
    account_count: accounts.length,
    ticker_count: tickers.length,
  });

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="app-page-header">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Overview</p>
          <h1 className="app-page-title mt-2">Your financial picture</h1>
          <p className="app-page-subtitle">Balances, progress, and spending in one focused view.</p>
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

      <div className="grid gap-5 xl:grid-cols-3">
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

      <DashboardAd />

      {snapshots.length > 1 && (
        <GainsChart snapshots={snapshots} />
      )}

      <AccountTypeMonthlyChart
        snapshots={accountTypeSnapshots}
        baseCurrency={baseCurrency}
      />

      <HoldingsOverview
        accounts={accounts}
        prices={prices}
        baseCurrency={baseCurrency}
        exchangeRates={exchangeRates}
      />
    </div>
  );
}
