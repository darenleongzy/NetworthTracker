import { describe, it, expect } from "vitest";
import {
  SUPPORTED_CURRENCIES,
  getCurrencySymbol,
  getCurrencyName,
} from "./currencies";

describe("SUPPORTED_CURRENCIES", () => {
  it("contains expected currencies", () => {
    const codes = SUPPORTED_CURRENCIES.map((c) => c.code);
    expect(codes).toContain("USD");
    expect(codes).toContain("EUR");
    expect(codes).toContain("GBP");
    expect(codes).toContain("SGD");
    expect(codes).toContain("JPY");
  });

  it("has 10 supported currencies", () => {
    expect(SUPPORTED_CURRENCIES).toHaveLength(10);
  });

  it("each currency has code, name, and symbol", () => {
    SUPPORTED_CURRENCIES.forEach((currency) => {
      expect(currency.code).toBeDefined();
      expect(currency.name).toBeDefined();
      expect(currency.symbol).toBeDefined();
      expect(currency.code).toHaveLength(3);
    });
  });
});

describe("getCurrencySymbol", () => {
  it("returns $ for USD", () => {
    expect(getCurrencySymbol("USD")).toBe("$");
  });

  it("returns correct symbol for EUR", () => {
    expect(getCurrencySymbol("EUR")).toBe("\u20AC");
  });

  it("returns correct symbol for GBP", () => {
    expect(getCurrencySymbol("GBP")).toBe("\u00A3");
  });

  it("returns correct symbol for SGD", () => {
    expect(getCurrencySymbol("SGD")).toBe("S$");
  });

  it("returns correct symbol for JPY", () => {
    expect(getCurrencySymbol("JPY")).toBe("\u00A5");
  });

  it("returns code for unknown currency", () => {
    expect(getCurrencySymbol("XYZ")).toBe("XYZ");
  });

  it("returns code for empty string", () => {
    expect(getCurrencySymbol("")).toBe("");
  });
});

describe("getCurrencyName", () => {
  it("returns full name for USD", () => {
    expect(getCurrencyName("USD")).toBe("US Dollar");
  });

  it("returns full name for EUR", () => {
    expect(getCurrencyName("EUR")).toBe("Euro");
  });

  it("returns full name for GBP", () => {
    expect(getCurrencyName("GBP")).toBe("British Pound");
  });

  it("returns full name for SGD", () => {
    expect(getCurrencyName("SGD")).toBe("Singapore Dollar");
  });

  it("returns code for unknown currency", () => {
    expect(getCurrencyName("XYZ")).toBe("XYZ");
  });

  it("returns code for empty string", () => {
    expect(getCurrencyName("")).toBe("");
  });
});
