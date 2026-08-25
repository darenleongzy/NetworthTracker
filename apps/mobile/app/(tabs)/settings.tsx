import { SITE_URL, SUPPORT_EMAIL, SUPPORT_MAILTO } from "@track-my-worth/config";
import { SUPPORTED_CURRENCIES } from "@track-my-worth/domain";
import { useEffect, useState } from "react";
import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { ChipSelector, PrimaryButton } from "@/src/components/form-ui";
import { Screen } from "@/src/components/screen";
import { SectionCard } from "@/src/components/section-card";
import { useAsyncResource } from "@/src/hooks/use-async-resource";
import { mobileApi } from "@/src/lib/api";
import { useSession } from "@/src/providers/session-provider";

const LEGAL_LINKS = [
  {
    label: "Privacy Policy",
    subtitle: "How Track My Worth collects, uses, and protects data",
    url: `${SITE_URL}/privacy`,
  },
  {
    label: "Terms of Service",
    subtitle: "The terms that govern the web and mobile apps",
    url: `${SITE_URL}/terms`,
  },
  {
    label: "Delete account or data",
    subtitle: "Instructions for account deletion and data deletion requests",
    url: `${SITE_URL}/delete-account`,
  },
];

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

      <SectionCard
        title="Deletion requests"
        subtitle="Start an account deletion or data deletion request from here"
      >
        <View style={styles.legalList}>
          <Pressable
            testID="settings-delete-request-link"
            style={styles.legalRow}
            onPress={() => Linking.openURL("https://trackmyworth.xyz/delete-account")}
          >
            <View style={styles.legalTextBlock}>
              <Text style={styles.legalTitle}>Delete account or request data deletion</Text>
              <Text style={styles.legalSubtitle}>
                Opens the public deletion request page with the current support instructions
              </Text>
            </View>
            <Text style={styles.legalArrow}>Open</Text>
          </Pressable>
          <Pressable
            testID="settings-delete-request-email-link"
            style={styles.legalRow}
            onPress={() =>
              Linking.openURL(
                `${SUPPORT_MAILTO}?subject=Account%20Deletion%20Request`
              )
            }
          >
            <View style={styles.legalTextBlock}>
              <Text style={styles.legalTitle}>Email support to request deletion</Text>
              <Text style={styles.legalSubtitle}>
                Starts an email draft to {SUPPORT_EMAIL} for account deletion or data deletion requests
              </Text>
            </View>
            <Text style={styles.legalArrow}>Email</Text>
          </Pressable>
        </View>
      </SectionCard>

      <SectionCard
        title="Legal"
        subtitle="These pages can be shared with App Review and opened in Safari"
      >
        <View style={styles.legalList}>
          {LEGAL_LINKS.map((link) => (
            <Pressable
              key={link.url}
              style={styles.legalRow}
              onPress={() => Linking.openURL(link.url)}
            >
              <View style={styles.legalTextBlock}>
                <Text style={styles.legalTitle}>{link.label}</Text>
                <Text style={styles.legalSubtitle}>{link.subtitle}</Text>
              </View>
              <Text style={styles.legalArrow}>Open</Text>
            </Pressable>
          ))}
        </View>
      </SectionCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  errorText: {
    fontSize: 13,
    color: "#b91c1c",
  },
  legalList: {
    gap: 12,
  },
  legalRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#dbe4f0",
    backgroundColor: "#f8fbff",
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  legalTextBlock: {
    flex: 1,
    gap: 4,
  },
  legalTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
  },
  legalSubtitle: {
    fontSize: 13,
    color: "#64748b",
    lineHeight: 18,
  },
  legalArrow: {
    fontSize: 13,
    fontWeight: "700",
    color: "#5b34ea",
  },
});
