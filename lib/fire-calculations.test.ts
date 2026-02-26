import { describe, it, expect } from "vitest";
import {
  calculateFireNumber,
  calculateMonthlyWithdrawal,
  calculateRealReturnRate,
  calculateYearsToFire,
  generateProjection,
  calculateFireMetrics,
} from "./fire-calculations";

describe("calculateFireNumber", () => {
  it("calculates FIRE number with 4% SWR", () => {
    // 50,000 annual expenses / 0.04 SWR = 1,250,000
    expect(calculateFireNumber(50000, 0.04)).toBe(1250000);
  });

  it("calculates FIRE number with 3% SWR", () => {
    // 50,000 / 0.03 = 1,666,666.67
    expect(calculateFireNumber(50000, 0.03)).toBeCloseTo(1666666.67, 2);
  });

  it("returns 0 when SWR is 0", () => {
    expect(calculateFireNumber(50000, 0)).toBe(0);
  });

  it("returns 0 when SWR is negative", () => {
    expect(calculateFireNumber(50000, -0.04)).toBe(0);
  });

  it("handles zero expenses", () => {
    expect(calculateFireNumber(0, 0.04)).toBe(0);
  });
});

describe("calculateMonthlyWithdrawal", () => {
  it("calculates monthly withdrawal correctly", () => {
    // 1,000,000 net worth * 0.04 SWR / 12 = 3,333.33
    expect(calculateMonthlyWithdrawal(1000000, 0.04)).toBeCloseTo(3333.33, 2);
  });

  it("returns 0 for zero net worth", () => {
    expect(calculateMonthlyWithdrawal(0, 0.04)).toBe(0);
  });

  it("handles high SWR", () => {
    // 1,000,000 * 0.05 / 12 = 4,166.67
    expect(calculateMonthlyWithdrawal(1000000, 0.05)).toBeCloseTo(4166.67, 2);
  });
});

describe("calculateRealReturnRate", () => {
  it("calculates real return rate correctly", () => {
    // (1 + 0.07) / (1 + 0.03) - 1 = 0.0388...
    const realReturn = calculateRealReturnRate(0.07, 0.03);
    expect(realReturn).toBeCloseTo(0.0388, 4);
  });

  it("returns negative when inflation exceeds growth", () => {
    // (1 + 0.02) / (1 + 0.05) - 1 = -0.0286...
    const realReturn = calculateRealReturnRate(0.02, 0.05);
    expect(realReturn).toBeLessThan(0);
  });

  it("returns nominal rate when inflation is 0", () => {
    const realReturn = calculateRealReturnRate(0.07, 0);
    expect(realReturn).toBeCloseTo(0.07, 10);
  });

  it("handles zero growth rate", () => {
    // (1 + 0) / (1 + 0.03) - 1 = -0.0291...
    const realReturn = calculateRealReturnRate(0, 0.03);
    expect(realReturn).toBeLessThan(0);
  });
});

describe("calculateYearsToFire", () => {
  it("returns 0 when already at FIRE", () => {
    expect(calculateYearsToFire(1000000, 1000000, 10000, 0.04)).toBe(0);
  });

  it("returns 0 when above FIRE number", () => {
    expect(calculateYearsToFire(1500000, 1000000, 10000, 0.04)).toBe(0);
  });

  it("calculates years to FIRE with savings only", () => {
    // Start: 0, FIRE: 100000, Save: 10000/year, 0% return
    // Should take 10 years
    const years = calculateYearsToFire(0, 100000, 10000, 0);
    expect(years).toBe(10);
  });

  it("calculates years to FIRE with compound growth", () => {
    // With compound growth, should reach faster
    const years = calculateYearsToFire(100000, 500000, 20000, 0.05);
    expect(years).toBeGreaterThan(0);
    expect(years).toBeLessThan(20);
  });

  it("returns null when FIRE is unreachable", () => {
    // No savings, no growth, can never reach FIRE
    expect(calculateYearsToFire(100000, 1000000, 0, 0)).toBeNull();
  });

  it("returns null when negative growth erodes savings", () => {
    // Negative return, minimal savings
    const years = calculateYearsToFire(100000, 10000000, 1000, -0.1);
    expect(years).toBeNull();
  });

  it("respects maxYears parameter", () => {
    const years = calculateYearsToFire(0, 1000000, 1000, 0.01, 50);
    expect(years).toBeNull(); // Would take more than 50 years
  });
});

describe("generateProjection", () => {
  it("generates correct number of points", () => {
    const projection = generateProjection(100000, 500000, 10000, 0.04, 30, 20);
    // 20 years + starting point = 21 points
    expect(projection).toHaveLength(21);
  });

  it("includes starting point at year 0", () => {
    const projection = generateProjection(100000, 500000, 10000, 0.04, 30);
    expect(projection[0].year).toBe(0);
    expect(projection[0].netWorth).toBe(100000);
    expect(projection[0].age).toBe(30);
  });

  it("applies compound growth and savings correctly", () => {
    const projection = generateProjection(100000, 500000, 10000, 0.05, 30, 2);
    // Year 1: 100000 * 1.05 + 10000 = 115000
    expect(projection[1].netWorth).toBeCloseTo(115000, 0);
    // Year 2: 115000 * 1.05 + 10000 = 130750
    expect(projection[2].netWorth).toBeCloseTo(130750, 0);
  });

  it("increments age correctly", () => {
    const projection = generateProjection(100000, 500000, 10000, 0.04, 30, 10);
    expect(projection[5].age).toBe(35);
    expect(projection[10].age).toBe(40);
  });

  it("keeps FIRE number constant", () => {
    const projection = generateProjection(100000, 500000, 10000, 0.04, 30);
    projection.forEach((point) => {
      expect(point.fireNumber).toBe(500000);
    });
  });

  it("ensures net worth is never negative", () => {
    // Start with negative situation
    const projection = generateProjection(1000, 500000, -2000, -0.1, 30, 10);
    projection.forEach((point) => {
      expect(point.netWorth).toBeGreaterThanOrEqual(0);
    });
  });
});

describe("calculateFireMetrics", () => {
  const baseInputs = {
    currentAge: 30,
    safeWithdrawalRate: 0.04,
    annualGrowthRate: 0.07,
    inflationRate: 0.03,
    annualExpenses: 50000,
    currentNetWorth: 500000,
    annualSavings: 30000,
  };

  it("calculates fire number correctly", () => {
    const result = calculateFireMetrics(baseInputs);
    // 50000 / 0.04 = 1,250,000
    expect(result.fireNumber).toBe(1250000);
  });

  it("calculates monthly withdrawal correctly", () => {
    const result = calculateFireMetrics(baseInputs);
    // 500000 * 0.04 / 12 = 1,666.67
    expect(result.monthlyWithdrawal).toBeCloseTo(1666.67, 2);
  });

  it("calculates gap to FIRE", () => {
    const result = calculateFireMetrics(baseInputs);
    // 1,250,000 - 500,000 = 750,000
    expect(result.gapToFire).toBe(750000);
  });

  it("calculates progress percent", () => {
    const result = calculateFireMetrics(baseInputs);
    // 500000 / 1250000 * 100 = 40%
    expect(result.progressPercent).toBe(40);
  });

  it("caps progress at 100%", () => {
    const result = calculateFireMetrics({
      ...baseInputs,
      currentNetWorth: 2000000, // Above FIRE number
    });
    expect(result.progressPercent).toBe(100);
  });

  it("calculates years to FIRE", () => {
    const result = calculateFireMetrics(baseInputs);
    expect(result.yearsToFire).toBeGreaterThan(0);
    expect(result.yearsToFire).toBeLessThan(30);
  });

  it("calculates FIRE age", () => {
    const result = calculateFireMetrics(baseInputs);
    if (result.yearsToFire !== null) {
      expect(result.fireAge).toBe(30 + result.yearsToFire);
    }
  });

  it("calculates income gap correctly", () => {
    const result = calculateFireMetrics(baseInputs);
    // monthlyWithdrawal - monthlyExpenses
    const monthlyExpenses = 50000 / 12;
    expect(result.incomeGap).toBeCloseTo(result.monthlyWithdrawal - monthlyExpenses, 2);
  });

  it("returns null FIRE age when unreachable", () => {
    const result = calculateFireMetrics({
      ...baseInputs,
      annualSavings: 0,
      annualGrowthRate: 0.03, // Same as inflation
    });
    expect(result.fireAge).toBeNull();
  });

  it("returns 0 progress when fire number is 0 (SWR is 0)", () => {
    const result = calculateFireMetrics({
      ...baseInputs,
      safeWithdrawalRate: 0, // This makes fireNumber = 0
    });
    expect(result.fireNumber).toBe(0);
    expect(result.progressPercent).toBe(0);
  });
});
