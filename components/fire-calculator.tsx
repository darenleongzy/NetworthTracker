"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FireProjectionChart } from "@/components/charts/fire-projection-chart";
import {
  calculateFireMetrics,
  calculateRealReturnRate,
  generateProjection,
} from "@/lib/fire-calculations";
import { getCurrencySymbol } from "@/lib/currencies";
import { Flame, Target, TrendingUp, Clock, Calendar, Wallet } from "lucide-react";

interface FireCalculatorProps {
  netWorthWithCpfSrs: number;
  netWorthWithoutCpfSrs: number;
  averageMonthlyExpenses: number;
  baseCurrency: string;
}

function formatWholeNumber(value: number, currencyCode: string = "USD"): string {
  const rounded = Math.round(value);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rounded);
  } catch {
    const symbol = getCurrencySymbol(currencyCode);
    return `${symbol}${rounded.toLocaleString("en-US")}`;
  }
}

export function FireCalculator({
  netWorthWithCpfSrs,
  netWorthWithoutCpfSrs,
  averageMonthlyExpenses,
  baseCurrency,
}: FireCalculatorProps) {
  const currencySymbol = getCurrencySymbol(baseCurrency);

  // Settings state
  const [currentAge, setCurrentAge] = useState(35);
  const [swr, setSwr] = useState(4);
  const [growthRate, setGrowthRate] = useState(7);
  const [inflationRate, setInflationRate] = useState(3);
  const [includeCpfSrs, setIncludeCpfSrs] = useState(false);

  // Expenses state
  const [expenseMode, setExpenseMode] = useState<"tracked" | "manual">("tracked");
  const [manualExpenses, setManualExpenses] = useState("");

  // Savings state
  const [savingsMode, setSavingsMode] = useState<"auto" | "manual">("manual");
  const [manualSavings, setManualSavings] = useState("");

  // Calculate values
  const currentNetWorth = includeCpfSrs
    ? netWorthWithCpfSrs
    : netWorthWithoutCpfSrs;

  const monthlyExpenses =
    expenseMode === "tracked"
      ? averageMonthlyExpenses
      : parseFloat(manualExpenses) || 0;

  const annualExpenses = monthlyExpenses * 12;

  const monthlySavings =
    savingsMode === "manual" ? parseFloat(manualSavings) || 0 : 0;
  const annualSavings = monthlySavings * 12;

  // Calculate FIRE metrics
  const fireMetrics = useMemo(() => {
    return calculateFireMetrics({
      currentAge,
      safeWithdrawalRate: swr / 100,
      annualGrowthRate: growthRate / 100,
      inflationRate: inflationRate / 100,
      annualExpenses,
      currentNetWorth,
      annualSavings,
    });
  }, [
    currentAge,
    swr,
    growthRate,
    inflationRate,
    annualExpenses,
    currentNetWorth,
    annualSavings,
  ]);

  // Generate projection
  const projection = useMemo(() => {
    const realReturnRate = calculateRealReturnRate(
      growthRate / 100,
      inflationRate / 100
    );
    return generateProjection(
      currentNetWorth,
      fireMetrics.fireNumber,
      annualSavings,
      realReturnRate,
      currentAge,
      40
    );
  }, [
    currentNetWorth,
    fireMetrics.fireNumber,
    annualSavings,
    growthRate,
    inflationRate,
    currentAge,
  ]);

  return (
    <div className="space-y-6">
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Age */}
          <div className="space-y-2">
            <Label htmlFor="age">Current Age</Label>
            <Input
              id="age"
              type="number"
              min={18}
              max={80}
              value={currentAge}
              onChange={(e) => setCurrentAge(parseInt(e.target.value) || 35)}
              className="w-32"
            />
          </div>

          {/* Safe Withdrawal Rate */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Safe Withdrawal Rate</Label>
              <span className="text-sm font-medium">{swr}%</span>
            </div>
            <Slider
              value={[swr]}
              onValueChange={([v]) => setSwr(v)}
              min={2}
              max={6}
              step={0.5}
            />
          </div>

          {/* Annual Growth Rate */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Annual Growth Rate</Label>
              <span className="text-sm font-medium">{growthRate}%</span>
            </div>
            <Slider
              value={[growthRate]}
              onValueChange={([v]) => setGrowthRate(v)}
              min={3}
              max={12}
              step={0.5}
            />
          </div>

          {/* Inflation Rate */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Inflation Rate</Label>
              <span className="text-sm font-medium">{inflationRate}%</span>
            </div>
            <Slider
              value={[inflationRate]}
              onValueChange={([v]) => setInflationRate(v)}
              min={0}
              max={6}
              step={0.5}
            />
          </div>

          {/* Include CPF/SRS Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Include CPF/SRS</Label>
              <p className="text-xs text-muted-foreground">
                Include retirement accounts in net worth calculation
              </p>
            </div>
            <Switch
              checked={includeCpfSrs}
              onCheckedChange={setIncludeCpfSrs}
            />
          </div>
        </CardContent>
      </Card>

      {/* Expenses Card */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={expenseMode}
            onValueChange={(v) => setExpenseMode(v as "tracked" | "manual")}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="tracked" id="tracked" />
              <Label htmlFor="tracked" className="font-normal cursor-pointer">
                From tracked:{" "}
                <span className="font-medium">
                  {formatWholeNumber(averageMonthlyExpenses, baseCurrency)}/mo
                </span>{" "}
                <span className="text-muted-foreground">(avg last 3 months)</span>
              </Label>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual" className="font-normal cursor-pointer">
                  Manual input:
                </Label>
              </div>
              <div className="flex items-center gap-2 ml-6 sm:ml-0">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={manualExpenses}
                    onChange={(e) => setManualExpenses(e.target.value)}
                    onFocus={() => setExpenseMode("manual")}
                    className="w-32 pl-8"
                    placeholder="0"
                  />
                </div>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Savings Card */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Savings (for projection)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup
            value={savingsMode}
            onValueChange={(v) => setSavingsMode(v as "auto" | "manual")}
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="manual" id="savings-manual" />
                <Label htmlFor="savings-manual" className="font-normal cursor-pointer">
                  Manual input:
                </Label>
              </div>
              <div className="flex items-center gap-2 ml-6 sm:ml-0">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {currencySymbol}
                  </span>
                  <Input
                    type="number"
                    min={0}
                    value={manualSavings}
                    onChange={(e) => setManualSavings(e.target.value)}
                    onFocus={() => setSavingsMode("manual")}
                    className="w-32 pl-8"
                    placeholder="0"
                  />
                </div>
                <span className="text-muted-foreground">/month</span>
              </div>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Results Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* FIRE Number */}
        <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-6 text-white shadow-lg shadow-orange-500/25 overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-white/90">FIRE Number</p>
            <div className="rounded-full bg-white/20 p-2 flex-shrink-0">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold truncate">
            {formatWholeNumber(fireMetrics.fireNumber, baseCurrency)}
          </div>
          <p className="mt-1 text-sm text-white/80">
            {swr}% of annual expenses ({Math.round(100 / swr)}x)
          </p>
        </div>

        {/* Current Progress */}
        <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg shadow-purple-500/25 overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-white/90">Current Progress</p>
            <div className="rounded-full bg-white/20 p-2 flex-shrink-0">
              <Target className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold truncate">
            {formatWholeNumber(currentNetWorth, baseCurrency)}
          </div>
          <div className="mt-2">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-white/80">Progress</span>
              <span className="font-medium">
                {fireMetrics.progressPercent.toFixed(1)}%
              </span>
            </div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all"
                style={{ width: `${Math.min(100, fireMetrics.progressPercent)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Monthly SWR Income */}
        <div className={`rounded-xl p-6 text-white shadow-lg overflow-hidden ${
          fireMetrics.incomeGap >= 0
            ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25"
            : "bg-gradient-to-br from-amber-500 to-orange-500 shadow-amber-500/25"
        }`}>
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-white/90">Monthly SWR Income</p>
            <div className="rounded-full bg-white/20 p-2 flex-shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold truncate">
            {formatWholeNumber(fireMetrics.monthlyWithdrawal, baseCurrency)}/mo
          </div>
          <p className="mt-1 text-sm text-white/80">
            vs {formatWholeNumber(monthlyExpenses, baseCurrency)} expenses
          </p>
          <p className="text-sm font-medium">
            Gap: {fireMetrics.incomeGap >= 0 ? "+" : ""}
            {formatWholeNumber(fireMetrics.incomeGap, baseCurrency)}/mo
          </p>
        </div>

        {/* Gap to FIRE */}
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg shadow-blue-500/25 overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-white/90">Gap to FIRE</p>
            <div className="rounded-full bg-white/20 p-2 flex-shrink-0">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold truncate">
            {formatWholeNumber(fireMetrics.gapToFire, baseCurrency)}
          </div>
          <p className="mt-1 text-sm text-white/80">
            needed to reach FIRE
          </p>
        </div>

        {/* Years to FIRE */}
        <div className="rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 p-6 text-white shadow-lg shadow-teal-500/25 overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-white/90">Years to FIRE</p>
            <div className="rounded-full bg-white/20 p-2 flex-shrink-0">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold truncate">
            {fireMetrics.yearsToFire !== null
              ? `${fireMetrics.yearsToFire} years`
              : "N/A"}
          </div>
          <p className="mt-1 text-sm text-white/80">
            at current savings rate
          </p>
        </div>

        {/* FIRE Age */}
        <div className="rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 p-6 text-white shadow-lg shadow-pink-500/25 overflow-hidden">
          <div className="flex items-center justify-between pb-2">
            <p className="text-sm font-medium text-white/90">FIRE Age</p>
            <div className="rounded-full bg-white/20 p-2 flex-shrink-0">
              <Calendar className="h-5 w-5" />
            </div>
          </div>
          <div className="text-2xl lg:text-3xl font-bold truncate">
            {fireMetrics.fireAge !== null
              ? `${fireMetrics.fireAge} years old`
              : "N/A"}
          </div>
          <p className="mt-1 text-sm text-white/80">
            {fireMetrics.yearsToFire !== null
              ? `in ${fireMetrics.yearsToFire} years`
              : "increase savings to calculate"}
          </p>
        </div>
      </div>

      {/* Projection Chart */}
      <FireProjectionChart
        projection={projection}
        fireNumber={fireMetrics.fireNumber}
        yearsToFire={fireMetrics.yearsToFire}
        baseCurrency={baseCurrency}
      />
    </div>
  );
}
