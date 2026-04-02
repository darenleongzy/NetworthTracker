"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrencySymbol } from "@/lib/currencies";
import type { MonthlyAccountTypeTotal } from "@/lib/account-history";

export function AccountTypeMonthlyChart({
  data,
  baseCurrency,
}: {
  data: MonthlyAccountTypeTotal[];
  baseCurrency: string;
}) {
  const hasAnyValue = data.some(
    (row) => row.cash || row.investment || row.cpf || row.srs
  );

  if (!hasAnyValue) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monthly Totals by Account Type</CardTitle>
        </CardHeader>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No account history yet. Monthly totals will appear after daily account snapshots are saved.
        </CardContent>
      </Card>
    );
  }

  const symbol = getCurrencySymbol(baseCurrency);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Totals by Account Type</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="month" className="text-xs" />
            <YAxis
              className="text-xs"
              tickFormatter={(value) => `${symbol}${Number(value).toLocaleString()}`}
            />
            <Tooltip
              formatter={(value: number) =>
                `${symbol}${value.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}`
              }
            />
            <Legend />
            <Line type="monotone" dataKey="cash" name="Cash" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="investment" name="Investments" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="cpf" name="CPF" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="srs" name="SRS" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
