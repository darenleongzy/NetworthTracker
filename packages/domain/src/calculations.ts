import { getCurrencySymbol } from "./currencies";
import type {
  CashHolding,
  ExchangeRates,
  Expense,
  StockHolding,
  StockPriceData,
} from "./types";

export function formatCurrency(
  value: number,
  currencyCode: string = "USD"
): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: currencyCode === "JPY" ? 0 : 2,
      maximumFractionDigits: currencyCode === "JPY" ? 0 : 2,
    }).format(value);
  } catch {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function calculateCashTotal(
  holdings: CashHolding[],
  baseCurrency: string = "USD",
  exchangeRates: ExchangeRates = {}
): number {
  return holdings.reduce((sum, holding) => {
    const balance = Number(holding.balance);
    if (holding.currency === baseCurrency) return sum + balance;

    const rate = exchangeRates[holding.currency];
    if (!rate || rate === 0) return sum + balance;
    return sum + balance / rate;
  }, 0);
}

export function calculateInvestmentValue(
  holdings: StockHolding[],
  prices: Record<string, StockPriceData>,
  baseCurrency: string = "USD",
  exchangeRates: ExchangeRates = {}
): number {
  return holdings.reduce((sum, holding) => {
    const priceData = prices[holding.ticker.toUpperCase()];
    if (!priceData) return sum;

    const value = Number(holding.shares) * priceData.price;
    if (priceData.currency === baseCurrency) return sum + value;

    const rate = exchangeRates[priceData.currency];
    if (!rate || rate === 0) return sum + value;
    return sum + value / rate;
  }, 0);
}

export function calculateInvestmentCost(holdings: StockHolding[]): number {
  return holdings.reduce((sum, holding) => {
    return sum + Number(holding.shares) * Number(holding.cost_basis_per_share);
  }, 0);
}

export function getCurrentMonthExpenses(expenses: Expense[]): Expense[] {
  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  return expenses.filter((expense) => {
    if (expense.category === "recurring") {
      return expense.expense_date <= today;
    }
    return expense.expense_date >= currentMonthStart;
  });
}
