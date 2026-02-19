"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const COLORS: Record<string, string> = {
  Cash: "#22c55e",       // green
  Investments: "#3b82f6", // blue
  CPF: "#f59e0b",        // amber
  SRS: "#8b5cf6",        // violet
};

export function AllocationChart({
  cashTotal,
  investmentValue,
  cpfTotal = 0,
  srsTotal = 0,
}: {
  cashTotal: number;
  investmentValue: number;
  cpfTotal?: number;
  srsTotal?: number;
}) {
  const total = cashTotal + investmentValue + cpfTotal + srsTotal;

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Asset Allocation</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-muted-foreground">
          Add accounts to see your allocation breakdown.
        </CardContent>
      </Card>
    );
  }

  const data = [
    { name: "Cash", value: cashTotal },
    { name: "Investments", value: investmentValue },
    { name: "CPF", value: cpfTotal },
    { name: "SRS", value: srsTotal },
  ].filter((d) => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={3}
              dataKey="value"
              label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell key={entry.name} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) =>
                `$${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                })}`
              }
            />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              iconType="circle"
              wrapperStyle={{ paddingTop: 8 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
