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
      <Card className="chart-card">
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
    <Card className="chart-card">
      <CardHeader>
        <CardTitle>Account Value History</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">Daily saved value for this account.</p>
      </CardHeader>
      <CardContent>
        <div className="h-[232px] sm:h-[272px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 12, right: 10, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="account-history-fill" x1="0" x2="0" y1="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.26} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e8edf4" strokeDasharray="2 5" />
            <XAxis dataKey="date" className="text-xs" minTickGap={24} axisLine={false} tickLine={false} />
            <YAxis
              className="text-xs"
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) =>
                `${getCurrencySymbol(currency)}${Number(value).toLocaleString()}`
              }
            />
            <Tooltip
              cursor={{ stroke: "#cbd5e1", strokeDasharray: "2 4" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #dbe5f0", boxShadow: "0 12px 26px rgba(15,23,42,0.12)" }}
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
              stroke="#4f46e5"
              fill="url(#account-history-fill)"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 5, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
