"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Label } from "recharts";
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
  Cash: "#0f766e",
  Investments: "#4f46e5",
  CPF: "#b7791f",
  SRS: "#7c3aed",
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
      <Card className="chart-card">
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
    <Card className="chart-card">
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ResponsiveContainer width="100%" height={258}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={91}
                paddingAngle={4}
                dataKey="value"
              >
                <Label
                  position="center"
                  content={({ viewBox }) => {
                    if (!viewBox || !("cx" in viewBox) || !("cy" in viewBox)) return null;

                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        className="fill-foreground text-[1.35rem] font-bold tracking-tight"
                      >
                        {formatCompactCurrency(total, currencySymbol)}
                      </text>
                    );
                  }}
                />
                {data.map((entry) => (
                  <Cell key={entry.name} fill={COLORS[entry.name]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ borderRadius: 12, border: "1px solid #dbe5f0", boxShadow: "0 12px 26px rgba(15,23,42,0.12)" }}
                formatter={(value: number) =>
                  `${currencySymbol}${Math.round(value).toLocaleString("en-US")}`
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-border/70 pt-4 text-xs sm:grid-cols-4">
          {data.map((entry) => (
            <div className="flex min-w-0 items-center gap-2" key={entry.name}>
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: COLORS[entry.name] }} />
              <span className="truncate text-muted-foreground">{entry.name}</span>
              <span className="ml-auto font-semibold text-foreground">{Math.round((entry.value / total) * 100)}%</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
