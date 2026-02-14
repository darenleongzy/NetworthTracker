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
  const exchangeRates = await getExchangeRates(baseCurrency);

  // Fetch stock prices for all investment accounts
  const allStockHoldings = typedAccounts.flatMap((a) => a.stock_holdings);
  const tickers = allStockHoldings.map((h) => h.ticker);
  const stockPrices = tickers.length > 0 ? await getStockPrices(tickers) : {};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">
            Manage your cash and investment accounts
          </p>
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
