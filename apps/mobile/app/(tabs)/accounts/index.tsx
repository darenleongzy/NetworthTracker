import {
  calculateCashTotal,
  calculateInvestmentValue,
  formatCurrency,
  type AccountType,
} from "@track-my-worth/domain";
import { Link } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useMemo, useState } from "react";
import { appTheme } from "@track-my-worth/config";
import {
  Field,
  FormInput,
  ChipSelector,
  PrimaryButton,
} from "@/src/components/form-ui";
import { SectionCard } from "@/src/components/section-card";
import { Screen } from "@/src/components/screen";
import { useAsyncResource } from "@/src/hooks/use-async-resource";
import { mobileApi } from "@/src/lib/api";
import {
  MOBILE_ACCOUNT_CATEGORIES,
  buildMobileAccountGroups,
  type MobileAccountCategoryKey,
} from "@/src/lib/mobile-helpers";

export default function AccountsScreen() {
  const resource = useAsyncResource(async () => {
    const [accounts, preferences] = await Promise.all([
      mobileApi.accounts.list(),
      mobileApi.preferences.get(),
    ]);
    const tickers = accounts.flatMap((account) =>
      account.stock_holdings.map((holding) => holding.ticker)
    );
    const [exchangeRates, stockPrices] = await Promise.all([
      mobileApi.market.getExchangeRates(preferences.base_currency),
      mobileApi.market.getStockPrices(tickers),
    ]);

    return { accounts, preferences, exchangeRates, stockPrices };
  }, []);
  const [activeCategory, setActiveCategory] =
    useState<MobileAccountCategoryKey>("brokerage");
  const [draftName, setDraftName] = useState("");
  const [draftType, setDraftType] = useState<AccountType>("cash");
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const baseCurrency = resource.data?.preferences.base_currency ?? "USD";
  const grouped = useMemo(() => {
    return buildMobileAccountGroups(
      resource.data?.accounts ?? [],
      baseCurrency,
      resource.data?.exchangeRates ?? {},
      resource.data?.stockPrices ?? {}
    );
  }, [baseCurrency, resource.data]);
  const visibleGroup =
    grouped.find((group) => group.key === activeCategory) ??
    grouped.find((group) => group.accounts.length > 0) ??
    grouped[0];

  async function handleCreateAccount() {
    if (!draftName.trim()) {
      setSubmitError("Enter an account name.");
      return;
    }

    setSaving(true);
    setSubmitError(null);
    try {
      await mobileApi.accounts.create(draftName.trim(), draftType);
      setDraftName("");
      setActiveCategory(
        MOBILE_ACCOUNT_CATEGORIES.find((category) =>
          category.types.includes(draftType)
        )?.key ?? "brokerage"
      );
      await resource.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to create account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      title="Accounts"
      subtitle="Grouped by how you use your money"
      loading={resource.loading}
      error={resource.error}
      onRefresh={resource.refresh}
      refreshing={resource.loading}
    >
      <SectionCard
        title="Add Account"
        subtitle="Create a new account without leaving mobile"
      >
        <Field label="Account name">
          <FormInput
            value={draftName}
            onChangeText={setDraftName}
            placeholder="DBS Multiplier"
          />
        </Field>
        <Field label="Account type">
          <ChipSelector
            value={draftType}
            onChange={setDraftType}
            options={[
              { label: "Cash", value: "cash" },
              { label: "Brokerage", value: "investment" },
              { label: "CPF", value: "cpf" },
              { label: "SRS", value: "srs" },
            ]}
          />
        </Field>
        {submitError ? <Text style={styles.errorText}>{submitError}</Text> : null}
        <PrimaryButton
          label={saving ? "Creating..." : "Create account"}
          onPress={handleCreateAccount}
          disabled={saving}
        />
      </SectionCard>

      <View style={styles.segmentRow}>
        {grouped.map((group) => (
          <Pressable
            key={group.key}
            style={[
              styles.segment,
              activeCategory === group.key && {
                borderColor:
                  group.key === "brokerage"
                    ? appTheme.colors.accentBlue
                    : group.key === "cash"
                      ? appTheme.colors.primary
                      : appTheme.colors.accentTeal,
                backgroundColor:
                  group.key === "brokerage"
                    ? `${appTheme.colors.accentBlue}14`
                    : group.key === "cash"
                      ? `${appTheme.colors.primary}14`
                      : `${appTheme.colors.accentTeal}14`,
              },
            ]}
            onPress={() => setActiveCategory(group.key)}
          >
            <Text style={styles.segmentLabel}>{group.label}</Text>
            <Text style={styles.segmentMeta}>
              {group.accounts.length} · {formatCurrency(group.total, baseCurrency)}
            </Text>
          </Pressable>
        ))}
      </View>

      <SectionCard
        title={visibleGroup.label}
        subtitle={`${visibleGroup.accounts.length} accounts in this group`}
      >
        {visibleGroup.accounts.map((account) => {
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
          const total = cashTotal + stockTotal;
          return (
            <Link key={account.id} href={`/(tabs)/accounts/${account.id}`} asChild>
              <Pressable style={styles.card}>
                <View style={styles.row}>
                  <Text style={styles.name}>{account.name}</Text>
                  <Text style={styles.badge}>{account.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.detail}>
                  {account.cash_holdings.length} cash balances ·{" "}
                  {account.stock_holdings.length} stock holdings
                </Text>
                <Text style={styles.value}>{formatCurrency(total, baseCurrency)}</Text>
              </Pressable>
            </Link>
          );
        })}
        {visibleGroup.accounts.length === 0 ? (
          <Text style={styles.emptyState}>No accounts in this category yet.</Text>
        ) : null}
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  segmentRow: {
    flexDirection: "row",
    gap: appTheme.spacing.sm,
    flexWrap: "wrap",
  },
  segment: {
    flexGrow: 1,
    minWidth: "30%",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
    backgroundColor: appTheme.colors.surface,
    padding: 12,
    gap: 4,
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  segmentMeta: {
    fontSize: 11,
    color: appTheme.colors.textMuted,
  },
  card: {
    borderRadius: 22,
    backgroundColor: appTheme.colors.surfaceMuted,
    padding: 16,
    gap: 10,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
  },
  name: {
    fontSize: 20,
    fontWeight: "700",
    color: appTheme.colors.text,
    flex: 1,
  },
  badge: {
    fontSize: 12,
    fontWeight: "700",
    color: appTheme.colors.primaryDeep,
  },
  detail: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
  },
  value: {
    fontSize: 24,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  emptyState: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
  },
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
  },
});
