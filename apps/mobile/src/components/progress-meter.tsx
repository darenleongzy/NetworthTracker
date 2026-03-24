import { StyleSheet, Text, View } from "react-native";
import { appTheme } from "@track-my-worth/config";

export function ProgressMeter({
  label,
  value,
  tone = appTheme.colors.primary,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <View style={styles.wrapper}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{Math.round(clamped)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped}%`, backgroundColor: tone }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: appTheme.colors.text,
  },
  value: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
    fontWeight: "600",
  },
  track: {
    height: 10,
    borderRadius: 999,
    backgroundColor: appTheme.colors.surfaceMuted,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
  },
});
