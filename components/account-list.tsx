"use client";

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
import { Trash2, ChevronRight } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import type { ExchangeRates } from "@/lib/exchange-rates";
import type { StockPriceData } from "@/lib/stock-api";
import type { AccountWithHoldings } from "@/lib/types";

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
  // Calculate account total in base currency
  function calculateAccountTotal(account: AccountWithHoldings): number {
    let total = 0;

    // Sum cash holdings converted to base currency
    for (const h of account.cash_holdings) {
      const balance = Number(h.balance);
      if (h.currency === baseCurrency) {
        total += balance;
      } else {
        const rate = exchangeRates[h.currency];
        if (rate && rate > 0) {
          total += balance / rate;
        } else {
          total += balance;
        }
      }
    }

    // Sum stock holdings (prices are in their native currency, convert to base)
    for (const h of account.stock_holdings) {
      const priceData = stockPrices[h.ticker.toUpperCase()];
      const price = priceData?.price ?? 0;
      const priceCurrency = priceData?.currency ?? "USD";
      const valueNative = Number(h.shares) * price;
      if (priceCurrency === baseCurrency) {
        total += valueNative;
      } else {
        const rate = exchangeRates[priceCurrency];
        if (rate && rate > 0) {
          total += valueNative / rate;
        } else {
          total += valueNative;
        }
      }
    }

    return total;
  }

  // Calculate grand total
  const grandTotal = accounts.reduce(
    (sum, account) => sum + calculateAccountTotal(account),
    0
  );

  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No accounts yet. Create one to get started.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
        <CardHeader>
          <CardDescription className="text-white/80">
            Total across all accounts ({baseCurrency})
          </CardDescription>
          <CardTitle className="text-3xl">
            {formatCurrency(grandTotal, baseCurrency)}
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Account Cards */}
      <div className="grid gap-4">
        {accounts.map((account) => {
          const accountTotal = calculateAccountTotal(account);

          return (
            <Card key={account.id}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-lg">{account.name}</CardTitle>
                  <CardDescription>
                    Created {new Date(account.created_at).toLocaleDateString("en-US")}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-lg font-semibold">
                      {formatCurrency(accountTotal, baseCurrency)}
                    </p>
                  </div>
                  <Badge variant={account.type === "investment" ? "secondary" : "default"}>
                    {account.type.toUpperCase()}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={async () => {
                      if (confirm("Delete this account and all its holdings?")) {
                        await deleteAccount(account.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                  <Link href={`/dashboard/accounts/${account.id}`}>
                    <Button variant="ghost" size="icon">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
