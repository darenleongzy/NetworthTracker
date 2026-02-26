"use client";

import { useMemo, useState } from "react";
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
import { SortableHeader } from "@/components/ui/sortable-header";
import { StockHoldingForm } from "@/components/forms/stock-holding-form";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { StockHolding } from "@/lib/types";
import type { ExchangeRates } from "@/lib/exchange-rates";
import type { StockPriceData } from "@/lib/stock-api";
import { formatCurrency } from "@/lib/calculations";
import { useTableSort } from "@/lib/hooks/use-table-sort";

type StockHoldingWithComputed = StockHolding & {
  price: number;
  currency: string;
  marketValue: number;
  costBasis: number;
  gainLoss: number;
};

export function StockHoldingsTable({
  holdings,
  accountId,
  stockPrices = {},
  baseCurrency = "USD",
  exchangeRates = {},
}: {
  holdings: StockHolding[];
  accountId: string;
  stockPrices?: Record<string, StockPriceData>;
  baseCurrency?: string;
  exchangeRates?: ExchangeRates;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this stock holding?")) return;
    setDeletingId(id);
    try {
      await deleteStockHolding(id);
      toast.success("Stock holding deleted");
    } catch {
      toast.error("Failed to delete stock holding");
    } finally {
      setDeletingId(null);
    }
  }

  // Compute derived values for sorting
  const holdingsWithComputed = useMemo<StockHoldingWithComputed[]>(() => {
    return holdings.map((h) => {
      const priceData = stockPrices[h.ticker.toUpperCase()];
      const price = priceData?.price ?? 0;
      const currency = priceData?.currency ?? "USD";
      const marketValue = Number(h.shares) * price;
      const costBasis = Number(h.shares) * Number(h.cost_basis_per_share);
      const gainLoss = marketValue - costBasis;
      return { ...h, price, currency, marketValue, costBasis, gainLoss };
    });
  }, [holdings, stockPrices]);

  const { sortedData, sortConfig, requestSort } =
    useTableSort(holdingsWithComputed);

  if (holdings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No stock holdings yet. Add one to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
        <TableRow>
          <TableHead>Ticker</TableHead>
          <SortableHeader
            label="Shares"
            sortKey="shares"
            currentSortKey={sortConfig.key as string | null}
            direction={sortConfig.direction}
            onSort={() => requestSort("shares")}
            className="text-right"
          />
          <SortableHeader
            label="Price"
            sortKey="price"
            currentSortKey={sortConfig.key as string | null}
            direction={sortConfig.direction}
            onSort={() => requestSort("price")}
            className="text-right"
          />
          <SortableHeader
            label="Market Value"
            sortKey="marketValue"
            currentSortKey={sortConfig.key as string | null}
            direction={sortConfig.direction}
            onSort={() => requestSort("marketValue")}
            className="text-right"
          />
          <SortableHeader
            label="Cost Basis"
            sortKey="costBasis"
            currentSortKey={sortConfig.key as string | null}
            direction={sortConfig.direction}
            onSort={() => requestSort("costBasis")}
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
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((h) => (
          <TableRow key={h.id}>
            <TableCell className="font-medium">{h.ticker}</TableCell>
            <TableCell className="text-right">{h.shares}</TableCell>
            <TableCell className="text-right">
              {formatCurrency(h.price, h.currency)}
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(h.marketValue, h.currency)}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {formatCurrency(h.costBasis, h.currency)}
            </TableCell>
            <TableCell className="text-right">
              <span className={h.gainLoss >= 0 ? "text-green-600" : "text-red-600"}>
                {h.gainLoss >= 0 ? "+" : ""}
                {formatCurrency(h.gainLoss, h.currency)}
              </span>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <StockHoldingForm accountId={accountId} holding={h} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(h.id)}
                  disabled={deletingId === h.id}
                >
                  {deletingId === h.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-destructive" />
                  )}
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
        </TableBody>
      </Table>
    </div>
  );
}
