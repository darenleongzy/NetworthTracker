"use client";

import { useState } from "react";
import { deleteCashHolding } from "@/lib/actions";
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
import { CashHoldingForm } from "@/components/forms/cash-holding-form";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { CashHolding } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import { getCurrencyName } from "@/lib/currencies";
import { useTableSort } from "@/lib/hooks/use-table-sort";

export function CashHoldingsTable({
  holdings,
  accountId,
}: {
  holdings: CashHolding[];
  accountId: string;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { sortedData, sortConfig, requestSort } = useTableSort(holdings);

  async function handleDelete(id: string) {
    if (!confirm("Delete this holding?")) return;
    setDeletingId(id);
    try {
      await deleteCashHolding(id);
      toast.success("Holding deleted");
    } catch {
      toast.error("Failed to delete holding");
    } finally {
      setDeletingId(null);
    }
  }

  if (holdings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No holdings yet. Add one to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
        <TableRow>
          <TableHead>Currency</TableHead>
          <SortableHeader
            label="Balance"
            sortKey="balance"
            currentSortKey={sortConfig.key as string | null}
            direction={sortConfig.direction}
            onSort={() => requestSort("balance")}
            className="text-right"
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((h) => (
          <TableRow key={h.id}>
            <TableCell>
              <span className="font-medium">{h.currency}</span>
              <span className="text-muted-foreground ml-2 text-sm">
                {getCurrencyName(h.currency)}
              </span>
            </TableCell>
            <TableCell className="text-right">
              {formatCurrency(h.balance, h.currency)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <CashHoldingForm accountId={accountId} holding={h} />
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
