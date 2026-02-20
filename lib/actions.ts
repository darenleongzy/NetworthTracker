"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { refreshStockPriceIfStale } from "@/lib/stock-api";
import type { AccountType, ExpenseCategory, ExpenseSubcategory, FireSettings } from "@/lib/types";
import { DEFAULT_FIRE_SETTINGS } from "@/lib/types";

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
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  return data;
}

export async function updateAccount(id: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("accounts")
    .update({ name })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
}

export async function deleteAccount(id: string) {
  const supabase = await createClient();
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

  if (holdingId) {
    const { error } = await supabase
      .from("cash_holdings")
      .update({ balance, currency, label })
      .eq("id", holdingId);
    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("cash_holdings")
      .insert({ account_id: accountId, balance, currency, label });
    if (error) throw new Error(error.message);
  }

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/accounts/${accountId}`);
}

export async function upsertCpfHoldings(
  accountId: string,
  holdings: { label: string; balance: number }[]
) {
  const supabase = await createClient();

  // Get existing CPF holdings for this account
  const { data: existing } = await supabase
    .from("cash_holdings")
    .select("id, label")
    .eq("account_id", accountId)
    .in("label", ["OA", "SA", "MA"]);

  const existingMap = new Map(existing?.map((h) => [h.label, h.id]) ?? []);

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

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/accounts/${accountId}`);
}

export async function deleteCashHolding(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("cash_holdings").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
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
  } else {
    const { error } = await supabase.from("stock_holdings").insert({
      account_id: accountId,
      ticker: upperTicker,
      shares,
      cost_basis_per_share: costBasisPerShare,
    });
    if (error) throw new Error(error.message);
  }

  // Refresh stock price if stale (older than 24 hours)
  try {
    const price = await refreshStockPriceIfStale(upperTicker);
    console.log(`Stock price for ${upperTicker}: ${price}`);
  } catch (error) {
    console.error(`Failed to refresh stock price for ${upperTicker}:`, error);
    // Don't throw - price refresh failure shouldn't block the save
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/accounts");
  revalidatePath(`/dashboard/accounts/${accountId}`);
}

export async function deleteStockHolding(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("stock_holdings")
    .delete()
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
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
  const { error } = await supabase.from("expenses").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
}
