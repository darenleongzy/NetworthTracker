"use client";

import { useState } from "react";
import {
  CartesianGrid,
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
  { key: "cash", label: "Cash", color: "#0f766e" },
  { key: "investment", label: "Investments", color: "#4f46e5" },
  { key: "cpf", label: "CPF", color: "#b7791f" },
  { key: "srs", label: "SRS", color: "#7c3aed" },
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
      <Card className="chart-card">
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
  const latestRow = data.at(-1);

  return (
    <Card className="chart-card">
      <CardHeader className="flex flex-col gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Balances by account type</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            End-of-period values, grouped by how you hold your money.
          </p>
        </div>
        <div
          aria-label="Account history range"
          className="inline-flex w-fit rounded-xl border border-border/80 bg-secondary/70 p-1"
        >
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setRange(option.value)}
              aria-pressed={range === option.value}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
                range === option.value
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background hover:text-foreground"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[232px] sm:h-[272px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 12, right: 10, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e8edf4" strokeDasharray="2 5" />
            <XAxis dataKey="label" className="text-xs" minTickGap={24} axisLine={false} tickLine={false} />
            <YAxis
              className="text-xs"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${symbol}${Number(value).toLocaleString()}`}
            />
            <Tooltip
              cursor={{ stroke: "#cbd5e1", strokeDasharray: "2 4" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #dbe5f0", boxShadow: "0 12px 26px rgba(15,23,42,0.12)" }}
              formatter={(value: number) =>
                `${symbol}${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              }
            />
            {SERIES.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={series.color}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: series.color, stroke: "#ffffff", strokeWidth: 2 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-border/70 pt-3 text-xs sm:mt-4 sm:pt-4 sm:grid-cols-4">
          {SERIES.map((series) => {
            const value = latestRow?.[series.key];
            return (
              <div className="flex min-w-0 items-center gap-2" key={series.key}>
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: series.color }} />
                <span className="truncate text-muted-foreground">{series.label}</span>
                <span className="ml-auto font-semibold text-foreground">
                  {value === null || value === undefined ? "-" : `${symbol}${Math.round(value).toLocaleString()}`}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
