"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/calculations";
import type { ExchangeRates } from "@/lib/exchange-rates";
import type { Account, CashHolding, StockHolding } from "@/lib/types";

type AccountWithHoldings = Account & {
  cash_holdings: CashHolding[];
  stock_holdings: StockHolding[];
};

export function HoldingsOverview({
  accounts,
  prices,
  baseCurrency = "USD",
  exchangeRates = {},
}: {
  accounts: AccountWithHoldings[];
  prices: Record<string, number>;
  baseCurrency?: string;
  exchangeRates?: ExchangeRates;
}) {
  // Helper to convert to base currency
  function convertToBase(amount: number, fromCurrency: string): number {
    if (fromCurrency === baseCurrency) return amount;
    const rate = exchangeRates[fromCurrency];
    if (!rate || rate === 0) return amount;
    return amount / rate;
  }

  // Build a flat list of all holdings
  const rows: {
    accountName: string;
    accountId: string;
    type: "cash" | "stock";
    label: string;
    originalCurrency: string;
    originalValue: number;
    convertedValue: number;
    gainLoss?: number;
  }[] = [];

  for (const account of accounts) {
    for (const h of account.cash_holdings) {
      const originalValue = Number(h.balance);
      const convertedValue = convertToBase(originalValue, h.currency);
      rows.push({
        accountName: account.name,
        accountId: account.id,
        type: "cash",
        label: h.currency,
        originalCurrency: h.currency,
        originalValue,
        convertedValue,
      });
    }
    for (const h of account.stock_holdings) {
      const price = prices[h.ticker.toUpperCase()] ?? 0;
      const costValueUSD = Number(h.shares) * Number(h.cost_basis_per_share);
      const currentValueUSD = price > 0 ? Number(h.shares) * price : costValueUSD;
      const currentValue = convertToBase(currentValueUSD, "USD");
      const costValue = convertToBase(costValueUSD, "USD");
      rows.push({
        accountName: account.name,
        accountId: account.id,
        type: "stock",
        label: `${h.ticker} (${h.shares} shares)`,
        originalCurrency: "USD",
        originalValue: costValueUSD, // Always show cost basis as original for stocks
        convertedValue: currentValue,
        gainLoss: price > 0 ? currentValue - costValue : undefined, // Only show gain/loss if we have price
      });
    }
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>All Holdings</CardTitle>
        </CardHeader>
        <CardContent className="text-center text-muted-foreground py-8">
          No holdings yet.{" "}
          <Link
            href="/dashboard/accounts"
            className="text-primary underline"
          >
            Add an account
          </Link>{" "}
          to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Holding</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Cost / Balance</TableHead>
              <TableHead className="text-right">Value ({baseCurrency})</TableHead>
              <TableHead className="text-right">Gain/Loss</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, i) => (
              <TableRow key={i}>
                <TableCell>
                  <Link
                    href={`/dashboard/accounts/${row.accountId}`}
                    className="hover:underline"
                  >
                    {row.accountName}
                  </Link>
                </TableCell>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell>
                  <Badge
                    variant={row.type === "cash" ? "default" : "secondary"}
                  >
                    {row.type}
                  </Badge>
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(row.originalValue, row.originalCurrency)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(row.convertedValue, baseCurrency)}
                </TableCell>
                <TableCell className="text-right">
                  {row.gainLoss !== undefined ? (
                    <span
                      className={
                        row.gainLoss >= 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      {row.gainLoss >= 0 ? "+" : ""}
                      {formatCurrency(row.gainLoss, baseCurrency)}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
