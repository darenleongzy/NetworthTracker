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
  Legend,
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
      <Card>
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
    <Card>
      <CardHeader>
        <CardTitle>Net Worth Projection</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="label"
              className="text-xs"
              interval="preserveStartEnd"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              className="text-xs"
              tickFormatter={formatValue}
              width={70}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                `${currencySymbol}${value.toLocaleString("en-US", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}`,
                name === "netWorth" ? "Net Worth" : "FIRE Target",
              ]}
              labelFormatter={(label) => label}
            />
            <Legend
              formatter={(value) =>
                value === "netWorth" ? "Projected Net Worth" : "FIRE Target"
              }
            />
            <ReferenceLine
              y={fireNumber}
              stroke="#f97316"
              strokeDasharray="5 5"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="netWorth"
              name="netWorth"
              stroke="#22c55e"
              strokeWidth={2}
              dot={false}
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
