export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserPreferences } from "@/lib/actions";
import { getExchangeRates } from "@/lib/exchange-rates";
import { getStockPrices } from "@/lib/stock-api";
import { AccountDetail } from "@/components/account-detail";
import type { AccountWithHoldings } from "@/lib/types";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: account }, preferences] = await Promise.all([
    supabase
      .from("accounts")
      .select("*, cash_holdings(*), stock_holdings(*)")
      .eq("id", id)
      .single(),
    getUserPreferences(),
  ]);

  if (!account) notFound();

  const baseCurrency = preferences.base_currency;
  const exchangeRates = await getExchangeRates(baseCurrency);

  // Fetch stock prices if this is an investment account
  const stockHoldings = (account as AccountWithHoldings).stock_holdings;
  const tickers = stockHoldings.map((h) => h.ticker);
  const stockPrices = tickers.length > 0 ? await getStockPrices(tickers) : {};

  return (
    <AccountDetail
      account={account as AccountWithHoldings}
      baseCurrency={baseCurrency}
      exchangeRates={exchangeRates}
      stockPrices={stockPrices}
    />
  );
}
