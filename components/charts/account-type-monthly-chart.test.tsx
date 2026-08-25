import type { PropsWithChildren } from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import { AccountTypeMonthlyChart } from "@/components/charts/account-type-monthly-chart";

vi.mock("recharts", () => {
  const Container = ({ children }: PropsWithChildren) => <div>{children}</div>;
  const Empty = () => null;

  return {
    CartesianGrid: Empty,
    Legend: Empty,
    Line: Empty,
    LineChart: Container,
    ResponsiveContainer: Container,
    Tooltip: Empty,
    XAxis: Empty,
    YAxis: Empty,
  };
});

describe("AccountTypeMonthlyChart", () => {
  it("renders selectable week, month, and year history ranges", async () => {
    const user = userEvent.setup();

    render(
      <AccountTypeMonthlyChart
        baseCurrency="SGD"
        snapshots={[
          {
            id: "cash-1",
            account_id: "cash-1",
            user_id: "user-1",
            account_type: "cash",
            total_value: 1000,
            currency: "SGD",
            snapshot_date: new Date().toISOString().split("T")[0],
            created_at: new Date().toISOString(),
          },
        ]}
      />
    );

    expect(screen.getByRole("button", { name: "Year" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Week" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Month" })).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Week" }));

    expect(screen.getByRole("button", { name: "Week" })).toHaveAttribute("aria-pressed", "true");
  });
});
