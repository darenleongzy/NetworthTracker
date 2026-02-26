import { describe, it, expect, vi, beforeEach } from "vitest";
import { convertToBaseCurrency, getExchangeRates } from "./exchange-rates";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock Supabase
const mockSupabaseFrom = vi.fn();
const mockSupabaseClient = {
  from: mockSupabaseFrom,
};

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabaseClient)),
}));

describe("convertToBaseCurrency", () => {
  const mockRates = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.79,
    SGD: 1.35,
    JPY: 149.5,
  };

  it("returns same amount when currencies match", () => {
    expect(convertToBaseCurrency(100, "USD", "USD", mockRates)).toBe(100);
    expect(convertToBaseCurrency(100, "EUR", "EUR", mockRates)).toBe(100);
  });

  it("converts EUR to USD correctly", () => {
    const result = convertToBaseCurrency(100, "EUR", "USD", mockRates);
    expect(result).toBeCloseTo(108.70, 2);
  });

  it("converts GBP to USD correctly", () => {
    const result = convertToBaseCurrency(100, "GBP", "USD", mockRates);
    expect(result).toBeCloseTo(126.58, 2);
  });

  it("converts SGD to USD correctly", () => {
    const result = convertToBaseCurrency(100, "SGD", "USD", mockRates);
    expect(result).toBeCloseTo(74.07, 2);
  });

  it("converts JPY to USD correctly", () => {
    const result = convertToBaseCurrency(1000, "JPY", "USD", mockRates);
    expect(result).toBeCloseTo(6.69, 2);
  });

  it("returns unconverted amount when rate not found", () => {
    const result = convertToBaseCurrency(100, "XYZ", "USD", mockRates);
    expect(result).toBe(100);
  });

  it("returns unconverted amount when rate is 0", () => {
    const ratesWithZero = { ...mockRates, EUR: 0 };
    const result = convertToBaseCurrency(100, "EUR", "USD", ratesWithZero);
    expect(result).toBe(100);
  });

  it("handles empty rates object", () => {
    const result = convertToBaseCurrency(100, "EUR", "USD", {});
    expect(result).toBe(100);
  });

  it("handles negative amounts", () => {
    const result = convertToBaseCurrency(-100, "EUR", "USD", mockRates);
    expect(result).toBeCloseTo(-108.70, 2);
  });

  it("handles zero amount", () => {
    const result = convertToBaseCurrency(0, "EUR", "USD", mockRates);
    expect(result).toBe(0);
  });
});

describe("getExchangeRates", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns cached rates when fresh", async () => {
    const freshTimestamp = new Date().toISOString();
    const cachedData = [
      { base_currency: "USD", target_currency: "EUR", rate: 0.92, fetched_at: freshTimestamp },
      { base_currency: "USD", target_currency: "GBP", rate: 0.79, fetched_at: freshTimestamp },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: cachedData, error: null }),
      }),
    });

    const rates = await getExchangeRates("USD");
    expect(rates.USD).toBe(1);
    expect(rates.EUR).toBe(0.92);
    expect(rates.GBP).toBe(0.79);
  });

  it("fetches from API when cache is empty", async () => {
    // Cache returns empty
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    // API returns rates
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        rates: { EUR: 0.92, GBP: 0.79 },
      }),
    });

    const rates = await getExchangeRates("USD");
    expect(rates.USD).toBe(1);
    expect(rates.EUR).toBe(0.92);
    expect(mockFetch).toHaveBeenCalled();
  });

  it("fetches from API when cache has error", async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        rates: { EUR: 0.92 },
      }),
    });

    const rates = await getExchangeRates("USD");
    expect(rates.EUR).toBe(0.92);
  });

  it("fetches from API when cache is stale", async () => {
    // Cache with old timestamp (2 hours ago)
    const oldTimestamp = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const staleData = [
      { base_currency: "USD", target_currency: "EUR", rate: 0.90, fetched_at: oldTimestamp },
    ];

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: staleData, error: null }),
      }),
      upsert: vi.fn().mockResolvedValue({ error: null }),
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        rates: { EUR: 0.92 },
      }),
    });

    const rates = await getExchangeRates("USD");
    expect(mockFetch).toHaveBeenCalled();
  });

  it("throws error when API fetch fails", async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
    });

    mockFetch.mockResolvedValue({
      ok: false,
      statusText: "Service Unavailable",
    });

    await expect(getExchangeRates("USD")).rejects.toThrow("Failed to fetch exchange rates");
  });

  it("caches rates after fetching from API", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      upsert: mockUpsert,
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        rates: { EUR: 0.92, GBP: 0.79 },
      }),
    });

    await getExchangeRates("USD");

    // Wait for async cache operation
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(mockUpsert).toHaveBeenCalled();
  });

  it("handles cache write failure gracefully", async () => {
    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      upsert: vi.fn().mockRejectedValue(new Error("DB write error")),
    });

    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        rates: { EUR: 0.92 },
      }),
    });

    // Should not throw, should return rates despite cache failure
    const rates = await getExchangeRates("USD");
    expect(rates.EUR).toBe(0.92);
  });

  it("skips cache write when no rates to save (only base currency)", async () => {
    const mockUpsert = vi.fn().mockResolvedValue({ error: null });

    mockSupabaseFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({ data: [], error: null }),
      }),
      upsert: mockUpsert,
    });

    // API returns only base currency (no other rates)
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        rates: {}, // Empty rates - only base currency
      }),
    });

    const rates = await getExchangeRates("USD");
    expect(rates.USD).toBe(1);

    // Wait for async cache operation
    await new Promise(resolve => setTimeout(resolve, 10));
    // Upsert should not be called when rows are empty
    expect(mockUpsert).not.toHaveBeenCalled();
  });
});
