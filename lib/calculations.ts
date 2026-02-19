import type { CashHolding, StockHolding } from "@/lib/types";
import type { ExchangeRates } from "@/lib/exchange-rates";
import type { StockPriceData } from "@/lib/stock-api";
import { getCurrencySymbol } from "@/lib/currencies";

export function formatCurrency(value: number, currencyCode: string = "USD"): string {
  // Use native Intl formatting with fallback for currencies not in standard list
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: currencyCode === "JPY" ? 0 : 2,
      maximumFractionDigits: currencyCode === "JPY" ? 0 : 2,
    }).format(value);
  } catch {
    // Fallback for unknown currency codes
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

/**
 * Calculate total cash in base currency
 */
export function calculateCashTotal(
  holdings: CashHolding[],
  baseCurrency: string = "USD",
  exchangeRates: ExchangeRates = {}
): number {
  return holdings.reduce((sum, h) => {
    const balance = Number(h.balance);
    if (h.currency === baseCurrency) {
      return sum + balance;
    }
    // Convert from holding currency to base currency
    const rate = exchangeRates[h.currency];
    if (!rate || rate === 0) {
      console.warn(`No exchange rate for ${h.currency}, using raw value`);
      return sum + balance;
    }
    // exchangeRates are FROM baseCurrency TO other currencies
    // So to convert FROM other TO base, we divide
    return sum + balance / rate;
  }, 0);
}

/**
 * Simple cash total without currency conversion (legacy support)
 */
export function calculateCashTotalSimple(holdings: CashHolding[]): number {
  return holdings.reduce((sum, h) => sum + Number(h.balance), 0);
}

export function calculateInvestmentValue(
  holdings: StockHolding[],
  prices: Record<string, StockPriceData>,
  baseCurrency: string = "USD",
  exchangeRates: ExchangeRates = {}
): number {
  return holdings.reduce((sum, h) => {
    const priceData = prices[h.ticker.toUpperCase()];
    if (!priceData) return sum;

    const valueInNativeCurrency = Number(h.shares) * priceData.price;

    // Convert to base currency if needed
    if (priceData.currency === baseCurrency) {
      return sum + valueInNativeCurrency;
    }

    // exchangeRates are FROM baseCurrency TO other currencies
    // So to convert FROM other TO base, we divide
    const rate = exchangeRates[priceData.currency];
    if (!rate || rate === 0) {
      console.warn(`No exchange rate for ${priceData.currency}, using raw value`);
      return sum + valueInNativeCurrency;
    }
    return sum + valueInNativeCurrency / rate;
  }, 0);
}

export function calculateInvestmentCost(holdings: StockHolding[]): number {
  return holdings.reduce(
    (sum, h) => sum + Number(h.shares) * Number(h.cost_basis_per_share),
    0
  );
}

export function calculateGainLoss(
  holdings: StockHolding[],
  prices: Record<string, StockPriceData>,
  baseCurrency: string = "USD",
  exchangeRates: ExchangeRates = {}
): { absolute: number; percent: number } {
  const currentValue = calculateInvestmentValue(holdings, prices, baseCurrency, exchangeRates);
  const costBasis = calculateInvestmentCost(holdings);
  const absolute = currentValue - costBasis;
  const percent = costBasis > 0 ? (absolute / costBasis) * 100 : 0;
  return { absolute, percent };
}
