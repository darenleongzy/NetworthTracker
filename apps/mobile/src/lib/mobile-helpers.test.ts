import {
  buildExpenseSubcategoryTotals,
  buildMobileTrendSeries,
  buildExpenseSummary,
  buildMobileAccountGroups,
  filterExpenses,
  getDefaultExpenseSubcategory,
  getSubcategoryOptions,
  mergeMobileFireSettings,
  sortExpenses,
} from "./mobile-helpers";
import type { AccountWithHoldings, Expense } from "@track-my-worth/domain";

describe("mobile helpers", () => {
  it("groups accounts into the three mobile account buckets", () => {
    const accounts = [
      {
        id: "1",
        user_id: "u1",
        name: "IBKR",
        type: "investment",
        created_at: "",
        updated_at: "",
        cash_holdings: [],
        stock_holdings: [
          {
            id: "s1",
            account_id: "1",
            ticker: "AAPL",
            shares: 2,
            cost_basis_per_share: 100,
            updated_at: "",
          },
        ],
      },
      {
        id: "2",
        user_id: "u1",
        name: "DBS",
        type: "cash",
        created_at: "",
        updated_at: "",
        cash_holdings: [
          {
            id: "c1",
            account_id: "2",
            balance: 5000,
            currency: "USD",
            updated_at: "",
          },
        ],
        stock_holdings: [],
      },
      {
        id: "3",
        user_id: "u1",
        name: "CPF",
        type: "cpf",
        created_at: "",
        updated_at: "",
        cash_holdings: [
          {
            id: "c2",
            account_id: "3",
            balance: 12000,
            currency: "SGD",
            label: "OA",
            updated_at: "",
          },
        ],
        stock_holdings: [],
      },
    ] satisfies AccountWithHoldings[];

    const groups = buildMobileAccountGroups(
      accounts,
      "USD",
      { SGD: 0.74 },
      { AAPL: { price: 210, currency: "USD" } }
    );

    expect(groups.map((group) => group.key)).toEqual([
      "brokerage",
      "cash",
      "retirement",
    ]);
    expect(groups[0]?.accounts).toHaveLength(1);
    expect(groups[1]?.accounts).toHaveLength(1);
    expect(groups[2]?.accounts).toHaveLength(1);
    expect(groups[0]?.total).toBe(420);
    expect(groups[1]?.total).toBe(5000);
    expect(groups[2]?.total).toBeCloseTo(16216.216, 2);
  });

  it("summarizes recurring and non-recurring expenses", () => {
    const expenses = [
      { amount: 100, category: "recurring" },
      { amount: 60, category: "non_recurring" },
      { amount: 40, category: "recurring" },
    ] as Expense[];

    expect(buildExpenseSummary(expenses)).toEqual({
      total: 200,
      recurring: 140,
      nonRecurring: 60,
    });
  });

  it("filters and sorts expenses for mobile list controls", () => {
    const expenses = [
      {
        id: "e1",
        category: "recurring",
        subcategory: "rent_mortgage",
        amount: 100,
        expense_date: "2026-03-10",
      },
      {
        id: "e2",
        category: "non_recurring",
        subcategory: "shopping",
        amount: 260,
        expense_date: "2026-03-12",
      },
    ] as Expense[];

    expect(filterExpenses(expenses, "recurring")).toHaveLength(1);
    expect(sortExpenses(expenses, "largest")[0]?.id).toBe("e2");
    expect(sortExpenses(expenses, "newest")[0]?.id).toBe("e2");
  });

  it("builds subcategory totals and trend points", () => {
    const expenses = [
      {
        id: "e1",
        category: "recurring",
        subcategory: "rent_mortgage",
        amount: 100,
        expense_date: "2026-03-10",
      },
      {
        id: "e2",
        category: "recurring",
        subcategory: "rent_mortgage",
        amount: 50,
        expense_date: "2026-03-12",
      },
      {
        id: "e3",
        category: "non_recurring",
        subcategory: "shopping",
        amount: 90,
        expense_date: "2026-03-08",
      },
    ] as Expense[];

    const totals = buildExpenseSubcategoryTotals(expenses);
    const trend = buildMobileTrendSeries(
      [
        {
          id: "s1",
          user_id: "u1",
          total_value: 1000,
          cash_value: 200,
          investment_value: 800,
          snapshot_date: "2026-03-01",
          currency: "USD",
          created_at: "",
        },
      ],
      { snapshot_date: "2026-03-24", total_value: 1400 }
    );

    expect(totals[0]).toEqual({ subcategory: "rent_mortgage", amount: 150 });
    expect(trend).toHaveLength(2);
    expect(trend[1]?.value).toBe(1400);
  });

  it("returns subcategory defaults scoped to the selected category", () => {
    const recurringOptions = getSubcategoryOptions("recurring");
    const defaultRecurring = getDefaultExpenseSubcategory("recurring");
    const defaultNonRecurring = getDefaultExpenseSubcategory("non_recurring");

    expect(recurringOptions.every((option) => option.category === "recurring")).toBe(true);
    expect(recurringOptions.some((option) => option.value === defaultRecurring)).toBe(true);
    expect(defaultNonRecurring).toBe("shopping");
  });

  it("merges missing fire settings with mobile defaults", () => {
    const merged = mergeMobileFireSettings({ fire_swr: 3.5 });

    expect(merged.fire_swr).toBe(3.5);
    expect(merged.fire_current_age).toBe(35);
    expect(merged.fire_include_cpf_srs).toBe(false);
  });
});
