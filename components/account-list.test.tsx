import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { render } from "@/tests/utils/render";
import { AccountList } from "./account-list";
import type { AccountWithHoldings } from "@/lib/types";

vi.mock("@/lib/actions", () => ({
  deleteAccount: vi.fn(),
}));

function createAccount(
  overrides: Partial<AccountWithHoldings>
): AccountWithHoldings {
  return {
    id: overrides.id ?? "account-1",
    user_id: "user-1",
    name: overrides.name ?? "Account",
    type: overrides.type ?? "cash",
    created_at: overrides.created_at ?? "2026-01-01T00:00:00.000Z",
    updated_at: overrides.updated_at ?? "2026-01-01T00:00:00.000Z",
    cash_holdings: overrides.cash_holdings ?? [],
    stock_holdings: overrides.stock_holdings ?? [],
  };
}

describe("AccountList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("groups accounts into brokerage, cash, and CPF/SRS tabs", async () => {
    render(
      <AccountList
        accounts={[
          createAccount({
            id: "brokerage",
            name: "IBKR",
            type: "investment",
            stock_holdings: [
              {
                id: "stock-1",
                account_id: "brokerage",
                ticker: "AAPL",
                shares: 2,
                cost_basis_per_share: 100,
                updated_at: "",
              },
            ],
          }),
          createAccount({
            id: "cash",
            name: "DBS Multiplier",
            type: "cash",
            cash_holdings: [
              {
                id: "cash-1",
                account_id: "cash",
                balance: 5000,
                currency: "USD",
                label: null,
                updated_at: "",
              },
            ],
          }),
          createAccount({
            id: "cpf",
            name: "CPF Account",
            type: "cpf",
            cash_holdings: [
              {
                id: "cpf-1",
                account_id: "cpf",
                balance: 10000,
                currency: "USD",
                label: "OA",
                updated_at: "",
              },
            ],
          }),
          createAccount({
            id: "srs",
            name: "SRS Account",
            type: "srs",
            cash_holdings: [
              {
                id: "srs-1",
                account_id: "srs",
                balance: 6000,
                currency: "USD",
                label: null,
                updated_at: "",
              },
            ],
          }),
        ]}
        stockPrices={{ AAPL: { price: 150, currency: "USD" } }}
      />
    );

    expect(screen.getByRole("tab", { name: /Brokerage Accounts/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Cash Accounts/i })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /CPF \/ SRS Accounts/i })).toBeInTheDocument();

    expect(screen.getByText("IBKR")).toBeInTheDocument();
    expect(screen.queryByText("DBS Multiplier")).not.toBeInTheDocument();
    expect(screen.queryByText("CPF Account")).not.toBeInTheDocument();
  });

  it("defaults to the first non-empty category tab", () => {
    render(
      <AccountList
        accounts={[
          createAccount({
            id: "cash",
            name: "Cash Reserve",
            type: "cash",
            cash_holdings: [
              {
                id: "cash-1",
                account_id: "cash",
                balance: 3000,
                currency: "USD",
                label: null,
                updated_at: "",
              },
            ],
          }),
        ]}
      />
    );

    expect(screen.getByRole("tab", { name: /Cash Accounts/i })).toHaveAttribute(
      "data-state",
      "active"
    );
    expect(screen.getByText("Cash Reserve")).toBeInTheDocument();
  });

  it("renders empty-state messaging for tabs without accounts", async () => {
    render(<AccountList accounts={[createAccount({ type: "cash", name: "Wallet" })]} />);

    expect(screen.getByText("Wallet")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Cash Accounts/i })).toHaveAttribute(
      "data-state",
      "active"
    );
  });
});
