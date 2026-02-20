"use client";

import { useState, useEffect } from "react";
import { createExpense, updateExpense } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { Expense, ExpenseCategory, ExpenseSubcategory } from "@/lib/types";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/lib/currencies";
import {
  EXPENSE_CATEGORIES,
  getSubcategoriesForCategory,
} from "@/lib/expense-categories";

export function ExpenseForm({ expense }: { expense?: Expense }) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(expense?.amount?.toString() ?? "");
  const [currency, setCurrency] = useState(expense?.currency ?? "USD");
  const [category, setCategory] = useState<ExpenseCategory>(
    expense?.category ?? "non_recurring"
  );
  const [subcategory, setSubcategory] = useState<ExpenseSubcategory | "">(
    expense?.subcategory ?? ""
  );
  const [expenseDate, setExpenseDate] = useState(
    expense?.expense_date ?? new Date().toISOString().split("T")[0]
  );
  const [description, setDescription] = useState(expense?.description ?? "");
  const [loading, setLoading] = useState(false);

  const subcategories = getSubcategoriesForCategory(category);

  useEffect(() => {
    if (!expense) {
      const isValidSubcategory = subcategories.some(
        (s) => s.value === subcategory
      );
      if (!isValidSubcategory) {
        setSubcategory("");
      }
    }
  }, [category, subcategories, expense, subcategory]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!subcategory) return;

    setLoading(true);
    try {
      if (expense) {
        await updateExpense(
          expense.id,
          parseFloat(amount),
          currency,
          category,
          subcategory,
          expenseDate,
          description || undefined
        );
      } else {
        await createExpense(
          parseFloat(amount),
          currency,
          category,
          subcategory,
          expenseDate,
          description || undefined
        );
      }
      setOpen(false);
      if (!expense) {
        setAmount("");
        setDescription("");
        setSubcategory("");
        setExpenseDate(new Date().toISOString().split("T")[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {expense ? (
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Expense
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {expense ? "Edit Expense" : "Add Expense"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={category}
                onValueChange={(v) => setCategory(v as ExpenseCategory)}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subcategory">Subcategory</Label>
              <Select
                value={subcategory}
                onValueChange={(v) => setSubcategory(v as ExpenseSubcategory)}
              >
                <SelectTrigger id="subcategory">
                  <SelectValue placeholder="Select subcategory" />
                </SelectTrigger>
                <SelectContent>
                  {subcategories.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger id="currency">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.symbol} {c.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount ({getCurrencySymbol(currency)})</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={expenseDate}
              onChange={(e) => setExpenseDate(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What was this expense for?"
              rows={2}
            />
          </div>
          <Button
            type="submit"
            className="w-full"
            disabled={loading || !subcategory}
          >
            {loading ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
