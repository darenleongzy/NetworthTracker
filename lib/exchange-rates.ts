import { createClient } from "@/lib/supabase/server";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";

const CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

export type ExchangeRates = Record<string, number>;

/**
 * Fetch exchange rates from free API (frankfurter.app)
 * Returns rates relative to the base currency
 */
async function fetchRatesFromAPI(baseCurrency: string): Promise<ExchangeRates> {
  const targetCurrencies = SUPPORTED_CURRENCIES
    .map(c => c.code)
    .filter(c => c !== baseCurrency)
    .join(',');

  const response = await fetch(
    `https://api.frankfurter.app/latest?from=${baseCurrency}&to=${targetCurrencies}`,
    { next: { revalidate: 3600 } } // Cache for 1 hour
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch exchange rates: ${response.statusText}`);
  }

  const data = await response.json();

  // Include the base currency itself with rate 1
  return {
    [baseCurrency]: 1,
    ...data.rates,
  };
}

/**
 * Get cached exchange rates from database
 */
async function getCachedRates(baseCurrency: string): Promise<ExchangeRates | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("exchange_rates")
    .select("*")
    .eq("base_currency", baseCurrency);

  if (error || !data || data.length === 0) {
    return null;
  }

  // Check if cache is still fresh (within 1 hour)
  const oldestFetch = data.reduce((oldest, rate) => {
    const fetchedAt = new Date(rate.fetched_at).getTime();
    return fetchedAt < oldest ? fetchedAt : oldest;
  }, Date.now());

  if (Date.now() - oldestFetch > CACHE_DURATION_MS) {
    return null; // Cache expired
  }

  // Build rates object
  const rates: ExchangeRates = { [baseCurrency]: 1 };
  for (const row of data) {
    rates[row.target_currency] = Number(row.rate);
  }

  return rates;
}

/**
 * Save exchange rates to database cache
 */
async function cacheRates(baseCurrency: string, rates: ExchangeRates): Promise<void> {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const rows = Object.entries(rates)
    .filter(([currency]) => currency !== baseCurrency)
    .map(([targetCurrency, rate]) => ({
      base_currency: baseCurrency,
      target_currency: targetCurrency,
      rate,
      fetched_at: now,
    }));

  if (rows.length > 0) {
    await supabase
      .from("exchange_rates")
      .upsert(rows, { onConflict: "base_currency,target_currency" });
  }
}

/**
 * Get exchange rates for a base currency
 * Uses cached rates if available, otherwise fetches from API
 */
export async function getExchangeRates(baseCurrency: string): Promise<ExchangeRates> {
  // Try cache first
  const cachedRates = await getCachedRates(baseCurrency);
  if (cachedRates) {
    return cachedRates;
  }

  // Fetch from API
  const rates = await fetchRatesFromAPI(baseCurrency);

  // Cache the results (fire and forget)
  cacheRates(baseCurrency, rates).catch(console.error);

  return rates;
}

/**
 * Convert an amount from one currency to the base currency
 */
export function convertToBaseCurrency(
  amount: number,
  fromCurrency: string,
  baseCurrency: string,
  rates: ExchangeRates
): number {
  if (fromCurrency === baseCurrency) {
    return amount;
  }

  // rates are relative to baseCurrency, so we need the inverse
  const rate = rates[fromCurrency];
  if (!rate || rate === 0) {
    console.warn(`No exchange rate found for ${fromCurrency}`);
    return amount; // Return unconverted if rate not found
  }

  // If we have rates FROM baseCurrency TO other currencies,
  // then to convert FROM other currency TO base, we divide
  return amount / rate;
}
