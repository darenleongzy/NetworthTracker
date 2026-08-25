import { describe, expect, it } from "vitest";
import { getCoupleGoalProgress } from "@/lib/couple-calculations";

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
