import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "@track-my-worth/config";

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "primary" | "blue" | "amber" | "teal" | "green";
}) {
  return (
    <View style={[styles.card, toneStyles[tone]]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 8,
    borderWidth: 1,
  },
  label: {
    fontSize: 14,
    color: "rgba(255,255,255,0.86)",
    fontWeight: "500",
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
  },
});

const toneStyles = StyleSheet.create({
  default: {
    backgroundColor: appTheme.colors.surface,
    borderColor: appTheme.colors.border,
  },
  primary: {
    backgroundColor: appTheme.colors.primary,
    borderColor: appTheme.colors.primary,
  },
  blue: {
    backgroundColor: appTheme.colors.accentBlue,
    borderColor: appTheme.colors.accentBlue,
  },
  amber: {
    backgroundColor: appTheme.colors.accentAmber,
    borderColor: appTheme.colors.accentAmber,
  },
  teal: {
    backgroundColor: appTheme.colors.accentTeal,
    borderColor: appTheme.colors.accentTeal,
  },
  green: {
    backgroundColor: appTheme.colors.accentEmerald,
    borderColor: appTheme.colors.accentEmerald,
  },
});
