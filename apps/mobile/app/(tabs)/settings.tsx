import { SUPPORTED_CURRENCIES } from "@track-my-worth/domain";
import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";
import { ChipSelector, PrimaryButton } from "@/src/components/form-ui";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";
import { useAsyncResource } from "@/src/hooks/use-async-resource";
import { mobileApi } from "@/src/lib/api";
import { useSession } from "@/src/providers/session-provider";

export default function SettingsScreen() {
  const { signOut } = useSession();
  const resource = useAsyncResource(async () => {
    return mobileApi.preferences.get();
  }, []);
  const [baseCurrency, setBaseCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (resource.data?.base_currency) {
      setBaseCurrency(resource.data.base_currency);
    }
  }, [resource.data?.base_currency]);

  async function handleSavePreferences() {
    setSaving(true);
    setActionError(null);
    try {
      await mobileApi.preferences.updateBaseCurrency(baseCurrency);
      await resource.refresh();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "Unable to save preferences");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Screen
      title="Settings"
      subtitle="Preferences and account"
      loading={resource.loading}
      error={resource.error}
      onRefresh={resource.refresh}
      refreshing={resource.loading}
    >
      <SectionCard
        title="Base Currency"
        subtitle="This affects how dashboard and account totals are displayed"
      >
        <ChipSelector
          value={baseCurrency}
          onChange={setBaseCurrency}
          options={SUPPORTED_CURRENCIES.slice(0, 6).map((currency) => ({
            label: currency.code,
            value: currency.code,
          }))}
        />
        {actionError ? <Text style={styles.errorText}>{actionError}</Text> : null}
        <PrimaryButton
          label={saving ? "Saving..." : "Save preferences"}
          onPress={handleSavePreferences}
          disabled={saving}
        />
      </SectionCard>

      <SectionCard title="Account" subtitle="Session controls for the current mobile login">
        <PrimaryButton label="Sign out" onPress={signOut} tone="danger" />
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
  },
});
