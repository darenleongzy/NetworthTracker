export type AccountType = "cash" | "investment" | "cpf" | "srs";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  created_at: string;
  updated_at: string;
}

export interface CashHolding {
  id: string;
  account_id: string;
  balance: number;
  currency: string;
  label?: string | null;
  updated_at: string;
}

export type CpfSubAccount = "OA" | "SA" | "MA";

export const CPF_SUB_ACCOUNTS: { value: CpfSubAccount; label: string }[] = [
  { value: "OA", label: "Ordinary Account" },
  { value: "SA", label: "Special Account" },
  { value: "MA", label: "Medisave Account" },
];

export interface StockHolding {
  id: string;
  account_id: string;
  ticker: string;
  shares: number;
  cost_basis_per_share: number;
  updated_at: string;
}

export interface StockPrice {
  ticker: string;
  price: number;
  currency: string;
  fetched_at: string;
}

export interface NetWorthSnapshot {
  id: string;
  user_id: string;
  total_value: number;
  cash_value: number;
  investment_value: number;
  snapshot_date: string;
  currency: string;
  created_at: string;
}

export type AccountHistoryEventType =
  | "account_created"
  | "account_renamed"
  | "account_deleted"
  | "cash_holding_created"
  | "cash_holding_updated"
  | "cash_holding_deleted"
  | "stock_holding_created"
  | "stock_holding_updated"
  | "stock_holding_deleted"
  | "cpf_holdings_updated"
  | "cpf_settings_updated";

export interface AccountHistoryEvent {
  id: string;
  account_id: string | null;
  user_id: string;
  event_type: AccountHistoryEventType;
  event_label: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AccountValueSnapshot {
  id: string;
  account_id: string | null;
  user_id: string;
  account_type: AccountType;
  total_value: number;
  currency: string;
  snapshot_date: string;
  created_at: string;
}

export interface UserPreferences {
  user_id: string;
  base_currency: string;
  updated_at: string;
}

export interface ExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number;
  fetched_at: string;
}

export interface AccountWithHoldings extends Account {
  cash_holdings: CashHolding[];
  stock_holdings: StockHolding[];
}

export type CoupleConnectionStatus = "pending" | "connected" | "declined" | "ended";

export interface CoupleConnection {
  id: string;
  inviter_id: string;
  invitee_id: string;
  inviter_email: string;
  invitee_email: string;
  status: CoupleConnectionStatus;
  goal_amount: number;
  goal_include_cpf: boolean;
  invite_sent_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export type CoupleAssetBreakdown = {
  cash: number;
  investments: number;
  cpf: number;
  srs: number;
};

export interface CpfAccountSettings {
  account_id: string;
  current_age: number;
  monthly_salary: number;
  oa_interest_rate: number;
  sa_interest_rate: number;
  ma_interest_rate: number;
  frs_met_for_ma_overflow: boolean;
  mortgage_monthly_deduction: number;
  mortgage_payoff_age: number | null;
  early_retirement_age: number;
  updated_at: string;
}

export const DEFAULT_CPF_ACCOUNT_SETTINGS: Omit<
  CpfAccountSettings,
  "account_id" | "updated_at"
> = {
  current_age: 35,
  monthly_salary: 0,
  oa_interest_rate: 2.5,
  sa_interest_rate: 4,
  ma_interest_rate: 4,
  frs_met_for_ma_overflow: false,
  mortgage_monthly_deduction: 0,
  mortgage_payoff_age: null,
  early_retirement_age: 55,
};

// Expense types
export type ExpenseCategory = "recurring" | "non_recurring";

export type RecurringSubcategory =
  | "rent_mortgage"
  | "utilities"
  | "insurance"
  | "subscriptions"
  | "loan_payments"
  | "memberships"
  | "childcare"
  | "phone_internet"
  | "family"
  | "tax"
  | "car";

export type NonRecurringSubcategory =
  | "shopping"
  | "food_dining"
  | "groceries"
  | "transportation"
  | "entertainment"
  | "travel"
  | "healthcare"
  | "education"
  | "gifts"
  | "home_maintenance"
  | "personal_care"
  | "tax"
  | "car"
  | "other";

export type ExpenseSubcategory = RecurringSubcategory | NonRecurringSubcategory;

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  subcategory: ExpenseSubcategory;
  description: string | null;
  expense_date: string;
  created_at: string;
  updated_at: string;
}

// FIRE Calculator Settings
export interface FireSettings {
  fire_current_age: number;
  fire_swr: number;
  fire_growth_rate: number;
  fire_inflation_rate: number;
  fire_include_cpf_srs: boolean;
  fire_expense_mode: "tracked" | "manual";
  fire_manual_expenses: number;
  fire_savings_mode: "auto" | "manual";
  fire_manual_savings: number;
}

export const DEFAULT_FIRE_SETTINGS: FireSettings = {
  fire_current_age: 35,
  fire_swr: 4,
  fire_growth_rate: 7,
  fire_inflation_rate: 3,
  fire_include_cpf_srs: false,
  fire_expense_mode: "tracked",
  fire_manual_expenses: 0,
  fire_savings_mode: "manual",
  fire_manual_savings: 0,
};
