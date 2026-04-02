import {
  calculateCashTotal,
  calculateInvestmentValue,
  formatCurrency,
} from "@/lib/calculations";
import type { ExchangeRates } from "@/lib/exchange-rates";
import type { StockPriceData } from "@/lib/stock-api";
import type {
  AccountHistoryEvent,
  AccountHistoryEventType,
  AccountType,
  AccountValueSnapshot,
  AccountWithHoldings,
} from "@/lib/types";

export type MonthlyAccountTypeTotal = {
  month: string;
  cash: number;
  investment: number;
  cpf: number;
  srs: number;
};

export type AccountHistoryDetail = {
  label: string;
  value: string;
};

export function calculateAccountTotalValue(
  account: AccountWithHoldings,
  baseCurrency: string,
  exchangeRates: ExchangeRates = {},
  stockPrices: Record<string, StockPriceData> = {}
): number {
  const cashTotal = calculateCashTotal(
    account.cash_holdings,
    baseCurrency,
    exchangeRates
  );

  const stockTotal = calculateInvestmentValue(
    account.stock_holdings,
    stockPrices,
    baseCurrency,
    exchangeRates
  );

  return cashTotal + stockTotal;
}

export function aggregateMonthlyAccountTypeTotals(
  snapshots: AccountValueSnapshot[],
  months = 12
): MonthlyAccountTypeTotal[] {
  const sortedSnapshots = [...snapshots].sort((left, right) =>
    new Date(`${left.snapshot_date}T00:00:00Z`).getTime() -
    new Date(`${right.snapshot_date}T00:00:00Z`).getTime()
  );

  const now = new Date();
  const result: MonthlyAccountTypeTotal[] = [];
  const latestAccountSnapshots = new Map<string, AccountValueSnapshot>();
  let snapshotIndex = 0;

  for (let i = months - 1; i >= 0; i -= 1) {
    const monthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1)
    );
    const nextMonthStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i + 1, 1)
    );

    while (snapshotIndex < sortedSnapshots.length) {
      const snapshot = sortedSnapshots[snapshotIndex];
      const snapshotDate = new Date(`${snapshot.snapshot_date}T00:00:00Z`);
      if (snapshotDate >= nextMonthStart) {
        break;
      }

      const accountKey =
        snapshot.account_id ??
        `${snapshot.account_type}-${snapshot.snapshot_date}-${snapshot.id}`;
      latestAccountSnapshots.set(accountKey, snapshot);
      snapshotIndex += 1;
    }

    const totals = {
      cash: 0,
      investment: 0,
      cpf: 0,
      srs: 0,
    };

    for (const snapshot of latestAccountSnapshots.values()) {
      totals[snapshot.account_type] += Number(snapshot.total_value);
    }

    result.push({
      month: monthStart.toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      ...totals,
    });
  }

  return result;
}

export function formatAccountHistoryTimestamp(timestamp: string) {
  return new Date(timestamp).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function buildAccountHistoryEventLabel(
  eventType: AccountHistoryEventType,
  accountName: string
) {
  const labels: Record<AccountHistoryEventType, string> = {
    account_created: `Created ${accountName}`,
    account_renamed: `Renamed ${accountName}`,
    account_deleted: `Deleted ${accountName}`,
    cash_holding_created: `Added cash holding in ${accountName}`,
    cash_holding_updated: `Updated cash holding in ${accountName}`,
    cash_holding_deleted: `Deleted cash holding from ${accountName}`,
    stock_holding_created: `Added stock holding in ${accountName}`,
    stock_holding_updated: `Updated stock holding in ${accountName}`,
    stock_holding_deleted: `Deleted stock holding from ${accountName}`,
    cpf_holdings_updated: `Updated CPF balances in ${accountName}`,
    cpf_settings_updated: `Updated CPF settings in ${accountName}`,
  };

  return labels[eventType];
}

export function describeAccountHistoryEvent(event: AccountHistoryEvent) {
  const metadata = (event.metadata ?? {}) as Record<string, unknown>;

  switch (event.event_type) {
    case "account_renamed":
      if (typeof metadata.previousName === "string" && typeof metadata.newName === "string") {
        return `${metadata.previousName} -> ${metadata.newName}`;
      }
      return null;
    case "cash_holding_created":
    case "cash_holding_updated":
    case "cash_holding_deleted":
      if (typeof metadata.currency === "string") {
        const label =
          typeof metadata.label === "string" && metadata.label.length > 0
            ? `${metadata.label} (${metadata.currency})`
            : metadata.currency;
        return label;
      }
      return null;
    case "stock_holding_created":
    case "stock_holding_updated":
    case "stock_holding_deleted":
      if (typeof metadata.ticker === "string") {
        return metadata.ticker;
      }
      return null;
    case "cpf_holdings_updated":
      if (Array.isArray(metadata.updatedLabels)) {
        return metadata.updatedLabels.join(", ");
      }
      return null;
    case "cpf_settings_updated":
      if (Array.isArray(metadata.changedFields)) {
        return metadata.changedFields.join(", ");
      }
      return null;
    default:
      return null;
  }
}

function formatPlainNumber(value: number) {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: Number.isInteger(value) ? 0 : 4,
  });
}

function formatUnknownValue(
  value: unknown,
  field?: string,
  currency = "SGD"
): string {
  if (typeof value === "number") {
    if (
      field?.includes("interest_rate") ||
      field?.includes("swr") ||
      field?.includes("growth_rate") ||
      field?.includes("inflation_rate")
    ) {
      return `${value}%`;
    }

    if (
      field?.includes("salary") ||
      field?.includes("deduction") ||
      field?.includes("balance")
    ) {
      return formatCurrency(value, currency);
    }

    return formatPlainNumber(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null) {
    return "None";
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

function getSettingLabel(field: string) {
  const labels: Record<string, string> = {
    current_age: "Current age",
    monthly_salary: "Monthly salary",
    oa_interest_rate: "OA interest rate",
    sa_interest_rate: "SA interest rate",
    ma_interest_rate: "MA interest rate",
    frs_met_for_ma_overflow: "FRS met for MA overflow",
    mortgage_monthly_deduction: "Mortgage monthly deduction",
    mortgage_payoff_age: "Mortgage payoff age",
    early_retirement_age: "Early retirement age",
  };

  return labels[field] ?? field;
}

export function getAccountHistoryEventDetails(
  event: AccountHistoryEvent
): AccountHistoryDetail[] {
  const metadata = (event.metadata ?? {}) as Record<string, unknown>;

  switch (event.event_type) {
    case "account_renamed":
      if (
        typeof metadata.previousName === "string" &&
        typeof metadata.newName === "string"
      ) {
        return [
          {
            label: "Name",
            value: `${metadata.previousName} -> ${metadata.newName}`,
          },
        ];
      }
      return [];
    case "cash_holding_created":
      return [
        {
          label: "Holding",
          value:
            typeof metadata.label === "string" && metadata.label.length > 0
              ? `${metadata.label} (${metadata.currency ?? "USD"})`
              : String(metadata.currency ?? "USD"),
        },
        ...(typeof metadata.newBalance === "number"
          ? [
              {
                label: "Balance",
                value: formatCurrency(
                  metadata.newBalance,
                  typeof metadata.currency === "string"
                    ? metadata.currency
                    : "USD"
                ),
              },
            ]
          : []),
      ];
    case "cash_holding_updated":
      return [
        {
          label: "Holding",
          value:
            typeof metadata.label === "string" && metadata.label.length > 0
              ? `${metadata.label} (${metadata.currency ?? "USD"})`
              : String(metadata.currency ?? "USD"),
        },
        ...(typeof metadata.previousBalance === "number" &&
        typeof metadata.newBalance === "number"
          ? [
              {
                label: "Balance",
                value: `${formatCurrency(
                  metadata.previousBalance,
                  typeof metadata.currency === "string"
                    ? metadata.currency
                    : "USD"
                )} -> ${formatCurrency(
                  metadata.newBalance,
                  typeof metadata.currency === "string"
                    ? metadata.currency
                    : "USD"
                )}`,
              },
            ]
          : []),
      ];
    case "cash_holding_deleted":
      return [
        {
          label: "Holding",
          value:
            typeof metadata.label === "string" && metadata.label.length > 0
              ? `${metadata.label} (${metadata.currency ?? "USD"})`
              : String(metadata.currency ?? "USD"),
        },
        ...(typeof metadata.previousBalance === "number"
          ? [
              {
                label: "Removed balance",
                value: formatCurrency(
                  metadata.previousBalance,
                  typeof metadata.currency === "string"
                    ? metadata.currency
                    : "USD"
                ),
              },
            ]
          : []),
      ];
    case "stock_holding_created":
      return [
        {
          label: "Ticker",
          value: String(metadata.ticker ?? ""),
        },
        ...(typeof metadata.newShares === "number"
          ? [
              {
                label: "Shares",
                value: formatPlainNumber(metadata.newShares),
              },
            ]
          : []),
        ...(typeof metadata.newCostBasisPerShare === "number"
          ? [
              {
                label: "Cost basis / share",
                value: formatCurrency(metadata.newCostBasisPerShare, "USD"),
              },
            ]
          : []),
      ];
    case "stock_holding_updated":
      return [
        {
          label: "Ticker",
          value:
            typeof metadata.previousTicker === "string" &&
            typeof metadata.ticker === "string" &&
            metadata.previousTicker !== metadata.ticker
              ? `${metadata.previousTicker} -> ${metadata.ticker}`
              : String(metadata.ticker ?? metadata.previousTicker ?? ""),
        },
        ...(typeof metadata.previousShares === "number" &&
        typeof metadata.newShares === "number"
          ? [
              {
                label: "Shares",
                value: `${formatPlainNumber(metadata.previousShares)} -> ${formatPlainNumber(
                  metadata.newShares
                )}`,
              },
            ]
          : []),
        ...(typeof metadata.previousCostBasisPerShare === "number" &&
        typeof metadata.newCostBasisPerShare === "number"
          ? [
              {
                label: "Cost basis / share",
                value: `${formatCurrency(
                  metadata.previousCostBasisPerShare,
                  "USD"
                )} -> ${formatCurrency(metadata.newCostBasisPerShare, "USD")}`,
              },
            ]
          : []),
      ];
    case "stock_holding_deleted":
      return [
        {
          label: "Ticker",
          value: String(metadata.ticker ?? ""),
        },
        ...(typeof metadata.previousShares === "number"
          ? [
              {
                label: "Removed shares",
                value: formatPlainNumber(metadata.previousShares),
              },
            ]
          : []),
        ...(typeof metadata.previousCostBasisPerShare === "number"
          ? [
              {
                label: "Cost basis / share",
                value: formatCurrency(metadata.previousCostBasisPerShare, "USD"),
              },
            ]
          : []),
      ];
    case "cpf_holdings_updated": {
      const before =
        typeof metadata.before === "object" && metadata.before !== null
          ? (metadata.before as Record<string, unknown>)
          : {};
      const after =
        typeof metadata.after === "object" && metadata.after !== null
          ? (metadata.after as Record<string, unknown>)
          : {};
      const labels = Array.isArray(metadata.updatedLabels)
        ? metadata.updatedLabels.filter(
            (item): item is string => typeof item === "string"
          )
        : [];

      return labels.map((label) => ({
        label,
        value: `${formatUnknownValue(before[label], `${label}_balance`, "SGD")} -> ${formatUnknownValue(
          after[label],
          `${label}_balance`,
          "SGD"
        )}`,
      }));
    }
    case "cpf_settings_updated": {
      const before =
        typeof metadata.before === "object" && metadata.before !== null
          ? (metadata.before as Record<string, unknown>)
          : {};
      const after =
        typeof metadata.after === "object" && metadata.after !== null
          ? (metadata.after as Record<string, unknown>)
          : {};
      const changedFields = Array.isArray(metadata.changedFields)
        ? metadata.changedFields.filter(
            (item): item is string => typeof item === "string"
          )
        : [];

      return changedFields.map((field) => ({
        label: getSettingLabel(field),
        value: `${formatUnknownValue(before[field], field)} -> ${formatUnknownValue(
          after[field],
          field
        )}`,
      }));
    }
    default:
      return [];
  }
}

export function buildEmptyMonthlyAccountTypeTotals(): MonthlyAccountTypeTotal[] {
  return aggregateMonthlyAccountTypeTotals([]);
}

export function buildSnapshotRecord(
  accountId: string | null,
  userId: string,
  accountType: AccountType,
  totalValue: number,
  currency: string,
  snapshotDate: string
) {
  return {
    account_id: accountId,
    user_id: userId,
    account_type: accountType,
    total_value: totalValue,
    currency,
    snapshot_date: snapshotDate,
  };
}
