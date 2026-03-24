import {
  calculateCashTotal,
  calculateInvestmentValue,
  formatCurrency,
  getCurrentMonthExpenses,
} from "@track-my-worth/domain";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "@track-my-worth/config";
import { DonutChart } from "@/src/components/donut-chart";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";
import { StatCard } from "@/src/components/stat-card";
import { useAsyncResource } from "@/src/hooks/use-async-resource";
import { mobileApi } from "@/src/lib/api";

export default function DashboardScreen() {
  const resource = useAsyncResource(async () => {
    const data = await mobileApi.dashboard.getBootstrapData();
    const tickers = data.accounts.flatMap((account) =>
      account.stock_holdings.map((holding) => holding.ticker)
    );
    const exchangeRates = await mobileApi.market.getExchangeRates(
      data.preferences.base_currency
    );
    const stockPrices = await mobileApi.market.getStockPrices(tickers);

    const cashTotal = calculateCashTotal(
      data.accounts
        .filter((account) => account.type === "cash")
        .flatMap((account) => account.cash_holdings),
      data.preferences.base_currency,
      exchangeRates
    );
    const cpfTotal = calculateCashTotal(
      data.accounts
        .filter((account) => account.type === "cpf")
        .flatMap((account) => account.cash_holdings),
      data.preferences.base_currency,
      exchangeRates
    );
    const srsTotal = calculateCashTotal(
      data.accounts
        .filter((account) => account.type === "srs")
        .flatMap((account) => account.cash_holdings),
      data.preferences.base_currency,
      exchangeRates
    );
    const investmentValue = calculateInvestmentValue(
      data.accounts.flatMap((account) => account.stock_holdings),
      stockPrices,
      data.preferences.base_currency,
      exchangeRates
    );

    return {
      ...data,
      cashTotal,
      cpfTotal,
      srsTotal,
      investmentValue,
      currentMonthExpenses: getCurrentMonthExpenses(data.expenses),
    };
  }, []);

  const baseCurrency = resource.data?.preferences.base_currency ?? "USD";
  const netWorth =
    (resource.data?.cashTotal ?? 0) +
    (resource.data?.cpfTotal ?? 0) +
    (resource.data?.srsTotal ?? 0) +
    (resource.data?.investmentValue ?? 0);
  const currentMonthTotal =
    resource.data?.currentMonthExpenses.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0
    ) ?? 0;
  const allocationData = [
    {
      label: "Cash",
      value: resource.data?.cashTotal ?? 0,
      color: appTheme.colors.accentBlue,
    },
    {
      label: "Investments",
      value: resource.data?.investmentValue ?? 0,
      color: appTheme.colors.primary,
    },
    {
      label: "CPF",
      value: resource.data?.cpfTotal ?? 0,
      color: appTheme.colors.accentAmber,
    },
    {
      label: "SRS",
      value: resource.data?.srsTotal ?? 0,
      color: appTheme.colors.accentTeal,
    },
  ];
  const recentExpenses = resource.data?.currentMonthExpenses.slice(0, 4) ?? [];

  return (
    <Screen
      title="Dashboard"
      subtitle="Your mobile financial overview"
      loading={resource.loading}
      error={resource.error}
      onRefresh={resource.refresh}
      refreshing={resource.loading}
    >
      <View style={styles.grid}>
        <StatCard
          label="Net Worth"
          value={formatCurrency(netWorth, baseCurrency)}
          tone="primary"
        />
        <StatCard
          label="Cash"
          value={formatCurrency(resource.data?.cashTotal ?? 0, baseCurrency)}
          tone="blue"
        />
        <StatCard
          label="Investments"
          value={formatCurrency(resource.data?.investmentValue ?? 0, baseCurrency)}
          tone="amber"
        />
        <StatCard
          label="CPF / SRS"
          value={formatCurrency(
            (resource.data?.cpfTotal ?? 0) + (resource.data?.srsTotal ?? 0),
            baseCurrency
          )}
          tone="teal"
        />
      </View>

      <SectionCard
        title="Asset Allocation"
        subtitle="A quick read of how your tracked net worth is distributed"
      >
        <DonutChart
          data={allocationData}
          centerValue={formatCurrency(netWorth, baseCurrency)}
        />
      </SectionCard>

      <SectionCard
        title="Quick Snapshot"
        subtitle="A read-only view of the latest mobile dashboard totals"
      >
        <View style={styles.snapshotGrid}>
          <View style={styles.snapshotItem}>
            <Text style={styles.snapshotLabel}>Accounts</Text>
            <Text style={styles.snapshotValue}>
              {resource.data?.accounts.length ?? 0}
            </Text>
          </View>
          <View style={styles.snapshotItem}>
            <Text style={styles.snapshotLabel}>Expenses</Text>
            <Text style={styles.snapshotValue}>
              {resource.data?.expenses.length ?? 0}
            </Text>
          </View>
          <View style={styles.snapshotItem}>
            <Text style={styles.snapshotLabel}>This Month</Text>
            <Text style={styles.snapshotValue}>
              {formatCurrency(currentMonthTotal, baseCurrency)}
            </Text>
          </View>
        </View>
      </SectionCard>

      <SectionCard
        title="Recent Expense Activity"
        subtitle="Latest entries from this month"
      >
        {recentExpenses.length === 0 ? (
          <Text style={styles.emptyState}>No expenses recorded this month yet.</Text>
        ) : (
          recentExpenses.map((expense) => (
            <View key={expense.id} style={styles.expenseRow}>
              <View>
                <Text style={styles.expenseTitle}>
                  {expense.subcategory.replace(/_/g, " ")}
                </Text>
                <Text style={styles.expenseMeta}>{expense.expense_date}</Text>
              </View>
              <Text style={styles.expenseAmount}>
                {formatCurrency(Number(expense.amount), expense.currency)}
              </Text>
            </View>
          ))
        )}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: appTheme.spacing.md,
  },
  snapshotGrid: {
    gap: appTheme.spacing.md,
  },
  snapshotItem: {
    paddingVertical: 4,
    gap: 4,
  },
  snapshotLabel: {
    fontSize: 13,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: appTheme.colors.textMuted,
  },
  snapshotValue: {
    fontSize: 20,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  expenseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: appTheme.spacing.md,
  },
  expenseTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: appTheme.colors.text,
    textTransform: "capitalize",
  },
  expenseMeta: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  expenseAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  emptyState: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
  },
});
