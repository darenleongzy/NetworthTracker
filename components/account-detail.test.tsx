import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/tests/utils/render";
import { AccountDetail } from "@/components/account-detail";
import type {
  AccountHistoryEvent,
  AccountValueSnapshot,
  AccountWithHoldings,
} from "@/lib/types";

vi.mock("@/lib/actions", () => ({
  updateAccount: vi.fn(),
}));

vi.mock("@/components/forms/cash-holding-form", () => ({
  CashHoldingForm: () => <div>CashHoldingForm</div>,
}));

vi.mock("@/components/forms/stock-holding-form", () => ({
  StockHoldingForm: () => <div>StockHoldingForm</div>,
}));

vi.mock("@/components/forms/cpf-holdings-form", () => ({
  CpfHoldingsForm: () => <div>CpfHoldingsForm</div>,
}));

vi.mock("@/components/forms/cpf-settings-form", () => ({
  CpfSettingsForm: () => <div>CpfSettingsForm</div>,
}));

vi.mock("@/components/cash-holdings-table", () => ({
  CashHoldingsTable: () => <div>CashHoldingsTable</div>,
}));

vi.mock("@/components/stock-holdings-table", () => ({
  StockHoldingsTable: () => <div>StockHoldingsTable</div>,
}));

vi.mock("@/components/ui/slider", () => ({
  Slider: () => <div>Slider</div>,
}));

vi.mock("@/components/charts/account-history-chart", () => ({
  AccountHistoryChart: () => <div>Account Value History</div>,
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("AccountDetail history", () => {
  it("renders account change history entries", () => {
    const account: AccountWithHoldings = {
      id: "account-1",
      user_id: "user-1",
      name: "Cash Reserve",
      type: "cash",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      cash_holdings: [],
      stock_holdings: [],
    };

    const events: AccountHistoryEvent[] = [
      {
        id: "event-1",
        account_id: "account-1",
        user_id: "user-1",
        event_type: "account_renamed",
        event_label: "Renamed Cash Reserve",
        metadata: {
          previousName: "DBS",
          newName: "Cash Reserve",
        },
        created_at: "2026-04-01T12:00:00.000Z",
      },
    ];

    const snapshots: AccountValueSnapshot[] = [
      {
        id: "snapshot-1",
        account_id: "account-1",
        user_id: "user-1",
        account_type: "cash",
        total_value: 1000,
        currency: "USD",
        snapshot_date: "2026-04-01",
        created_at: "2026-04-01T12:00:00.000Z",
      },
    ];

    render(
      <AccountDetail
        account={account}
        accountHistoryEvents={events}
        accountValueSnapshots={snapshots}
      />
    );

    expect(screen.getByText("Change History")).toBeInTheDocument();
    expect(screen.getByText("Renamed Cash Reserve")).toBeInTheDocument();
    expect(screen.getByText("DBS -> Cash Reserve")).toBeInTheDocument();
    expect(screen.getByText("Account Value History")).toBeInTheDocument();
  });

  it("renders detailed value changes for history events", () => {
    const account: AccountWithHoldings = {
      id: "account-1",
      user_id: "user-1",
      name: "Cash Reserve",
      type: "cash",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      cash_holdings: [],
      stock_holdings: [],
    };

    const events: AccountHistoryEvent[] = [
      {
        id: "event-2",
        account_id: "account-1",
        user_id: "user-1",
        event_type: "cash_holding_updated",
        event_label: "Updated cash holding in Cash Reserve",
        metadata: {
          label: "Emergency Fund",
          currency: "USD",
          previousBalance: 1000,
          newBalance: 1250,
        },
        created_at: "2026-04-01T12:00:00.000Z",
      },
    ];

    render(<AccountDetail account={account} accountHistoryEvents={events} />);

    expect(screen.getByText("Holding")).toBeInTheDocument();
    expect(screen.getByText("Emergency Fund (USD)")).toBeInTheDocument();
    expect(screen.getByText("$1,000.00 -> $1,250.00")).toBeInTheDocument();
  });
});
