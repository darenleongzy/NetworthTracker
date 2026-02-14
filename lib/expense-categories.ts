import type { ExpenseCategory, ExpenseSubcategory } from "@/lib/types";

export const EXPENSE_CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "recurring", label: "Recurring" },
  { value: "non_recurring", label: "Non-Recurring" },
];

export const EXPENSE_SUBCATEGORIES: {
  value: ExpenseSubcategory;
  label: string;
  category: ExpenseCategory;
}[] = [
  // Recurring
  { value: "rent_mortgage", label: "Rent/Mortgage", category: "recurring" },
  { value: "utilities", label: "Utilities", category: "recurring" },
  { value: "insurance", label: "Insurance", category: "recurring" },
  { value: "subscriptions", label: "Subscriptions", category: "recurring" },
  { value: "loan_payments", label: "Loan Payments", category: "recurring" },
  { value: "memberships", label: "Memberships", category: "recurring" },
  { value: "childcare", label: "Childcare", category: "recurring" },
  { value: "phone_internet", label: "Phone/Internet", category: "recurring" },
  { value: "family", label: "Family", category: "recurring" },
  // Non-Recurring
  { value: "shopping", label: "Shopping", category: "non_recurring" },
  { value: "food_dining", label: "Food & Dining", category: "non_recurring" },
  { value: "groceries", label: "Groceries", category: "non_recurring" },
  { value: "transportation", label: "Transportation", category: "non_recurring" },
  { value: "entertainment", label: "Entertainment", category: "non_recurring" },
  { value: "travel", label: "Travel", category: "non_recurring" },
  { value: "healthcare", label: "Healthcare", category: "non_recurring" },
  { value: "education", label: "Education", category: "non_recurring" },
  { value: "gifts", label: "Gifts", category: "non_recurring" },
  { value: "home_maintenance", label: "Home Maintenance", category: "non_recurring" },
  { value: "personal_care", label: "Personal Care", category: "non_recurring" },
  { value: "other", label: "Other", category: "non_recurring" },
];

export const EXPENSE_COLORS: Record<ExpenseSubcategory, string> = {
  // Recurring - blues and purples
  rent_mortgage: "#3b82f6",
  utilities: "#6366f1",
  insurance: "#8b5cf6",
  subscriptions: "#a855f7",
  loan_payments: "#d946ef",
  memberships: "#ec4899",
  childcare: "#f43f5e",
  phone_internet: "#0ea5e9",
  family: "#7c3aed",
  // Non-Recurring - greens, oranges, etc.
  shopping: "#22c55e",
  food_dining: "#84cc16",
  groceries: "#eab308",
  transportation: "#f97316",
  entertainment: "#ef4444",
  travel: "#14b8a6",
  healthcare: "#06b6d4",
  education: "#0891b2",
  gifts: "#f472b6",
  home_maintenance: "#78716c",
  personal_care: "#a3e635",
  other: "#9ca3af",
};

export function getSubcategoriesForCategory(category: ExpenseCategory) {
  return EXPENSE_SUBCATEGORIES.filter((s) => s.category === category);
}

export function getSubcategoryLabel(subcategory: ExpenseSubcategory): string {
  const found = EXPENSE_SUBCATEGORIES.find((s) => s.value === subcategory);
  return found?.label ?? subcategory;
}

export function getCategoryLabel(category: ExpenseCategory): string {
  const found = EXPENSE_CATEGORIES.find((c) => c.value === category);
  return found?.label ?? category;
}
