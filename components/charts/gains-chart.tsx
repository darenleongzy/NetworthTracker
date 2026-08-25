"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { NetWorthSnapshot } from "@/lib/types";

export function GainsChart({
  snapshots,
}: {
  snapshots: NetWorthSnapshot[];
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

  return (
    <Card className="chart-card">
      <CardHeader>
        <CardTitle>Daily Changes</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">How your total balance moved between snapshots</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data} margin={{ top: 10, right: 10, left: -12, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e8edf4" strokeDasharray="2 5" />
            <XAxis dataKey="date" className="text-xs" axisLine={false} tickLine={false} />
            <YAxis
              className="text-xs"
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `$${v.toLocaleString()}`}
            />
            <Tooltip
              cursor={{ fill: "rgba(37, 99, 235, 0.05)" }}
              contentStyle={{ borderRadius: 12, border: "1px solid #dbe5f0", boxShadow: "0 12px 26px rgba(15,23,42,0.12)" }}
              formatter={(value: number) =>
                `$${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}`
              }
            />
            <Bar dataKey="change" name="Change" radius={[6, 6, 2, 2]}>
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
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
