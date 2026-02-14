export type AccountType = "cash" | "investment";

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
  updated_at: string;
}

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
