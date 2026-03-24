import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { appTheme } from "@track-my-worth/config";
import type { ReactNode } from "react";

export function Screen({
  title,
  subtitle,
  children,
  loading = false,
  error,
  onRefresh,
  refreshing = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  refreshing?: boolean;
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          onRefresh ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={appTheme.colors.primary} />
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          children
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appTheme.colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.lg,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: appTheme.colors.textMuted,
  },
  centered: {
    minHeight: 240,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    color: "#b91c1c",
    textAlign: "center",
  },
});
