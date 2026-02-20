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
  | "family";

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
