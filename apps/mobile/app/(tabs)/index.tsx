import {
  calculateCashTotal,
  calculateInvestmentCost,
  calculateInvestmentValue,
  formatCurrency,
  getCurrentMonthExpenses,
} from "@track-my-worth/domain";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "@track-my-worth/config";
import { DonutChart } from "@/src/components/donut-chart";
import { LineChart } from "@/src/components/line-chart";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";
import { StatCard } from "@/src/components/stat-card";
import { useAsyncResource } from "@/src/hooks/use-async-resource";
import { mobileApi } from "@/src/lib/api";
import { buildMobileTrendSeries } from "@/src/lib/mobile-helpers";

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
    const allStockHoldings = data.accounts.flatMap((account) => account.stock_holdings);
    const investmentValue = calculateInvestmentValue(
      allStockHoldings,
      stockPrices,
      data.preferences.base_currency,
      exchangeRates
    );
    const investmentCost = calculateInvestmentCost(allStockHoldings);
    const currentMonthExpenses = getCurrentMonthExpenses(data.expenses);
    const netWorth =
      cashTotal + cpfTotal + srsTotal + investmentValue;

    return {
      ...data,
      exchangeRates,
      stockPrices,
      cashTotal,
      cpfTotal,
      srsTotal,
      investmentValue,
      investmentCost,
      netWorth,
      currentMonthExpenses,
      trendSeries: buildMobileTrendSeries(data.snapshots, {
        snapshot_date: new Date().toISOString().slice(0, 10),
        total_value: netWorth,
      }),
    };
  }, []);

  const baseCurrency = resource.data?.preferences.base_currency ?? "USD";
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
  const topAccounts = (resource.data?.accounts ?? [])
    .map((account) => {
      const cashTotal = calculateCashTotal(
        account.cash_holdings,
        baseCurrency,
        resource.data?.exchangeRates ?? {}
      );
      const stockTotal = calculateInvestmentValue(
        account.stock_holdings,
        resource.data?.stockPrices ?? {},
        baseCurrency,
        resource.data?.exchangeRates ?? {}
      );
      return { ...account, total: cashTotal + stockTotal };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const totalGainLoss =
    (resource.data?.investmentValue ?? 0) - (resource.data?.investmentCost ?? 0);
  const gainLossPercent =
    (resource.data?.investmentCost ?? 0) > 0
      ? (totalGainLoss / (resource.data?.investmentCost ?? 1)) * 100
      : 0;

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
          value={formatCurrency(resource.data?.netWorth ?? 0, baseCurrency)}
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
        title="Net Worth Trend"
        subtitle="A compact trend view based on your saved snapshots"
      >
        <LineChart
          points={resource.data?.trendSeries ?? []}
          color={appTheme.colors.primary}
        />
      </SectionCard>

      <SectionCard
        title="Asset Allocation"
        subtitle="A quick read of how your tracked net worth is distributed"
      >
        <DonutChart
          data={allocationData}
          centerValue={formatCurrency(resource.data?.netWorth ?? 0, baseCurrency)}
        />
      </SectionCard>

      <SectionCard
        title="Investment Performance"
        subtitle="Current market value versus your recorded cost basis"
      >
        <View style={styles.snapshotGrid}>
          <View style={styles.snapshotItem}>
            <Text style={styles.snapshotLabel}>Cost Basis</Text>
            <Text style={styles.snapshotValue}>
              {formatCurrency(resource.data?.investmentCost ?? 0, "USD")}
            </Text>
          </View>
          <View style={styles.snapshotItem}>
            <Text style={styles.snapshotLabel}>Gain / Loss</Text>
            <Text
              style={[
                styles.snapshotValue,
                totalGainLoss >= 0 ? styles.positive : styles.negative,
              ]}
            >
              {formatCurrency(totalGainLoss, baseCurrency)}
            </Text>
            <Text style={styles.snapshotHint}>
              {gainLossPercent.toFixed(2)}%
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
        title="Top Holdings Overview"
        subtitle="Your largest tracked accounts across cash, brokerage, CPF, and SRS"
      >
        {topAccounts.map((account) => (
          <View key={account.id} style={styles.accountRow}>
            <View>
              <Text style={styles.expenseTitle}>{account.name}</Text>
              <Text style={styles.expenseMeta}>{account.type.toUpperCase()}</Text>
            </View>
            <Text style={styles.expenseAmount}>
              {formatCurrency(account.total, baseCurrency)}
            </Text>
          </View>
        ))}
      </SectionCard>

      <SectionCard
        title="Recent Expense Activity"
        subtitle="Latest entries from this month"
      >
        {recentExpenses.length === 0 ? (
          <Text style={styles.emptyState}>No expenses recorded this month yet.</Text>
        ) : (
          recentExpenses.map((expense) => (
            <View key={expense.id} style={styles.accountRow}>
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
  snapshotHint: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
  },
  accountRow: {
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
  positive: {
    color: appTheme.colors.accentEmerald,
  },
  negative: {
    color: "#b91c1c",
  },
});
