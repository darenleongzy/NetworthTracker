"use client";

import { deleteStockHolding } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockHoldingForm } from "@/components/forms/stock-holding-form";
import { Trash2 } from "lucide-react";
import type { StockHolding } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";

export function StockHoldingsTable({
  holdings,
  accountId,
  stockPrices = {},
}: {
  holdings: StockHolding[];
  accountId: string;
  stockPrices?: Record<string, number>;
}) {
  if (holdings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No stock holdings yet. Add one to get started.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <TableHead className="text-right">Shares</TableHead>
          <TableHead className="text-right">Price (USD)</TableHead>
          <TableHead className="text-right">Market Value (USD)</TableHead>
          <TableHead className="text-right">Cost Basis (USD)</TableHead>
          <TableHead className="text-right">Gain/Loss (USD)</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.map((h) => {
          const price = stockPrices[h.ticker.toUpperCase()] ?? 0;
          const marketValue = Number(h.shares) * price;
          const costBasis = Number(h.shares) * Number(h.cost_basis_per_share);
          const gainLoss = marketValue - costBasis;

          return (
            <TableRow key={h.id}>
              <TableCell className="font-medium">{h.ticker}</TableCell>
              <TableCell className="text-right">{h.shares}</TableCell>
              <TableCell className="text-right">
                {formatCurrency(price, "USD")}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(marketValue, "USD")}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                {formatCurrency(costBasis, "USD")}
              </TableCell>
              <TableCell className="text-right">
                <span className={gainLoss >= 0 ? "text-green-600" : "text-red-600"}>
                  {gainLoss >= 0 ? "+" : ""}
                  {formatCurrency(gainLoss, "USD")}
                </span>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <StockHoldingForm accountId={accountId} holding={h} />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      if (confirm("Delete this stock holding?")) {
                        await deleteStockHolding(h.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
