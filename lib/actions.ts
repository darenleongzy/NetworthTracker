"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  aggregateMonthlyAccountTypeTotals,
  buildAccountHistoryEventLabel,
  buildSnapshotRecord,
  calculateAccountTotalValue,
} from "@/lib/account-history";
import { getExchangeRates } from "@/lib/exchange-rates";
import { getStockPrices, refreshStockPriceIfStale } from "@/lib/stock-api";
import type {
  AccountHistoryEventType,
  AccountType,
  AccountValueSnapshot,
  AccountWithHoldings,
  CpfAccountSettings,
  ExpenseCategory,
  ExpenseSubcategory,
  FireSettings,
} from "@/lib/types";
import {
  DEFAULT_CPF_ACCOUNT_SETTINGS,
  DEFAULT_FIRE_SETTINGS,
} from "@/lib/types";

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

async function recordAccountHistoryEvent(
  userId: string,
  accountId: string | null,
  eventType: AccountHistoryEventType,
  accountName: string,
  metadata: Record<string, unknown> = {}
) {
  const supabase = await createClient();
  const { error } = await supabase.from("account_history_events").insert({
    user_id: userId,
    account_id: accountId,
    event_type: eventType,
    event_label: buildAccountHistoryEventLabel(eventType, accountName),
    metadata,
  });

  if (error) {
    console.error("Failed to record account history event:", error);
  }
}

async function getAccountWithHoldingsForSnapshot(accountId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("accounts")
    .select("*, cash_holdings(*), stock_holdings(*)")
    .eq("id", accountId)
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Account not found");
  }

  return data as AccountWithHoldings;
}

async function saveAccountSnapshotForAccount(
  userId: string,
  accountId: string
) {
  const supabase = await createClient();
  const account = await getAccountWithHoldingsForSnapshot(accountId);
  const preferences = await getUserPreferences();
  const baseCurrency = preferences.base_currency;
  const exchangeRates = await getExchangeRates(baseCurrency);
  const tickers = account.stock_holdings.map((holding) => holding.ticker);
  const stockPrices = tickers.length > 0 ? await getStockPrices(tickers) : {};
  const totalValue = calculateAccountTotalValue(
    account,
    baseCurrency,
    exchangeRates,
    stockPrices
  );
  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase.from("account_value_snapshots").upsert(
    buildSnapshotRecord(
      account.id,
      userId,
      account.type,
      totalValue,
      baseCurrency,
      today
    ),
    { onConflict: "account_id,snapshot_date" }
  );

  if (error) {
    throw new Error(error.message);
  }
}

// ── Accounts ──

export async function createAccount(name: string, type: AccountType) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("accounts")
    .insert({ name, type, user_id: user.id })
    .select()
    .single();

  if (error) throw new Error(error.message);
  await recordAccountHistoryEvent(user.id, data.id, "account_created", data.name, {
    accountType: data.type,
  });
  const today = new Date().toISOString().split("T")[0];
  await supabase.from("account_value_snapshots").upsert(
    buildSnapshotRecord(data.id, user.id, data.type, 0, "USD", today),
    { onConflict: "account_id,snapshot_date" }
  );
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  return data;
}

export async function updateAccount(id: string, name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership before update
  const { data: account } = await supabase
    .from("accounts")
    .select("user_id, name")
    .eq("id", id)
    .single();

  if (!account || account.user_id !== user.id) {
    throw new Error("Account not found");
  }

  const { error } = await supabase
    .from("accounts")
    .update({ name })
    .eq("id", id);

  if (error) throw new Error(error.message);
  await recordAccountHistoryEvent(user.id, id, "account_renamed", name, {
    previousName: account.name,
    newName: name,
  });
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  revalidatePath(`/dashboard/accounts/${id}`);
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership before delete
  const { data: account } = await supabase
    .from("accounts")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!account || account.user_id !== user.id) {
    throw new Error("Account not found");
  }

  const { data: accountRecord } = await supabase
    .from("accounts")
    .select("name, type")
    .eq("id", id)
    .single();

  if (accountRecord) {
    await recordAccountHistoryEvent(user.id, id, "account_deleted", accountRecord.name, {
      accountType: accountRecord.type,
    });
  }

  const { error } = await supabase.from("accounts").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
}

// ── Cash Holdings ──

export async function upsertCashHolding(
  accountId: string,
  balance: number,
  currency: string = "USD",
  holdingId?: string,
  label?: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify account ownership
  const { data: account } = await supabase
    .from("accounts")
    .select("user_id, name")
    .eq("id", accountId)
    .single();

  if (!account || account.user_id !== user.id) {
    throw new Error("Account not found");
  }

  const { data: accountRecord } = await supabase
    .from("accounts")
    .select("name, type")
    .eq("id", accountId)
    .single();

  if (holdingId) {
    // Verify holding belongs to user's account
    const { data: holding } = await supabase
      .from("cash_holdings")
      .select("account_id")
      .eq("id", holdingId)
      .single();

    if (!holding || holding.account_id !== accountId) {
      throw new Error("Holding not found");
    }

    const { data: existingHolding } = await supabase
      .from("cash_holdings")
      .select("balance, currency, label")
      .eq("id", holdingId)
      .single();

    const { error } = await supabase
      .from("cash_holdings")
      .update({ balance, currency, label })
      .eq("id", holdingId);
    if (error) throw new Error(error.message);

    if (
      !existingHolding ||
      Number(existingHolding.balance) !== balance ||
      existingHolding.currency !== currency ||
      (existingHolding.label ?? null) !== (label ?? null)
    ) {
      await recordAccountHistoryEvent(
        user.id,
        accountId,
        "cash_holding_updated",
        accountRecord?.name ?? "Account",
        {
          label: label ?? existingHolding?.label ?? null,
          currency,
          previousBalance: Number(existingHolding?.balance ?? 0),
          newBalance: balance,
        }
      );
    }
  } else {
    const { error } = await supabase
      .from("cash_holdings")
      .insert({ account_id: accountId, balance, currency, label });
    if (error) throw new Error(error.message);
    await recordAccountHistoryEvent(
      user.id,
      accountId,
      "cash_holding_created",
      accountRecord?.name ?? "Account",
      {
        label: label ?? null,
        currency,
        newBalance: balance,
      }
    );
  }

  await saveAccountSnapshotForAccount(user.id, accountId);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/accounts/${accountId}`);
}

export async function upsertCpfHoldings(
  accountId: string,
  holdings: { label: string; balance: number }[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify account ownership
  const { data: account } = await supabase
    .from("accounts")
    .select("user_id")
    .eq("id", accountId)
    .single();

  if (!account || account.user_id !== user.id) {
    throw new Error("Account not found");
  }

  const { data: accountRecord } = await supabase
    .from("accounts")
    .select("name")
    .eq("id", accountId)
    .single();

  // Get existing CPF holdings for this account
  const { data: existing } = await supabase
    .from("cash_holdings")
    .select("id, label")
    .eq("account_id", accountId)
    .in("label", ["OA", "SA", "MA"]);

  const existingMap = new Map(existing?.map((h) => [h.label, h.id]) ?? []);
  const previousValues = new Map(
    ((await supabase
      .from("cash_holdings")
      .select("label, balance")
      .eq("account_id", accountId)
      .in("label", ["OA", "SA", "MA"])).data ?? []).map((holding) => [
      holding.label ?? "",
      Number(holding.balance),
    ])
  );

  for (const { label, balance } of holdings) {
    const existingId = existingMap.get(label);
    if (existingId) {
      // Update existing
      const { error } = await supabase
        .from("cash_holdings")
        .update({ balance, currency: "SGD" })
        .eq("id", existingId);
      if (error) throw new Error(error.message);
    } else {
      // Insert new
      const { error } = await supabase
        .from("cash_holdings")
        .insert({ account_id: accountId, balance, currency: "SGD", label });
      if (error) throw new Error(error.message);
    }
  }

  const changedLabels = holdings
    .filter(({ label, balance }) => Number(previousValues.get(label) ?? 0) !== balance)
    .map(({ label }) => label);

  if (changedLabels.length > 0) {
    await recordAccountHistoryEvent(
      user.id,
      accountId,
      "cpf_holdings_updated",
      accountRecord?.name ?? "CPF Account",
      {
        updatedLabels: changedLabels,
        before: Object.fromEntries(
          holdings.map(({ label }) => [label, Number(previousValues.get(label) ?? 0)])
        ),
        after: Object.fromEntries(
          holdings.map(({ label, balance }) => [label, balance])
        ),
      }
    );
  }

  await saveAccountSnapshotForAccount(user.id, accountId);

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/accounts/${accountId}`);
}

export async function getCpfAccountSettings(
  accountId: string
): Promise<CpfAccountSettings | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: account } = await supabase
    .from("accounts")
    .select("user_id, type, name")
    .eq("id", accountId)
    .single();

  if (!account || account.user_id !== user.id) {
    throw new Error("Account not found");
  }

  if (account.type !== "cpf") {
    return null;
  }

  const { data, error } = await supabase
    .from("cpf_account_settings")
    .select("*")
    .eq("account_id", accountId)
    .maybeSingle();

  if (error) {
    if (isMissingCpfSettingsTableError(error)) {
      return null;
    }
    throw new Error(error.message);
  }
  return data;
}

export async function upsertCpfAccountSettings(
  accountId: string,
  settings: Partial<Omit<CpfAccountSettings, "account_id" | "updated_at">>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: account } = await supabase
    .from("accounts")
    .select("user_id, type, name")
    .eq("id", accountId)
    .single();

  if (!account || account.user_id !== user.id) {
    throw new Error("Account not found");
  }

  if (account.type !== "cpf") {
    throw new Error("CPF settings can only be saved for CPF accounts");
  }

  const { data: existingSettings } = await supabase
    .from("cpf_account_settings")
    .select("*")
    .eq("account_id", accountId)
    .maybeSingle();

  const mergedSettings = {
    ...DEFAULT_CPF_ACCOUNT_SETTINGS,
    ...(existingSettings ?? {}),
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

  const previousSettings = {
    ...DEFAULT_CPF_ACCOUNT_SETTINGS,
    ...(existingSettings ?? {}),
  };
  const changedFields = Object.keys(mergedSettings).filter((key) => {
    const typedKey = key as keyof typeof mergedSettings;
    return previousSettings[typedKey] !== mergedSettings[typedKey];
  });

  if (changedFields.length > 0) {
    await recordAccountHistoryEvent(
      user.id,
      accountId,
      "cpf_settings_updated",
      account.name,
      {
        changedFields,
        before: Object.fromEntries(
          changedFields.map((key) => [key, previousSettings[key as keyof typeof previousSettings]])
        ),
        after: Object.fromEntries(
          changedFields.map((key) => [key, mergedSettings[key as keyof typeof mergedSettings]])
        ),
      }
    );
  }

  await saveAccountSnapshotForAccount(user.id, accountId);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/accounts/${accountId}`);
}

export async function deleteCashHolding(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership via account
  const { data: holding } = await supabase
    .from("cash_holdings")
    .select("account_id, accounts(user_id)")
    .eq("id", id)
    .single();

  const accountData = holding?.accounts as unknown as { user_id: string } | null;
  if (!holding || !accountData || accountData.user_id !== user.id) {
    throw new Error("Holding not found");
  }

  const { data: holdingRecord } = await supabase
    .from("cash_holdings")
    .select("account_id, balance, currency, label")
    .eq("id", id)
    .single();
  const { data: accountRecord } = await supabase
    .from("accounts")
    .select("name")
    .eq("id", holding.account_id)
    .single();

  const { error } = await supabase.from("cash_holdings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  await recordAccountHistoryEvent(
    user.id,
    holding.account_id,
    "cash_holding_deleted",
    accountRecord?.name ?? "Account",
    {
      label: holdingRecord?.label ?? null,
      currency: holdingRecord?.currency ?? "USD",
      previousBalance: Number(holdingRecord?.balance ?? 0),
    }
  );
  await saveAccountSnapshotForAccount(user.id, holding.account_id);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/accounts/${holding.account_id}`);
}

// ── Stock Holdings ──

export async function upsertStockHolding(
  accountId: string,
  ticker: string,
  shares: number,
  costBasisPerShare: number,
  holdingId?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify account ownership
  const { data: account } = await supabase
    .from("accounts")
    .select("user_id")
    .eq("id", accountId)
    .single();

  if (!account || account.user_id !== user.id) {
    throw new Error("Account not found");
  }

  const { data: accountRecord } = await supabase
    .from("accounts")
    .select("name")
    .eq("id", accountId)
    .single();

  const upperTicker = ticker.toUpperCase();

  if (holdingId) {
    // Verify holding belongs to user's account
    const { data: holding } = await supabase
      .from("stock_holdings")
      .select("account_id")
      .eq("id", holdingId)
      .single();

    if (!holding || holding.account_id !== accountId) {
      throw new Error("Holding not found");
    }

    const { data: existingHolding } = await supabase
      .from("stock_holdings")
      .select("ticker, shares, cost_basis_per_share")
      .eq("id", holdingId)
      .single();

    const { error } = await supabase
      .from("stock_holdings")
      .update({
        ticker: upperTicker,
        shares,
        cost_basis_per_share: costBasisPerShare,
      })
      .eq("id", holdingId);
    if (error) throw new Error(error.message);

    if (
      !existingHolding ||
      existingHolding.ticker !== upperTicker ||
      Number(existingHolding.shares) !== shares ||
      Number(existingHolding.cost_basis_per_share) !== costBasisPerShare
    ) {
      await recordAccountHistoryEvent(
        user.id,
        accountId,
        "stock_holding_updated",
        accountRecord?.name ?? "Account",
        {
          ticker: upperTicker,
          previousTicker: existingHolding?.ticker ?? upperTicker,
          previousShares: Number(existingHolding?.shares ?? 0),
          newShares: shares,
          previousCostBasisPerShare: Number(existingHolding?.cost_basis_per_share ?? 0),
          newCostBasisPerShare: costBasisPerShare,
        }
      );
    }
  } else {
    const { error } = await supabase.from("stock_holdings").insert({
      account_id: accountId,
      ticker: upperTicker,
      shares,
      cost_basis_per_share: costBasisPerShare,
    });
    if (error) throw new Error(error.message);
    await recordAccountHistoryEvent(
      user.id,
      accountId,
      "stock_holding_created",
      accountRecord?.name ?? "Account",
      {
        ticker: upperTicker,
        newShares: shares,
        newCostBasisPerShare: costBasisPerShare,
      }
    );
  }

  // Refresh stock price if stale (older than 24 hours)
  try {
    const price = await refreshStockPriceIfStale(upperTicker);
    console.log(`Stock price for ${upperTicker}: ${price}`);
  } catch (error) {
    console.error(`Failed to refresh stock price for ${upperTicker}:`, error);
    // Don't throw - price refresh failure shouldn't block the save
  }

  await saveAccountSnapshotForAccount(user.id, accountId);

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  revalidatePath(`/dashboard/accounts/${accountId}`);
}

export async function deleteStockHolding(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership via account
  const { data: holding } = await supabase
    .from("stock_holdings")
    .select("account_id, accounts(user_id)")
    .eq("id", id)
    .single();

  const accountData = holding?.accounts as unknown as { user_id: string } | null;
  if (!holding || !accountData || accountData.user_id !== user.id) {
    throw new Error("Holding not found");
  }

  const { data: holdingRecord } = await supabase
    .from("stock_holdings")
    .select("account_id, ticker, shares, cost_basis_per_share")
    .eq("id", id)
    .single();
  const { data: accountRecord } = await supabase
    .from("accounts")
    .select("name")
    .eq("id", holding.account_id)
    .single();

  const { error } = await supabase
    .from("stock_holdings")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  await recordAccountHistoryEvent(
    user.id,
    holding.account_id,
    "stock_holding_deleted",
    accountRecord?.name ?? "Account",
    {
      ticker: holdingRecord?.ticker ?? null,
      previousShares: Number(holdingRecord?.shares ?? 0),
      previousCostBasisPerShare: Number(holdingRecord?.cost_basis_per_share ?? 0),
    }
  );
  await saveAccountSnapshotForAccount(user.id, holding.account_id);
  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/accounts/${holding.account_id}`);
}

// ── User Preferences ──

export async function getUserPreferences() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows returned
    throw new Error(error.message);
  }

  // Return defaults if no preferences exist
  return data ?? { user_id: user.id, base_currency: "USD" };
}

export async function updateBaseCurrency(baseCurrency: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      base_currency: baseCurrency,
    },
    { onConflict: "user_id" }
  );

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
}

// ── FIRE Settings ──

export async function getFireSettings(): Promise<FireSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_preferences")
    .select(
      "fire_current_age, fire_swr, fire_growth_rate, fire_inflation_rate, fire_include_cpf_srs, fire_expense_mode, fire_manual_expenses, fire_savings_mode, fire_manual_savings"
    )
    .eq("user_id", user.id)
    .single();

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message);
  }

  // Return defaults merged with any existing data
  return {
    ...DEFAULT_FIRE_SETTINGS,
    ...data,
  };
}

export async function updateFireSettings(settings: Partial<FireSettings>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      ...settings,
    },
    { onConflict: "user_id" }
  );

  if (error) throw new Error(error.message);
  // Don't revalidate - these are user inputs that don't affect other data
}

// ── Snapshots ──

export async function saveSnapshot(
  totalValue: number,
  cashValue: number,
  investmentValue: number,
  currency: string = "USD"
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const today = new Date().toISOString().split("T")[0];

  const { error } = await supabase.from("net_worth_snapshots").upsert(
    {
      user_id: user.id,
      total_value: totalValue,
      cash_value: cashValue,
      investment_value: investmentValue,
      snapshot_date: today,
      currency,
    },
    { onConflict: "user_id,snapshot_date" }
  );

  if (error) throw new Error(error.message);
}

export async function saveAccountSnapshots(
  accounts: AccountWithHoldings[],
  baseCurrency: string,
  exchangeRates: Record<string, number>,
  stockPrices: Record<string, { price: number; currency: string }>
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const today = new Date().toISOString().split("T")[0];
  const rows = accounts.map((account) =>
    buildSnapshotRecord(
      account.id,
      user.id,
      account.type,
      calculateAccountTotalValue(account, baseCurrency, exchangeRates, stockPrices),
      baseCurrency,
      today
    )
  );

  if (rows.length === 0) return;

  const { error } = await supabase
    .from("account_value_snapshots")
    .upsert(rows, { onConflict: "account_id,snapshot_date" });

  if (error) throw new Error(error.message);
}

export async function getAccountHistoryEvents(accountId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("account_history_events")
    .select("*")
    .eq("user_id", user.id)
    .eq("account_id", accountId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getAccountValueSnapshots(accountId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("account_value_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .eq("account_id", accountId)
    .order("snapshot_date", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as AccountValueSnapshot[];
}

export async function getMonthlyAccountTypeTotals() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("account_value_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .order("snapshot_date", { ascending: true });

  if (error) throw new Error(error.message);
  return aggregateMonthlyAccountTypeTotals((data ?? []) as AccountValueSnapshot[]);
}

// ── Expenses ──

export async function createExpense(
  amount: number,
  currency: string,
  category: ExpenseCategory,
  subcategory: ExpenseSubcategory,
  expenseDate: string,
  description?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      user_id: user.id,
      amount,
      currency,
      category,
      subcategory,
      expense_date: expenseDate,
      description: description || null,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  return data;
}

export async function updateExpense(
  id: string,
  amount: number,
  currency: string,
  category: ExpenseCategory,
  subcategory: ExpenseSubcategory,
  expenseDate: string,
  description?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership
  const { data: expense } = await supabase
    .from("expenses")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!expense || expense.user_id !== user.id) {
    throw new Error("Expense not found");
  }

  const { error } = await supabase
    .from("expenses")
    .update({
      amount,
      currency,
      category,
      subcategory,
      expense_date: expenseDate,
      description: description || null,
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
}

export async function deleteExpense(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  // Verify ownership
  const { data: expense } = await supabase
    .from("expenses")
    .select("user_id")
    .eq("id", id)
    .single();

  if (!expense || expense.user_id !== user.id) {
    throw new Error("Expense not found");
  }

  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
}
