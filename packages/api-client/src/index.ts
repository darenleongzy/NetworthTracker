import type { SupabaseClient } from "@supabase/supabase-js";
import {
  DEFAULT_CPF_ACCOUNT_SETTINGS,
  DEFAULT_FIRE_SETTINGS,
  type AccountWithHoldings,
  type AccountType,
  type CpfAccountSettings,
  type ExchangeRates,
  type Expense,
  type ExpenseCategory,
  type ExpenseSubcategory,
  type FireSettings,
  type NetWorthSnapshot,
  type StockPriceData,
  type UserPreferences,
} from "@track-my-worth/domain";

function isMissingCpfSettingsTableError(error: {
  code?: string;
  message?: string;
}) {
  return (
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message?.includes("public.cpf_account_settings") ||
    error.message?.includes("schema cache") ||
    error.message?.includes("does not exist")
  );
}

async function requireUserId(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");
  return user.id;
}

export function createTrackMyWorthApiClient(supabase: SupabaseClient) {
  async function getUserPreferencesInternal() {
    const userId = await requireUserId(supabase);
    const { data, error } = await supabase
      .from("user_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    return (data ?? {
      user_id: userId,
      base_currency: "USD",
    }) as UserPreferences;
  }

  async function getFireSettingsInternal() {
    const userId = await requireUserId(supabase);
    const { data, error } = await supabase
      .from("user_preferences")
      .select(
        "fire_current_age, fire_swr, fire_growth_rate, fire_inflation_rate, fire_include_cpf_srs, fire_expense_mode, fire_manual_expenses, fire_savings_mode, fire_manual_savings"
      )
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      throw new Error(error.message);
    }

    return {
      ...DEFAULT_FIRE_SETTINGS,
      ...data,
    } as FireSettings;
  }

  return {
    auth: {
      getUser: () => supabase.auth.getUser(),
      signInWithPassword: (email: string, password: string) =>
        supabase.auth.signInWithPassword({ email, password }),
      signOut: () => supabase.auth.signOut(),
    },

    dashboard: {
      async getBootstrapData() {
        const userId = await requireUserId(supabase);

        const [accountsRes, snapshotsRes, expensesRes, preferences, fireSettings] =
          await Promise.all([
            supabase
              .from("accounts")
              .select("*, cash_holdings(*), stock_holdings(*)")
              .eq("user_id", userId)
              .order("created_at"),
            supabase
              .from("net_worth_snapshots")
              .select("*")
              .eq("user_id", userId)
              .order("snapshot_date", { ascending: true })
              .limit(90),
            supabase
              .from("expenses")
              .select("*")
              .eq("user_id", userId)
              .order("expense_date", { ascending: false }),
            getUserPreferencesInternal(),
            getFireSettingsInternal(),
          ]);

        if (accountsRes.error) throw new Error(accountsRes.error.message);
        if (snapshotsRes.error) throw new Error(snapshotsRes.error.message);
        if (expensesRes.error) throw new Error(expensesRes.error.message);

        return {
          accounts: (accountsRes.data ?? []) as AccountWithHoldings[],
          snapshots: (snapshotsRes.data ?? []) as NetWorthSnapshot[],
          expenses: (expensesRes.data ?? []) as Expense[],
          preferences,
          fireSettings,
        };
      },
    },

    accounts: {
      async list() {
        const userId = await requireUserId(supabase);
        const { data, error } = await supabase
          .from("accounts")
          .select("*, cash_holdings(*), stock_holdings(*)")
          .eq("user_id", userId)
          .order("created_at");

        if (error) throw new Error(error.message);
        return (data ?? []) as AccountWithHoldings[];
      },

      async get(accountId: string) {
        const userId = await requireUserId(supabase);
        const { data, error } = await supabase
          .from("accounts")
          .select("*, cash_holdings(*), stock_holdings(*)")
          .eq("id", accountId)
          .eq("user_id", userId)
          .single();

        if (error) throw new Error(error.message);
        return data as AccountWithHoldings;
      },

      async create(name: string, type: AccountType) {
        const userId = await requireUserId(supabase);
        const { data, error } = await supabase
          .from("accounts")
          .insert({ name, type, user_id: userId })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      },

      async updateName(id: string, name: string) {
        const userId = await requireUserId(supabase);
        const { data: account, error: lookupError } = await supabase
          .from("accounts")
          .select("user_id")
          .eq("id", id)
          .single();

        if (lookupError || !account || account.user_id !== userId) {
          throw new Error("Account not found");
        }

        const { error } = await supabase
          .from("accounts")
          .update({ name })
          .eq("id", id);

        if (error) throw new Error(error.message);
      },

      async remove(id: string) {
        const userId = await requireUserId(supabase);
        const { data: account, error: lookupError } = await supabase
          .from("accounts")
          .select("user_id")
          .eq("id", id)
          .single();

        if (lookupError || !account || account.user_id !== userId) {
          throw new Error("Account not found");
        }

        const { error } = await supabase.from("accounts").delete().eq("id", id);
        if (error) throw new Error(error.message);
      },
    },

    holdings: {
      async upsertCash(
        accountId: string,
        balance: number,
        currency: string = "USD",
        holdingId?: string,
        label?: string | null
      ) {
        const userId = await requireUserId(supabase);
        const { data: account, error: accountError } = await supabase
          .from("accounts")
          .select("user_id")
          .eq("id", accountId)
          .single();

        if (accountError || !account || account.user_id !== userId) {
          throw new Error("Account not found");
        }

        if (holdingId) {
          const { error } = await supabase
            .from("cash_holdings")
            .update({ balance, currency, label })
            .eq("id", holdingId);
          if (error) throw new Error(error.message);
          return;
        }

        const { error } = await supabase
          .from("cash_holdings")
          .insert({ account_id: accountId, balance, currency, label });
        if (error) throw new Error(error.message);
      },

      async upsertCpfBalances(
        accountId: string,
        holdings: { label: string; balance: number }[]
      ) {
        const userId = await requireUserId(supabase);
        const { data: account, error: accountError } = await supabase
          .from("accounts")
          .select("user_id")
          .eq("id", accountId)
          .single();

        if (accountError || !account || account.user_id !== userId) {
          throw new Error("Account not found");
        }

        const { data: existing } = await supabase
          .from("cash_holdings")
          .select("id, label")
          .eq("account_id", accountId)
          .in("label", ["OA", "SA", "MA"]);

        const existingMap = new Map(existing?.map((item) => [item.label, item.id]) ?? []);

        for (const holding of holdings) {
          const existingId = existingMap.get(holding.label);
          if (existingId) {
            const { error } = await supabase
              .from("cash_holdings")
              .update({ balance: holding.balance, currency: "SGD" })
              .eq("id", existingId);
            if (error) throw new Error(error.message);
            continue;
          }

          const { error } = await supabase.from("cash_holdings").insert({
            account_id: accountId,
            balance: holding.balance,
            currency: "SGD",
            label: holding.label,
          });
          if (error) throw new Error(error.message);
        }
      },

      async removeCash(id: string) {
        const userId = await requireUserId(supabase);
        const { data: holding } = await supabase
          .from("cash_holdings")
          .select("account_id, accounts(user_id)")
          .eq("id", id)
          .single();

        const owner = holding?.accounts as { user_id?: string } | null;
        if (!holding || owner?.user_id !== userId) {
          throw new Error("Holding not found");
        }

        const { error } = await supabase.from("cash_holdings").delete().eq("id", id);
        if (error) throw new Error(error.message);
      },

      async upsertStock(
        accountId: string,
        ticker: string,
        shares: number,
        costBasisPerShare: number,
        holdingId?: string
      ) {
        const userId = await requireUserId(supabase);
        const { data: account, error: accountError } = await supabase
          .from("accounts")
          .select("user_id")
          .eq("id", accountId)
          .single();

        if (accountError || !account || account.user_id !== userId) {
          throw new Error("Account not found");
        }

        const upperTicker = ticker.toUpperCase();
        if (holdingId) {
          const { error } = await supabase
            .from("stock_holdings")
            .update({
              ticker: upperTicker,
              shares,
              cost_basis_per_share: costBasisPerShare,
            })
            .eq("id", holdingId);
          if (error) throw new Error(error.message);
          return;
        }

        const { error } = await supabase.from("stock_holdings").insert({
          account_id: accountId,
          ticker: upperTicker,
          shares,
          cost_basis_per_share: costBasisPerShare,
        });
        if (error) throw new Error(error.message);
      },

      async removeStock(id: string) {
        const userId = await requireUserId(supabase);
        const { data: holding } = await supabase
          .from("stock_holdings")
          .select("account_id, accounts(user_id)")
          .eq("id", id)
          .single();

        const owner = holding?.accounts as { user_id?: string } | null;
        if (!holding || owner?.user_id !== userId) {
          throw new Error("Holding not found");
        }

        const { error } = await supabase.from("stock_holdings").delete().eq("id", id);
        if (error) throw new Error(error.message);
      },
    },

    cpf: {
      async getSettings(accountId: string): Promise<CpfAccountSettings | null> {
        const userId = await requireUserId(supabase);
        const { data: account } = await supabase
          .from("accounts")
          .select("user_id, type")
          .eq("id", accountId)
          .single();

        if (!account || account.user_id !== userId) {
          throw new Error("Account not found");
        }
        if (account.type !== "cpf") return null;

        const { data, error } = await supabase
          .from("cpf_account_settings")
          .select("*")
          .eq("account_id", accountId)
          .maybeSingle();

        if (error) {
          if (isMissingCpfSettingsTableError(error)) return null;
          throw new Error(error.message);
        }
        return data;
      },

      async upsertSettings(
        accountId: string,
        settings: Partial<Omit<CpfAccountSettings, "account_id" | "updated_at">>
      ) {
        const userId = await requireUserId(supabase);
        const { data: account } = await supabase
          .from("accounts")
          .select("user_id, type")
          .eq("id", accountId)
          .single();

        if (!account || account.user_id !== userId) {
          throw new Error("Account not found");
        }
        if (account.type !== "cpf") {
          throw new Error("CPF settings can only be saved for CPF accounts");
        }

        const mergedSettings = {
          ...DEFAULT_CPF_ACCOUNT_SETTINGS,
          ...settings,
        };

        if (mergedSettings.early_retirement_age < mergedSettings.current_age) {
          throw new Error("Early retirement age must be at least the current age");
        }

        if (
          mergedSettings.mortgage_payoff_age !== null &&
          mergedSettings.mortgage_payoff_age < mergedSettings.current_age
        ) {
          throw new Error("Mortgage payoff age must be at least the current age");
        }

        const { error } = await supabase.from("cpf_account_settings").upsert(
          {
            account_id: accountId,
            ...mergedSettings,
          },
          { onConflict: "account_id" }
        );

        if (error) {
          if (isMissingCpfSettingsTableError(error)) {
            throw new Error(
              "The CPF settings table has not been created yet. Run the latest Supabase migration and try again."
            );
          }
          throw new Error(error.message);
        }
      },
    },

    expenses: {
      async list() {
        const userId = await requireUserId(supabase);
        const { data, error } = await supabase
          .from("expenses")
          .select("*")
          .eq("user_id", userId)
          .order("expense_date", { ascending: false });

        if (error) throw new Error(error.message);
        return (data ?? []) as Expense[];
      },

      async create(input: {
        amount: number;
        currency: string;
        category: ExpenseCategory;
        subcategory: ExpenseSubcategory;
        expenseDate: string;
        description?: string;
      }) {
        const userId = await requireUserId(supabase);
        const { data, error } = await supabase
          .from("expenses")
          .insert({
            user_id: userId,
            amount: input.amount,
            currency: input.currency,
            category: input.category,
            subcategory: input.subcategory,
            expense_date: input.expenseDate,
            description: input.description ?? null,
          })
          .select()
          .single();

        if (error) throw new Error(error.message);
        return data;
      },

      async update(
        id: string,
        input: {
          amount: number;
          currency: string;
          category: ExpenseCategory;
          subcategory: ExpenseSubcategory;
          expenseDate: string;
          description?: string;
        }
      ) {
        const userId = await requireUserId(supabase);
        const { data: expense } = await supabase
          .from("expenses")
          .select("user_id")
          .eq("id", id)
          .single();

        if (!expense || expense.user_id !== userId) {
          throw new Error("Expense not found");
        }

        const { error } = await supabase
          .from("expenses")
          .update({
            amount: input.amount,
            currency: input.currency,
            category: input.category,
            subcategory: input.subcategory,
            expense_date: input.expenseDate,
            description: input.description ?? null,
          })
          .eq("id", id);

        if (error) throw new Error(error.message);
      },

      async remove(id: string) {
        const userId = await requireUserId(supabase);
        const { data: expense } = await supabase
          .from("expenses")
          .select("user_id")
          .eq("id", id)
          .single();

        if (!expense || expense.user_id !== userId) {
          throw new Error("Expense not found");
        }

        const { error } = await supabase.from("expenses").delete().eq("id", id);
        if (error) throw new Error(error.message);
      },
    },

    preferences: {
      get: getUserPreferencesInternal,

      async updateBaseCurrency(baseCurrency: string) {
        const userId = await requireUserId(supabase);
        const { error } = await supabase.from("user_preferences").upsert(
          {
            user_id: userId,
            base_currency: baseCurrency,
          },
          { onConflict: "user_id" }
        );

        if (error) throw new Error(error.message);
      },
    },

    fire: {
      getSettings: getFireSettingsInternal,

      async updateSettings(settings: Partial<FireSettings>) {
        const userId = await requireUserId(supabase);
        const { error } = await supabase.from("user_preferences").upsert(
          {
            user_id: userId,
            ...settings,
          },
          { onConflict: "user_id" }
        );

        if (error) throw new Error(error.message);
      },
    },

    market: {
      async getStockPrices(tickers: string[]) {
        const uniqueTickers = [...new Set(tickers.map((ticker) => ticker.toUpperCase()))];
        if (uniqueTickers.length === 0) {
          return {} as Record<string, StockPriceData>;
        }

        const { data, error } = await supabase
          .from("stock_prices")
          .select("ticker, price, currency")
          .in("ticker", uniqueTickers);

        if (error) throw new Error(error.message);

        return (data ?? []).reduce<Record<string, StockPriceData>>((result, row) => {
          result[row.ticker] = {
            price: Number(row.price),
            currency: row.currency ?? "USD",
          };
          return result;
        }, {});
      },

      async getExchangeRates(baseCurrency: string) {
        const { data, error } = await supabase
          .from("exchange_rates")
          .select("target_currency, rate")
          .eq("base_currency", baseCurrency);

        if (error) throw new Error(error.message);

        return (data ?? []).reduce<ExchangeRates>(
          (rates, row) => {
            rates[row.target_currency] = Number(row.rate);
            return rates;
          },
          { [baseCurrency]: 1 }
        );
      },
    },
  };
}

export type TrackMyWorthApiClient = ReturnType<typeof createTrackMyWorthApiClient>;
