"use client";

import { useMemo } from "react";
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
import { SortableHeader } from "@/components/ui/sortable-header";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/calculations";
import { useTableSort } from "@/lib/hooks/use-table-sort";
import type { ExchangeRates } from "@/lib/exchange-rates";
import type { StockPriceData } from "@/lib/stock-api";
import type { Account, CashHolding, StockHolding } from "@/lib/types";

type AccountWithHoldings = Account & {
  cash_holdings: CashHolding[];
  stock_holdings: StockHolding[];
};

type HoldingRow = {
  accountName: string;
  accountId: string;
  type: "cash" | "stock";
  label: string;
  originalCurrency: string;
  originalValue: number;
  convertedValue: number;
  gainLoss: number | null;
};

export function HoldingsOverview({
  accounts,
  prices,
  baseCurrency = "USD",
  exchangeRates = {},
}: {
  accounts: AccountWithHoldings[];
  prices: Record<string, StockPriceData>;
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
  const rows = useMemo<HoldingRow[]>(() => {
    const result: HoldingRow[] = [];

    for (const account of accounts) {
      for (const h of account.cash_holdings) {
        const originalValue = Number(h.balance);
        const convertedValue = convertToBase(originalValue, h.currency);
        result.push({
          accountName: account.name,
          accountId: account.id,
          type: "cash",
          label: h.currency,
          originalCurrency: h.currency,
          originalValue,
          convertedValue,
          gainLoss: null,
        });
      }
      for (const h of account.stock_holdings) {
        const priceData = prices[h.ticker.toUpperCase()];
        const price = priceData?.price ?? 0;
        const priceCurrency = priceData?.currency ?? "USD";
        const costValueNative = Number(h.shares) * Number(h.cost_basis_per_share);
        const currentValueNative = price > 0 ? Number(h.shares) * price : costValueNative;
        const currentValue = convertToBase(currentValueNative, priceCurrency);
        const costValue = convertToBase(costValueNative, priceCurrency);
        result.push({
          accountName: account.name,
          accountId: account.id,
          type: "stock",
          label: `${h.ticker} (${h.shares} shares)`,
          originalCurrency: priceCurrency,
          originalValue: costValueNative,
          convertedValue: currentValue,
          gainLoss: price > 0 ? currentValue - costValue : null,
        });
      }
    }

    return result;
  }, [accounts, prices, baseCurrency, exchangeRates]);

  const { sortedData, sortConfig, requestSort } = useTableSort(rows);

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
    <Card className="overflow-hidden">
      <CardHeader>
        <CardTitle>All Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
            <TableRow>
              <TableHead>Account</TableHead>
              <TableHead>Holding</TableHead>
              <TableHead>Type</TableHead>
              <SortableHeader
                label="Cost / Balance"
                sortKey="originalValue"
                currentSortKey={sortConfig.key as string | null}
                direction={sortConfig.direction}
                onSort={() => requestSort("originalValue")}
                className="text-right"
              />
              <SortableHeader
                label={`Value (${baseCurrency})`}
                sortKey="convertedValue"
                currentSortKey={sortConfig.key as string | null}
                direction={sortConfig.direction}
                onSort={() => requestSort("convertedValue")}
                className="text-right"
              />
              <SortableHeader
                label="Gain/Loss"
                sortKey="gainLoss"
                currentSortKey={sortConfig.key as string | null}
                direction={sortConfig.direction}
                onSort={() => requestSort("gainLoss")}
                className="text-right"
              />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((row, i) => (
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
                  {row.gainLoss !== null ? (
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
        </div>
      </CardContent>
    </Card>
  );
}
