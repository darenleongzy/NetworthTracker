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
    <Card>
      <CardHeader>
        <CardTitle>Daily Changes</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="date" className="text-xs" />
            <YAxis
              className="text-xs"
              tickFormatter={(v) => `$${v.toLocaleString()}`}
            />
            <Tooltip
              formatter={(value: number) =>
                `$${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}`
              }
            />
            <Bar dataKey="change" name="Change" radius={[4, 4, 0, 0]}>
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
