"use client";

import { useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrencySymbol } from "@/lib/currencies";
import {
  aggregateAccountTypeHistory,
  type AccountHistoryRange,
} from "@/lib/account-history";
import type { AccountValueSnapshot } from "@/lib/types";

const SERIES = [
  { key: "cash", label: "Cash", color: "#22c55e" },
  { key: "investment", label: "Investments", color: "#3b82f6" },
  { key: "cpf", label: "CPF", color: "#f59e0b" },
  { key: "srs", label: "SRS", color: "#8b5cf6" },
] as const;

const RANGE_OPTIONS: { value: AccountHistoryRange; label: string }[] = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "year", label: "Year" },
];

export function AccountTypeMonthlyChart({
  snapshots,
  baseCurrency,
}: {
  snapshots: AccountValueSnapshot[];
  baseCurrency: string;
}) {
  const [range, setRange] = useState<AccountHistoryRange>("year");
  const data = aggregateAccountTypeHistory(snapshots, range);
  const hasAnyValue = data.some((row) =>
    SERIES.some((series) => row[series.key] !== null)
  );

  if (!hasAnyValue) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Totals by Type</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No account history yet. Daily snapshots will begin building this view after you add an account.
        </CardContent>
      </Card>
    );
  }

  const symbol = getCurrencySymbol(baseCurrency);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Account Totals by Type</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            End-of-period values from saved account snapshots.
          </p>
        </div>
        <div
          aria-label="Account history range"
          className="inline-flex w-fit rounded-xl border border-slate-200 bg-slate-100/80 p-1 shadow-inner"
        >
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              aria-pressed={range === option.value}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                range === option.value
                  ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                  : "text-slate-500 hover:bg-white hover:text-slate-950"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="label" className="text-xs" minTickGap={24} />
            <YAxis
              className="text-xs"
              tickFormatter={(value) => `${symbol}${Number(value).toLocaleString()}`}
            />
            <Tooltip
              cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "3 3" }}
              formatter={(value: number) =>
                `${symbol}${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              }
            />
            <Legend />
            {SERIES.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={series.color}
                strokeWidth={3}
                dot={{ r: 2.5, fill: series.color, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: series.color, stroke: "#ffffff", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
