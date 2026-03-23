import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, screen } from "@testing-library/react";
import { render } from "@/tests/utils/render";
import { CpfSettingsForm } from "./cpf-settings-form";

const mockUpsertCpfAccountSettings = vi.fn();
const mockToastError = vi.fn();

vi.mock("@/lib/actions", () => ({
  upsertCpfAccountSettings: (...args: unknown[]) =>
    mockUpsertCpfAccountSettings(...args),
}));

vi.mock("sonner", () => ({
  toast: {
    error: (...args: unknown[]) => mockToastError(...args),
  },
}));

describe("CpfSettingsForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    mockUpsertCpfAccountSettings.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("does not render a save button", () => {
    render(<CpfSettingsForm accountId="account-1" settings={null} />);

    expect(
      screen.queryByRole("button", { name: /save cpf settings/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText("Autosaves changes")).toBeInTheDocument();
  });

  it("debounces autosave while the user is typing", async () => {
    render(<CpfSettingsForm accountId="account-1" settings={null} />);

    const monthlySalaryInput = screen.getByLabelText("Monthly Salary");

    fireEvent.change(monthlySalaryInput, { target: { value: "4" } });
    fireEvent.change(monthlySalaryInput, { target: { value: "40" } });
    fireEvent.change(monthlySalaryInput, { target: { value: "4000" } });

    expect(mockUpsertCpfAccountSettings).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(649);
    });
    expect(mockUpsertCpfAccountSettings).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(1);
      await Promise.resolve();
    });

    expect(mockUpsertCpfAccountSettings).toHaveBeenCalledTimes(1);
    expect(mockUpsertCpfAccountSettings).toHaveBeenCalledWith("account-1", {
      current_age: 35,
      monthly_salary: 4000,
      oa_interest_rate: 2.5,
      sa_interest_rate: 4,
      ma_interest_rate: 4,
      frs_met_for_ma_overflow: false,
      mortgage_monthly_deduction: 0,
      mortgage_payoff_age: null,
      early_retirement_age: 55,
    });
  });

  it("shows an error state without clearing the edited value when autosave fails", async () => {
    mockUpsertCpfAccountSettings.mockRejectedValueOnce(new Error("Save failed"));

    render(<CpfSettingsForm accountId="account-1" settings={null} />);

    const mortgageInput = screen.getByLabelText("Monthly OA Mortgage Deduction");

    fireEvent.change(mortgageInput, { target: { value: "900" } });
    await act(async () => {
      vi.advanceTimersByTime(650);
      await Promise.resolve();
    });

    expect(screen.getByText("Unable to save")).toBeInTheDocument();
    expect(mortgageInput).toHaveValue(900);
    expect(mockToastError).toHaveBeenCalledWith("Save failed");
  });

  it("persists the FRS overflow toggle", async () => {
    render(<CpfSettingsForm accountId="account-1" settings={null} />);

    const checkbox = screen.getByLabelText("FRS already met for MA overflow");
    fireEvent.click(checkbox);

    await act(async () => {
      vi.advanceTimersByTime(650);
      await Promise.resolve();
    });

    expect(mockUpsertCpfAccountSettings).toHaveBeenCalledWith("account-1", {
      current_age: 35,
      monthly_salary: 0,
      oa_interest_rate: 2.5,
      sa_interest_rate: 4,
      ma_interest_rate: 4,
      frs_met_for_ma_overflow: true,
      mortgage_monthly_deduction: 0,
      mortgage_payoff_age: null,
      early_retirement_age: 55,
    });
  });
});
