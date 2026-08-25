export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getUserPreferences } from "@/lib/actions";
import { getExchangeRates } from "@/lib/exchange-rates";
import { getStockPrices } from "@/lib/stock-api";
import { AccountList } from "@/components/account-list";
import { CreateAccountForm } from "@/components/forms/create-account-form";
import type { AccountWithHoldings } from "@/lib/types";

export default async function AccountsPage() {
  const supabase = await createClient();

  const [{ data: accounts }, preferences] = await Promise.all([
    supabase
      .from("accounts")
      .select("*, cash_holdings(*), stock_holdings(*)")
      .order("created_at", { ascending: true }),
    getUserPreferences(),
  ]);

  const typedAccounts = (accounts as AccountWithHoldings[]) ?? [];
  const baseCurrency = preferences.base_currency;
  // Fetch stock prices for all investment accounts
  const allStockHoldings = typedAccounts.flatMap((a) => a.stock_holdings);
  const tickers = allStockHoldings.map((h) => h.ticker);
  const [exchangeRates, stockPrices] = await Promise.all([
    getExchangeRates(baseCurrency),
    tickers.length > 0 ? getStockPrices(tickers) : Promise.resolve({}),
  ]);

  return (
    <div className="mx-auto max-w-[1600px] space-y-6">
      <div className="app-page-header">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Portfolio</p>
          <h1 className="app-page-title mt-2">Accounts</h1>
          <p className="app-page-subtitle">Organize the places your money lives.</p>
        </div>
        <CreateAccountForm />
      </div>

      <AccountList
        accounts={typedAccounts}
        baseCurrency={baseCurrency}
        exchangeRates={exchangeRates}
        stockPrices={stockPrices}
      />
    </div>
  );
}
