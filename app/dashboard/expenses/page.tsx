export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { ExpenseForm } from "@/components/forms/expense-form";
import { ExpensesTable } from "@/components/expenses-table";
import { ExpenseBreakdownChart } from "@/components/charts/expense-breakdown-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Expense } from "@/lib/types";

export default async function ExpensesPage() {
  const supabase = await createClient();

  const { data: expenses } = await supabase
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false });

  const typedExpenses = (expenses as Expense[]) ?? [];

  // Calculate totals
  const totalExpenses = typedExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0
  );
  const recurringTotal = typedExpenses
    .filter((e) => e.category === "recurring")
    .reduce((sum, e) => sum + Number(e.amount), 0);
  const nonRecurringTotal = typedExpenses
    .filter((e) => e.category === "non_recurring")
    .reduce((sum, e) => sum + Number(e.amount), 0);

  // Get current month expenses for the chart
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const currentMonthExpenses = typedExpenses.filter(
    (e) => e.expense_date >= currentMonthStart
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-muted-foreground">
            Track and categorize your spending
          </p>
        </div>
        <ExpenseForm />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recurring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${recurringTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Non-Recurring
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${nonRecurringTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="min-w-0">
          <ExpenseBreakdownChart
            expenses={currentMonthExpenses}
            title="This Month's Breakdown"
          />
        </div>
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>All Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpensesTable expenses={typedExpenses} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
