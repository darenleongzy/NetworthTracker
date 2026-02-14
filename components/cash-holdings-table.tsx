"use client";

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
import { CashHoldingForm } from "@/components/forms/cash-holding-form";
import { Trash2 } from "lucide-react";
import type { CashHolding } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import { getCurrencyName } from "@/lib/currencies";

export function CashHoldingsTable({
  holdings,
  accountId,
}: {
  holdings: CashHolding[];
  accountId: string;
}) {
  if (holdings.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No holdings yet. Add one to get started.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Currency</TableHead>
          <TableHead className="text-right">Balance</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {holdings.map((h) => (
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
                  onClick={async () => {
                    if (confirm("Delete this holding?")) {
                      await deleteCashHolding(h.id);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
