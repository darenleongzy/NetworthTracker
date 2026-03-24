import {
  DEFAULT_FIRE_SETTINGS,
  EXPENSE_CATEGORIES,
  EXPENSE_SUBCATEGORIES,
  calculateCashTotal,
  calculateInvestmentValue,
  type AccountWithHoldings,
  type AccountType,
  type ExchangeRates,
  type Expense,
  type ExpenseCategory,
  type ExpenseSubcategory,
  type FireSettings,
  type StockPriceData,
} from "@track-my-worth/domain";

export type MobileAccountCategoryKey = "brokerage" | "cash" | "retirement";

export const MOBILE_ACCOUNT_CATEGORIES: {
  key: MobileAccountCategoryKey;
  label: string;
  types: AccountType[];
  tone: "blue" | "primary" | "teal";
}[] = [
  { key: "brokerage", label: "Brokerage", types: ["investment"], tone: "blue" },
  { key: "cash", label: "Cash", types: ["cash"], tone: "primary" },
  { key: "retirement", label: "CPF / SRS", types: ["cpf", "srs"], tone: "teal" },
];

export function buildMobileAccountGroups(
  accounts: AccountWithHoldings[],
  baseCurrency: string,
  exchangeRates: ExchangeRates,
  stockPrices: Record<string, StockPriceData>
) {
  return MOBILE_ACCOUNT_CATEGORIES.map((category) => {
    const groupedAccounts = accounts.filter((account) =>
      category.types.includes(account.type)
    );
    const total = groupedAccounts.reduce((sum, account) => {
      const cashTotal = calculateCashTotal(
        account.cash_holdings,
        baseCurrency,
        exchangeRates
      );
      const stockTotal = calculateInvestmentValue(
        account.stock_holdings,
        stockPrices,
        baseCurrency,
        exchangeRates
      );

      return sum + cashTotal + stockTotal;
    }, 0);

    return {
      ...category,
      accounts: groupedAccounts,
      total,
    };
  });
}

export function buildExpenseSummary(expenses: Expense[]) {
  const total = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0);
  const recurring = expenses
    .filter((expense) => expense.category === "recurring")
    .reduce((sum, expense) => sum + Number(expense.amount), 0);

  return {
    total,
    recurring,
    nonRecurring: total - recurring,
  };
}

export function getSubcategoryOptions(category: ExpenseCategory) {
  return EXPENSE_SUBCATEGORIES.filter((option) => option.category === category);
}

export function getDefaultExpenseCategory(): ExpenseCategory {
  return EXPENSE_CATEGORIES[0]?.value ?? "recurring";
}

export function getDefaultExpenseSubcategory(
  category: ExpenseCategory
): ExpenseSubcategory {
  return (
    getSubcategoryOptions(category)[0]?.value ??
    EXPENSE_SUBCATEGORIES[0]?.value ??
    "other"
  );
}

export function mergeMobileFireSettings(
  fireSettings?: Partial<FireSettings> | null
): FireSettings {
  return {
    ...DEFAULT_FIRE_SETTINGS,
    ...(fireSettings ?? {}),
  };
}
