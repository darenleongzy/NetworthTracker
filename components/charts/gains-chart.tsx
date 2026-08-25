"use client";

import {
  Bar,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NetWorthSnapshot } from "@/lib/types";
import { getCurrencySymbol } from "@/lib/currencies";

function formatCompactCurrency(value: number, currencySymbol: string) {
  const absoluteValue = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  if (absoluteValue >= 1_000_000) {
    return `${sign}${currencySymbol}${(absoluteValue / 1_000_000).toFixed(1)}M`;
  }
  if (absoluteValue >= 1_000) {
    return `${sign}${currencySymbol}${Math.round(absoluteValue / 1_000)}K`;
  }
  return `${sign}${currencySymbol}${Math.round(absoluteValue)}`;
}

export function GainsChart({
  snapshots,
  baseCurrency = "USD",
}: {
  snapshots: NetWorthSnapshot[];
  baseCurrency?: string;
}) {
  // Calculate period-over-period changes
  const data = snapshots.slice(1).map((s, i) => {
    const prev = snapshots[i];
    const change = Number(s.total_value) - Number(prev.total_value);
    return {
      date: new Date(s.snapshot_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      change,
    };
  });
  const currencySymbol = getCurrencySymbol(baseCurrency);

  return (
    <Card className="chart-card">
      <CardHeader>
        <CardTitle>Daily Changes</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Gain and loss between each saved balance.</p>
      </CardHeader>
      <CardContent>
        <div className="h-[228px] sm:h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 12, right: 8, left: 4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e8edf4" strokeDasharray="2 5" />
            <ReferenceLine y={0} stroke="currentColor" strokeOpacity={0.5} />
            <XAxis
              dataKey="date"
              className="text-xs"
              interval="preserveStartEnd"
              minTickGap={28}
              tickMargin={8}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              className="text-xs"
              width={72}
              tickMargin={8}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => formatCompactCurrency(Number(value), currencySymbol)}
            />
            <Tooltip
              cursor={{ stroke: "#94a3b8", strokeDasharray: "2 4" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #dbe5f0", boxShadow: "0 12px 26px rgba(15,23,42,0.12)" }}
              formatter={(value: number) =>
                `${value >= 0 ? "+" : ""}${currencySymbol}${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}`
              }
            />
            <Bar
              dataKey="change"
              name="Change"
              barSize={10}
              shape={(props: unknown) => {
                const { x, y, width, height, fill, payload } = props as {
                  x?: number;
                  y?: number;
                  width?: number;
                  height?: number;
                  fill?: string;
                  payload?: { change: number };
                };
                if (
                  x === undefined ||
                  y === undefined ||
                  width === undefined ||
                  height === undefined ||
                  !payload
                ) {
                  return <g />;
                }

                const stemX = x + width / 2;
                const pointY = payload.change >= 0 ? y : y + height;
                const baselineY = payload.change >= 0 ? y + height : y;

                return (
                  <g>
                    <line
                      x1={stemX}
                      x2={stemX}
                      y1={baselineY}
                      y2={pointY}
                      stroke={fill}
                      strokeWidth={2}
                      strokeLinecap="round"
                    />
                    <circle
                      cx={stemX}
                      cy={pointY}
                      r={4}
                      fill={fill}
                      stroke="var(--card)"
                      strokeWidth={2}
                    />
                  </g>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell
                  key={index}
                  fill={
                    entry.change >= 0
                      ? "hsl(142, 76%, 36%)"
                      : "hsl(0, 84%, 60%)"
                  }
                />
              ))}
            </Bar>
          </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
