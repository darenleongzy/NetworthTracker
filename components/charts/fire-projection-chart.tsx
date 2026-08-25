"use client";

import { useMemo } from "react";
import {
  Line,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrencySymbol } from "@/lib/currencies";
import type { ProjectionPoint } from "@/lib/fire-calculations";

interface FireProjectionChartProps {
  projection: ProjectionPoint[];
  fireNumber: number;
  yearsToFire: number | null;
  baseCurrency: string;
}

export function FireProjectionChart({
  projection,
  fireNumber,
  yearsToFire,
  baseCurrency,
}: FireProjectionChartProps) {
  const currencySymbol = getCurrencySymbol(baseCurrency);

  const chartData = useMemo(() => {
    // Limit to reasonable projection window
    const maxYears = yearsToFire !== null ? Math.min(yearsToFire + 10, 40) : 30;
    return projection.slice(0, maxYears + 1).map((point) => ({
      ...point,
      label: `Age ${point.age}`,
    }));
  }, [projection, yearsToFire]);

  const formatValue = (value: number) => {
    if (value >= 1_000_000) {
      return `${currencySymbol}${(value / 1_000_000).toFixed(1)}M`;
    }
    return `${currencySymbol}${(value / 1000).toFixed(0)}k`;
  };

  if (projection.length === 0) {
    return (
      <Card className="chart-card">
        <CardHeader>
          <CardTitle>Net Worth Projection</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-muted-foreground">
          Enter your details to see the projection.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="chart-card">
      <CardHeader>
        <CardTitle>Net Worth Projection</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Your expected balance against the financial independence target.</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData} margin={{ top: 12, right: 10, left: -4, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e8edf4" strokeDasharray="2 5" />
            <XAxis
              dataKey="label"
              className="text-xs"
              interval="preserveStartEnd"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              className="text-xs"
              tickFormatter={formatValue}
              width={70}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              cursor={{ stroke: "#cbd5e1", strokeDasharray: "2 4" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #dbe5f0", boxShadow: "0 12px 26px rgba(15,23,42,0.12)" }}
              formatter={(value: number, name: string) => [
                `${currencySymbol}${value.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}`,
                name === "netWorth" ? "Net Worth" : "FIRE Target",
              ]}
              labelFormatter={(label) => label}
            />
            <ReferenceLine
              y={fireNumber}
              stroke="#b7791f"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="netWorth"
              name="netWorth"
              stroke="#0f766e"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: "#0f766e", stroke: "#ffffff", strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="fireNumber"
              name="fireNumber"
              stroke="#f97316"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-border/70 pt-4 text-xs">
          <span className="flex items-center gap-2 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-[#0f766e]" />Projected net worth</span>
          <span className="flex items-center gap-2 text-muted-foreground"><span className="h-0 w-4 border-t-2 border-dashed border-[#b7791f]" />FIRE target</span>
        </div>
        {yearsToFire !== null && (
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Projected to reach FIRE in{" "}
            <span className="font-semibold text-foreground">{yearsToFire} years</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
