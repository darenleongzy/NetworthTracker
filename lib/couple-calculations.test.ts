import { describe, expect, it } from "vitest";
import {
  getCoupleAssetTotal,
  getCoupleContributionPercentages,
  getCoupleGoalProgress,
} from "@/lib/couple-calculations";

describe("getCoupleGoalProgress", () => {
  const breakdown = { cash: 100_000, investments: 250_000, cpf: 90_000, srs: 10_000 };

  it("excludes CPF and SRS when the shared goal does not include retirement balances", () => {
    expect(getCoupleGoalProgress(breakdown, false, 500_000)).toEqual({
      total: 350_000,
      progress: 70,
      remaining: 150_000,
    });
  });

  it("includes CPF and SRS and caps visual progress at 100 percent", () => {
    expect(getCoupleGoalProgress(breakdown, true, 400_000)).toEqual({
      total: 450_000,
      progress: 100,
      remaining: 0,
    });
  });

  it("keeps a zero-value goal in a neutral state", () => {
    expect(getCoupleGoalProgress(breakdown, true, 0)).toEqual({
      total: 450_000,
      progress: 0,
      remaining: 0,
    });
  });
});

describe("couple summary helpers", () => {
  const breakdown = { cash: 100_000, investments: 250_000, cpf: 90_000, srs: 10_000 };

  it("reports both the full and retirement-excluded totals", () => {
    expect(getCoupleAssetTotal(breakdown)).toBe(450_000);
    expect(getCoupleAssetTotal(breakdown, false)).toBe(350_000);
  });

  it("calculates contribution percentages without failing on empty balances", () => {
    expect(getCoupleContributionPercentages(300_000, 100_000)).toEqual({ first: 75, second: 25 });
    expect(getCoupleContributionPercentages(0, 0)).toEqual({ first: 0, second: 0 });
  });
});
