import type {
  Account,
  CashHolding,
  StockHolding,
  NetWorthSnapshot,
  AccountType,
} from "@/lib/types";

let idCounter = 0;

function generateId(): string {
  return `test-id-${++idCounter}`;
}

function generateTimestamp(): string {
  return new Date().toISOString();
}

// Reset counter between tests
export function resetFactories(): void {
  idCounter = 0;
}

export function createAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: generateId(),
    user_id: "test-user-id",
    name: "Test Account",
    type: "investment" as AccountType,
    created_at: generateTimestamp(),
    updated_at: generateTimestamp(),
    ...overrides,
  };
}

export function createCashHolding(overrides: Partial<CashHolding> = {}): CashHolding {
  return {
    id: generateId(),
    account_id: "test-account-id",
    balance: 1000,
    currency: "USD",
    label: null,
    updated_at: generateTimestamp(),
    ...overrides,
  };
}

export function createStockHolding(overrides: Partial<StockHolding> = {}): StockHolding {
  return {
    id: generateId(),
    account_id: "test-account-id",
    ticker: "AAPL",
    shares: 10,
    cost_basis_per_share: 150,
    updated_at: generateTimestamp(),
    ...overrides,
  };
}

export function createSnapshot(overrides: Partial<NetWorthSnapshot> = {}): NetWorthSnapshot {
  return {
    id: generateId(),
    user_id: "test-user-id",
    total_value: 50000,
    cash_value: 20000,
    investment_value: 30000,
    snapshot_date: new Date().toISOString().split("T")[0],
    currency: "USD",
    created_at: generateTimestamp(),
    ...overrides,
  };
}

// Create multiple items at once
export function createCashHoldings(count: number, overrides: Partial<CashHolding> = {}): CashHolding[] {
  return Array.from({ length: count }, (_, i) =>
    createCashHolding({
      balance: (i + 1) * 1000,
      ...overrides,
    })
  );
}

export function createStockHoldings(count: number, overrides: Partial<StockHolding> = {}): StockHolding[] {
  const tickers = ["AAPL", "GOOGL", "MSFT", "AMZN", "META"];
  return Array.from({ length: count }, (_, i) =>
    createStockHolding({
      ticker: tickers[i % tickers.length],
      shares: (i + 1) * 5,
      cost_basis_per_share: 100 + i * 50,
      ...overrides,
    })
  );
}

export function createSnapshots(count: number, startDate: Date = new Date()): NetWorthSnapshot[] {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() - (count - 1 - i));
    return createSnapshot({
      snapshot_date: date.toISOString().split("T")[0],
      total_value: 50000 + i * 1000,
      cash_value: 20000 + i * 400,
      investment_value: 30000 + i * 600,
    });
  });
}
