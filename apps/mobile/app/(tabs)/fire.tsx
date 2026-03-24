import {
  calculateFireMetrics,
  calculateCashTotal,
  calculateInvestmentValue,
  formatCurrency,
  generateProjection,
} from "@track-my-worth/domain";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "@track-my-worth/config";
import {
  ChipSelector,
  Field,
  FormInput,
  PrimaryButton,
} from "@/src/components/form-ui";
import { LineChart } from "@/src/components/line-chart";
import { ProgressMeter } from "@/src/components/progress-meter";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";
import { StatCard } from "@/src/components/stat-card";
import { useAsyncResource } from "@/src/hooks/use-async-resource";
import { mobileApi } from "@/src/lib/api";
import { mergeMobileFireSettings } from "@/src/lib/mobile-helpers";

const isE2EEnabled = Boolean(
  process.env.EXPO_PUBLIC_E2E_TEST_EMAIL && process.env.EXPO_PUBLIC_E2E_TEST_PASSWORD
);

export default function FireScreen() {
  const resource = useAsyncResource(async () => {
    const bootstrap = await mobileApi.dashboard.getBootstrapData();
    const fireSettings = mergeMobileFireSettings(bootstrap.fireSettings);
    const tickers = bootstrap.accounts.flatMap((account) =>
      account.stock_holdings.map((holding) => holding.ticker)
    );
    const rates = await mobileApi.market.getExchangeRates(
      bootstrap.preferences.base_currency
    );
    const stockPrices = await mobileApi.market.getStockPrices(tickers);
    const cashTotal = calculateCashTotal(
      bootstrap.accounts
        .filter((account) => account.type === "cash")
        .flatMap((account) => account.cash_holdings),
      bootstrap.preferences.base_currency,
      rates
    );
    const cpfTotal = calculateCashTotal(
      bootstrap.accounts
        .filter((account) => account.type === "cpf")
        .flatMap((account) => account.cash_holdings),
      bootstrap.preferences.base_currency,
      rates
    );
    const srsTotal = calculateCashTotal(
      bootstrap.accounts
        .filter((account) => account.type === "srs")
        .flatMap((account) => account.cash_holdings),
      bootstrap.preferences.base_currency,
      rates
    );
    const investmentValue = calculateInvestmentValue(
      bootstrap.accounts.flatMap((account) => account.stock_holdings),
      stockPrices,
      bootstrap.preferences.base_currency,
      rates
    );
    const trackedMonthlyExpenses =
      bootstrap.expenses.reduce((sum, expense) => sum + Number(expense.amount), 0) / 3;

    const annualExpenses =
      fireSettings.fire_expense_mode === "manual"
        ? fireSettings.fire_manual_expenses * 12
        : trackedMonthlyExpenses * 12;
    const currentNetWorth =
      cashTotal +
      investmentValue +
      (fireSettings.fire_include_cpf_srs ? cpfTotal + srsTotal : 0);
    const annualSavings =
      fireSettings.fire_savings_mode === "manual"
        ? fireSettings.fire_manual_savings * 12
        : 0;

    const metrics = calculateFireMetrics({
      currentAge: fireSettings.fire_current_age,
      safeWithdrawalRate: fireSettings.fire_swr / 100,
      annualGrowthRate: fireSettings.fire_growth_rate / 100,
      inflationRate: fireSettings.fire_inflation_rate / 100,
      annualExpenses,
      currentNetWorth,
      annualSavings,
    });

    const projection = generateProjection(
      currentNetWorth,
      metrics.fireNumber,
      annualSavings,
      (1 + fireSettings.fire_growth_rate / 100) /
        (1 + fireSettings.fire_inflation_rate / 100) -
        1,
      fireSettings.fire_current_age,
      10
    );

    return {
      baseCurrency: bootstrap.preferences.base_currency,
      metrics,
      includeCpfSrs: fireSettings.fire_include_cpf_srs,
      projection,
      fireSettings,
      trackedMonthlyExpenses,
    };
  }, []);
  const [form, setForm] = useState({
    fire_current_age: "35",
    fire_swr: "4",
    fire_growth_rate: "7",
    fire_inflation_rate: "3",
    fire_include_cpf_srs: false,
    fire_expense_mode: "tracked" as "tracked" | "manual",
    fire_manual_expenses: "0",
    fire_savings_mode: "manual" as "auto" | "manual",
    fire_manual_savings: "0",
  });
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!resource.data?.fireSettings) return;
    setForm({
      fire_current_age: String(resource.data.fireSettings.fire_current_age),
      fire_swr: String(resource.data.fireSettings.fire_swr),
      fire_growth_rate: String(resource.data.fireSettings.fire_growth_rate),
      fire_inflation_rate: String(resource.data.fireSettings.fire_inflation_rate),
      fire_include_cpf_srs: resource.data.fireSettings.fire_include_cpf_srs,
      fire_expense_mode: resource.data.fireSettings.fire_expense_mode,
      fire_manual_expenses: String(resource.data.fireSettings.fire_manual_expenses),
      fire_savings_mode: resource.data.fireSettings.fire_savings_mode,
      fire_manual_savings: String(resource.data.fireSettings.fire_manual_savings),
    });
  }, [resource.data?.fireSettings]);

  async function handleSaveSettings() {
    setSaving(true);
    setActionError(null);
    setActionNotice(null);
    try {
      await mobileApi.fire.updateSettings({
        fire_current_age: Number(form.fire_current_age || 0),
        fire_swr: Number(form.fire_swr || 0),
        fire_growth_rate: Number(form.fire_growth_rate || 0),
        fire_inflation_rate: Number(form.fire_inflation_rate || 0),
        fire_include_cpf_srs: form.fire_include_cpf_srs,
        fire_expense_mode: form.fire_expense_mode,
        fire_manual_expenses: Number(form.fire_manual_expenses || 0),
        fire_savings_mode: form.fire_savings_mode,
        fire_manual_savings: Number(form.fire_manual_savings || 0),
      });
      await resource.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save FIRE settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleApplyE2ESettings() {
    setSaving(true);
    setActionError(null);
    setActionNotice(null);
    try {
      await mobileApi.fire.updateSettings({
        fire_current_age: 35,
        fire_swr: 4,
        fire_growth_rate: 7,
        fire_inflation_rate: 3,
        fire_include_cpf_srs: true,
        fire_expense_mode: "manual",
        fire_manual_expenses: 3000,
        fire_savings_mode: "manual",
        fire_manual_savings: 2500,
      });
      await resource.refresh();
      setActionNotice("E2E FIRE scenario applied");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save FIRE settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      title="FIRE"
      subtitle="Financial independence on mobile"
      loading={resource.loading}
      error={resource.error}
      onRefresh={resource.refresh}
      refreshing={resource.loading}
    >
      <View style={styles.grid}>
        <StatCard
          label="FIRE Number"
          value={formatCurrency(resource.data?.metrics.fireNumber ?? 0, resource.data?.baseCurrency)}
          tone="primary"
        />
        <StatCard
          label="Gap to FIRE"
          value={formatCurrency(resource.data?.metrics.gapToFire ?? 0, resource.data?.baseCurrency)}
          tone="amber"
        />
        <StatCard
          label="Progress"
          value={`${Math.round(resource.data?.metrics.progressPercent ?? 0)}%`}
          tone="green"
        />
      </View>

      <SectionCard
        title="FIRE Settings"
        subtitle="Adjust the assumptions behind your mobile FIRE view"
      >
        <Field label="Current age">
          <FormInput
            testID="fire-current-age-input"
            accessibilityLabel="FIRE current age"
            value={form.fire_current_age}
            onChangeText={(value) => setForm((current) => ({ ...current, fire_current_age: value }))}
            keyboardType="number-pad"
          />
        </Field>
        <Field label="SWR %">
          <FormInput
            testID="fire-swr-input"
            accessibilityLabel="FIRE safe withdrawal rate"
            value={form.fire_swr}
            onChangeText={(value) => setForm((current) => ({ ...current, fire_swr: value }))}
            keyboardType="decimal-pad"
          />
        </Field>
        <Field label="Growth rate %">
          <FormInput
            testID="fire-growth-rate-input"
            accessibilityLabel="FIRE growth rate"
            value={form.fire_growth_rate}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, fire_growth_rate: value }))
            }
            keyboardType="decimal-pad"
          />
        </Field>
        <Field label="Inflation rate %">
          <FormInput
            testID="fire-inflation-rate-input"
            accessibilityLabel="FIRE inflation rate"
            value={form.fire_inflation_rate}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, fire_inflation_rate: value }))
            }
            keyboardType="decimal-pad"
          />
        </Field>
        <Field label="Include CPF / SRS">
          <ChipSelector
            testID="fire-include-cpf-srs"
            value={form.fire_include_cpf_srs ? "yes" : "no"}
            onChange={(value) =>
              setForm((current) => ({ ...current, fire_include_cpf_srs: value === "yes" }))
            }
            options={[
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ]}
          />
        </Field>
        <Field label="Expense mode">
          <ChipSelector
            testID="fire-expense-mode"
            value={form.fire_expense_mode}
            onChange={(value) =>
              setForm((current) => ({ ...current, fire_expense_mode: value }))
            }
            options={[
              { label: "Tracked", value: "tracked" },
              { label: "Manual", value: "manual" },
            ]}
          />
        </Field>
        {form.fire_expense_mode === "manual" ? (
          <Field label="Manual monthly expenses">
            <FormInput
              testID="fire-manual-expenses-input"
              accessibilityLabel="Manual monthly expenses"
              value={form.fire_manual_expenses}
              onChangeText={(value) =>
                setForm((current) => ({ ...current, fire_manual_expenses: value }))
              }
              keyboardType="decimal-pad"
            />
          </Field>
        ) : (
          <Text style={styles.panelText}>
            Tracked monthly expenses:{" "}
            {formatCurrency(resource.data?.trackedMonthlyExpenses ?? 0, resource.data?.baseCurrency)}
          </Text>
        )}
        <Field label="Savings mode">
          <ChipSelector
            testID="fire-savings-mode"
            value={form.fire_savings_mode}
            onChange={(value) =>
              setForm((current) => ({ ...current, fire_savings_mode: value }))
            }
            options={[
              { label: "Auto", value: "auto" },
              { label: "Manual", value: "manual" },
            ]}
          />
        </Field>
        {form.fire_savings_mode === "manual" ? (
          <Field label="Manual monthly savings">
            <FormInput
              testID="fire-manual-savings-input"
              accessibilityLabel="Manual monthly savings"
              value={form.fire_manual_savings}
              onChangeText={(value) =>
                setForm((current) => ({ ...current, fire_manual_savings: value }))
              }
              keyboardType="decimal-pad"
            />
          </Field>
        ) : null}
        {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
        {actionNotice ? <Text style={styles.noticeText}>{actionNotice}</Text> : null}
        <PrimaryButton
          label={saving ? "Saving..." : "Save FIRE settings"}
          onPress={handleSaveSettings}
          disabled={saving}
          testID="fire-save-button"
        />
        {__DEV__ && isE2EEnabled ? (
          <PrimaryButton
            label="Apply E2E FIRE Scenario"
            onPress={handleApplyE2ESettings}
            disabled={saving}
            tone="neutral"
            testID="fire-apply-e2e-button"
          />
        ) : null}
      </SectionCard>

      <SectionCard
        title="Projection"
        subtitle="Current FIRE target, runway, and 10-year preview"
      >
        <ProgressMeter
          label="Progress toward FIRE"
          value={resource.data?.metrics.progressPercent ?? 0}
          tone={appTheme.colors.accentEmerald}
        />
        <Text style={styles.panelText}>
          Years to FIRE: {resource.data?.metrics.yearsToFire ?? "Not reached"}
        </Text>
        <Text style={styles.panelText}>
          FIRE age: {resource.data?.metrics.fireAge ?? "Not reached"}
        </Text>
        <Text style={styles.panelText}>
          CPF/SRS included: {resource.data?.includeCpfSrs ? "Yes" : "No"}
        </Text>
        <Text style={styles.panelText}>
          Monthly withdrawal now:{" "}
          {formatCurrency(resource.data?.metrics.monthlyWithdrawal ?? 0, resource.data?.baseCurrency)}
        </Text>
        <Text style={styles.panelText}>
          Income gap: {formatCurrency(resource.data?.metrics.incomeGap ?? 0, resource.data?.baseCurrency)}
        </Text>
      </SectionCard>

      <SectionCard
        title="Projection Chart"
        subtitle="Net worth trend against your FIRE target"
      >
        <LineChart
          points={
            resource.data?.projection.map((point) => ({
              label: `Age ${point.age}`,
              value: point.netWorth,
            })) ?? []
          }
          color={appTheme.colors.accentEmerald}
        />
        <Text style={styles.panelText}>
          FIRE target today: {formatCurrency(resource.data?.metrics.fireNumber ?? 0, resource.data?.baseCurrency)}
        </Text>
      </SectionCard>

      <SectionCard title="10-Year Preview" subtitle="Projected net worth versus FIRE target">
        {resource.data?.projection.slice(0, 6).map((point) => (
          <View key={point.year} style={styles.projectionRow}>
            <Text style={styles.projectionYear}>Age {point.age}</Text>
            <View style={styles.projectionValues}>
              <Text style={styles.panelText}>
                Net worth {formatCurrency(point.netWorth, resource.data?.baseCurrency)}
              </Text>
              <Text style={styles.panelText}>
                Target {formatCurrency(point.fireNumber, resource.data?.baseCurrency)}
              </Text>
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
  panelText: {
    fontSize: 15,
    color: appTheme.colors.textMuted,
  },
  projectionRow: {
    gap: 4,
    paddingVertical: 4,
  },
  projectionYear: {
    fontSize: 15,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  projectionValues: {
    gap: 2,
  },
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
  },
  noticeText: {
    fontSize: 13,
    color: appTheme.colors.primaryDeep,
    fontWeight: "600",
  },
});
