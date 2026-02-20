/**
 * FIRE (Financial Independence Retire Early) calculation utilities
 */

export interface FireInputs {
  currentAge: number;
  safeWithdrawalRate: number; // e.g., 0.04 for 4%
  annualGrowthRate: number; // e.g., 0.07 for 7%
  inflationRate: number; // e.g., 0.03 for 3%
  annualExpenses: number;
  currentNetWorth: number;
  annualSavings: number;
}

export interface FireResults {
  fireNumber: number;
  monthlyWithdrawal: number;
  gapToFire: number;
  progressPercent: number;
  yearsToFire: number | null;
  fireAge: number | null;
  incomeGap: number;
}

export interface ProjectionPoint {
  year: number;
  age: number;
  netWorth: number;
  fireNumber: number;
}

/**
 * Calculate the FIRE number (target net worth)
 * FIRE Number = Annual Expenses / Safe Withdrawal Rate
 */
export function calculateFireNumber(
  annualExpenses: number,
  safeWithdrawalRate: number
): number {
  if (safeWithdrawalRate <= 0) return 0;
  return annualExpenses / safeWithdrawalRate;
}

/**
 * Calculate monthly withdrawal based on current net worth and SWR
 */
export function calculateMonthlyWithdrawal(
  netWorth: number,
  safeWithdrawalRate: number
): number {
  return (netWorth * safeWithdrawalRate) / 12;
}

/**
 * Calculate real return rate adjusted for inflation
 * Real Return = (1 + nominal) / (1 + inflation) - 1
 */
export function calculateRealReturnRate(
  nominalRate: number,
  inflationRate: number
): number {
  return (1 + nominalRate) / (1 + inflationRate) - 1;
}

/**
 * Calculate years to reach FIRE number
 * Uses iterative calculation accounting for compound growth and annual savings
 * Returns null if FIRE is not achievable with given inputs
 */
export function calculateYearsToFire(
  currentNetWorth: number,
  fireNumber: number,
  annualSavings: number,
  realReturnRate: number,
  maxYears: number = 100
): number | null {
  if (currentNetWorth >= fireNumber) return 0;
  if (annualSavings <= 0 && realReturnRate <= 0) return null;

  let netWorth = currentNetWorth;
  let years = 0;

  while (netWorth < fireNumber && years < maxYears) {
    // Apply growth to existing net worth
    netWorth = netWorth * (1 + realReturnRate);
    // Add annual savings (assumed at end of year)
    netWorth += annualSavings;
    years++;
  }

  return years < maxYears ? years : null;
}

/**
 * Generate a projection of net worth over time
 */
export function generateProjection(
  currentNetWorth: number,
  fireNumber: number,
  annualSavings: number,
  realReturnRate: number,
  currentAge: number,
  yearsToProject: number = 40
): ProjectionPoint[] {
  const projection: ProjectionPoint[] = [];
  let netWorth = currentNetWorth;

  // Add starting point
  projection.push({
    year: 0,
    age: currentAge,
    netWorth: currentNetWorth,
    fireNumber: fireNumber,
  });

  for (let year = 1; year <= yearsToProject; year++) {
    netWorth = netWorth * (1 + realReturnRate) + annualSavings;
    projection.push({
      year,
      age: currentAge + year,
      netWorth: Math.max(0, netWorth),
      fireNumber: fireNumber,
    });
  }

  return projection;
}

/**
 * Calculate all FIRE metrics at once
 */
export function calculateFireMetrics(inputs: FireInputs): FireResults {
  const realReturnRate = calculateRealReturnRate(
    inputs.annualGrowthRate,
    inputs.inflationRate
  );

  const fireNumber = calculateFireNumber(
    inputs.annualExpenses,
    inputs.safeWithdrawalRate
  );

  const monthlyWithdrawal = calculateMonthlyWithdrawal(
    inputs.currentNetWorth,
    inputs.safeWithdrawalRate
  );

  const gapToFire = Math.max(0, fireNumber - inputs.currentNetWorth);

  const progressPercent =
    fireNumber > 0
      ? Math.min(100, (inputs.currentNetWorth / fireNumber) * 100)
      : 0;

  const yearsToFire = calculateYearsToFire(
    inputs.currentNetWorth,
    fireNumber,
    inputs.annualSavings,
    realReturnRate
  );

  const fireAge =
    yearsToFire !== null ? inputs.currentAge + yearsToFire : null;

  const monthlyExpenses = inputs.annualExpenses / 12;
  const incomeGap = monthlyWithdrawal - monthlyExpenses;

  return {
    fireNumber,
    monthlyWithdrawal,
    gapToFire,
    progressPercent,
    yearsToFire,
    fireAge,
    incomeGap,
  };
}
