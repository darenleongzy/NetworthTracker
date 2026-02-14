"use client";

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
import { ExpenseForm } from "@/components/forms/expense-form";
import { Trash2 } from "lucide-react";
import type { Expense } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";
import {
  getCategoryLabel,
  getSubcategoryLabel,
} from "@/lib/expense-categories";

export function ExpensesTable({ expenses }: { expenses: Expense[] }) {
  if (expenses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No expenses yet. Add one to start tracking.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Subcategory</TableHead>
          <TableHead>Description</TableHead>
          <TableHead className="text-right">Amount</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((expense) => (
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
                  onClick={async () => {
                    if (confirm("Delete this expense?")) {
                      await deleteExpense(expense.id);
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
