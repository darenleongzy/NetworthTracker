import {
  CPF_SUB_ACCOUNTS,
  DEFAULT_CPF_ACCOUNT_SETTINGS,
  buildCpfProjectionSummary,
  calculateCashTotal,
  calculateInvestmentValue,
  formatCurrency,
} from "@track-my-worth/domain";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { appTheme } from "@track-my-worth/config";
import {
  ChipSelector,
  Field,
  FormInput,
  PrimaryButton,
} from "@/src/components/form-ui";
import { SectionCard } from "@/src/components/section-card";
import { Screen } from "@/src/components/screen";
import { useAsyncResource } from "@/src/hooks/use-async-resource";
import { mobileApi } from "@/src/lib/api";

const isE2EEnabled = Boolean(
  process.env.EXPO_PUBLIC_E2E_TEST_EMAIL && process.env.EXPO_PUBLIC_E2E_TEST_PASSWORD
);

export default function AccountDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const resource = useAsyncResource(async () => {
    if (!id) throw new Error("Missing account id");
    const [account, preferences] = await Promise.all([
      mobileApi.accounts.get(id),
      mobileApi.preferences.get(),
    ]);
    const tickers = account.stock_holdings.map((holding) => holding.ticker);
    const [exchangeRates, stockPrices] = await Promise.all([
      mobileApi.market.getExchangeRates(preferences.base_currency),
      mobileApi.market.getStockPrices(tickers),
    ]);
    const cpfSettings =
      account.type === "cpf" ? await mobileApi.cpf.getSettings(account.id) : null;

    return { account, preferences, cpfSettings, exchangeRates, stockPrices };
  }, [id]);

  const [accountName, setAccountName] = useState("");
  const [cashLabel, setCashLabel] = useState("");
  const [cashBalance, setCashBalance] = useState("");
  const [cashCurrency, setCashCurrency] = useState("USD");
  const [stockTicker, setStockTicker] = useState("");
  const [stockShares, setStockShares] = useState("");
  const [stockCostBasis, setStockCostBasis] = useState("");
  const [cpfBalances, setCpfBalances] = useState<Record<"OA" | "SA" | "MA", string>>({
    OA: "",
    SA: "",
    MA: "",
  });
  const [cpfForm, setCpfForm] = useState({
    current_age: String(DEFAULT_CPF_ACCOUNT_SETTINGS.current_age),
    monthly_salary: "0",
    oa_interest_rate: String(DEFAULT_CPF_ACCOUNT_SETTINGS.oa_interest_rate),
    sa_interest_rate: String(DEFAULT_CPF_ACCOUNT_SETTINGS.sa_interest_rate),
    ma_interest_rate: String(DEFAULT_CPF_ACCOUNT_SETTINGS.ma_interest_rate),
    mortgage_monthly_deduction: "0",
    mortgage_payoff_age: "",
    early_retirement_age: String(DEFAULT_CPF_ACCOUNT_SETTINGS.early_retirement_age),
    frs_met_for_ma_overflow: DEFAULT_CPF_ACCOUNT_SETTINGS.frs_met_for_ma_overflow,
  });
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [projectionYears, setProjectionYears] = useState("7");

  const baseCurrency = resource.data?.preferences.base_currency ?? "USD";
  const account = resource.data?.account;

  const total = account
    ? calculateCashTotal(
        account.cash_holdings,
        baseCurrency,
        resource.data?.exchangeRates ?? {}
      ) +
      calculateInvestmentValue(
        account.stock_holdings,
        resource.data?.stockPrices ?? {},
        baseCurrency,
        resource.data?.exchangeRates ?? {}
      )
    : 0;

  const cpfSettings = useMemo(
    () => ({
      ...DEFAULT_CPF_ACCOUNT_SETTINGS,
      ...(resource.data?.cpfSettings ?? {}),
    }),
    [resource.data?.cpfSettings]
  );

  const cpfProjection =
    account?.type === "cpf"
      ? buildCpfProjectionSummary(account.cash_holdings, {
          currentAge: Number(cpfForm.current_age || cpfSettings.current_age),
          monthlySalary: Number(cpfForm.monthly_salary || cpfSettings.monthly_salary),
          oaInterestRate: Number(cpfForm.oa_interest_rate || cpfSettings.oa_interest_rate),
          saInterestRate: Number(cpfForm.sa_interest_rate || cpfSettings.sa_interest_rate),
          maInterestRate: Number(cpfForm.ma_interest_rate || cpfSettings.ma_interest_rate),
          frsMetForMaOverflow: cpfForm.frs_met_for_ma_overflow,
          mortgageMonthlyDeduction: Number(
            cpfForm.mortgage_monthly_deduction || cpfSettings.mortgage_monthly_deduction
          ),
          mortgagePayoffAge: cpfForm.mortgage_payoff_age
            ? Number(cpfForm.mortgage_payoff_age)
            : cpfSettings.mortgage_payoff_age,
          earlyRetirementAge: Number(
            cpfForm.early_retirement_age || cpfSettings.early_retirement_age
          ),
        }, Number(projectionYears))
      : null;

  useEffect(() => {
    if (!account) return;
    setAccountName(account.name);
    setCashCurrency(baseCurrency);
    setCpfBalances({
      OA: String(account.cash_holdings.find((holding) => holding.label === "OA")?.balance ?? 0),
      SA: String(account.cash_holdings.find((holding) => holding.label === "SA")?.balance ?? 0),
      MA: String(account.cash_holdings.find((holding) => holding.label === "MA")?.balance ?? 0),
    });
    setCpfForm({
      current_age: String(cpfSettings.current_age),
      monthly_salary: String(cpfSettings.monthly_salary),
      oa_interest_rate: String(cpfSettings.oa_interest_rate),
      sa_interest_rate: String(cpfSettings.sa_interest_rate),
      ma_interest_rate: String(cpfSettings.ma_interest_rate),
      mortgage_monthly_deduction: String(cpfSettings.mortgage_monthly_deduction),
      mortgage_payoff_age: cpfSettings.mortgage_payoff_age
        ? String(cpfSettings.mortgage_payoff_age)
        : "",
      early_retirement_age: String(cpfSettings.early_retirement_age),
      frs_met_for_ma_overflow: cpfSettings.frs_met_for_ma_overflow,
    });
  }, [account, baseCurrency, cpfSettings]);

  async function runAction(key: string, action: () => Promise<void>) {
    setSavingKey(key);
    setActionError(null);
    setActionNotice(null);
    try {
      await action();
      await resource.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setSavingKey(null);
    }
  }

  async function handleRename() {
    if (!account || !accountName.trim()) return;
    await runAction("rename", async () => {
      await mobileApi.accounts.updateName(account.id, accountName.trim());
    });
  }

  async function handleAddCash() {
    if (!account || !cashBalance) {
      setActionError("Enter a balance before saving.");
      return;
    }

    await runAction("cash", async () => {
      await mobileApi.holdings.upsertCash(
        account.id,
        Number(cashBalance),
        cashCurrency,
        undefined,
        cashLabel.trim() || null
      );
      setCashLabel("");
      setCashBalance("");
      setCashCurrency(baseCurrency);
    });
  }

  async function handleAddStock() {
    if (!account || !stockTicker.trim() || !stockShares || !stockCostBasis) {
      setActionError("Enter ticker, shares, and cost basis before saving.");
      return;
    }

    await runAction("stock", async () => {
      await mobileApi.holdings.upsertStock(
        account.id,
        stockTicker.trim(),
        Number(stockShares),
        Number(stockCostBasis)
      );
      setStockTicker("");
      setStockShares("");
      setStockCostBasis("");
    });
  }

  async function handleSaveCpfBalances() {
    if (!account) return;

    await runAction("cpf-balances", async () => {
      await mobileApi.holdings.upsertCpfBalances(
        account.id,
        CPF_SUB_ACCOUNTS.map((subAccount) => ({
          label: subAccount.value,
          balance: Number(cpfBalances[subAccount.value] || 0),
        }))
      );
    });
  }

  async function handleSaveCpfSettings() {
    if (!account) return;

    await runAction("cpf-settings", async () => {
      await mobileApi.cpf.upsertSettings(account.id, {
        current_age: Number(cpfForm.current_age || 0),
        monthly_salary: Number(cpfForm.monthly_salary || 0),
        oa_interest_rate: Number(cpfForm.oa_interest_rate || 0),
        sa_interest_rate: Number(cpfForm.sa_interest_rate || 0),
        ma_interest_rate: Number(cpfForm.ma_interest_rate || 0),
        frs_met_for_ma_overflow: cpfForm.frs_met_for_ma_overflow,
        mortgage_monthly_deduction: Number(cpfForm.mortgage_monthly_deduction || 0),
        mortgage_payoff_age: cpfForm.mortgage_payoff_age
          ? Number(cpfForm.mortgage_payoff_age)
          : null,
        early_retirement_age: Number(cpfForm.early_retirement_age || 0),
      });
    });
  }

  async function handleDeleteAccount() {
    if (!account) return;

    await runAction("delete-account", async () => {
      await mobileApi.accounts.remove(account.id);
      router.replace("/(tabs)/accounts");
    });
  }

  async function handleApplyE2ECpfScenario() {
    if (!account || account.type !== "cpf") return;

    setProjectionYears("15");
    await runAction("cpf-e2e", async () => {
      await mobileApi.holdings.upsertCpfBalances(account.id, [
        { label: "OA", balance: 1000 },
        { label: "SA", balance: 2000 },
        { label: "MA", balance: 3000 },
      ]);
      await mobileApi.cpf.upsertSettings(account.id, {
        current_age: 35,
        monthly_salary: 8000,
        oa_interest_rate: DEFAULT_CPF_ACCOUNT_SETTINGS.oa_interest_rate,
        sa_interest_rate: DEFAULT_CPF_ACCOUNT_SETTINGS.sa_interest_rate,
        ma_interest_rate: DEFAULT_CPF_ACCOUNT_SETTINGS.ma_interest_rate,
        frs_met_for_ma_overflow: false,
        mortgage_monthly_deduction: 0,
        mortgage_payoff_age: null,
        early_retirement_age: 45,
      });
    });
    setActionNotice("E2E CPF scenario applied");
  }

  async function handleCleanupE2EAccounts() {
    setSavingKey("cleanup-e2e");
    setActionError(null);
    setActionNotice(null);
    try {
      const accounts = await mobileApi.accounts.list();
      const e2eAccounts = accounts.filter((entry) => entry.name.startsWith("Maestro "));
      for (const entry of e2eAccounts) {
        await mobileApi.accounts.remove(entry.id);
      }
      router.replace("/(tabs)/accounts");
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to clean up E2E accounts");
    } finally {
      setSavingKey(null);
    }
  }

  return (
    <Screen
      title={account?.name ?? "Account"}
      subtitle={account ? account.type.toUpperCase() : undefined}
      loading={resource.loading}
      error={resource.error}
      onRefresh={resource.refresh}
      refreshing={resource.loading}
    >
      <SectionCard>
        <Text style={styles.value}>{formatCurrency(total, baseCurrency)}</Text>
        <Text style={styles.muted}>
          {account?.cash_holdings.length ?? 0} cash balances ·{" "}
          {account?.stock_holdings.length ?? 0} stock holdings
        </Text>
      </SectionCard>

      <SectionCard title="Account Actions" subtitle="Rename or remove this account">
        <Field label="Account name">
          <FormInput value={accountName} onChangeText={setAccountName} />
        </Field>
        <View style={styles.buttonRow}>
          <PrimaryButton
            label={savingKey === "rename" ? "Saving..." : "Save name"}
            onPress={handleRename}
            disabled={savingKey !== null}
          />
          <PrimaryButton
            label={savingKey === "delete-account" ? "Deleting..." : "Delete account"}
            onPress={handleDeleteAccount}
            disabled={savingKey !== null}
            tone="danger"
            testID="account-delete-button"
          />
        </View>
        {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
        {actionNotice ? <Text style={styles.noticeText}>{actionNotice}</Text> : null}
        {__DEV__ && isE2EEnabled ? (
          <PrimaryButton
            label={savingKey === "cleanup-e2e" ? "Cleaning..." : "Cleanup E2E Accounts"}
            onPress={handleCleanupE2EAccounts}
            disabled={savingKey !== null}
            tone="neutral"
            testID="account-cleanup-e2e-button"
          />
        ) : null}
      </SectionCard>

      {(account?.type === "cash" || account?.type === "srs") && (
        <SectionCard title="Add Cash Balance" subtitle="Track another cash position">
          <Field label="Label">
            <FormInput
              value={cashLabel}
              onChangeText={setCashLabel}
              placeholder="Emergency fund"
            />
          </Field>
          <Field label="Currency">
            <FormInput
              value={cashCurrency}
              onChangeText={(value) => setCashCurrency(value.toUpperCase())}
              autoCapitalize="characters"
            />
          </Field>
          <Field label="Balance">
            <FormInput
              value={cashBalance}
              onChangeText={setCashBalance}
              keyboardType="decimal-pad"
              placeholder="25000"
            />
          </Field>
          <PrimaryButton
            label={savingKey === "cash" ? "Saving..." : "Add cash balance"}
            onPress={handleAddCash}
            disabled={savingKey !== null}
          />
        </SectionCard>
      )}

      {account?.cash_holdings.length ? (
        <SectionCard title="Cash Balances" subtitle="Balances currently tracked in this account">
          {account.cash_holdings.map((holding) => (
            <View key={holding.id} style={styles.rowCard}>
              <View style={styles.rowContent}>
                <Text style={styles.rowLabel}>{holding.label ?? holding.currency}</Text>
                <Text style={styles.rowValue}>
                  {formatCurrency(Number(holding.balance), holding.currency)}
                </Text>
              </View>
              {account.type !== "cpf" ? (
                <Pressable
                  onPress={() =>
                    runAction(`remove-cash-${holding.id}`, async () => {
                      await mobileApi.holdings.removeCash(holding.id);
                    })
                  }
                >
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </SectionCard>
      ) : null}

      {account?.type === "investment" && (
        <SectionCard title="Add Stock Holding" subtitle="Save ticker, shares, and cost basis">
          <Field label="Ticker">
            <FormInput
              value={stockTicker}
              onChangeText={(value) => setStockTicker(value.toUpperCase())}
              autoCapitalize="characters"
              placeholder="AAPL"
            />
          </Field>
          <Field label="Shares">
            <FormInput
              value={stockShares}
              onChangeText={setStockShares}
              keyboardType="decimal-pad"
              placeholder="10"
            />
          </Field>
          <Field label="Cost basis per share (USD)">
            <FormInput
              value={stockCostBasis}
              onChangeText={setStockCostBasis}
              keyboardType="decimal-pad"
              placeholder="175"
            />
          </Field>
          <PrimaryButton
            label={savingKey === "stock" ? "Saving..." : "Add stock holding"}
            onPress={handleAddStock}
            disabled={savingKey !== null}
          />
        </SectionCard>
      )}

      {account?.stock_holdings.length ? (
        <SectionCard title="Stock Holdings" subtitle="Market snapshot with direct remove actions">
          {account.stock_holdings.map((holding) => (
            <View key={holding.id} style={styles.rowCard}>
              <View style={styles.rowContent}>
                <Text style={styles.rowValue}>{holding.ticker}</Text>
                <Text style={styles.rowLabel}>
                  {holding.shares} shares · Cost basis{" "}
                  {formatCurrency(Number(holding.cost_basis_per_share), "USD")}
                </Text>
                <Text style={styles.rowLabel}>
                  Market value{" "}
                  {formatCurrency(
                    Number(holding.shares) *
                      (resource.data?.stockPrices?.[holding.ticker.toUpperCase()]?.price ?? 0),
                    resource.data?.stockPrices?.[holding.ticker.toUpperCase()]?.currency ?? "USD"
                  )}
                </Text>
              </View>
              <Pressable
                onPress={() =>
                  runAction(`remove-stock-${holding.id}`, async () => {
                    await mobileApi.holdings.removeStock(holding.id);
                  })
                }
              >
                <Text style={styles.removeText}>Remove</Text>
              </Pressable>
            </View>
          ))}
        </SectionCard>
      ) : null}

      {account?.type === "cpf" && (
        <>
          <SectionCard title="CPF Balances" subtitle="Update OA, SA, and MA tracked balances">
            {CPF_SUB_ACCOUNTS.map((subAccount) => (
              <Field key={subAccount.value} label={subAccount.label}>
                <FormInput
                  testID={`cpf-balance-${subAccount.value}-input`}
                  accessibilityLabel={`${subAccount.label} balance`}
                  value={cpfBalances[subAccount.value]}
                  onChangeText={(value) =>
                    setCpfBalances((current) => ({
                      ...current,
                      [subAccount.value]: value,
                    }))
                  }
                  keyboardType="decimal-pad"
                />
              </Field>
            ))}
            <PrimaryButton
              label={savingKey === "cpf-balances" ? "Saving..." : "Save CPF balances"}
              onPress={handleSaveCpfBalances}
              disabled={savingKey !== null}
              testID="cpf-balances-save-button"
            />
          </SectionCard>

          <SectionCard
            title="CPF Settings"
            subtitle="Update contribution assumptions and retirement planning inputs"
          >
            <Field label="Current age">
              <FormInput
                testID="cpf-current-age-input"
                accessibilityLabel="Current age"
                value={cpfForm.current_age}
                onChangeText={(value) =>
                  setCpfForm((current) => ({ ...current, current_age: value }))
                }
                keyboardType="number-pad"
              />
            </Field>
            <Field label="Monthly salary (SGD)">
              <FormInput
                testID="cpf-monthly-salary-input"
                accessibilityLabel="Monthly salary"
                value={cpfForm.monthly_salary}
                onChangeText={(value) =>
                  setCpfForm((current) => ({ ...current, monthly_salary: value }))
                }
                keyboardType="decimal-pad"
              />
            </Field>
            <View style={styles.inlineFields}>
              <View style={styles.inlineField}>
                <Field label="OA interest %">
                  <FormInput
                    testID="cpf-oa-interest-input"
                    accessibilityLabel="OA interest rate"
                    value={cpfForm.oa_interest_rate}
                    onChangeText={(value) =>
                      setCpfForm((current) => ({ ...current, oa_interest_rate: value }))
                    }
                    keyboardType="decimal-pad"
                  />
                </Field>
              </View>
              <View style={styles.inlineField}>
                <Field label="SA interest %">
                  <FormInput
                    testID="cpf-sa-interest-input"
                    accessibilityLabel="SA interest rate"
                    value={cpfForm.sa_interest_rate}
                    onChangeText={(value) =>
                      setCpfForm((current) => ({ ...current, sa_interest_rate: value }))
                    }
                    keyboardType="decimal-pad"
                  />
                </Field>
              </View>
              <View style={styles.inlineField}>
                <Field label="MA interest %">
                  <FormInput
                    testID="cpf-ma-interest-input"
                    accessibilityLabel="MA interest rate"
                    value={cpfForm.ma_interest_rate}
                    onChangeText={(value) =>
                      setCpfForm((current) => ({ ...current, ma_interest_rate: value }))
                    }
                    keyboardType="decimal-pad"
                  />
                </Field>
              </View>
            </View>
            <Field label="Mortgage deduction (SGD)">
              <FormInput
                testID="cpf-mortgage-deduction-input"
                accessibilityLabel="Mortgage deduction"
                value={cpfForm.mortgage_monthly_deduction}
                onChangeText={(value) =>
                  setCpfForm((current) => ({
                    ...current,
                    mortgage_monthly_deduction: value,
                  }))
                }
                keyboardType="decimal-pad"
              />
            </Field>
            <Field label="Mortgage payoff age">
              <FormInput
                testID="cpf-mortgage-payoff-age-input"
                accessibilityLabel="Mortgage payoff age"
                value={cpfForm.mortgage_payoff_age}
                onChangeText={(value) =>
                  setCpfForm((current) => ({ ...current, mortgage_payoff_age: value }))
                }
                keyboardType="number-pad"
                placeholder="Optional"
              />
            </Field>
            <Field label="Early retirement age">
              <FormInput
                testID="cpf-early-retirement-age-input"
                accessibilityLabel="Early retirement age"
                value={cpfForm.early_retirement_age}
                onChangeText={(value) =>
                  setCpfForm((current) => ({ ...current, early_retirement_age: value }))
                }
                keyboardType="number-pad"
              />
            </Field>
            <Field label="MA overflow after 55">
              <ChipSelector
                testID="cpf-ma-overflow"
                value={cpfForm.frs_met_for_ma_overflow ? "oa" : "ra"}
                onChange={(value) =>
                  setCpfForm((current) => ({
                    ...current,
                    frs_met_for_ma_overflow: value === "oa",
                  }))
                }
                options={[
                  { label: "Route to RA", value: "ra" },
                  { label: "FRS met → OA", value: "oa" },
                ]}
              />
            </Field>
            <PrimaryButton
              label={savingKey === "cpf-settings" ? "Saving..." : "Save CPF settings"}
              onPress={handleSaveCpfSettings}
              disabled={savingKey !== null}
              testID="cpf-settings-save-button"
            />
            {__DEV__ && isE2EEnabled ? (
              <PrimaryButton
                label="Apply E2E CPF Scenario"
                onPress={handleApplyE2ECpfScenario}
                disabled={savingKey !== null}
                tone="neutral"
                testID="cpf-apply-e2e-button"
              />
            ) : null}
            {actionNotice ? <Text style={styles.noticeText}>{actionNotice}</Text> : null}
          </SectionCard>
        </>
      )}

      {cpfProjection ? (
        <SectionCard
          title="CPF Projection"
          subtitle="Adjust the horizon and compare projected CPF balances over time"
        >
          <Field label="Projection horizon">
            <ChipSelector
              testID="cpf-projection-years"
              value={projectionYears}
              onChange={setProjectionYears}
              options={[
                { label: "7y", value: "7" },
                { label: "15y", value: "15" },
                { label: "25y", value: "25" },
                { label: "40y", value: "40" },
              ]}
            />
          </Field>
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryCard, styles.summaryBlue]}>
              <Text style={styles.summaryLabel}>Monthly CPF</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(cpfProjection.currentBreakdown.totalContribution, "SGD")}
              </Text>
              <Text style={styles.summaryHint}>
                OA {formatCurrency(cpfProjection.currentBreakdown.oaContribution, "SGD")} ·
                {` `}
                {cpfProjection.currentBreakdown.middleAccountLabel}{" "}
                {formatCurrency(cpfProjection.currentBreakdown.middleContribution, "SGD")}
              </Text>
            </View>
            <View style={[styles.summaryCard, styles.summaryAmber]}>
              <Text style={styles.summaryLabel}>{projectionYears}-Year Total</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(cpfProjection.sevenYearProjection.totalBalance, "SGD")}
              </Text>
              <Text style={styles.summaryHint}>
                Interest {formatCurrency(cpfProjection.sevenYearProjection.totalInterestEarned, "SGD")}
              </Text>
            </View>
          </View>
          <Text style={styles.muted}>
            Projected age: {cpfProjection.sevenYearProjection.ageAtEnd}
          </Text>
          <View style={styles.summaryGrid}>
            <View style={styles.balancePill}>
              <Text style={styles.balanceLabel}>OA</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(cpfProjection.sevenYearProjection.balances.oa, "SGD")}
              </Text>
            </View>
            <View style={styles.balancePill}>
              <Text style={styles.balanceLabel}>SA</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(cpfProjection.sevenYearProjection.balances.sa, "SGD")}
              </Text>
            </View>
            <View style={styles.balancePill}>
              <Text style={styles.balanceLabel}>MA</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(cpfProjection.sevenYearProjection.balances.ma, "SGD")}
              </Text>
            </View>
            <View style={styles.balancePill}>
              <Text style={styles.balanceLabel}>RA</Text>
              <Text style={styles.balanceValue}>
                {formatCurrency(cpfProjection.sevenYearProjection.balances.retirement, "SGD")}
              </Text>
            </View>
          </View>
          <View style={[styles.summaryCard, styles.summaryTeal]}>
            <Text style={styles.summaryLabel}>Early retirement projection</Text>
            <Text style={styles.summaryValue}>
              {formatCurrency(cpfProjection.earlyRetirementProjection.totalBalance, "SGD")}
            </Text>
            <Text style={styles.summaryHint}>
              Age {cpfProjection.earlyRetirementProjection.ageAtEnd} · Mortgage used{" "}
              {formatCurrency(cpfProjection.earlyRetirementProjection.totalMortgageDeducted, "SGD")}
            </Text>
          </View>
        </SectionCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  value: {
    fontSize: 30,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  muted: {
    fontSize: 15,
    color: appTheme.colors.textMuted,
  },
  rowCard: {
    borderRadius: 18,
    backgroundColor: appTheme.colors.surfaceMuted,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: appTheme.spacing.md,
  },
  rowContent: {
    gap: 4,
    flex: 1,
  },
  rowLabel: {
    fontSize: 15,
    color: appTheme.colors.textMuted,
  },
  rowValue: {
    fontSize: 18,
    fontWeight: "600",
    color: appTheme.colors.text,
  },
  removeText: {
    color: "#b91c1c",
    fontWeight: "700",
    fontSize: 13,
  },
  buttonRow: {
    gap: appTheme.spacing.sm,
  },
  inlineFields: {
    gap: appTheme.spacing.sm,
  },
  inlineField: {
    flex: 1,
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
  summaryGrid: {
    gap: appTheme.spacing.sm,
  },
  summaryCard: {
    borderRadius: 18,
    padding: 14,
    gap: 4,
  },
  summaryBlue: {
    backgroundColor: "#eff6ff",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  summaryAmber: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
  },
  summaryTeal: {
    backgroundColor: "#f0fdfa",
    borderWidth: 1,
    borderColor: "#99f6e4",
  },
  summaryLabel: {
    fontSize: 13,
    color: appTheme.colors.textMuted,
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  summaryHint: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
  },
  balancePill: {
    borderRadius: 16,
    padding: 12,
    backgroundColor: appTheme.colors.surfaceMuted,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  balanceLabel: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
});
