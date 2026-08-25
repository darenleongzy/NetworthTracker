export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { getCurrentMonthExpenses } from "@/lib/calculations";
import { ExpenseForm } from "@/components/forms/expense-form";
import { ExpensesTable } from "@/components/expenses-table";
import { ExpenseBreakdownChart } from "@/components/charts/expense-breakdown-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Expense } from "@/lib/types";

function formatExpenseAmount(value: number) {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
}

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

  // Get current month expenses for the chart (includes recurring from previous months)
  const currentMonthExpenses = getCurrentMonthExpenses(typedExpenses);

  const expenseCards = [
    {
      title: "Total Expenses",
      value: totalExpenses,
      tone: "dashboard-summary-card--net-worth",
    },
    {
      title: "Recurring",
      value: recurringTotal,
      tone: "dashboard-summary-card--cash",
    },
    {
      title: "Non-Recurring",
      value: nonRecurringTotal,
      tone: "dashboard-summary-card--investments",
    },
  ] as const;

  return (
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="app-page-header">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Spending</p>
          <h1 className="app-page-title mt-2">Expenses</h1>
          <p className="app-page-subtitle">Track recurring commitments and everyday spending.</p>
        </div>
        <ExpenseForm />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {expenseCards.map((card) => (
          <Card
            key={card.title}
            className={`dashboard-summary-card ${card.tone}`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-white/85">
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-[clamp(1.35rem,4vw,2.35rem)] font-bold leading-tight tracking-tight sm:text-left">
                {formatExpenseAmount(card.value)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0">
          <ExpenseBreakdownChart
            expenses={currentMonthExpenses}
            title="This Month's Breakdown"
          />
        </div>
        <Card className="chart-card min-w-0">
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
