"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCurrencySymbol } from "@/lib/currencies";

function formatCompactCurrency(value: number, currencySymbol: string): string {
  const rounded = Math.round(value);
  if (rounded >= 1000000) {
    return `${currencySymbol}${(rounded / 1000000).toFixed(1)}M`;
  }
  if (rounded >= 1000) {
    return `${currencySymbol}${(rounded / 1000).toFixed(0)}K`;
  }
  return `${currencySymbol}${rounded.toLocaleString()}`;
}

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
  baseCurrency = "USD",
}: {
  cashTotal: number;
  investmentValue: number;
  cpfTotal?: number;
  srsTotal?: number;
  baseCurrency?: string;
}) {
  const currencySymbol = getCurrencySymbol(baseCurrency);
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
        <div className="relative">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="45%"
                innerRadius={50}
                outerRadius={75}
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
                  `${currencySymbol}${Math.round(value).toLocaleString("en-US")}`
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
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: "-20px" }}>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{formatCompactCurrency(total, currencySymbol)}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
