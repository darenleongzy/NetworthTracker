"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  describeAccountHistoryEvent,
  formatAccountHistoryTimestamp,
  getAccountHistoryEventDetails,
} from "@/lib/account-history";
import { updateAccount } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CashHoldingForm } from "@/components/forms/cash-holding-form";
import { StockHoldingForm } from "@/components/forms/stock-holding-form";
import { CpfHoldingsForm } from "@/components/forms/cpf-holdings-form";
import { CpfSettingsForm } from "@/components/forms/cpf-settings-form";
import { CashHoldingsTable } from "@/components/cash-holdings-table";
import { StockHoldingsTable } from "@/components/stock-holdings-table";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { AccountHistoryChart } from "@/components/charts/account-history-chart";
import {
  CPF_DEFAULT_PROJECTION_YEARS,
  CPF_ORDINARY_WAGE_CEILING,
  buildCpfProjectionSummary,
  getEffectiveBasicHealthcareSum,
  getMaOverflowDestination,
} from "@/lib/cpf";
import {
  CPF_SUB_ACCOUNTS,
  DEFAULT_CPF_ACCOUNT_SETTINGS,
} from "@/lib/types";
import { ArrowLeft, Check, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/calculations";
import type { ExchangeRates } from "@/lib/exchange-rates";
import type { StockPriceData } from "@/lib/stock-api";
import type {
  AccountHistoryEvent,
  AccountValueSnapshot,
  AccountWithHoldings,
  CpfAccountSettings,
} from "@/lib/types";

export function AccountDetail({
  account,
  baseCurrency = "USD",
  exchangeRates = {},
  stockPrices = {},
  cpfSettings = null,
  accountHistoryEvents = [],
  accountValueSnapshots = [],
}: {
  account: AccountWithHoldings;
  baseCurrency?: string;
  exchangeRates?: ExchangeRates;
  stockPrices?: Record<string, StockPriceData>;
  cpfSettings?: CpfAccountSettings | null;
  accountHistoryEvents?: AccountHistoryEvent[];
  accountValueSnapshots?: AccountValueSnapshot[];
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.name);
  const [renaming, setRenaming] = useState(false);
  const [projectionYears, setProjectionYears] = useState(
    CPF_DEFAULT_PROJECTION_YEARS
  );

  const effectiveCpfSettings = useMemo(
    () => ({
      ...DEFAULT_CPF_ACCOUNT_SETTINGS,
      ...(cpfSettings ?? {}),
    }),
    [cpfSettings]
  );

  const cpfProjection = useMemo(() => {
    if (account.type !== "cpf") return null;

    return buildCpfProjectionSummary(
      account.cash_holdings,
      {
        currentAge: effectiveCpfSettings.current_age,
        monthlySalary: effectiveCpfSettings.monthly_salary,
        oaInterestRate: effectiveCpfSettings.oa_interest_rate,
        saInterestRate: effectiveCpfSettings.sa_interest_rate,
        maInterestRate: effectiveCpfSettings.ma_interest_rate,
        frsMetForMaOverflow: effectiveCpfSettings.frs_met_for_ma_overflow,
        mortgageMonthlyDeduction: effectiveCpfSettings.mortgage_monthly_deduction,
        mortgagePayoffAge: effectiveCpfSettings.mortgage_payoff_age,
        earlyRetirementAge: effectiveCpfSettings.early_retirement_age,
      },
      projectionYears
    );
  }, [account.cash_holdings, account.type, effectiveCpfSettings, projectionYears]);

  // Calculate account total in base currency
  function calculateAccountTotal(): number {
    let total = 0;

    // Sum cash holdings converted to base currency
    for (const h of account.cash_holdings) {
      const balance = Number(h.balance);
      if (h.currency === baseCurrency) {
        total += balance;
      } else {
        const rate = exchangeRates[h.currency];
        if (rate && rate > 0) {
          total += balance / rate;
        } else {
          total += balance;
        }
      }
    }

    // Sum stock holdings (prices are in their native currency, convert to base)
    for (const h of account.stock_holdings) {
      const priceData = stockPrices[h.ticker.toUpperCase()];
      const price = priceData?.price ?? 0;
      const priceCurrency = priceData?.currency ?? "USD";
      const valueNative = Number(h.shares) * price;
      if (priceCurrency === baseCurrency) {
        total += valueNative;
      } else {
        const rate = exchangeRates[priceCurrency];
        if (rate && rate > 0) {
          total += valueNative / rate;
        } else {
          total += valueNative;
        }
      }
    }

    return total;
  }

  const accountTotal = calculateAccountTotal();

  async function handleRename() {
    if (name.trim() && name !== account.name) {
      setRenaming(true);
      try {
        await updateAccount(account.id, name.trim());
        toast.success("Account renamed");
      } catch {
        toast.error("Failed to rename account");
        setName(account.name);
      } finally {
        setRenaming(false);
      }
    }
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/accounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            {editing ? (
              <>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl font-bold h-auto py-0"
                  autoFocus
                  disabled={renaming}
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                />
                <Button variant="ghost" size="icon" onClick={handleRename} disabled={renaming}>
                  {renaming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{account.name}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
            <Badge variant={account.type === "investment" ? "secondary" : "default"}>
              {account.type.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="text-sm text-muted-foreground">Account Total</p>
          <p className="text-2xl font-bold">
            {formatCurrency(accountTotal, baseCurrency)}
          </p>
        </div>
      </div>

      {account.type === "cpf" ? (
        <Card className="account-list-surface overflow-hidden">
          <CardHeader className="relative flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>CPF Balances & Projections</CardTitle>
              <CardDescription>
                Track balances, salary-based contributions, and retirement projections.
              </CardDescription>
            </div>
            <CpfHoldingsForm
              accountId={account.id}
              holdings={account.cash_holdings}
            />
          </CardHeader>
          <CardContent className="relative space-y-6">
            <CpfSettingsForm
              accountId={account.id}
              settings={cpfSettings}
            />
            <CpfBalancesDisplay holdings={account.cash_holdings} />
            {cpfProjection ? (
              <>
                <Separator />
                <CpfContributionSummary
                  monthlySalary={effectiveCpfSettings.monthly_salary}
                  currentAge={effectiveCpfSettings.current_age}
                  oaInterestRate={effectiveCpfSettings.oa_interest_rate}
                  saInterestRate={effectiveCpfSettings.sa_interest_rate}
                  maInterestRate={effectiveCpfSettings.ma_interest_rate}
                  frsMetForMaOverflow={
                    effectiveCpfSettings.frs_met_for_ma_overflow
                  }
                  mortgageMonthlyDeduction={
                    effectiveCpfSettings.mortgage_monthly_deduction
                  }
                  mortgagePayoffAge={effectiveCpfSettings.mortgage_payoff_age}
                  projection={cpfProjection}
                />
                <Separator />
                <CpfProjectionScenarios
                  earlyRetirementAge={effectiveCpfSettings.early_retirement_age}
                  projectionYears={projectionYears}
                  onProjectionYearsChange={setProjectionYears}
                  projection={cpfProjection}
                />
              </>
            ) : null}
          </CardContent>
        </Card>
      ) : account.type !== "investment" ? (
        <Card className="chart-card">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Cash Holdings</CardTitle>
            <CashHoldingForm accountId={account.id} />
          </CardHeader>
          <CardContent>
            <CashHoldingsTable
              holdings={account.cash_holdings}
              accountId={account.id}
            />
          </CardContent>
        </Card>
      ) : (
        <Card className="chart-card">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Stock Holdings</CardTitle>
              <CardDescription>
                Stock values shown in native currency
              </CardDescription>
            </div>
            <StockHoldingForm accountId={account.id} />
          </CardHeader>
          <CardContent>
            <StockHoldingsTable
              holdings={account.stock_holdings}
              accountId={account.id}
              stockPrices={stockPrices}
              baseCurrency={baseCurrency}
              exchangeRates={exchangeRates}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <AccountHistoryChart
          snapshots={accountValueSnapshots}
          currency={baseCurrency}
        />
        <Card className="chart-card">
          <CardHeader>
            <CardTitle>Change History</CardTitle>
            <CardDescription>
              Recent account edits and value-affecting actions visible to this user.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {accountHistoryEvents.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No change history yet. Events will appear after you update this account.
              </p>
            ) : (
              <div className="space-y-4">
                {accountHistoryEvents.map((event) => {
                  const detail = describeAccountHistoryEvent(event);
                  const detailRows = getAccountHistoryEventDetails(event);
                  return (
                    <div
                      key={event.id}
                      className="rounded-2xl border border-border/80 bg-secondary/35 p-4"
                    >
                      <div className="flex flex-col gap-1">
                        <p className="font-medium text-foreground">{event.event_label}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatAccountHistoryTimestamp(event.created_at)}
                        </p>
                      </div>
                      {detail && detailRows.length === 0 ? (
                        <p className="mt-2 text-sm text-muted-foreground">{detail}</p>
                      ) : null}
                      {detailRows.length > 0 ? (
                        <div className="mt-3 space-y-2 rounded-xl border border-border/70 bg-background/70 p-3">
                          {detailRows.map((row) => (
                            <div
                              key={`${event.id}-${row.label}`}
                              className="flex flex-col gap-1 text-sm sm:flex-row sm:items-start sm:justify-between"
                            >
                              <span className="font-medium text-foreground">{row.label}</span>
                              <span className="text-slate-600 sm:text-right">{row.value}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CpfBalancesDisplay({ holdings }: { holdings: { label?: string | null; balance: number }[] }) {
  const cpfHoldings = holdings.filter((h) =>
    ["OA", "SA", "MA"].includes(h.label ?? "")
  );

  if (cpfHoldings.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No CPF balances set. Click &quot;Set Up CPF Balances&quot; to add your balances.
      </p>
    );
  }

  const total = cpfHoldings.reduce((sum, h) => sum + Number(h.balance), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        {CPF_SUB_ACCOUNTS.map(({ value, label }) => {
          const holding = cpfHoldings.find((h) => h.label === value);
          const balance = holding ? Number(holding.balance) : 0;
          const tone =
            value === "OA"
              ? "border-amber-200/70 bg-[linear-gradient(135deg,rgba(255,247,237,0.95),rgba(255,237,213,0.88))]"
              : value === "SA"
                ? "border-emerald-200/70 bg-[linear-gradient(135deg,rgba(236,253,245,0.98),rgba(209,250,229,0.8))]"
                : "border-sky-200/70 bg-[linear-gradient(135deg,rgba(239,246,255,0.98),rgba(224,242,254,0.85))]";
          return (
            <div
              key={value}
              className={`flex items-center justify-between rounded-2xl border p-4 shadow-sm ${tone}`}
            >
              <div>
                <p className="font-medium text-slate-950">{label}</p>
                <p className="text-sm text-slate-600">{value}</p>
              </div>
              <p className="text-lg font-semibold text-slate-950">
                {formatCurrency(balance, "SGD")}
              </p>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-slate-200/70 bg-white/70 px-4 py-3 shadow-sm">
        <p className="font-medium">Total CPF</p>
        <p className="text-xl font-bold text-slate-950">{formatCurrency(total, "SGD")}</p>
      </div>
    </div>
  );
}

function CpfContributionSummary({
  monthlySalary,
  currentAge,
  oaInterestRate,
  saInterestRate,
  maInterestRate,
  frsMetForMaOverflow,
  mortgageMonthlyDeduction,
  mortgagePayoffAge,
  projection,
}: {
  monthlySalary: number;
  currentAge: number;
  oaInterestRate: number;
  saInterestRate: number;
  maInterestRate: number;
  frsMetForMaOverflow: boolean;
  mortgageMonthlyDeduction: number;
  mortgagePayoffAge: number | null;
  projection: ReturnType<typeof buildCpfProjectionSummary>;
}) {
  const { currentBreakdown } = projection;
  const effectiveBhs = getEffectiveBasicHealthcareSum(currentAge);
  const maOverflowDestination = getMaOverflowDestination(
    currentAge,
    frsMetForMaOverflow
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-medium">Monthly CPF Contribution Breakdown</p>
          <p className="text-sm text-muted-foreground">
            Based on age {currentAge} and a monthly salary of{" "}
            {formatCurrency(monthlySalary, "SGD")}.
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Current age band: {currentBreakdown.contributionBandLabel}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryTile
          label="Employee CPF"
          value={formatCurrency(currentBreakdown.employeeContribution, "SGD")}
          hint="Monthly employee contribution"
          tone="sand"
        />
        <SummaryTile
          label="Employer CPF"
          value={formatCurrency(currentBreakdown.employerContribution, "SGD")}
          hint="Monthly employer contribution"
          tone="mint"
        />
        <SummaryTile
          label="Total CPF"
          value={formatCurrency(currentBreakdown.totalContribution, "SGD")}
          hint={
            currentBreakdown.salaryUsedForCpf < monthlySalary
              ? `Capped at ${formatCurrency(CPF_ORDINARY_WAGE_CEILING, "SGD")} OW ceiling`
              : "Salary within CPF OW ceiling"
          }
          tone="sky"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <SummaryTile
          label="OA / month"
          value={formatCurrency(currentBreakdown.oaContribution, "SGD")}
          hint={`Interest assumption: ${oaInterestRate}%`}
          tone="amber"
        />
        <SummaryTile
          label={`${currentBreakdown.middleAccountLabel} / month`}
          value={formatCurrency(currentBreakdown.middleContribution, "SGD")}
          hint={`Interest assumption: ${saInterestRate}%`}
          tone="emerald"
        />
        <SummaryTile
          label="MA / month"
          value={formatCurrency(currentBreakdown.maContribution, "SGD")}
          hint={`Interest assumption: ${maInterestRate}%`}
          tone="cyan"
        />
      </div>

      <div className="rounded-[1.5rem] border border-slate-200/80 bg-white/75 p-4 text-sm text-slate-600 shadow-sm">
        <p>
          Mortgage deduction from OA:{" "}
          <span className="font-medium text-slate-950">
            {formatCurrency(mortgageMonthlyDeduction, "SGD")}
          </span>
          {mortgagePayoffAge
            ? ` until age ${mortgagePayoffAge}`
            : " until manually changed"}
        </p>
        <p>
          Allocation band in use:{" "}
          <span className="font-medium text-slate-950">
            {currentBreakdown.allocationBandLabel}
          </span>
          {currentBreakdown.middleAccountLabel === "RA"
            ? " (retirement allocations go to RA after 55)"
            : " (retirement allocations go to SA before 55)"}
        </p>
        <p>
          Effective MA cap:{" "}
          <span className="font-medium text-slate-950">
            {formatCurrency(effectiveBhs, "SGD")}
          </span>
          {` and excess MA contributions flow to ${maOverflowDestination}.`}
        </p>
      </div>
    </div>
  );
}

function CpfProjectionScenarios({
  earlyRetirementAge,
  projectionYears,
  onProjectionYearsChange,
  projection,
}: {
  earlyRetirementAge: number;
  projectionYears: number;
  onProjectionYearsChange: (value: number) => void;
  projection: ReturnType<typeof buildCpfProjectionSummary>;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 rounded-[1.5rem] border border-white/70 bg-white/70 p-4 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <p className="font-medium">CPF Projections</p>
        <div className="w-full max-w-xl space-y-3">
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              These scenarios use monthly salary-based CPF contributions, your custom
              interest assumptions, and OA mortgage deductions.
            </p>
            <div className="shrink-0 rounded-full bg-slate-950 px-3 py-1 text-sm font-medium text-white">
              {projectionYears} years
            </div>
          </div>
          <div className="space-y-2">
            <Slider
              value={[projectionYears]}
              onValueChange={([value]) => onProjectionYearsChange(value)}
              min={1}
              max={40}
              step={1}
              className="[&_[data-slot=slider-range]]:bg-sky-500 [&_[data-slot=slider-thumb]]:border-sky-500 [&_[data-slot=slider-thumb]]:bg-white [&_[data-slot=slider-track]]:bg-sky-100/90"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>1 year</span>
              <span>Projection horizon</span>
              <span>40 years</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ProjectionCard
          title={`${projectionYears}-Year Projection`}
          subtitle={`Projected age ${projection.sevenYearProjection.ageAtEnd}`}
          snapshot={projection.sevenYearProjection}
          tone="ocean"
        />
        <ProjectionCard
          title="Early Retirement Projection"
          subtitle={`Projected age ${earlyRetirementAge}`}
          snapshot={projection.earlyRetirementProjection}
          tone="sunrise"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Projection note: this uses current CPF rates from 1 January 2026, models salary as
        ordinary wages capped at the monthly OW ceiling, approximates interest monthly,
        applies the 2026 Basic Healthcare Sum cap, and does not automatically add CPF
        extra interest, Additional Wages, or Full Retirement Sum transfers from OA into RA.
      </p>
    </div>
  );
}

function ProjectionCard({
  title,
  subtitle,
  snapshot,
  tone,
}: {
  title: string;
  subtitle: string;
  snapshot: ReturnType<typeof buildCpfProjectionSummary>["sevenYearProjection"];
  tone: "ocean" | "sunrise";
}) {
  const toneClass =
    tone === "ocean"
      ? "border-sky-200/70 bg-[linear-gradient(155deg,rgba(239,246,255,0.96),rgba(224,242,254,0.92)_40%,rgba(236,253,245,0.84))]"
      : "border-amber-200/70 bg-[linear-gradient(155deg,rgba(255,247,237,0.96),rgba(254,249,195,0.86)_45%,rgba(255,237,213,0.92))]";

  return (
    <div className={`space-y-4 rounded-[1.75rem] border p-4 shadow-sm ${toneClass}`}>
      <div className="space-y-1">
        <p className="font-medium text-slate-950">{title}</p>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SummaryTile
          label="Total CPF"
          value={formatCurrency(snapshot.totalBalance, "SGD")}
          hint={`${snapshot.monthsProjected} months projected`}
          tone="glass"
        />
        <SummaryTile
          label="Interest Earned"
          value={formatCurrency(snapshot.totalInterestEarned, "SGD")}
          hint="Based on your configured rates"
          tone="glass"
        />
        <SummaryTile
          label="CPF Added"
          value={formatCurrency(snapshot.totalContributions, "SGD")}
          hint="Employer + employee CPF contributions"
          tone="glass"
        />
        <SummaryTile
          label="OA Mortgage Used"
          value={formatCurrency(snapshot.totalMortgageDeducted, "SGD")}
          hint="CPF deductions applied to OA"
          tone="glass"
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryTile
          label="OA"
          value={formatCurrency(snapshot.balances.oa, "SGD")}
          tone="amber"
        />
        <SummaryTile
          label="SA"
          value={formatCurrency(snapshot.balances.sa, "SGD")}
          tone="emerald"
        />
        <SummaryTile
          label="MA"
          value={formatCurrency(snapshot.balances.ma, "SGD")}
          tone="cyan"
        />
        <SummaryTile
          label="RA"
          value={formatCurrency(snapshot.balances.retirement, "SGD")}
          hint="Uses SA/RA rate after age 55"
          tone="rose"
        />
      </div>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?:
    | "default"
    | "amber"
    | "emerald"
    | "cyan"
    | "rose"
    | "sand"
    | "mint"
    | "sky"
    | "glass";
}) {
  const toneClass =
    tone === "amber"
      ? "border-amber-200/70 bg-amber-50/90"
      : tone === "emerald"
        ? "border-emerald-200/70 bg-emerald-50/90"
        : tone === "cyan"
          ? "border-sky-200/70 bg-sky-50/90"
          : tone === "rose"
            ? "border-rose-200/70 bg-rose-50/90"
            : tone === "sand"
              ? "border-orange-200/70 bg-orange-50/90"
              : tone === "mint"
                ? "border-teal-200/70 bg-teal-50/90"
                : tone === "sky"
                  ? "border-blue-200/70 bg-blue-50/90"
                  : tone === "glass"
                    ? "border-white/70 bg-white/65 backdrop-blur"
                    : "border-slate-200/70 bg-white/85";

  return (
    <div className={`rounded-2xl border p-3 shadow-sm ${toneClass}`}>
      <p className="text-sm text-slate-600">{label}</p>
      <p className="text-lg font-semibold text-slate-950">{value}</p>
      {hint ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
    </div>
  );
}
