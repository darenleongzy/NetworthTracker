import { calculateCashTotal, calculateInvestmentValue } from "@/lib/calculations";
import type { ExchangeRates } from "@/lib/exchange-rates";
import type { StockPriceData } from "@/lib/stock-api";
import type { AccountWithHoldings, CoupleAssetBreakdown } from "@/lib/types";

export function calculateCoupleAssetBreakdown(
  accounts: AccountWithHoldings[],
  baseCurrency: string,
  exchangeRates: ExchangeRates,
  stockPrices: Record<string, StockPriceData>
): CoupleAssetBreakdown {
  const accountsOfType = (type: AccountWithHoldings["type"]) =>
    accounts.filter((account) => account.type === type);
  const cashValue = (type: AccountWithHoldings["type"]) =>
    calculateCashTotal(
      accountsOfType(type).flatMap((account) => account.cash_holdings),
      baseCurrency,
      exchangeRates
    );

  return {
    cash: cashValue("cash"),
    investments: calculateInvestmentValue(
      accountsOfType("investment").flatMap((account) => account.stock_holdings),
      stockPrices,
      baseCurrency,
      exchangeRates
    ),
    cpf: cashValue("cpf"),
    srs: cashValue("srs"),
  };
}

export function getCoupleGoalProgress(
  breakdown: CoupleAssetBreakdown,
  includeCpf: boolean,
  goalAmount: number
) {
  const total =
    breakdown.cash +
    breakdown.investments +
    (includeCpf ? breakdown.cpf + breakdown.srs : 0);
  const progress = goalAmount > 0 ? Math.min((total / goalAmount) * 100, 100) : 0;

  return { total, progress, remaining: Math.max(goalAmount - total, 0) };
}

export function getCoupleAssetTotal(breakdown: CoupleAssetBreakdown, includeCpf = true) {
  return (
    breakdown.cash +
    breakdown.investments +
    (includeCpf ? breakdown.cpf + breakdown.srs : 0)
  );
}

export function getCoupleContributionPercentages(
  firstContribution: number,
  secondContribution: number
) {
  const total = firstContribution + secondContribution;
  if (total <= 0) return { first: 0, second: 0 };

  return {
    first: (firstContribution / total) * 100,
    second: (secondContribution / total) * 100,
  };
}
