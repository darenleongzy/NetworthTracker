"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { deleteAccount } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowUpRight,
  ChevronRight,
  Landmark,
  Loader2,
  PiggyBank,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/calculations";
import type { ExchangeRates } from "@/lib/exchange-rates";
import type { StockPriceData } from "@/lib/stock-api";
import type { AccountType, AccountWithHoldings } from "@/lib/types";

type AccountCategoryKey = "brokerage" | "cash" | "retirement";

type AccountCategory = {
  key: AccountCategoryKey;
  title: string;
  icon: typeof ArrowUpRight;
  types: AccountType[];
  emptyMessage: string;
  badgeTone: string;
};

const ACCOUNT_CATEGORIES: AccountCategory[] = [
  {
    key: "brokerage",
    title: "Brokerage Accounts",
    icon: ArrowUpRight,
    types: ["investment"],
    emptyMessage: "No brokerage accounts yet.",
    badgeTone: "bg-primary/15 text-primary",
  },
  {
    key: "cash",
    title: "Cash Accounts",
    icon: Wallet,
    types: ["cash"],
    emptyMessage: "No cash accounts yet.",
    badgeTone: "bg-secondary text-secondary-foreground",
  },
  {
    key: "retirement",
    title: "CPF / SRS Accounts",
    icon: ShieldCheck,
    types: ["cpf", "srs"],
    emptyMessage: "No CPF or SRS accounts yet.",
    badgeTone: "bg-chart-5/15 text-chart-5",
  },
];

function getCategoryKey(type: AccountType): AccountCategoryKey {
  if (type === "investment") return "brokerage";
  if (type === "cash") return "cash";
  return "retirement";
}

export function AccountList({
  accounts,
  baseCurrency = "USD",
  exchangeRates = {},
  stockPrices = {},
}: {
  accounts: AccountWithHoldings[];
  baseCurrency?: string;
  exchangeRates?: ExchangeRates;
  stockPrices?: Record<string, StockPriceData>;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("Delete this account and all its holdings?")) return;
    setDeletingId(id);
    try {
      await deleteAccount(id);
      toast.success("Account deleted");
    } catch {
      toast.error("Failed to delete account");
    } finally {
      setDeletingId(null);
    }
  }

  const calculateAccountTotal = useCallback(
    (account: AccountWithHoldings): number => {
      let total = 0;

      for (const h of account.cash_holdings) {
        const balance = Number(h.balance);
        if (h.currency === baseCurrency) {
          total += balance;
        } else {
          const rate = exchangeRates[h.currency];
          total += rate && rate > 0 ? balance / rate : balance;
        }
      }

      for (const h of account.stock_holdings) {
        const priceData = stockPrices[h.ticker.toUpperCase()];
        const price = priceData?.price ?? 0;
        const priceCurrency = priceData?.currency ?? "USD";
        const valueNative = Number(h.shares) * price;
        if (priceCurrency === baseCurrency) {
          total += valueNative;
        } else {
          const rate = exchangeRates[priceCurrency];
          total += rate && rate > 0 ? valueNative / rate : valueNative;
        }
      }

      return total;
    },
    [baseCurrency, exchangeRates, stockPrices]
  );

  const accountTotals = useMemo(
    () =>
      new Map(accounts.map((account) => [account.id, calculateAccountTotal(account)])),
    [accounts, calculateAccountTotal]
  );

  const grandTotal = useMemo(
    () =>
      accounts.reduce(
        (sum, account) => sum + (accountTotals.get(account.id) ?? 0),
        0
      ),
    [accounts, accountTotals]
  );

  const groupedAccounts = useMemo(
    () =>
      ACCOUNT_CATEGORIES.map((category) => {
        const items = accounts.filter((account) =>
          category.types.includes(account.type)
        );
        const total = items.reduce(
          (sum, account) => sum + (accountTotals.get(account.id) ?? 0),
          0
        );

        return {
          category,
          items,
          total,
        };
      }),
    [accounts, accountTotals]
  );

  const defaultTab =
    groupedAccounts.find((group) => group.items.length > 0)?.category.key ??
    "brokerage";

  if (accounts.length === 0) {
    return (
      <Card className="border-border/80 bg-card shadow-sm">
        <CardContent className="py-10 text-center text-muted-foreground">
          No accounts yet. Create one to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="accounts-overview text-white">
        <CardHeader className="relative">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_18%,rgba(125,211,252,0.14),transparent_26%),radial-gradient(circle_at_82%_22%,rgba(94,234,212,0.1),transparent_30%),radial-gradient(circle_at_92%_100%,rgba(45,212,191,0.14),transparent_34%)]" />
          <div className="relative flex flex-col gap-4">
            <div className="space-y-2">
              <CardDescription className="text-white/75">
                Total across all accounts ({baseCurrency})
              </CardDescription>
              <CardTitle className="text-4xl tracking-tight">
                {formatCurrency(grandTotal, baseCurrency)}
              </CardTitle>
              <p className="text-sm text-white/70">
                Reclassified by how you use your money, not just the raw account type.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-white/75">
              <span className="rounded-full border border-white/12 bg-white/8 px-3 py-1.5 backdrop-blur">
                {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
              </span>
              {groupedAccounts.map(({ category, items }) => (
                <span
                  key={category.key}
                  className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-white/70"
                >
                  {category.title}: {items.length}
                </span>
              ))}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue={defaultTab} className="space-y-0">
        <TabsList className="!grid !h-auto w-full grid-cols-3 items-stretch gap-2 bg-transparent p-0 sm:gap-3">
          {groupedAccounts.map(({ category, items, total }) => {
            const Icon = category.icon;

            return (
              <TabsTrigger
                key={category.key}
                value={category.key}
                className="account-category-tab min-w-0 whitespace-normal px-2 py-3 transition-all hover:-translate-y-0.5 sm:px-3 sm:py-3 md:px-5 md:py-4"
              >
                <div className="flex w-full flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                  <div className="rounded-2xl bg-background/90 p-2 shadow-sm ring-1 ring-border/70 sm:p-2.5">
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-foreground sm:text-xs md:text-base">
                        {category.title}
                    </p>
                    <div className="mt-2 flex flex-col items-center gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                      <span className="rounded-full bg-secondary px-2 py-1 text-[10px] font-medium text-secondary-foreground shadow-sm sm:px-2.5 md:px-3 md:py-1.5 md:text-xs">
                      {items.length} {items.length === 1 ? "acct" : "accts"}
                      </span>
                      <span className="max-w-full rounded-full bg-foreground px-2 py-1 text-[10px] font-semibold text-background shadow-sm sm:px-2.5 md:px-3 md:py-1.5 md:text-xs">
                      {formatCurrency(total, baseCurrency)}
                      </span>
                    </div>
                  </div>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {groupedAccounts.map(({ category, items }) => (
          <TabsContent
            key={category.key}
            value={category.key}
            className="account-list-surface mt-3 p-3 outline-none sm:mt-4 sm:p-4 lg:p-5"
          >
            {items.length === 0 ? (
              <Card className="border-dashed border-border/80 bg-card/80 shadow-sm">
                <CardContent className="py-10 text-center text-muted-foreground">
                  {category.emptyMessage}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 xl:grid-cols-2">
                {items.map((account) => {
                  const accountTotal = accountTotals.get(account.id) ?? 0;
                  const detailLabel =
                    account.type === "investment"
                      ? `${account.stock_holdings.length} holdings`
                      : `${account.cash_holdings.length} balances tracked`;
                  const categoryLabel =
                    account.type === "investment"
                      ? "BROKERAGE"
                      : account.type === "cash"
                        ? "CASH"
                        : account.type.toUpperCase();
                  const Icon =
                    category.key === "brokerage"
                      ? ArrowUpRight
                      : category.key === "cash"
                        ? Landmark
                        : PiggyBank;

                  return (
                    <Card
                      key={account.id}
                      className="border-border/80 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <CardHeader className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="rounded-2xl bg-secondary p-3 shadow-sm">
                              <Icon className="h-5 w-5 text-foreground" />
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="truncate pr-2 text-lg">
                                {account.name}
                              </CardTitle>
                              <CardDescription>
                                Created{" "}
                                {new Date(account.created_at).toLocaleDateString("en-US")}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={`${category.badgeTone} shrink-0 border-0`}>
                            {categoryLabel}
                          </Badge>
                        </div>

                        <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-secondary/40 p-4 sm:flex-row sm:items-end sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm text-muted-foreground">Account total</p>
                            <p className="text-2xl font-semibold">
                              {formatCurrency(accountTotal, baseCurrency)}
                            </p>
                          </div>
                          <p className="text-sm text-muted-foreground sm:text-right">{detailLabel}</p>
                        </div>
                      </CardHeader>

                      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-muted-foreground">
                          {getCategoryKey(account.type) === "retirement"
                            ? "Designed for long-term retirement tracking"
                            : getCategoryKey(account.type) === "brokerage"
                              ? "Market value reflects current holdings"
                              : "Best for liquid cash balances and reserves"}
                        </div>
                        <div className="flex gap-2 self-end sm:self-auto">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(account.id)}
                            disabled={deletingId === account.id}
                            aria-label={`Delete ${account.name}`}
                          >
                            {deletingId === account.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-destructive" />
                            )}
                          </Button>
                          <Link href={`/dashboard/accounts/${account.id}`}>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label={`View ${account.name}`}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
