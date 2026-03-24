import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";
import { appTheme } from "@track-my-worth/config";

export function LineChart({
  points,
  color = appTheme.colors.primary,
  width = 300,
  height = 160,
}: {
  points: { label: string; value: number }[];
  color?: string;
  width?: number;
  height?: number;
}) {
  if (points.length === 0) {
    return <Text style={styles.empty}>No trend data yet.</Text>;
  }

  const padding = 14;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(max - min, 1);
  const stepX = points.length > 1 ? (width - padding * 2) / (points.length - 1) : 0;
  const chartPoints = points.map((point, index) => {
    const x = padding + index * stepX;
    const y = height - padding - ((point.value - min) / range) * (height - padding * 2);
    return { ...point, x, y };
  });

  return (
    <View style={styles.wrapper}>
      <Svg width={width} height={height}>
        <Polyline
          points={chartPoints.map((point) => `${point.x},${point.y}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {chartPoints.map((point) => (
          <Circle key={point.label} cx={point.x} cy={point.y} r={4} fill={color} />
        ))}
      </Svg>
      <View style={styles.footer}>
        <Text style={styles.caption}>{points[0]?.label}</Text>
        <Text style={styles.caption}>{points[points.length - 1]?.label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  caption: {
    fontSize: 12,
    color: appTheme.colors.textMuted,
  },
  empty: {
    fontSize: 14,
    color: appTheme.colors.textMuted,
  },
});
