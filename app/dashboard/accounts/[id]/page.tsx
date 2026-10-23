export const dynamic = "force-dynamic";

import { after } from "next/server";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAccountHistoryEvents,
  getAccountValueSnapshots,
  getCpfAccountSettings,
  saveAccountSnapshots,
} from "@/lib/actions";
import { getExchangeRates } from "@/lib/exchange-rates";
import { getStockPrices } from "@/lib/stock-api";
import { calculateAccountTotalValue } from "@/lib/account-history";
import { AccountDetail } from "@/components/account-detail";
import type { AccountHistoryEvent, AccountValueSnapshot, AccountWithHoldings } from "@/lib/types";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) notFound();

  const [{ data: account }, preferencesRes] = await Promise.all([
    supabase
      .from("accounts")
      .select("*, cash_holdings(*), stock_holdings(*)")
      .eq("id", id)
      .eq("user_id", userId)
      .single(),
    supabase.from("user_preferences").select("base_currency").maybeSingle(),
  ]);

  if (!account) notFound();

  const cpfSettings =
    account.type === "cpf" ? await getCpfAccountSettings(account.id) : null;
  const [accountHistoryEvents, accountValueSnapshots] = await Promise.all([
    getAccountHistoryEvents(account.id),
    getAccountValueSnapshots(account.id),
  ]);

  const baseCurrency = preferencesRes.data?.base_currency ?? "USD";
  // Fetch stock prices if this is an investment account
  const stockHoldings = (account as AccountWithHoldings).stock_holdings;
  const tickers = stockHoldings.map((h) => h.ticker);
  const [exchangeRates, stockPrices] = await Promise.all([
    getExchangeRates(baseCurrency),
    tickers.length > 0 ? getStockPrices(tickers) : Promise.resolve({}),
  ]);
  const accountWithHoldings = account as AccountWithHoldings;
  const today = new Date().toISOString().split("T")[0];
  const currentSnapshot: AccountValueSnapshot = {
    id: `current-${account.id}`,
    account_id: account.id,
    user_id: userId,
    account_type: account.type,
    total_value: calculateAccountTotalValue(
      accountWithHoldings,
      baseCurrency,
      exchangeRates,
      stockPrices
    ),
    currency: baseCurrency,
    snapshot_date: today,
    created_at: new Date().toISOString(),
  };
  const snapshotsWithCurrentValue = [
    ...accountValueSnapshots.filter((snapshot) => snapshot.snapshot_date !== today),
    currentSnapshot,
  ];

  // A visit makes the latest valuation immediately visible, then persists it
  // without delaying the account detail response.
  after(async () => {
    try {
      await saveAccountSnapshots([accountWithHoldings], baseCurrency, exchangeRates, stockPrices);
    } catch (error) {
      console.error("Failed to save account detail snapshot", error);
    }
  });

  return (
    <AccountDetail
      account={accountWithHoldings}
      baseCurrency={baseCurrency}
      exchangeRates={exchangeRates}
      stockPrices={stockPrices}
      cpfSettings={cpfSettings}
      accountHistoryEvents={accountHistoryEvents as AccountHistoryEvent[]}
      accountValueSnapshots={snapshotsWithCurrentValue}
    />
  );
}
