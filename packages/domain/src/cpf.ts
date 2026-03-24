import type { CashHolding } from "./types";

export const CPF_ORDINARY_WAGE_CEILING = 8000;
export const CPF_DEFAULT_PROJECTION_YEARS = 7;
export const CPF_2026_BASIC_HEALTHCARE_SUM_UNDER_65 = 79000;

type ContributionBand = {
  label: string;
  totalRate: number;
  employeeRate: number;
  employerRate: number;
  lowWageBaseRate: number;
  taperRate: number;
};

type AllocationBand = {
  label: string;
  oaRatio: number;
  middleRatio: number;
  maRatio: number;
  middleAccount: "SA" | "RA";
};

export interface CpfBalances {
  oa: number;
  sa: number;
  ma: number;
  retirement: number;
}

export interface CpfMonthlyContributionBreakdown {
  age: number;
  contributionBandLabel: string;
  allocationBandLabel: string;
  middleAccountLabel: "SA" | "RA";
  monthlySalary: number;
  salaryUsedForCpf: number;
  employeeContribution: number;
  employerContribution: number;
  totalContribution: number;
  oaContribution: number;
  middleContribution: number;
  maContribution: number;
}

export interface CpfProjectionSettingsInput {
  currentAge: number;
  monthlySalary: number;
  oaInterestRate: number;
  saInterestRate: number;
  maInterestRate: number;
  frsMetForMaOverflow: boolean;
  mortgageMonthlyDeduction: number;
  mortgagePayoffAge: number | null;
  earlyRetirementAge: number;
}

export interface CpfProjectionSnapshot {
  monthsProjected: number;
  ageAtEnd: number;
  balances: CpfBalances;
  totalBalance: number;
  totalContributions: number;
  totalInterestEarned: number;
  totalMortgageDeducted: number;
}

export interface CpfProjectionSummary {
  currentBreakdown: CpfMonthlyContributionBreakdown;
  sevenYearProjection: CpfProjectionSnapshot;
  earlyRetirementProjection: CpfProjectionSnapshot;
}

const CONTRIBUTION_BANDS: ContributionBand[] = [
  { label: "55 and below", totalRate: 0.37, employeeRate: 0.2, employerRate: 0.17, lowWageBaseRate: 0.17, taperRate: 0.6 },
  { label: "Above 55 to 60", totalRate: 0.34, employeeRate: 0.18, employerRate: 0.16, lowWageBaseRate: 0.16, taperRate: 0.54 },
  { label: "Above 60 to 65", totalRate: 0.25, employeeRate: 0.125, employerRate: 0.125, lowWageBaseRate: 0.125, taperRate: 0.375 },
  { label: "Above 65 to 70", totalRate: 0.165, employeeRate: 0.075, employerRate: 0.09, lowWageBaseRate: 0.09, taperRate: 0.225 },
  { label: "Above 70", totalRate: 0.125, employeeRate: 0.05, employerRate: 0.075, lowWageBaseRate: 0.075, taperRate: 0.15 },
];

const ALLOCATION_BANDS: AllocationBand[] = [
  { label: "35 and below", oaRatio: 0.6217, middleRatio: 0.1621, maRatio: 0.2162, middleAccount: "SA" },
  { label: "Above 35 to 45", oaRatio: 0.5677, middleRatio: 0.1891, maRatio: 0.2432, middleAccount: "SA" },
  { label: "Above 45 to 50", oaRatio: 0.5136, middleRatio: 0.2162, maRatio: 0.2702, middleAccount: "SA" },
  { label: "Above 50 to 55", oaRatio: 0.4055, middleRatio: 0.3108, maRatio: 0.2837, middleAccount: "SA" },
  { label: "Above 55 to 60", oaRatio: 0.353, middleRatio: 0.3382, maRatio: 0.3088, middleAccount: "RA" },
  { label: "Above 60 to 65", oaRatio: 0.14, middleRatio: 0.44, maRatio: 0.42, middleAccount: "RA" },
  { label: "Above 65 to 70", oaRatio: 0.0607, middleRatio: 0.303, maRatio: 0.6363, middleAccount: "RA" },
  { label: "Above 70", oaRatio: 0.08, middleRatio: 0.08, maRatio: 0.84, middleAccount: "RA" },
];

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function roundCpfTotal(value: number): number {
  return Math.round(value);
}

function clampNonNegative(value: number): number {
  return Number.isFinite(value) ? Math.max(0, value) : 0;
}

function getContributionBand(age: number): ContributionBand {
  if (age <= 55) return CONTRIBUTION_BANDS[0];
  if (age <= 60) return CONTRIBUTION_BANDS[1];
  if (age <= 65) return CONTRIBUTION_BANDS[2];
  if (age <= 70) return CONTRIBUTION_BANDS[3];
  return CONTRIBUTION_BANDS[4];
}

function getAllocationBand(age: number): AllocationBand {
  if (age <= 35) return ALLOCATION_BANDS[0];
  if (age <= 45) return ALLOCATION_BANDS[1];
  if (age <= 50) return ALLOCATION_BANDS[2];
  if (age <= 55) return ALLOCATION_BANDS[3];
  if (age <= 60) return ALLOCATION_BANDS[4];
  if (age <= 65) return ALLOCATION_BANDS[5];
  if (age <= 70) return ALLOCATION_BANDS[6];
  return ALLOCATION_BANDS[7];
}

function initializeProjectionBalances(
  balances: CpfBalances,
  currentAge: number
): CpfBalances {
  if (currentAge < 55) return { ...balances };
  return {
    oa: balances.oa,
    sa: 0,
    ma: balances.ma,
    retirement: balances.retirement + balances.sa,
  };
}

export function getEffectiveBasicHealthcareSum(age: number): number {
  if (age < 65) return CPF_2026_BASIC_HEALTHCARE_SUM_UNDER_65;
  return CPF_2026_BASIC_HEALTHCARE_SUM_UNDER_65;
}

export function getMaOverflowDestination(
  age: number,
  frsMetForMaOverflow: boolean
): "SA" | "RA" | "OA" {
  if (age < 55) return "SA";
  return frsMetForMaOverflow ? "OA" : "RA";
}

export function getCpfBalancesFromHoldings(holdings: CashHolding[]): CpfBalances {
  return holdings.reduce<CpfBalances>(
    (balances, holding) => {
      const amount = clampNonNegative(Number(holding.balance));
      if (holding.label === "OA") balances.oa += amount;
      if (holding.label === "SA") balances.sa += amount;
      if (holding.label === "MA") balances.ma += amount;
      return balances;
    },
    { oa: 0, sa: 0, ma: 0, retirement: 0 }
  );
}

export function calculateCpfMonthlyContribution(
  age: number,
  monthlySalary: number
): CpfMonthlyContributionBreakdown {
  const contributionBand = getContributionBand(age);
  const allocationBand = getAllocationBand(age);
  const monthlyWage = clampNonNegative(monthlySalary);
  const salaryUsedForCpf = Math.min(monthlyWage, CPF_ORDINARY_WAGE_CEILING);

  let totalContribution = 0;
  let employeeContribution = 0;

  if (salaryUsedForCpf <= 50) {
    totalContribution = 0;
  } else if (salaryUsedForCpf <= 500) {
    totalContribution = roundCpfTotal(
      salaryUsedForCpf * contributionBand.lowWageBaseRate
    );
  } else if (salaryUsedForCpf <= 750) {
    totalContribution = roundCpfTotal(
      salaryUsedForCpf * contributionBand.lowWageBaseRate +
        contributionBand.taperRate * (salaryUsedForCpf - 500)
    );
    employeeContribution = Math.floor(
      contributionBand.taperRate * (salaryUsedForCpf - 500)
    );
  } else {
    totalContribution = roundCpfTotal(
      salaryUsedForCpf * contributionBand.totalRate
    );
    employeeContribution = Math.floor(
      salaryUsedForCpf * contributionBand.employeeRate
    );
  }

  const employerContribution = totalContribution - employeeContribution;
  const maContribution = roundCurrency(totalContribution * allocationBand.maRatio);
  const middleContribution = roundCurrency(
    totalContribution * allocationBand.middleRatio
  );
  const oaContribution = roundCurrency(
    totalContribution - maContribution - middleContribution
  );

  return {
    age,
    contributionBandLabel: contributionBand.label,
    allocationBandLabel: allocationBand.label,
    middleAccountLabel: allocationBand.middleAccount,
    monthlySalary: monthlyWage,
    salaryUsedForCpf,
    employeeContribution,
    employerContribution,
    totalContribution,
    oaContribution,
    middleContribution,
    maContribution,
  };
}

export function projectCpfBalances(
  startingBalances: CpfBalances,
  settings: CpfProjectionSettingsInput,
  monthsProjected: number
): CpfProjectionSnapshot {
  const balances = initializeProjectionBalances(
    {
      oa: clampNonNegative(startingBalances.oa),
      sa: clampNonNegative(startingBalances.sa),
      ma: clampNonNegative(startingBalances.ma),
      retirement: clampNonNegative(startingBalances.retirement),
    },
    settings.currentAge
  );

  let totalContributions = 0;
  let totalMortgageDeducted = 0;
  let transferredToRetirement = settings.currentAge >= 55;
  const openingTotal =
    balances.oa + balances.sa + balances.ma + balances.retirement;

  for (let month = 0; month < monthsProjected; month += 1) {
    const age = settings.currentAge + month / 12;

    if (age >= 55 && !transferredToRetirement) {
      balances.retirement = roundCurrency(balances.retirement + balances.sa);
      balances.sa = 0;
      transferredToRetirement = true;
    }

    const contribution = calculateCpfMonthlyContribution(age, settings.monthlySalary);
    const effectiveBhs = getEffectiveBasicHealthcareSum(age);
    const maHeadroom = Math.max(0, effectiveBhs - balances.ma);
    const maContributionApplied = Math.min(contribution.maContribution, maHeadroom);
    const maOverflow = roundCurrency(contribution.maContribution - maContributionApplied);
    const maOverflowDestination = getMaOverflowDestination(
      age,
      settings.frsMetForMaOverflow
    );

    balances.oa = roundCurrency(balances.oa + contribution.oaContribution);
    if (contribution.middleAccountLabel === "SA" && !transferredToRetirement) {
      balances.sa = roundCurrency(balances.sa + contribution.middleContribution);
    } else {
      balances.retirement = roundCurrency(
        balances.retirement + contribution.middleContribution
      );
    }
    balances.ma = roundCurrency(balances.ma + maContributionApplied);

    if (maOverflow > 0) {
      if (maOverflowDestination === "SA" && !transferredToRetirement) {
        balances.sa = roundCurrency(balances.sa + maOverflow);
      } else if (maOverflowDestination === "OA") {
        balances.oa = roundCurrency(balances.oa + maOverflow);
      } else {
        balances.retirement = roundCurrency(balances.retirement + maOverflow);
      }
    }

    totalContributions += contribution.totalContribution;

    const mortgageIsActive =
      settings.mortgageMonthlyDeduction > 0 &&
      (settings.mortgagePayoffAge === null || age < settings.mortgagePayoffAge);

    if (mortgageIsActive) {
      const deduction = Math.min(
        balances.oa,
        clampNonNegative(settings.mortgageMonthlyDeduction)
      );
      balances.oa = roundCurrency(balances.oa - deduction);
      totalMortgageDeducted += deduction;
    }

    balances.oa = roundCurrency(
      balances.oa * (1 + clampNonNegative(settings.oaInterestRate) / 100 / 12)
    );
    balances.sa = roundCurrency(
      balances.sa * (1 + clampNonNegative(settings.saInterestRate) / 100 / 12)
    );
    balances.ma = roundCurrency(
      balances.ma * (1 + clampNonNegative(settings.maInterestRate) / 100 / 12)
    );
    balances.retirement = roundCurrency(
      balances.retirement * (1 + clampNonNegative(settings.saInterestRate) / 100 / 12)
    );
  }

  const totalBalance =
    balances.oa + balances.sa + balances.ma + balances.retirement;

  return {
    monthsProjected,
    ageAtEnd: roundCurrency(settings.currentAge + monthsProjected / 12),
    balances,
    totalBalance: roundCurrency(totalBalance),
    totalContributions: roundCurrency(totalContributions),
    totalInterestEarned: roundCurrency(
      totalBalance - openingTotal - totalContributions + totalMortgageDeducted
    ),
    totalMortgageDeducted: roundCurrency(totalMortgageDeducted),
  };
}

export function buildCpfProjectionSummary(
  holdings: CashHolding[],
  settings: CpfProjectionSettingsInput,
  projectionYears: number = CPF_DEFAULT_PROJECTION_YEARS
): CpfProjectionSummary {
  const startingBalances = getCpfBalancesFromHoldings(holdings);
  const currentBreakdown = calculateCpfMonthlyContribution(
    settings.currentAge,
    settings.monthlySalary
  );
  const sevenYearProjection = projectCpfBalances(
    startingBalances,
    settings,
    Math.max(1, Math.round(projectionYears)) * 12
  );
  const earlyRetirementMonths = Math.max(
    0,
    Math.round((settings.earlyRetirementAge - settings.currentAge) * 12)
  );

  return {
    currentBreakdown,
    sevenYearProjection,
    earlyRetirementProjection: projectCpfBalances(
      startingBalances,
      settings,
      earlyRetirementMonths
    ),
  };
}
