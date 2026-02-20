import { createClient } from "@/lib/supabase/server";
import YahooFinance from "yahoo-finance2";

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Create a singleton instance of YahooFinance
const yahooFinance = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

export type StockPriceData = { price: number; currency: string };

export async function getStockPrice(ticker: string): Promise<StockPriceData | null> {
  const supabase = await createClient();
  const upperTicker = ticker.toUpperCase();

  // Check cache first
  const { data: cached } = await supabase
    .from("stock_prices")
    .select("price, currency, fetched_at")
    .eq("ticker", upperTicker)
    .single();

  if (cached) {
    const age = Date.now() - new Date(cached.fetched_at).getTime();
    if (age < CACHE_TTL_MS) {
      return { price: cached.price, currency: cached.currency ?? "USD" };
    }
  }

  // Fetch from Yahoo Finance
  try {
    const result = await yahooFinance.quoteCombine(upperTicker, {
      fields: ["regularMarketPrice", "currency"],
    });

    const price = result?.regularMarketPrice;
    const currency = result?.currency ?? "USD";
    if (!price) {
      return cached ? { price: cached.price, currency: cached.currency ?? "USD" } : null;
    }

    // Upsert cache
    await supabase.from("stock_prices").upsert(
      {
        ticker: upperTicker,
        price,
        currency,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "ticker" }
    );

    return { price, currency };
  } catch (error) {
    console.error(`Failed to fetch price for ${upperTicker}:`, error);
    return cached ? { price: cached.price, currency: cached.currency ?? "USD" } : null;
  }
}

/**
 * Refresh stock price if cache is stale (older than 24 hours)
 * Returns the refreshed price data or null if fetch failed
 */
export async function refreshStockPriceIfStale(
  ticker: string
): Promise<StockPriceData | null> {
  const supabase = await createClient();
  const upperTicker = ticker.toUpperCase();

  // Check if price exists and is stale
  const { data: cached } = await supabase
    .from("stock_prices")
    .select("price, currency, fetched_at")
    .eq("ticker", upperTicker)
    .single();

  const isStale =
    !cached ||
    Date.now() - new Date(cached.fetched_at).getTime() >= CACHE_TTL_MS;

  if (!isStale) {
    return cached ? { price: cached.price, currency: cached.currency ?? "USD" } : null;
  }

  // Fetch fresh price from Yahoo Finance
  try {
    const result = await yahooFinance.quoteCombine(upperTicker, {
      fields: ["regularMarketPrice", "currency"],
    });

    const price = result?.regularMarketPrice;
    const currency = result?.currency ?? "USD";
    if (!price) {
      console.warn(`No price data returned for ${upperTicker}`);
      return cached ? { price: cached.price, currency: cached.currency ?? "USD" } : null;
    }

    // Upsert to cache
    const { error } = await supabase.from("stock_prices").upsert(
      {
        ticker: upperTicker,
        price,
        currency,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: "ticker" }
    );

    if (error) {
      console.error(`Failed to cache price for ${upperTicker}:`, error);
    }

    return { price, currency };
  } catch (error) {
    console.error(`Failed to refresh price for ${upperTicker}:`, error);
    return cached ? { price: cached.price, currency: cached.currency ?? "USD" } : null;
  }
}

export async function getStockPrices(
  tickers: string[]
): Promise<Record<string, StockPriceData>> {
  const unique = [...new Set(tickers.map((t) => t.toUpperCase()))];
  const prices: Record<string, StockPriceData> = {};

  if (unique.length === 0) return prices;

  // Batch: fetch all cached prices first
  const supabase = await createClient();
  const { data: cachedPrices } = await supabase
    .from("stock_prices")
    .select("ticker, price, currency, fetched_at")
    .in("ticker", unique);

  const stale: string[] = [];
  for (const t of unique) {
    const cached = cachedPrices?.find((p) => p.ticker === t);
    if (cached) {
      prices[t] = { price: cached.price, currency: cached.currency ?? "USD" };
      const age = Date.now() - new Date(cached.fetched_at).getTime();
      if (age >= CACHE_TTL_MS) stale.push(t);
    } else {
      stale.push(t);
    }
  }

  // Fetch stale prices using Yahoo Finance quoteCombine (batches automatically)
  if (stale.length > 0) {
    try {
      const now = new Date().toISOString();
      const upsertRows: { ticker: string; price: number; currency: string; fetched_at: string }[] =
        [];

      // quoteCombine debounces multiple calls into a single HTTP request
      const results = await Promise.all(
        stale.map(async (ticker) => {
          try {
            const result = await yahooFinance.quoteCombine(ticker, {
              fields: ["regularMarketPrice", "currency"],
            });
            return {
              ticker,
              price: result?.regularMarketPrice ?? null,
              currency: result?.currency ?? "USD",
            };
          } catch (error) {
            console.error(`Failed to fetch price for ${ticker}:`, error);
            return { ticker, price: null, currency: "USD" };
          }
        })
      );

      for (const { ticker, price, currency } of results) {
        if (price) {
          prices[ticker] = { price, currency };
          upsertRows.push({
            ticker,
            price,
            currency,
            fetched_at: now,
          });
        }
      }

      // Batch upsert to cache
      if (upsertRows.length > 0) {
        await supabase
          .from("stock_prices")
          .upsert(upsertRows, { onConflict: "ticker" });
      }
    } catch (error) {
      console.error("Failed to fetch stock prices from Yahoo Finance:", error);
    }
  }

  return prices;
}
