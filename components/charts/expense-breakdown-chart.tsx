"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  Label,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Expense, ExpenseSubcategory } from "@/lib/types";
import {
  EXPENSE_COLORS,
  getSubcategoryLabel,
} from "@/lib/expense-categories";
import { getCurrencySymbol } from "@/lib/currencies";

function formatCompactCurrency(value: number, currencySymbol: string): string {
  const rounded = Math.round(value);
  if (rounded >= 1000000) {
    return `${currencySymbol}${(rounded / 1000000).toFixed(1)}M`;
  }
  if (rounded >= 1000) {
    return `${currencySymbol}${(rounded / 1000).toFixed(1)}K`;
  }
  return `${currencySymbol}${rounded.toLocaleString()}`;
}

interface ExpenseBreakdownChartProps {
  expenses: Expense[];
  title?: string;
  baseCurrency?: string;
}

export function ExpenseBreakdownChart({
  expenses,
  title = "Expense Breakdown",
  baseCurrency = "USD",
}: ExpenseBreakdownChartProps) {
  const currencySymbol = getCurrencySymbol(baseCurrency);
  if (expenses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center text-muted-foreground">
          No expenses to display.
        </CardContent>
      </Card>
    );
  }

  // Group expenses by subcategory
  const grouped = expenses.reduce<Record<ExpenseSubcategory, number>>(
    (acc, expense) => {
      const key = expense.subcategory;
      acc[key] = (acc[key] || 0) + Number(expense.amount);
      return acc;
    },
    {} as Record<ExpenseSubcategory, number>
  );

  const data = Object.entries(grouped)
    .map(([subcategory, value]) => ({
      name: getSubcategoryLabel(subcategory as ExpenseSubcategory),
      value,
      subcategory: subcategory as ExpenseSubcategory,
    }))
    .sort((a, b) => b.value - a.value);

  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={2}
                dataKey="value"
                label={({ percent }) =>
                  percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
                }
                labelLine={false}
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
                        className="fill-foreground text-[1.5rem] font-bold tracking-tight"
                      >
                        {formatCompactCurrency(total, currencySymbol)}
                      </text>
                    );
                  }}
                />
                {data.map((entry) => (
                  <Cell
                    key={entry.subcategory}
                    fill={EXPENSE_COLORS[entry.subcategory]}
                  />
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
                wrapperStyle={{ paddingTop: 8, fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
