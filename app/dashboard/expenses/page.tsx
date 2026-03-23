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
      tone:
        "border-transparent bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-purple-500/25",
      text: "text-white",
      subtext: "text-white/80",
    },
    {
      title: "Recurring",
      value: recurringTotal,
      tone:
        "border-transparent bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25",
      text: "text-white",
      subtext: "text-white/80",
    },
    {
      title: "Non-Recurring",
      value: nonRecurringTotal,
      tone:
        "border-transparent bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25",
      text: "text-white",
      subtext: "text-white/80",
    },
  ] as const;

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
        {expenseCards.map((card) => (
          <Card
            key={card.title}
            className={`overflow-hidden rounded-[1.4rem] border ${card.tone}`}
          >
            <CardHeader className="pb-2">
              <CardTitle className={`text-sm font-medium ${card.subtext}`}>
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-center text-[clamp(1.35rem,4vw,2.35rem)] font-bold leading-tight tracking-tight sm:text-left ${card.text}`}>
                {formatExpenseAmount(card.value)}
              </div>
            </CardContent>
          </Card>
        ))}
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
