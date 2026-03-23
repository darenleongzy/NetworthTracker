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
  description: string;
  icon: typeof ArrowUpRight;
  types: AccountType[];
  emptyMessage: string;
  tabTone: string;
  cardTone: string;
  badgeTone: string;
};

const ACCOUNT_CATEGORIES: AccountCategory[] = [
  {
    key: "brokerage",
    title: "Brokerage Accounts",
    description: "Track investment accounts and market-linked holdings.",
    icon: ArrowUpRight,
    types: ["investment"],
    emptyMessage: "No brokerage accounts yet.",
    tabTone:
      "data-[state=active]:border-sky-300/70 data-[state=active]:bg-sky-50/90 data-[state=active]:text-sky-950",
    cardTone:
      "border-sky-200/70 bg-[linear-gradient(160deg,rgba(248,250,252,0.98),rgba(239,246,255,0.96),rgba(224,242,254,0.82))]",
    badgeTone: "bg-sky-100 text-sky-900",
  },
  {
    key: "cash",
    title: "Cash Accounts",
    description: "Monitor liquid funds across day-to-day cash holdings.",
    icon: Wallet,
    types: ["cash"],
    emptyMessage: "No cash accounts yet.",
    tabTone:
      "data-[state=active]:border-slate-300/70 data-[state=active]:bg-slate-100/90 data-[state=active]:text-slate-950",
    cardTone:
      "border-slate-200/70 bg-[linear-gradient(160deg,rgba(255,255,255,0.98),rgba(248,250,252,0.96),rgba(241,245,249,0.86))]",
    badgeTone: "bg-slate-100 text-slate-900",
  },
  {
    key: "retirement",
    title: "CPF / SRS Accounts",
    description: "Keep retirement-focused balances and protected savings in view.",
    icon: ShieldCheck,
    types: ["cpf", "srs"],
    emptyMessage: "No CPF or SRS accounts yet.",
    tabTone:
      "data-[state=active]:border-emerald-300/70 data-[state=active]:bg-emerald-50/90 data-[state=active]:text-emerald-950",
    cardTone:
      "border-emerald-200/70 bg-[linear-gradient(160deg,rgba(255,251,235,0.88),rgba(236,253,245,0.98),rgba(219,234,254,0.75))]",
    badgeTone: "bg-emerald-100 text-emerald-900",
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
      <Card className="border-slate-200/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.98),rgba(248,250,252,0.94))] shadow-sm">
        <CardContent className="py-10 text-center text-muted-foreground">
          No accounts yet. Create one to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      <Card className="overflow-hidden border-slate-200/70 bg-[linear-gradient(125deg,rgba(15,23,42,0.98)_0%,rgba(30,41,59,0.96)_38%,rgba(44,98,120,0.9)_72%,rgba(77,163,176,0.88)_100%)] text-white shadow-[0_26px_70px_-40px_rgba(15,23,42,0.65)]">
        <CardHeader className="relative">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_18%,rgba(125,211,252,0.14),transparent_26%),radial-gradient(circle_at_82%_22%,rgba(94,234,212,0.1),transparent_30%),radial-gradient(circle_at_92%_100%,rgba(45,212,191,0.14),transparent_34%)]" />
          <div className="relative flex flex-col gap-6">
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
                className={`min-w-0 rounded-[1.15rem] border border-slate-200/80 bg-white/92 px-2 py-3 whitespace-normal shadow-[0_12px_28px_-24px_rgba(15,23,42,0.32)] backdrop-blur-sm transition-[box-shadow,border-color,background-color] hover:shadow-[0_16px_34px_-28px_rgba(15,23,42,0.36)] data-[state=active]:shadow-[0_18px_38px_-30px_rgba(14,116,144,0.3)] sm:rounded-[1.35rem] sm:px-3 sm:py-3 md:px-5 md:py-4 ${category.tabTone}`}
              >
                <div className="flex w-full flex-col items-center gap-2 text-center sm:items-start sm:text-left">
                  <div className="rounded-2xl bg-white p-2 shadow-sm ring-1 ring-black/5 sm:p-2.5">
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                  </div>
                  <div className="min-w-0 w-full">
                    <p className="line-clamp-2 text-[11px] font-semibold leading-tight text-slate-950 sm:text-xs md:text-base">
                        {category.title}
                    </p>
                    <div className="mt-2 flex flex-col items-center gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-2">
                      <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-medium text-slate-700 shadow-sm sm:px-2.5 md:px-3 md:py-1.5 md:text-xs">
                      {items.length} {items.length === 1 ? "acct" : "accts"}
                      </span>
                      <span className="max-w-full rounded-full bg-slate-950 px-2 py-1 text-[10px] font-semibold text-white shadow-sm sm:px-2.5 md:px-3 md:py-1.5 md:text-xs">
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
            className="mt-4 rounded-[1.75rem] border border-slate-200/70 bg-[linear-gradient(180deg,rgba(248,250,252,0.78),rgba(255,255,255,0.96))] p-4 shadow-[0_18px_44px_-40px_rgba(15,23,42,0.2)] outline-none sm:mt-5 sm:p-5 lg:mt-6 lg:p-6"
          >
            {items.length === 0 ? (
              <Card className="border-dashed border-slate-200/80 bg-white/80 shadow-sm">
                <CardContent className="py-10 text-center text-muted-foreground">
                  {category.emptyMessage}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-5 xl:grid-cols-2">
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
                      className={`${category.cardTone} border shadow-[0_18px_40px_-34px_rgba(15,23,42,0.35)] transition-transform hover:-translate-y-0.5`}
                    >
                      <CardHeader className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="rounded-2xl bg-white/85 p-3 shadow-sm">
                              <Icon className="h-5 w-5 text-slate-900" />
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="truncate pr-2 text-lg text-slate-950">
                                {account.name}
                              </CardTitle>
                              <CardDescription className="text-slate-600">
                                Created{" "}
                                {new Date(account.created_at).toLocaleDateString("en-US")}
                              </CardDescription>
                            </div>
                          </div>
                          <Badge className={`${category.badgeTone} shrink-0 border-0`}>
                            {categoryLabel}
                          </Badge>
                        </div>

                        <div className="flex flex-col gap-3 rounded-2xl border border-white/60 bg-white/75 p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-sm text-slate-600">Account total</p>
                            <p className="text-2xl font-semibold text-slate-950">
                              {formatCurrency(accountTotal, baseCurrency)}
                            </p>
                          </div>
                          <p className="text-sm text-slate-500 sm:text-right">{detailLabel}</p>
                        </div>
                      </CardHeader>

                      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="text-sm text-slate-600">
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
