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
      <div
        className="dashboard-summary-card dashboard-summary-card--net-worth"
        data-testid="net-worth-card"
      >
        <div className="flex items-center justify-between pb-2">
          <p className="text-sm font-medium text-white/90">Total Net Worth</p>
          <div className="rounded-full bg-white/20 p-2 flex-shrink-0">
            <span className="text-sm font-bold">{currencySymbol}</span>
          </div>
        </div>
        <div
          className="text-center text-[clamp(1.25rem,4vw,1.85rem)] font-bold leading-tight tracking-tight sm:text-left"
          data-testid="net-worth"
        >
          {formatWholeNumber(totalNetWorth, baseCurrency)}
        </div>
      </div>

      {/* Cash - Blue */}
      <div className="dashboard-summary-card dashboard-summary-card--cash">
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
      <div className="dashboard-summary-card dashboard-summary-card--investments">
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
      <div className="dashboard-summary-card dashboard-summary-card--retirement">
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
      <div className={`dashboard-summary-card ${
        isGain
          ? "dashboard-summary-card--gain"
          : "dashboard-summary-card--loss"
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
