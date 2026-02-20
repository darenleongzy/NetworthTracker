"use client";

import { useState } from "react";
import Link from "next/link";
import { updateAccount } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CashHoldingForm } from "@/components/forms/cash-holding-form";
import { StockHoldingForm } from "@/components/forms/stock-holding-form";
import { CpfHoldingsForm } from "@/components/forms/cpf-holdings-form";
import { CashHoldingsTable } from "@/components/cash-holdings-table";
import { StockHoldingsTable } from "@/components/stock-holdings-table";
import { CPF_SUB_ACCOUNTS } from "@/lib/types";
import { ArrowLeft, Check, Pencil } from "lucide-react";
import { formatCurrency } from "@/lib/calculations";
import type { ExchangeRates } from "@/lib/exchange-rates";
import type { AccountWithHoldings } from "@/lib/types";

export function AccountDetail({
  account,
  baseCurrency = "USD",
  exchangeRates = {},
  stockPrices = {},
}: {
  account: AccountWithHoldings;
  baseCurrency?: string;
  exchangeRates?: ExchangeRates;
  stockPrices?: Record<string, number>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(account.name);

  // Calculate account total in base currency
  function calculateAccountTotal(): number {
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

    // Sum stock holdings (prices are in USD, convert to base)
    for (const h of account.stock_holdings) {
      const price = stockPrices[h.ticker.toUpperCase()] ?? 0;
      const valueUSD = Number(h.shares) * price;
      if (baseCurrency === "USD") {
        total += valueUSD;
      } else {
        const usdRate = exchangeRates["USD"];
        if (usdRate && usdRate > 0) {
          total += valueUSD / usdRate;
        } else {
          total += valueUSD;
        }
      }
    }

    return total;
  }

  const accountTotal = calculateAccountTotal();

  async function handleRename() {
    if (name.trim() && name !== account.name) {
      await updateAccount(account.id, name.trim());
    }
    setEditing(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/accounts">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            {editing ? (
              <>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl font-bold h-auto py-0"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleRename()}
                />
                <Button variant="ghost" size="icon" onClick={handleRename}>
                  <Check className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{account.name}</h1>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </>
            )}
            <Badge variant={account.type === "investment" ? "secondary" : "default"}>
              {account.type.toUpperCase()}
            </Badge>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Account Total</p>
          <p className="text-2xl font-bold">
            {formatCurrency(accountTotal, baseCurrency)}
          </p>
        </div>
      </div>

      {account.type === "cpf" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>CPF Balances</CardTitle>
            <CpfHoldingsForm
              accountId={account.id}
              holdings={account.cash_holdings}
            />
          </CardHeader>
          <CardContent>
            <CpfBalancesDisplay holdings={account.cash_holdings} />
          </CardContent>
        </Card>
      ) : account.type !== "investment" ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Cash Holdings</CardTitle>
            <CashHoldingForm accountId={account.id} />
          </CardHeader>
          <CardContent>
            <CashHoldingsTable
              holdings={account.cash_holdings}
              accountId={account.id}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Stock Holdings</CardTitle>
              <CardDescription>
                Stock values shown in USD
              </CardDescription>
            </div>
            <StockHoldingForm accountId={account.id} />
          </CardHeader>
          <CardContent>
            <StockHoldingsTable
              holdings={account.stock_holdings}
              accountId={account.id}
              stockPrices={stockPrices}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CpfBalancesDisplay({ holdings }: { holdings: { label?: string | null; balance: number }[] }) {
  const cpfHoldings = holdings.filter((h) =>
    ["OA", "SA", "MA"].includes(h.label ?? "")
  );

  if (cpfHoldings.length === 0) {
    return (
      <p className="text-muted-foreground text-center py-4">
        No CPF balances set. Click &quot;Set Up CPF Balances&quot; to add your balances.
      </p>
    );
  }

  const total = cpfHoldings.reduce((sum, h) => sum + Number(h.balance), 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {CPF_SUB_ACCOUNTS.map(({ value, label }) => {
          const holding = cpfHoldings.find((h) => h.label === value);
          const balance = holding ? Number(holding.balance) : 0;
          return (
            <div
              key={value}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
            >
              <div>
                <p className="font-medium">{label}</p>
                <p className="text-sm text-muted-foreground">{value}</p>
              </div>
              <p className="text-lg font-semibold">
                {formatCurrency(balance, "SGD")}
              </p>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-between pt-3 border-t">
        <p className="font-medium">Total CPF</p>
        <p className="text-xl font-bold">{formatCurrency(total, "SGD")}</p>
      </div>
    </div>
  );
}
