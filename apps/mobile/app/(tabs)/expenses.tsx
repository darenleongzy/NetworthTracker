import {
  EXPENSE_CATEGORIES,
  SUPPORTED_CURRENCIES,
  formatCurrency,
  getCategoryLabel,
  getSubcategoryLabel,
  type Expense,
} from "@track-my-worth/domain";
import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "@track-my-worth/config";
import {
  ChipSelector,
  Field,
  FormInput,
  PrimaryButton,
} from "@/src/components/form-ui";
import { DonutChart } from "@/src/components/donut-chart";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";
import { StatCard } from "@/src/components/stat-card";
import { useAsyncResource } from "@/src/hooks/use-async-resource";
import { mobileApi } from "@/src/lib/api";
import {
  buildExpenseSummary,
  getDefaultExpenseCategory,
  getDefaultExpenseSubcategory,
  getSubcategoryOptions,
} from "@/src/lib/mobile-helpers";

type ExpenseDraft = {
  id: string | null;
  amount: string;
  currency: string;
  category: "recurring" | "non_recurring";
  subcategory: string;
  expenseDate: string;
  description: string;
};

function createEmptyDraft(): ExpenseDraft {
  const category = getDefaultExpenseCategory();
  return {
    id: null,
    amount: "",
    currency: "USD",
    category,
    subcategory: getDefaultExpenseSubcategory(category),
    expenseDate: new Date().toISOString().slice(0, 10),
    description: "",
  };
}

export default function ExpensesScreen() {
  const resource = useAsyncResource(async () => {
    const [expenses, preferences] = await Promise.all([
      mobileApi.expenses.list(),
      mobileApi.preferences.get(),
    ]);
    return { expenses, preferences };
  }, []);
  const [draft, setDraft] = useState<ExpenseDraft>(createEmptyDraft());
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const baseCurrency = resource.data?.preferences.base_currency ?? "USD";
  const summary = buildExpenseSummary(resource.data?.expenses ?? []);
  const subcategoryOptions = useMemo(
    () => getSubcategoryOptions(draft.category),
    [draft.category]
  );
  const chartData = [
    { label: "Recurring", value: summary.recurring, color: appTheme.colors.accentBlue },
    {
      label: "Non-recurring",
      value: summary.nonRecurring,
      color: appTheme.colors.accentAmber,
    },
  ];

  function populateDraft(expense: Expense) {
    setDraft({
      id: expense.id,
      amount: String(expense.amount),
      currency: expense.currency,
      category: expense.category,
      subcategory: expense.subcategory,
      expenseDate: expense.expense_date,
      description: expense.description ?? "",
    });
  }

  function resetDraft() {
    setDraft(createEmptyDraft());
    setActionError(null);
  }

  async function handleSaveExpense() {
    if (!draft.amount) {
      setActionError("Enter an amount before saving.");
      return;
    }

    setSaving(true);
    setActionError(null);
    try {
      const payload = {
        amount: Number(draft.amount),
        currency: draft.currency,
        category: draft.category,
        subcategory: draft.subcategory as Expense["subcategory"],
        expenseDate: draft.expenseDate,
        description: draft.description.trim() || undefined,
      };
      if (draft.id) {
        await mobileApi.expenses.update(draft.id, payload);
      } else {
        await mobileApi.expenses.create(payload);
      }
      resetDraft();
      await resource.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save expense");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteExpense(id: string) {
    setSaving(true);
    setActionError(null);
    try {
      await mobileApi.expenses.remove(id);
      if (draft.id === id) resetDraft();
      await resource.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to delete expense");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      title="Expenses"
      subtitle="Track and review your spending"
      loading={resource.loading}
      error={resource.error}
      onRefresh={resource.refresh}
      refreshing={resource.loading}
    >
      <View style={styles.grid}>
        <StatCard label="Total" value={formatCurrency(summary.total, baseCurrency)} tone="primary" />
        <StatCard
          label="Recurring"
          value={formatCurrency(summary.recurring, baseCurrency)}
          tone="blue"
        />
        <StatCard
          label="Non-recurring"
          value={formatCurrency(summary.nonRecurring, baseCurrency)}
          tone="amber"
        />
      </View>

      <SectionCard
        title={draft.id ? "Edit Expense" : "Add Expense"}
        subtitle="Create and update expense records directly from mobile"
      >
        <Field label="Amount">
          <FormInput
            value={draft.amount}
            onChangeText={(value) => setDraft((current) => ({ ...current, amount: value }))}
            keyboardType="decimal-pad"
            placeholder="150"
          />
        </Field>
        <Field label="Currency">
          <ChipSelector
            value={draft.currency}
            onChange={(value) => setDraft((current) => ({ ...current, currency: value }))}
            options={SUPPORTED_CURRENCIES.slice(0, 4).map((currency) => ({
              label: currency.code,
              value: currency.code,
            }))}
          />
        </Field>
        <Field label="Category">
          <ChipSelector
            value={draft.category}
            onChange={(value) =>
              setDraft((current) => ({
                ...current,
                category: value,
                subcategory: getDefaultExpenseSubcategory(value),
              }))
            }
            options={EXPENSE_CATEGORIES.map((category) => ({
              label: category.label,
              value: category.value,
            }))}
          />
        </Field>
        <Field label="Subcategory">
          <ChipSelector
            value={draft.subcategory}
            onChange={(value) => setDraft((current) => ({ ...current, subcategory: value }))}
            options={subcategoryOptions.map((option) => ({
              label: option.label,
              value: option.value,
            }))}
          />
        </Field>
        <Field label="Date">
          <FormInput
            value={draft.expenseDate}
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, expenseDate: value }))
            }
            placeholder="YYYY-MM-DD"
          />
        </Field>
        <Field label="Description">
          <FormInput
            value={draft.description}
            onChangeText={(value) =>
              setDraft((current) => ({ ...current, description: value }))
            }
            placeholder="Optional note"
          />
        </Field>
        {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
        <View style={styles.buttonRow}>
          <PrimaryButton
            label={saving ? "Saving..." : draft.id ? "Update expense" : "Add expense"}
            onPress={handleSaveExpense}
            disabled={saving}
          />
          {draft.id ? (
            <PrimaryButton
              label="Cancel edit"
              onPress={resetDraft}
              disabled={saving}
              tone="neutral"
            />
          ) : null}
        </View>
      </SectionCard>

      <SectionCard
        title="Spending Mix"
        subtitle="A simple read of recurring versus non-recurring spending"
      >
        <DonutChart data={chartData} centerValue={formatCurrency(summary.total, baseCurrency)} />
      </SectionCard>

      <SectionCard title="Recent Expenses" subtitle="Tap Edit to update, or Remove to delete">
        {(resource.data?.expenses ?? []).map((expense) => (
          <View key={expense.id} style={styles.card}>
            <View style={styles.row}>
              <Text style={styles.category}>{getCategoryLabel(expense.category)}</Text>
              <Text style={styles.amount}>
                {formatCurrency(Number(expense.amount), expense.currency)}
              </Text>
            </View>
            <Text style={styles.subcategory}>{getSubcategoryLabel(expense.subcategory)}</Text>
            <Text style={styles.date}>{expense.expense_date}</Text>
            {expense.description ? (
              <Text style={styles.description}>{expense.description}</Text>
            ) : null}
            <View style={styles.actionRow}>
              <Pressable onPress={() => populateDraft(expense)}>
                <Text style={styles.editText}>Edit</Text>
              </Pressable>
              <Pressable onPress={() => handleDeleteExpense(expense.id)}>
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: appTheme.spacing.md,
  },
  card: {
    borderRadius: 18,
    backgroundColor: appTheme.colors.surfaceMuted,
    padding: 14,
    gap: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: appTheme.spacing.md,
  },
  category: {
    fontSize: 16,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  amount: {
    fontSize: 18,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  subcategory: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
  },
  date: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  description: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  actionRow: {
    flexDirection: "row",
    gap: appTheme.spacing.md,
    paddingTop: 4,
  },
  editText: {
    color: appTheme.colors.primaryDeep,
    fontWeight: "700",
    fontSize: 13,
  },
  removeText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 13,
  },
  buttonRow: {
    gap: appTheme.spacing.sm,
  },
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
  },
});
