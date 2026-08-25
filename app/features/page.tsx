import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  BarChart3,
  Calculator,
  Landmark,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Singapore Net Worth, CPF and FIRE Planner Features",
  description:
    "Explore Track My Worth's Singapore-focused net worth tracking, CPF OA, SA and MA projections, investment portfolio tracking, expense tracking, and FIRE planning tools.",
  alternates: {
    canonical: "/features",
  },
};

const features = [
  {
    icon: Landmark,
    title: "CPF OA, SA and MA projections",
    description:
      "Bring your CPF balances together with salary-based contribution allocations, adjustable interest assumptions, mortgage deductions, and a retirement horizon you can explore.",
  },
  {
    icon: TrendingUp,
    title: "Investment portfolio tracking",
    description:
      "Track brokerage holdings, cash balances, and portfolio values in one place so it is easier to understand how each account contributes to your total worth.",
  },
  {
    icon: Calculator,
    title: "FIRE planning",
    description:
      "Use your spending and savings assumptions to estimate a financial independence target and follow progress alongside the rest of your finances.",
  },
  {
    icon: PiggyBank,
    title: "Expenses and cash-flow context",
    description:
      "Keep recurring and non-recurring expenses visible next to your assets, making your planning inputs easier to review and update.",
  },
  {
    icon: BarChart3,
    title: "Clear history and allocation views",
    description:
      "Review account changes, valuation history, monthly account-type totals, and asset allocation without maintaining a separate spreadsheet.",
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    description:
      "Your dashboard is account-protected, with financial data isolated to your signed-in account. Track My Worth is a planning tool, not financial advice.",
  },
];

export default function FeaturesPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Image src="/track-my-worth-mark.svg" alt="" width={24} height={24} priority />
            Track My Worth
          </Link>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-md px-4 py-2 text-sm font-medium hover:bg-accent">
              Sign in
            </Link>
            <Link href="/signup" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
              Sign up
            </Link>
          </div>
        </div>
      </header>

      <section className="border-b bg-gradient-to-br from-slate-950 via-slate-800 to-cyan-800 px-6 py-20 text-white sm:py-28">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-200">
            Singapore-focused personal finance planning
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            One place for your net worth, CPF and FIRE plans
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-200">
            Track My Worth brings cash, investments, CPF, SRS, expenses, and
            retirement assumptions into a single personal dashboard built for
            clearer financial planning.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/signup" className="inline-flex h-10 items-center justify-center rounded-md bg-white px-6 text-sm font-medium text-slate-950 hover:bg-slate-100">
              Start tracking your worth
            </Link>
            <Link href="/" className="inline-flex h-10 items-center justify-center rounded-md border border-white/40 px-6 text-sm font-medium text-white hover:bg-white/10">
              See the dashboard overview
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <div className="max-w-2xl">
          <h2 className="text-3xl font-bold tracking-tight">
            Planning tools that reflect how you manage money
          </h2>
          <p className="mt-4 text-muted-foreground">
            Financial tracking is more useful when your accounts, monthly
            expenses, and long-term assumptions can be reviewed together.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <article key={title} className="rounded-2xl border bg-card p-6 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y bg-muted/40 px-6 py-16 sm:py-20">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold tracking-tight">How CPF projections are used</h2>
          <div className="mt-6 space-y-4 leading-7 text-muted-foreground">
            <p>
              Enter your current OA, SA, and MA balances alongside your age and
              monthly salary. The planner applies age-based contribution
              allocations and lets you review the effect of account interest,
              CPF-funded mortgage deductions, and different projection horizons.
            </p>
            <p>
              The results are estimates for planning and should be checked
              against official CPF Board information and your own circumstances.
              Track My Worth does not provide financial, tax, retirement, or
              investment advice.
            </p>
          </div>
          <Link href="/signup" className="mt-7 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
            Create your CPF projection
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center sm:py-24">
        <h2 className="text-3xl font-bold tracking-tight">See the full picture, not isolated balances</h2>
        <p className="mt-4 text-muted-foreground">
          Start with the accounts you already have and build a clearer view of
          your financial progress over time.
        </p>
        <Link href="/signup" className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Sign up for Track My Worth
        </Link>
      </section>
    </main>
  );
}
