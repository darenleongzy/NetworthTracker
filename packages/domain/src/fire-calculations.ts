export interface FireInputs {
  currentAge: number;
  safeWithdrawalRate: number;
  annualGrowthRate: number;
  inflationRate: number;
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

export function calculateFireNumber(
  annualExpenses: number,
  safeWithdrawalRate: number
): number {
  if (safeWithdrawalRate <= 0) return 0;
  return annualExpenses / safeWithdrawalRate;
}

export function calculateMonthlyWithdrawal(
  netWorth: number,
  safeWithdrawalRate: number
): number {
  return (netWorth * safeWithdrawalRate) / 12;
}

export function calculateRealReturnRate(
  nominalRate: number,
  inflationRate: number
): number {
  return (1 + nominalRate) / (1 + inflationRate) - 1;
}

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
    netWorth = netWorth * (1 + realReturnRate);
    netWorth += annualSavings;
    years += 1;
  }

  return years < maxYears ? years : null;
}

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

  projection.push({
    year: 0,
    age: currentAge,
    netWorth: currentNetWorth,
    fireNumber,
  });

  for (let year = 1; year <= yearsToProject; year += 1) {
    netWorth = netWorth * (1 + realReturnRate) + annualSavings;
    projection.push({
      year,
      age: currentAge + year,
      netWorth: Math.max(0, netWorth),
      fireNumber,
    });
  }

  return projection;
}

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

  return {
    fireNumber,
    monthlyWithdrawal,
    gapToFire,
    progressPercent,
    yearsToFire,
    fireAge: yearsToFire === null ? null : inputs.currentAge + yearsToFire,
    incomeGap: monthlyWithdrawal - inputs.annualExpenses / 12,
  };
}
