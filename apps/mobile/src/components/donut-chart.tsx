import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { appTheme } from "@track-my-worth/config";

type DonutDatum = {
  label: string;
  value: number;
  color: string;
};

export function DonutChart({
  data,
  centerLabel,
  centerValue,
  size = 184,
  strokeWidth = 24,
}: {
  data: DonutDatum[];
  centerLabel?: string;
  centerValue: string;
  size?: number;
  strokeWidth?: number;
}) {
  const filtered = data.filter((item) => item.value > 0);
  const total = filtered.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const segments = filtered.map((item, index) => {
    const fraction = total > 0 ? item.value / total : 0;
    const dash = circumference * fraction;
    const previousDashTotal = filtered
      .slice(0, index)
      .reduce((sum, previous) => {
        const previousFraction = total > 0 ? previous.value / total : 0;
        return sum + circumference * previousFraction;
      }, 0);

    return {
      ...item,
      dash,
      gap: circumference - dash,
      offset: previousDashTotal,
    };
  });

  return (
    <View style={styles.wrapper}>
      <View style={styles.chartWrap}>
        <Svg width={size} height={size}>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={appTheme.colors.surfaceMuted}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {segments.map((item) => (
              <Circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={item.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={`${item.dash} ${item.gap}`}
                strokeDashoffset={-item.offset}
                strokeLinecap="round"
                rotation="-90"
                origin={`${size / 2}, ${size / 2}`}
              />
          ))}
        </Svg>
        <View style={styles.center}>
          {centerLabel ? <Text style={styles.centerLabel}>{centerLabel}</Text> : null}
          <Text style={styles.centerValue}>{centerValue}</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {segments.map((item) => (
          <View key={item.label} style={styles.legendRow}>
            <View style={[styles.swatch, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    gap: appTheme.spacing.lg,
  },
  chartWrap: {
    justifyContent: "center",
    alignItems: "center",
  },
  center: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    maxWidth: 100,
  },
  centerLabel: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
    textAlign: "center",
  },
  centerValue: {
    fontSize: 22,
    fontWeight: "800",
    color: appTheme.colors.text,
    textAlign: "center",
  },
  legend: {
    width: "100%",
    gap: 10,
  },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  legendText: {
    color: appTheme.colors.textMuted,
    fontSize: 14,
  },
});
