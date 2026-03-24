import {
  buildExpenseSummary,
  buildMobileAccountGroups,
  getDefaultExpenseSubcategory,
  getSubcategoryOptions,
  mergeMobileFireSettings,
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
