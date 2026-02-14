"use client";

import { formatCurrency, formatPercent } from "@/lib/calculations";
import { getCurrencySymbol } from "@/lib/currencies";
import { DollarSign, TrendingUp, Wallet, BarChart3, TrendingDown } from "lucide-react";

export function SummaryCards({
  totalNetWorth,
  cashTotal,
  investmentValue,
  totalGainLoss,
  gainLossPercent,
  baseCurrency = "USD",
}: {
  totalNetWorth: number;
  cashTotal: number;
  investmentValue: number;
  totalGainLoss: number;
  gainLossPercent: number;
  baseCurrency?: string;
}) {
  const isGain = totalGainLoss >= 0;
  const currencySymbol = getCurrencySymbol(baseCurrency);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Net Worth - Purple */}
      <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg shadow-purple-500/25">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium text-white/90">Total Net Worth</p>
          <div className="rounded-full bg-white/20 p-2">
            <span className="text-sm font-bold">{currencySymbol}</span>
          </div>
        </div>
        <div className="text-3xl font-bold">
          {formatCurrency(totalNetWorth, baseCurrency)}
        </div>
      </div>

      {/* Cash - Blue */}
      <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg shadow-blue-500/25">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium text-white/90">Cash</p>
          <div className="rounded-full bg-white/20 p-2">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div className="text-3xl font-bold">
          {formatCurrency(cashTotal, baseCurrency)}
        </div>
      </div>

      {/* Investments - Amber/Orange */}
      <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-lg shadow-amber-500/25">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium text-white/90">Investments</p>
          <div className="rounded-full bg-white/20 p-2">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>
        <div className="text-3xl font-bold">
          {formatCurrency(investmentValue, baseCurrency)}
        </div>
      </div>

      {/* Gain/Loss - Green or Red based on value */}
      <div className={`rounded-xl p-6 text-white shadow-lg ${
        isGain
          ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25"
          : "bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/25"
      }`}>
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium text-white/90">Total Gain/Loss</p>
          <div className="rounded-full bg-white/20 p-2">
            {isGain ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
          </div>
        </div>
        <div className="text-3xl font-bold">
          {isGain ? "+" : ""}
          {formatCurrency(totalGainLoss, baseCurrency)}
        </div>
        <p className="mt-1 text-sm text-white/80">
          {isGain ? "+" : ""}
          {formatPercent(gainLossPercent)} overall
        </p>
      </div>
    </div>
  );
}
