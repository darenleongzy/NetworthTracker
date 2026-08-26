export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getExchangeRates } from "@/lib/exchange-rates";
import { getStockPrices } from "@/lib/stock-api";
import { calculateCoupleAssetBreakdown } from "@/lib/couple-calculations";
import { CoupleDashboard } from "@/components/couple-dashboard";
import type { AccountWithHoldings, CoupleAssetBreakdown, CoupleConnection } from "@/lib/types";

const emptyBreakdown: CoupleAssetBreakdown = { cash: 0, investments: 0, cpf: 0, srs: 0 };

export default async function CouplePage() {
  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims.sub;
  if (!userId) return null;

  const [{ data: connection }, { data: preferences }] = await Promise.all([
    supabase
      .from("couple_connections")
      .select("*")
      .or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`)
      .in("status", ["pending", "connected"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("user_preferences").select("base_currency").maybeSingle(),
  ]);

  const typedConnection = (connection ?? null) as CoupleConnection | null;
  const baseCurrency = preferences?.base_currency ?? "USD";
  let breakdown = emptyBreakdown;
  let ownBreakdown = emptyBreakdown;
  let partnerBreakdown = emptyBreakdown;

  if (typedConnection?.status === "connected") {
    const [{ data: ownAccounts }, { data: partnerAccounts, error: partnerAccountsError }] = await Promise.all([
      supabase
        .from("accounts")
        .select("*, cash_holdings(*), stock_holdings(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
      supabase.rpc("get_connected_partner_account_data"),
    ]);
    if (partnerAccountsError) {
      console.error("Unable to load connected partner accounts", partnerAccountsError.message);
    }
    const typedAccounts = [
      ...((ownAccounts ?? []) as AccountWithHoldings[]),
      ...((Array.isArray(partnerAccounts) ? partnerAccounts : []) as AccountWithHoldings[]),
    ];
    const tickers = typedAccounts.flatMap((account) => account.stock_holdings.map((holding) => holding.ticker));
    const [exchangeRates, stockPrices] = await Promise.all([
      getExchangeRates(baseCurrency),
      tickers.length > 0 ? getStockPrices(tickers) : Promise.resolve({}),
    ]);
    breakdown = calculateCoupleAssetBreakdown(typedAccounts, baseCurrency, exchangeRates, stockPrices);
    ownBreakdown = calculateCoupleAssetBreakdown(
      typedAccounts.filter((account) => account.user_id === userId),
      baseCurrency,
      exchangeRates,
      stockPrices
    );
    partnerBreakdown = calculateCoupleAssetBreakdown(
      typedAccounts.filter((account) => account.user_id !== userId),
      baseCurrency,
      exchangeRates,
      stockPrices
    );
  }

  return (
    <CoupleDashboard
      connection={typedConnection}
      currentUserId={userId}
      baseCurrency={baseCurrency}
      breakdown={breakdown}
      ownBreakdown={ownBreakdown}
      partnerBreakdown={partnerBreakdown}
    />
  );
}
