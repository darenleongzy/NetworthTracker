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
import type { NetWorthSnapshot } from "@/lib/types";

type TimeRange = "daily" | "monthly" | "yearly";

function aggregateSnapshots(
  snapshots: NetWorthSnapshot[],
  range: TimeRange
) {
  if (range === "daily") {
    return snapshots.map((s) => ({
      date: new Date(s.snapshot_date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      total: Number(s.total_value),
      cash: Number(s.cash_value),
      investments: Number(s.investment_value),
    }));
  }

  const grouped = new Map<
    string,
    { total: number; cash: number; investments: number; count: number }
  >();

  for (const s of snapshots) {
    const d = new Date(s.snapshot_date);
    const key =
      range === "monthly"
        ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
        : `${d.getFullYear()}`;

    const existing = grouped.get(key);
    if (existing) {
      existing.total += Number(s.total_value);
      existing.cash += Number(s.cash_value);
      existing.investments += Number(s.investment_value);
      existing.count += 1;
    } else {
      grouped.set(key, {
        total: Number(s.total_value),
        cash: Number(s.cash_value),
        investments: Number(s.investment_value),
        count: 1,
      });
    }
  }

  return Array.from(grouped.entries()).map(([key, val]) => {
    let date: string;
    if (range === "monthly") {
      const [year, month] = key.split("-");
      date = new Date(Number(year), Number(month) - 1).toLocaleDateString(
        "en-US",
        { month: "short", year: "numeric" }
      );
    } else {
      date = key;
    }
    return {
      date,
      total: val.total / val.count,
      cash: val.cash / val.count,
      investments: val.investments / val.count,
    };
  });
}

export function NetWorthChart({
  snapshots,
}: {
  snapshots: NetWorthSnapshot[];
}) {
  const [range, setRange] = useState<TimeRange>("daily");

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
            <XAxis dataKey="date" className="text-xs" />
            <YAxis
              className="text-xs"
              tickFormatter={(v) =>
                `$${(v / 1000).toFixed(0)}k`
              }
            />
            <Tooltip
              formatter={(value: number) =>
                `$${value.toLocaleString("en-US", {
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
