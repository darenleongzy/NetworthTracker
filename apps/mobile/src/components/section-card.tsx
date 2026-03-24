import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "@track-my-worth/config";

export function SectionCard({
  title,
  subtitle,
  children,
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.card}>
      {title ? (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: appTheme.radius.lg,
    backgroundColor: appTheme.colors.surface,
    padding: appTheme.spacing.lg,
    gap: appTheme.spacing.md,
    borderWidth: 1,
    borderColor: appTheme.colors.border,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: appTheme.colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
  },
});
