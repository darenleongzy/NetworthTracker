import { describe, it, expect } from "vitest";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_SUBCATEGORIES,
  EXPENSE_COLORS,
  getSubcategoriesForCategory,
  getSubcategoryLabel,
  getCategoryLabel,
} from "./expense-categories";

describe("EXPENSE_CATEGORIES", () => {
  it("contains recurring and non_recurring categories", () => {
    const values = EXPENSE_CATEGORIES.map((c) => c.value);
    expect(values).toContain("recurring");
    expect(values).toContain("non_recurring");
  });

  it("has labels for each category", () => {
    EXPENSE_CATEGORIES.forEach((category) => {
      expect(category.label).toBeDefined();
      expect(category.label.length).toBeGreaterThan(0);
    });
  });
});

describe("EXPENSE_SUBCATEGORIES", () => {
  it("has subcategories for recurring", () => {
    const recurring = EXPENSE_SUBCATEGORIES.filter(
      (s) => s.category === "recurring"
    );
    expect(recurring.length).toBeGreaterThan(0);
  });

  it("has subcategories for non_recurring", () => {
    const nonRecurring = EXPENSE_SUBCATEGORIES.filter(
      (s) => s.category === "non_recurring"
    );
    expect(nonRecurring.length).toBeGreaterThan(0);
  });

  it("each subcategory has value, label, and category", () => {
    EXPENSE_SUBCATEGORIES.forEach((sub) => {
      expect(sub.value).toBeDefined();
      expect(sub.label).toBeDefined();
      expect(sub.category).toBeDefined();
      expect(["recurring", "non_recurring"]).toContain(sub.category);
    });
  });
});

describe("EXPENSE_COLORS", () => {
  it("has a color for each subcategory", () => {
    const subcategoryValues = EXPENSE_SUBCATEGORIES.map((s) => s.value);
    const uniqueValues = [...new Set(subcategoryValues)];
    uniqueValues.forEach((value) => {
      expect(EXPENSE_COLORS[value]).toBeDefined();
      expect(EXPENSE_COLORS[value]).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe("getSubcategoriesForCategory", () => {
  it("returns only recurring subcategories for recurring", () => {
    const result = getSubcategoriesForCategory("recurring");
    result.forEach((sub) => {
      expect(sub.category).toBe("recurring");
    });
  });

  it("returns only non_recurring subcategories for non_recurring", () => {
    const result = getSubcategoriesForCategory("non_recurring");
    result.forEach((sub) => {
      expect(sub.category).toBe("non_recurring");
    });
  });

  it("returns rent_mortgage in recurring", () => {
    const result = getSubcategoriesForCategory("recurring");
    const values = result.map((s) => s.value);
    expect(values).toContain("rent_mortgage");
  });

  it("returns shopping in non_recurring", () => {
    const result = getSubcategoriesForCategory("non_recurring");
    const values = result.map((s) => s.value);
    expect(values).toContain("shopping");
  });
});

describe("getSubcategoryLabel", () => {
  it("returns correct label for rent_mortgage", () => {
    expect(getSubcategoryLabel("rent_mortgage")).toBe("Rent/Mortgage");
  });

  it("returns correct label for food_dining", () => {
    expect(getSubcategoryLabel("food_dining")).toBe("Food & Dining");
  });

  it("returns correct label for utilities", () => {
    expect(getSubcategoryLabel("utilities")).toBe("Utilities");
  });

  it("returns value for unknown subcategory", () => {
    // @ts-expect-error - testing invalid input
    expect(getSubcategoryLabel("unknown_category")).toBe("unknown_category");
  });
});

describe("getCategoryLabel", () => {
  it("returns Recurring for recurring", () => {
    expect(getCategoryLabel("recurring")).toBe("Recurring");
  });

  it("returns Non-Recurring for non_recurring", () => {
    expect(getCategoryLabel("non_recurring")).toBe("Non-Recurring");
  });

  it("returns value for unknown category", () => {
    // @ts-expect-error - testing invalid input
    expect(getCategoryLabel("unknown")).toBe("unknown");
  });
});
