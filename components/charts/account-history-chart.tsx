"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrencySymbol } from "@/lib/currencies";
import type { AccountValueSnapshot } from "@/lib/types";

export function AccountHistoryChart({
  snapshots,
  currency,
}: {
  snapshots: AccountValueSnapshot[];
  currency: string;
}) {
  if (snapshots.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Value History</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No history yet. Your account chart will appear after a saved daily snapshot.
        </CardContent>
      </Card>
    );
  }

  const data = snapshots.map((snapshot) => ({
    date: new Date(`${snapshot.snapshot_date}T00:00:00Z`).toLocaleDateString(
      "en-US",
      {
        month: "short",
        day: "numeric",
      }
    ),
    total: Number(snapshot.total_value),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Value History</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="account-history-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.35} />
                <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis
              className="text-xs"
              tickFormatter={(value) =>
                `${getCurrencySymbol(currency)}${Number(value).toLocaleString()}`
              }
            />
            <Tooltip
              formatter={(value: number) =>
                `${getCurrencySymbol(currency)}${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              }
            />
            <Area
              type="monotone"
              dataKey="total"
              stroke="hsl(var(--chart-2))"
              fill="url(#account-history-fill)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
