import { describe, expect, it } from "vitest";
import {
  aggregateMonthlyAccountTypeTotals,
  calculateAccountTotalValue,
  describeAccountHistoryEvent,
  getAccountHistoryEventDetails,
} from "@/lib/account-history";
import type {
  AccountHistoryEvent,
  AccountValueSnapshot,
  AccountWithHoldings,
} from "@/lib/types";

describe("account history helpers", () => {
  it("calculates an account total using cash and stocks in the base currency", () => {
    const account: AccountWithHoldings = {
      id: "account-1",
      user_id: "user-1",
      name: "Brokerage",
      type: "investment",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      cash_holdings: [
        {
          id: "cash-1",
          account_id: "account-1",
          balance: 1000,
          currency: "USD",
          label: null,
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ],
      stock_holdings: [
        {
          id: "stock-1",
          account_id: "account-1",
          ticker: "AAPL",
          shares: 2,
          cost_basis_per_share: 100,
          updated_at: "2026-01-01T00:00:00.000Z",
        },
      ],
    };

    expect(
      calculateAccountTotalValue(
        account,
        "USD",
        {},
        { AAPL: { price: 150, currency: "USD" } }
      )
    ).toBe(1300);
  });

  it("uses the latest snapshot within each month per account type", () => {
    const now = new Date();
    const currentMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 5)
    );
    const previousMonth = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 5)
    );
    const previousMonthEarly = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)
    );

    const toDate = (date: Date) => date.toISOString().split("T")[0];

    const snapshots: AccountValueSnapshot[] = [
      {
        id: "1",
        account_id: "cash-1",
        user_id: "user-1",
        account_type: "cash",
        total_value: 1000,
        currency: "USD",
        snapshot_date: toDate(previousMonthEarly),
        created_at: `${toDate(previousMonthEarly)}T00:00:00.000Z`,
      },
      {
        id: "2",
        account_id: "cash-1",
        user_id: "user-1",
        account_type: "cash",
        total_value: 1200,
        currency: "USD",
        snapshot_date: toDate(previousMonth),
        created_at: `${toDate(previousMonth)}T00:00:00.000Z`,
      },
      {
        id: "3",
        account_id: "brokerage-1",
        user_id: "user-1",
        account_type: "investment",
        total_value: 4000,
        currency: "USD",
        snapshot_date: toDate(previousMonth),
        created_at: `${toDate(previousMonth)}T00:00:00.000Z`,
      },
      {
        id: "4",
        account_id: "cash-1",
        user_id: "user-1",
        account_type: "cash",
        total_value: 1400,
        currency: "USD",
        snapshot_date: toDate(currentMonth),
        created_at: `${toDate(currentMonth)}T00:00:00.000Z`,
      },
    ];

    const totals = aggregateMonthlyAccountTypeTotals(snapshots, 2);

    expect(totals[0]).toMatchObject({
      cash: 1200,
      investment: 4000,
      cpf: 0,
      srs: 0,
    });
    expect(totals[1]).toMatchObject({
      cash: 1400,
      investment: 4000,
      cpf: 0,
      srs: 0,
    });
  });

  it("includes a newly saved current-month snapshot in the monthly series", () => {
    const now = new Date();
    const snapshotDate = now.toISOString().split("T")[0];

    const totals = aggregateMonthlyAccountTypeTotals(
      [
        {
          id: "today-cash",
          account_id: "cash-1",
          user_id: "user-1",
          account_type: "cash",
          total_value: 2500,
          currency: "USD",
          snapshot_date: snapshotDate,
          created_at: now.toISOString(),
        },
      ],
      1
    );

    expect(totals).toHaveLength(1);
    expect(totals[0]).toMatchObject({ cash: 2500, investment: 0, cpf: 0, srs: 0 });
  });

  it("renders concise detail text for renamed accounts", () => {
    const event: AccountHistoryEvent = {
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
    };

    expect(describeAccountHistoryEvent(event)).toBe("DBS -> Cash Reserve");
  });

  it("builds detailed before and after values for cash holding updates", () => {
    const event: AccountHistoryEvent = {
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
    };

    expect(getAccountHistoryEventDetails(event)).toEqual([
      {
        label: "Holding",
        value: "Emergency Fund (USD)",
      },
      {
        label: "Balance",
        value: "$1,000.00 -> $1,250.00",
      },
    ]);
  });
});
