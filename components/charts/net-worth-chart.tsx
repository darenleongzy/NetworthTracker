"use client";

import { useState, useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrencySymbol } from "@/lib/currencies";
import type { NetWorthSnapshot } from "@/lib/types";

type TimeRange = "daily" | "monthly" | "yearly";

function getLast7Days(snapshots: NetWorthSnapshot[]) {
  // Create a map of date -> snapshot
  const snapshotMap = new Map<string, NetWorthSnapshot>();
  for (const s of snapshots) {
    snapshotMap.set(s.snapshot_date, s);
  }

  // Get today and 6 days ago (7 days total)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 6);

  // Find the most recent snapshot before or on startDate to initialize lastValue
  let lastValue = { total: 0, cash: 0, investments: 0 };
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
  );
  for (const s of sortedSnapshots) {
    const snapshotDate = new Date(s.snapshot_date);
    if (snapshotDate <= startDate) {
      lastValue = {
        total: Number(s.total_value),
        cash: Number(s.cash_value),
        investments: Number(s.investment_value),
      };
    }
  }

  // Fill in all 7 days
  const result: { date: string; total: number; cash: number; investments: number }[] = [];
  const currentDate = new Date(startDate);

  for (let i = 0; i < 7; i++) {
    const dateStr = currentDate.toISOString().split("T")[0];
    const snapshot = snapshotMap.get(dateStr);

    if (snapshot) {
      lastValue = {
        total: Number(snapshot.total_value),
        cash: Number(snapshot.cash_value),
        investments: Number(snapshot.investment_value),
      };
    }

    result.push({
      date: currentDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      ...lastValue,
    });

    currentDate.setDate(currentDate.getDate() + 1);
  }

  return result;
}

function getLast12Months(snapshots: NetWorthSnapshot[]) {
  // Group snapshots by month and get the latest value for each month
  const monthlyMap = new Map<string, { total: number; cash: number; investments: number }>();

  for (const s of snapshots) {
    const d = new Date(s.snapshot_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    // Always use the latest snapshot for each month
    monthlyMap.set(key, {
      total: Number(s.total_value),
      cash: Number(s.cash_value),
      investments: Number(s.investment_value),
    });
  }

  // Generate last 12 months
  const today = new Date();
  const result: { date: string; total: number; cash: number; investments: number }[] = [];
  let lastValue = { total: 0, cash: 0, investments: 0 };

  // Find earliest value to initialize
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
  );

  const startMonth = new Date(today.getFullYear(), today.getMonth() - 11, 1);
  for (const s of sortedSnapshots) {
    const snapshotDate = new Date(s.snapshot_date);
    if (snapshotDate < startMonth) {
      lastValue = {
        total: Number(s.total_value),
        cash: Number(s.cash_value),
        investments: Number(s.investment_value),
      };
    }
  }

  for (let i = 11; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const monthData = monthlyMap.get(key);
    if (monthData) {
      lastValue = monthData;
    }

    result.push({
      date: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      ...lastValue,
    });
  }

  return result;
}

function getLast5Years(snapshots: NetWorthSnapshot[]) {
  // Group snapshots by year and get the latest value for each year
  const yearlyMap = new Map<string, { total: number; cash: number; investments: number }>();

  for (const s of snapshots) {
    const d = new Date(s.snapshot_date);
    const key = `${d.getFullYear()}`;
    // Always use the latest snapshot for each year
    yearlyMap.set(key, {
      total: Number(s.total_value),
      cash: Number(s.cash_value),
      investments: Number(s.investment_value),
    });
  }

  // Generate last 5 years
  const today = new Date();
  const currentYear = today.getFullYear();
  const result: { date: string; total: number; cash: number; investments: number }[] = [];
  let lastValue = { total: 0, cash: 0, investments: 0 };

  // Find earliest value to initialize
  const sortedSnapshots = [...snapshots].sort(
    (a, b) => new Date(a.snapshot_date).getTime() - new Date(b.snapshot_date).getTime()
  );

  const startYear = currentYear - 4;
  for (const s of sortedSnapshots) {
    const snapshotYear = new Date(s.snapshot_date).getFullYear();
    if (snapshotYear < startYear) {
      lastValue = {
        total: Number(s.total_value),
        cash: Number(s.cash_value),
        investments: Number(s.investment_value),
      };
    }
  }

  for (let i = 4; i >= 0; i--) {
    const year = currentYear - i;
    const key = `${year}`;

    const yearData = yearlyMap.get(key);
    if (yearData) {
      lastValue = yearData;
    }

    result.push({
      date: key,
      ...lastValue,
    });
  }

  return result;
}

function aggregateSnapshots(
  snapshots: NetWorthSnapshot[],
  range: TimeRange
) {
  if (range === "daily") {
    return getLast7Days(snapshots);
  }
  if (range === "monthly") {
    return getLast12Months(snapshots);
  }
  return getLast5Years(snapshots);
}

export function NetWorthChart({
  snapshots,
  baseCurrency = "USD",
}: {
  snapshots: NetWorthSnapshot[];
  baseCurrency?: string;
}) {
  const [range, setRange] = useState<TimeRange>("daily");
  const currencySymbol = getCurrencySymbol(baseCurrency);

  const data = useMemo(
    () => aggregateSnapshots(snapshots, range),
    [snapshots, range]
  );

  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Net Worth Over Time</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-muted-foreground">
          No data yet. Your net worth will be tracked daily.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Net Worth Over Time</CardTitle>
        <div className="flex gap-1">
          {(["daily", "monthly", "yearly"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                range === r
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              interval={0}
              tick={{ fontSize: 11 }}
            />
            <YAxis
              className="text-xs"
              tickFormatter={(v) =>
                `${currencySymbol}${(v / 1000).toFixed(0)}k`
              }
            />
            <Tooltip
              formatter={(value: number) =>
                `${currencySymbol}${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}`
              }
            />
            <Area
              type="monotone"
              dataKey="total"
              name="Total"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
