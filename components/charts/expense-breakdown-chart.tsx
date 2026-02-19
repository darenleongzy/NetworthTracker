"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
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

interface ExpenseBreakdownChartProps {
  expenses: Expense[];
  title?: string;
}

export function ExpenseBreakdownChart({
  expenses,
  title = "Expense Breakdown",
}: ExpenseBreakdownChartProps) {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
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
              paddingAngle={2}
              dataKey="value"
              label={({ percent }) =>
                percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ""
              }
              labelLine={false}
            >
              {data.map((entry) => (
                <Cell
                  key={entry.subcategory}
                  fill={EXPENSE_COLORS[entry.subcategory]}
                />
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
