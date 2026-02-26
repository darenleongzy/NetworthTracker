import { describe, it, expect } from "vitest";
import {
  formatCurrency,
  formatPercent,
  calculateCashTotal,
  calculateCashTotalSimple,
  calculateInvestmentValue,
  calculateInvestmentCost,
  calculateGainLoss,
} from "./calculations";
import type { CashHolding, StockHolding } from "@/lib/types";
import type { StockPriceData } from "@/lib/stock-api";

describe("formatCurrency", () => {
  it("formats USD correctly", () => {
    expect(formatCurrency(1234.56, "USD")).toBe("$1,234.56");
  });

  it("formats EUR correctly", () => {
    expect(formatCurrency(1234.56, "EUR")).toMatch(/€1,234\.56/);
  });

  it("formats GBP correctly", () => {
    expect(formatCurrency(1234.56, "GBP")).toMatch(/£1,234\.56/);
  });

  it("formats JPY without decimals", () => {
    expect(formatCurrency(1234, "JPY")).toMatch(/¥1,234/);
    expect(formatCurrency(1234, "JPY")).not.toContain(".");
  });

  it("formats negative numbers correctly", () => {
    expect(formatCurrency(-1234.56, "USD")).toBe("-$1,234.56");
  });

  it("formats zero correctly", () => {
    expect(formatCurrency(0, "USD")).toBe("$0.00");
  });

  it("defaults to USD when no currency provided", () => {
    expect(formatCurrency(1234.56)).toBe("$1,234.56");
  });

  it("handles unknown currency codes with fallback", () => {
    const result = formatCurrency(1234.56, "XYZ");
    expect(result).toContain("1,234.56");
  });

  it("uses fallback formatting for truly invalid currency codes", () => {
    // Currency codes with special characters can trigger the catch block
    const result = formatCurrency(1234.56, "INVALID_CODE_THAT_THROWS");
    // Should fall back to using getCurrencySymbol + toLocaleString
    expect(result).toContain("1,234.56");
  });
});

describe("formatPercent", () => {
  it("formats positive percentages", () => {
    expect(formatPercent(25.5)).toBe("25.50%");
  });

  it("formats negative percentages", () => {
    expect(formatPercent(-10.25)).toBe("-10.25%");
  });

  it("formats zero", () => {
    expect(formatPercent(0)).toBe("0.00%");
  });

  it("formats small percentages", () => {
    expect(formatPercent(0.5)).toBe("0.50%");
  });
});

describe("calculateCashTotal", () => {
  it("calculates total for single holding in base currency", () => {
    const holdings: CashHolding[] = [
      { id: "1", account_id: "a1", balance: 1000, currency: "USD", label: null, updated_at: "" },
    ];
    expect(calculateCashTotal(holdings, "USD", {})).toBe(1000);
  });

  it("calculates total for multiple holdings in base currency", () => {
    const holdings: CashHolding[] = [
      { id: "1", account_id: "a1", balance: 1000, currency: "USD", label: null, updated_at: "" },
      { id: "2", account_id: "a1", balance: 2000, currency: "USD", label: null, updated_at: "" },
    ];
    expect(calculateCashTotal(holdings, "USD", {})).toBe(3000);
  });

  it("converts foreign currency to base currency", () => {
    const holdings: CashHolding[] = [
      { id: "1", account_id: "a1", balance: 1000, currency: "EUR", label: null, updated_at: "" },
    ];
    // EUR rate is 0.92, so 1000 EUR = 1000 / 0.92 = 1086.96 USD
    const total = calculateCashTotal(holdings, "USD", { EUR: 0.92 });
    expect(total).toBeCloseTo(1086.96, 2);
  });

  it("handles mixed currencies", () => {
    const holdings: CashHolding[] = [
      { id: "1", account_id: "a1", balance: 1000, currency: "USD", label: null, updated_at: "" },
      { id: "2", account_id: "a1", balance: 920, currency: "EUR", label: null, updated_at: "" },
    ];
    // 1000 USD + (920 / 0.92) USD = 1000 + 1000 = 2000
    const total = calculateCashTotal(holdings, "USD", { EUR: 0.92 });
    expect(total).toBeCloseTo(2000, 2);
  });

  it("returns raw value when exchange rate is missing", () => {
    const holdings: CashHolding[] = [
      { id: "1", account_id: "a1", balance: 1000, currency: "EUR", label: null, updated_at: "" },
    ];
    expect(calculateCashTotal(holdings, "USD", {})).toBe(1000);
  });

  it("returns 0 for empty holdings array", () => {
    expect(calculateCashTotal([], "USD", {})).toBe(0);
  });

  it("handles zero exchange rate gracefully", () => {
    const holdings: CashHolding[] = [
      { id: "1", account_id: "a1", balance: 1000, currency: "EUR", label: null, updated_at: "" },
    ];
    expect(calculateCashTotal(holdings, "USD", { EUR: 0 })).toBe(1000);
  });
});

describe("calculateCashTotalSimple", () => {
  it("sums all balances without conversion", () => {
    const holdings: CashHolding[] = [
      { id: "1", account_id: "a1", balance: 1000, currency: "USD", label: null, updated_at: "" },
      { id: "2", account_id: "a1", balance: 2000, currency: "EUR", label: null, updated_at: "" },
    ];
    expect(calculateCashTotalSimple(holdings)).toBe(3000);
  });

  it("returns 0 for empty array", () => {
    expect(calculateCashTotalSimple([])).toBe(0);
  });
});

describe("calculateInvestmentValue", () => {
  const createHolding = (ticker: string, shares: number): StockHolding => ({
    id: "1",
    account_id: "a1",
    ticker,
    shares,
    cost_basis_per_share: 100,
    updated_at: "",
  });

  it("calculates value for single holding", () => {
    const holdings = [createHolding("AAPL", 10)];
    const prices: Record<string, StockPriceData> = {
      AAPL: { price: 150, currency: "USD" },
    };
    expect(calculateInvestmentValue(holdings, prices, "USD", {})).toBe(1500);
  });

  it("calculates value for multiple holdings", () => {
    const holdings = [
      createHolding("AAPL", 10),
      createHolding("GOOGL", 5),
    ];
    const prices: Record<string, StockPriceData> = {
      AAPL: { price: 150, currency: "USD" },
      GOOGL: { price: 100, currency: "USD" },
    };
    // 10 * 150 + 5 * 100 = 1500 + 500 = 2000
    expect(calculateInvestmentValue(holdings, prices, "USD", {})).toBe(2000);
  });

  it("converts foreign stock currency to base", () => {
    const holdings = [createHolding("VWRA.L", 10)];
    const prices: Record<string, StockPriceData> = {
      "VWRA.L": { price: 100, currency: "GBP" },
    };
    // 10 * 100 GBP = 1000 GBP / 0.79 = 1265.82 USD
    const value = calculateInvestmentValue(holdings, prices, "USD", { GBP: 0.79 });
    expect(value).toBeCloseTo(1265.82, 2);
  });

  it("handles case-insensitive ticker lookup", () => {
    const holdings: StockHolding[] = [{
      id: "1",
      account_id: "a1",
      ticker: "aapl",
      shares: 10,
      cost_basis_per_share: 100,
      updated_at: "",
    }];
    const prices: Record<string, StockPriceData> = {
      AAPL: { price: 150, currency: "USD" },
    };
    expect(calculateInvestmentValue(holdings, prices, "USD", {})).toBe(1500);
  });

  it("returns 0 when price data is missing", () => {
    const holdings = [createHolding("AAPL", 10)];
    expect(calculateInvestmentValue(holdings, {}, "USD", {})).toBe(0);
  });

  it("returns 0 for empty holdings", () => {
    expect(calculateInvestmentValue([], {}, "USD", {})).toBe(0);
  });

  it("returns raw value when foreign stock has no exchange rate", () => {
    const holdings = [createHolding("VWRA.L", 10)];
    const prices: Record<string, StockPriceData> = {
      "VWRA.L": { price: 100, currency: "GBP" },
    };
    // No GBP rate provided, should return raw value (10 * 100 = 1000)
    const value = calculateInvestmentValue(holdings, prices, "USD", {});
    expect(value).toBe(1000);
  });

  it("returns raw value when foreign stock has zero exchange rate", () => {
    const holdings = [createHolding("VWRA.L", 10)];
    const prices: Record<string, StockPriceData> = {
      "VWRA.L": { price: 100, currency: "GBP" },
    };
    // GBP rate is 0, should return raw value
    const value = calculateInvestmentValue(holdings, prices, "USD", { GBP: 0 });
    expect(value).toBe(1000);
  });
});

describe("calculateInvestmentCost", () => {
  it("calculates cost basis for single holding", () => {
    const holdings: StockHolding[] = [{
      id: "1",
      account_id: "a1",
      ticker: "AAPL",
      shares: 10,
      cost_basis_per_share: 100,
      updated_at: "",
    }];
    expect(calculateInvestmentCost(holdings)).toBe(1000);
  });

  it("calculates cost basis for multiple holdings", () => {
    const holdings: StockHolding[] = [
      { id: "1", account_id: "a1", ticker: "AAPL", shares: 10, cost_basis_per_share: 100, updated_at: "" },
      { id: "2", account_id: "a1", ticker: "GOOGL", shares: 5, cost_basis_per_share: 200, updated_at: "" },
    ];
    // 10 * 100 + 5 * 200 = 1000 + 1000 = 2000
    expect(calculateInvestmentCost(holdings)).toBe(2000);
  });

  it("returns 0 for empty holdings", () => {
    expect(calculateInvestmentCost([])).toBe(0);
  });
});

describe("calculateGainLoss", () => {
  const createHolding = (shares: number, costBasis: number): StockHolding => ({
    id: "1",
    account_id: "a1",
    ticker: "AAPL",
    shares,
    cost_basis_per_share: costBasis,
    updated_at: "",
  });

  it("calculates positive gain", () => {
    const holdings = [createHolding(10, 100)]; // Cost: 1000
    const prices: Record<string, StockPriceData> = {
      AAPL: { price: 150, currency: "USD" }, // Value: 1500
    };
    const result = calculateGainLoss(holdings, prices, "USD", {});
    expect(result.absolute).toBe(500);
    expect(result.percent).toBe(50);
  });

  it("calculates negative loss", () => {
    const holdings = [createHolding(10, 100)]; // Cost: 1000
    const prices: Record<string, StockPriceData> = {
      AAPL: { price: 80, currency: "USD" }, // Value: 800
    };
    const result = calculateGainLoss(holdings, prices, "USD", {});
    expect(result.absolute).toBe(-200);
    expect(result.percent).toBe(-20);
  });

  it("returns 0 percent when cost basis is 0", () => {
    const holdings = [createHolding(10, 0)];
    const prices: Record<string, StockPriceData> = {
      AAPL: { price: 100, currency: "USD" },
    };
    const result = calculateGainLoss(holdings, prices, "USD", {});
    expect(result.percent).toBe(0);
  });

  it("handles empty holdings", () => {
    const result = calculateGainLoss([], {}, "USD", {});
    expect(result.absolute).toBe(0);
    expect(result.percent).toBe(0);
  });
});
