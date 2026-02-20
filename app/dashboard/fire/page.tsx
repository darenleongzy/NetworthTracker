export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getStockPrices } from "@/lib/stock-api";
import {
  calculateCashTotal,
  calculateInvestmentValue,
} from "@/lib/calculations";
import { getUserPreferences } from "@/lib/actions";
import { getExchangeRates, convertToBaseCurrency } from "@/lib/exchange-rates";
import { FireCalculator } from "@/components/fire-calculator";
import type { Account, CashHolding, StockHolding, Expense } from "@/lib/types";

export default async function FirePage() {
  const supabase = await createClient();

  // Calculate date range for last 3 months of expenses
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
  const threeMonthsAgoStr = threeMonthsAgo.toISOString().split("T")[0];

  // Fetch all user data in parallel
  const [accountsRes, expensesRes, preferences] = await Promise.all([
    supabase
      .from("accounts")
      .select("*, cash_holdings(*), stock_holdings(*)")
      .order("created_at"),
    supabase
      .from("expenses")
      .select("*")
      .gte("expense_date", threeMonthsAgoStr)
      .order("expense_date", { ascending: false }),
    getUserPreferences(),
  ]);

  const accounts = (accountsRes.data ?? []) as (Account & {
    cash_holdings: CashHolding[];
    stock_holdings: StockHolding[];
  })[];
  const expenses = (expensesRes.data ?? []) as Expense[];
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

  // Calculate cash totals
  const cashOnlyHoldings = cashAccounts.flatMap((a) => a.cash_holdings);
  const cashTotal = calculateCashTotal(cashOnlyHoldings, baseCurrency, exchangeRates);

  // CPF total
  const cpfHoldings = cpfAccounts.flatMap((a) => a.cash_holdings);
  const cpfTotal = calculateCashTotal(cpfHoldings, baseCurrency, exchangeRates);

  // SRS total
  const srsHoldings = srsAccounts.flatMap((a) => a.cash_holdings);
  const srsTotal = calculateCashTotal(srsHoldings, baseCurrency, exchangeRates);

  // Investment value
  const investmentValue = calculateInvestmentValue(
    allStockHoldings,
    prices,
    baseCurrency,
    exchangeRates
  );

  // Calculate net worth with and without CPF/SRS
  const netWorthWithoutCpfSrs = cashTotal + investmentValue;
  const netWorthWithCpfSrs = netWorthWithoutCpfSrs + cpfTotal + srsTotal;

  // Calculate average monthly expenses from last 3 months
  // Convert all expenses to base currency first
  const totalExpenses = expenses.reduce((sum, expense) => {
    const amountInBase = convertToBaseCurrency(
      Number(expense.amount),
      expense.currency,
      baseCurrency,
      exchangeRates
    );
    return sum + amountInBase;
  }, 0);

  // Calculate how many months we have data for (minimum 1 to avoid division by zero)
  const monthsWithData = Math.max(1, getMonthsWithExpenses(expenses));
  const averageMonthlyExpenses = totalExpenses / monthsWithData;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">FIRE Planning</h1>
        <p className="text-muted-foreground">
          Plan your path to financial independence
        </p>
      </div>

      <FireCalculator
        netWorthWithCpfSrs={netWorthWithCpfSrs}
        netWorthWithoutCpfSrs={netWorthWithoutCpfSrs}
        averageMonthlyExpenses={averageMonthlyExpenses}
        baseCurrency={baseCurrency}
      />
    </div>
  );
}

/**
 * Calculate how many distinct months have expenses in the data
 */
function getMonthsWithExpenses(expenses: Expense[]): number {
  const months = new Set<string>();
  for (const expense of expenses) {
    const date = new Date(expense.expense_date);
    months.add(`${date.getFullYear()}-${date.getMonth()}`);
  }
  return months.size;
}
