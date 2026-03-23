"use client";

import { getCurrencySymbol } from "@/lib/currencies";
import { TrendingUp, Wallet, BarChart3, TrendingDown, Landmark } from "lucide-react";

function formatWholeNumber(value: number, currencyCode: string = "USD"): string {
  const rounded = Math.round(value);
  const symbol = getCurrencySymbol(currencyCode);
  return `${symbol}${rounded.toLocaleString("en-US")}`;
}

export function SummaryCards({
  totalNetWorth,
  cashTotal,
  investmentValue,
  cpfSrsTotal,
  totalGainLoss,
  baseCurrency = "USD",
}: {
  totalNetWorth: number;
  cashTotal: number;
  investmentValue: number;
  cpfSrsTotal: number;
  totalGainLoss: number;
  baseCurrency?: string;
}) {
  const isGain = totalGainLoss >= 0;
  const currencySymbol = getCurrencySymbol(baseCurrency);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
      {/* Total Net Worth - Purple */}
      <div className="rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 p-6 text-white shadow-lg shadow-purple-500/25 overflow-hidden">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium text-white/90">Total Net Worth</p>
          <div className="rounded-full bg-white/20 p-2 flex-shrink-0">
            <span className="text-sm font-bold">{currencySymbol}</span>
          </div>
        </div>
        <div className="text-center text-[clamp(1.25rem,4vw,1.85rem)] font-bold leading-tight tracking-tight sm:text-left">
          {formatWholeNumber(totalNetWorth, baseCurrency)}
        </div>
      </div>

      {/* Cash - Blue */}
      <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 text-white shadow-lg shadow-blue-500/25 overflow-hidden">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium text-white/90">Cash</p>
          <div className="rounded-full bg-white/20 p-2 flex-shrink-0">
            <Wallet className="h-5 w-5" />
          </div>
        </div>
        <div className="text-center text-[clamp(1.25rem,4vw,1.85rem)] font-bold leading-tight tracking-tight sm:text-left">
          {formatWholeNumber(cashTotal, baseCurrency)}
        </div>
      </div>

      {/* Investments - Amber/Orange */}
      <div className="rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 p-6 text-white shadow-lg shadow-amber-500/25 overflow-hidden">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium text-white/90">Investments</p>
          <div className="rounded-full bg-white/20 p-2 flex-shrink-0">
            <BarChart3 className="h-5 w-5" />
          </div>
        </div>
        <div className="text-center text-[clamp(1.25rem,4vw,1.85rem)] font-bold leading-tight tracking-tight sm:text-left">
          {formatWholeNumber(investmentValue, baseCurrency)}
        </div>
      </div>

      {/* CPF/SRS - Teal/Cyan */}
      <div className="rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 p-6 text-white shadow-lg shadow-teal-500/25 overflow-hidden">
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium text-white/90">CPF/SRS</p>
          <div className="rounded-full bg-white/20 p-2 flex-shrink-0">
            <Landmark className="h-5 w-5" />
          </div>
        </div>
        <div className="text-center text-[clamp(1.25rem,4vw,1.85rem)] font-bold leading-tight tracking-tight sm:text-left">
          {formatWholeNumber(cpfSrsTotal, baseCurrency)}
        </div>
      </div>

      {/* Gain/Loss - Green or Red based on value */}
      <div className={`rounded-xl p-6 text-white shadow-lg overflow-hidden ${
        isGain
          ? "bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25"
          : "bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/25"
      }`}>
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium text-white/90">Total Gain/Loss</p>
          <div className="rounded-full bg-white/20 p-2 flex-shrink-0">
            {isGain ? (
              <TrendingUp className="h-5 w-5" />
            ) : (
              <TrendingDown className="h-5 w-5" />
            )}
          </div>
        </div>
        <div className="text-center text-[clamp(1.25rem,4vw,1.85rem)] font-bold leading-tight tracking-tight sm:text-left">
          {isGain ? "+" : ""}
          {formatWholeNumber(totalGainLoss, baseCurrency)}
        </div>
      </div>
    </div>
  );
}
