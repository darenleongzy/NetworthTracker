"use client";

import { useState } from "react";
import { deleteExpense } from "@/lib/actions";
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
import { ExpenseForm } from "@/components/forms/expense-form";
import { Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import {
  getCategoryLabel,
  getSubcategoryLabel,
} from "@/lib/expense-categories";
import { useTableSort } from "@/lib/hooks/use-table-sort";

export function ExpensesTable({ expenses }: { expenses: Expense[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { sortedData, sortConfig, requestSort } = useTableSort(expenses);

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    setDeletingId(id);
    try {
      await deleteExpense(id);
      toast.success("Expense deleted");
    } catch {
      toast.error("Failed to delete expense");
    } finally {
      setDeletingId(null);
    }
  }

  if (expenses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No expenses yet. Add one to start tracking.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
        <TableRow>
          <SortableHeader
            label="Date"
            sortKey="expense_date"
            currentSortKey={sortConfig.key as string | null}
            direction={sortConfig.direction}
            onSort={() => requestSort("expense_date")}
          />
          <TableHead>Category</TableHead>
          <TableHead>Subcategory</TableHead>
          <TableHead>Description</TableHead>
          <SortableHeader
            label="Amount"
            sortKey="amount"
            currentSortKey={sortConfig.key as string | null}
            direction={sortConfig.direction}
            onSort={() => requestSort("amount")}
            className="text-right"
          />
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedData.map((expense) => (
          <TableRow key={expense.id}>
            <TableCell>
              {new Date(expense.expense_date).toLocaleDateString()}
            </TableCell>
            <TableCell>{getCategoryLabel(expense.category)}</TableCell>
            <TableCell>{getSubcategoryLabel(expense.subcategory)}</TableCell>
            <TableCell className="max-w-[200px] truncate text-muted-foreground">
              {expense.description || "-"}
            </TableCell>
            <TableCell className="text-right font-medium">
              {formatCurrency(expense.amount, expense.currency)}
            </TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <ExpenseForm expense={expense} />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(expense.id)}
                  disabled={deletingId === expense.id}
                >
                  {deletingId === expense.id ? (
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
