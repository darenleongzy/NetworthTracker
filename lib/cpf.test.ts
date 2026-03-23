import { describe, expect, it } from "vitest";
import {
  CPF_DEFAULT_PROJECTION_YEARS,
  CPF_2026_BASIC_HEALTHCARE_SUM_UNDER_65,
  CPF_ORDINARY_WAGE_CEILING,
  buildCpfProjectionSummary,
  calculateCpfMonthlyContribution,
  getEffectiveBasicHealthcareSum,
  getMaOverflowDestination,
  getCpfBalancesFromHoldings,
  projectCpfBalances,
} from "./cpf";
import type { CashHolding } from "@/lib/types";

describe("getCpfBalancesFromHoldings", () => {
  it("extracts OA, SA, and MA balances from holdings", () => {
    const holdings: CashHolding[] = [
      { id: "1", account_id: "a1", balance: 1000, currency: "SGD", label: "OA", updated_at: "" },
      { id: "2", account_id: "a1", balance: 2000, currency: "SGD", label: "SA", updated_at: "" },
      { id: "3", account_id: "a1", balance: 3000, currency: "SGD", label: "MA", updated_at: "" },
      { id: "4", account_id: "a1", balance: 999, currency: "SGD", label: "Other", updated_at: "" },
    ];

    expect(getCpfBalancesFromHoldings(holdings)).toEqual({
      oa: 1000,
      sa: 2000,
      ma: 3000,
      retirement: 0,
    });
  });
});

describe("calculateCpfMonthlyContribution", () => {
  it("caps salary at the 2026 OW ceiling and allocates contributions for members 35 and below", () => {
    const result = calculateCpfMonthlyContribution(30, 9000);

    expect(result.salaryUsedForCpf).toBe(CPF_ORDINARY_WAGE_CEILING);
    expect(result.totalContribution).toBe(2960);
    expect(result.employeeContribution).toBe(1600);
    expect(result.employerContribution).toBe(1360);
    expect(result.middleAccountLabel).toBe("SA");
    expect(result.oaContribution).toBeCloseTo(1840.23, 2);
    expect(result.middleContribution).toBeCloseTo(479.82, 2);
    expect(result.maContribution).toBeCloseTo(639.95, 2);
  });

  it("uses tapered low-wage contributions below $750", () => {
    const result = calculateCpfMonthlyContribution(40, 600);

    expect(result.totalContribution).toBe(162);
    expect(result.employeeContribution).toBe(60);
    expect(result.employerContribution).toBe(102);
  });

  it("switches the middle allocation to RA after 55", () => {
    const result = calculateCpfMonthlyContribution(58, 8000);

    expect(result.totalContribution).toBe(2720);
    expect(result.employeeContribution).toBe(1440);
    expect(result.employerContribution).toBe(1280);
    expect(result.middleAccountLabel).toBe("RA");
    expect(result.oaContribution).toBeCloseTo(960.16, 2);
    expect(result.middleContribution).toBeCloseTo(919.9, 2);
    expect(result.maContribution).toBeCloseTo(839.94, 2);
  });
});

describe("projectCpfBalances", () => {
  it("transfers SA to retirement savings after age 55", () => {
    const projection = projectCpfBalances(
      { oa: 0, sa: 1000, ma: 0, retirement: 0 },
      {
        currentAge: 54,
        monthlySalary: 0,
        oaInterestRate: 0,
        saInterestRate: 0,
        maInterestRate: 0,
        frsMetForMaOverflow: false,
        mortgageMonthlyDeduction: 0,
        mortgagePayoffAge: null,
        earlyRetirementAge: 60,
      },
      24
    );

    expect(projection.balances.sa).toBe(0);
    expect(projection.balances.retirement).toBe(1000);
  });

  it("applies monthly mortgage deductions against OA without going negative", () => {
    const projection = projectCpfBalances(
      { oa: 250, sa: 0, ma: 0, retirement: 0 },
      {
        currentAge: 40,
        monthlySalary: 0,
        oaInterestRate: 0,
        saInterestRate: 0,
        maInterestRate: 0,
        frsMetForMaOverflow: false,
        mortgageMonthlyDeduction: 100,
        mortgagePayoffAge: 45,
        earlyRetirementAge: 50,
      },
      3
    );

    expect(projection.balances.oa).toBe(0);
    expect(projection.totalMortgageDeducted).toBe(250);
  });

  it("caps MA at BHS and redirects overflow to SA below age 55", () => {
    const projection = projectCpfBalances(
      {
        oa: 0,
        sa: 1000,
        ma: CPF_2026_BASIC_HEALTHCARE_SUM_UNDER_65 - 100,
        retirement: 0,
      },
      {
        currentAge: 40,
        monthlySalary: 8000,
        oaInterestRate: 0,
        saInterestRate: 0,
        maInterestRate: 0,
        frsMetForMaOverflow: false,
        mortgageMonthlyDeduction: 0,
        mortgagePayoffAge: null,
        earlyRetirementAge: 50,
      },
      1
    );

    expect(projection.balances.ma).toBe(CPF_2026_BASIC_HEALTHCARE_SUM_UNDER_65);
    expect(projection.balances.sa).toBeGreaterThan(1000);
  });

  it("redirects MA overflow to RA for members 55 and above when FRS is not met", () => {
    const projection = projectCpfBalances(
      {
        oa: 0,
        sa: 0,
        ma: CPF_2026_BASIC_HEALTHCARE_SUM_UNDER_65 - 100,
        retirement: 0,
      },
      {
        currentAge: 56,
        monthlySalary: 8000,
        oaInterestRate: 0,
        saInterestRate: 0,
        maInterestRate: 0,
        frsMetForMaOverflow: false,
        mortgageMonthlyDeduction: 0,
        mortgagePayoffAge: null,
        earlyRetirementAge: 60,
      },
      1
    );

    expect(projection.balances.ma).toBe(CPF_2026_BASIC_HEALTHCARE_SUM_UNDER_65);
    expect(projection.balances.retirement).toBeGreaterThan(0);
  });

  it("redirects MA overflow to OA for members 55 and above when FRS is met", () => {
    const projection = projectCpfBalances(
      {
        oa: 0,
        sa: 0,
        ma: CPF_2026_BASIC_HEALTHCARE_SUM_UNDER_65 - 100,
        retirement: 0,
      },
      {
        currentAge: 56,
        monthlySalary: 8000,
        oaInterestRate: 0,
        saInterestRate: 0,
        maInterestRate: 0,
        frsMetForMaOverflow: true,
        mortgageMonthlyDeduction: 0,
        mortgagePayoffAge: null,
        earlyRetirementAge: 60,
      },
      1
    );

    expect(projection.balances.ma).toBe(CPF_2026_BASIC_HEALTHCARE_SUM_UNDER_65);
    expect(projection.balances.oa).toBeGreaterThan(0);
  });
});

describe("buildCpfProjectionSummary", () => {
  it("builds both the seven-year and early-retirement projections", () => {
    const holdings: CashHolding[] = [
      { id: "1", account_id: "a1", balance: 5000, currency: "SGD", label: "OA", updated_at: "" },
      { id: "2", account_id: "a1", balance: 4000, currency: "SGD", label: "SA", updated_at: "" },
      { id: "3", account_id: "a1", balance: 3000, currency: "SGD", label: "MA", updated_at: "" },
    ];

    const summary = buildCpfProjectionSummary(
      holdings,
      {
        currentAge: 40,
        monthlySalary: 0,
        oaInterestRate: 0,
        saInterestRate: 0,
        maInterestRate: 0,
        frsMetForMaOverflow: false,
        mortgageMonthlyDeduction: 0,
        mortgagePayoffAge: null,
        earlyRetirementAge: 45,
      },
      CPF_DEFAULT_PROJECTION_YEARS
    );

    expect(summary.sevenYearProjection.monthsProjected).toBe(
      CPF_DEFAULT_PROJECTION_YEARS * 12
    );
    expect(summary.earlyRetirementProjection.monthsProjected).toBe(60);
    expect(summary.sevenYearProjection.totalBalance).toBe(12000);
  });
});

describe("BHS helpers", () => {
  it("returns the 2026 BHS for members below 65", () => {
    expect(getEffectiveBasicHealthcareSum(40)).toBe(
      CPF_2026_BASIC_HEALTHCARE_SUM_UNDER_65
    );
  });

  it("routes MA overflow to the correct destination", () => {
    expect(getMaOverflowDestination(40, false)).toBe("SA");
    expect(getMaOverflowDestination(56, false)).toBe("RA");
    expect(getMaOverflowDestination(56, true)).toBe("OA");
  });
});
