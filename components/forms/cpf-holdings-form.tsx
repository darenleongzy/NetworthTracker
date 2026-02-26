"use client";

import { useState } from "react";
import { upsertCpfHoldings } from "@/lib/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil } from "lucide-react";
import { toast } from "sonner";
import type { CashHolding } from "@/lib/types";
import { CPF_SUB_ACCOUNTS } from "@/lib/types";

export function CpfHoldingsForm({
  accountId,
  holdings,
}: {
  accountId: string;
  holdings: CashHolding[];
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialize balances from existing holdings
  const getInitialBalance = (label: string) => {
    const holding = holdings.find((h) => h.label === label);
    return holding?.balance?.toString() ?? "";
  };

  const [oaBalance, setOaBalance] = useState(getInitialBalance("OA"));
  const [saBalance, setSaBalance] = useState(getInitialBalance("SA"));
  const [maBalance, setMaBalance] = useState(getInitialBalance("MA"));

  // Reset form when dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setOaBalance(getInitialBalance("OA"));
      setSaBalance(getInitialBalance("SA"));
      setMaBalance(getInitialBalance("MA"));
    }
    setOpen(isOpen);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const holdingsData = [
        { label: "OA", balance: parseFloat(oaBalance) || 0 },
        { label: "SA", balance: parseFloat(saBalance) || 0 },
        { label: "MA", balance: parseFloat(maBalance) || 0 },
      ];
      await upsertCpfHoldings(accountId, holdingsData);
      setOpen(false);
      toast.success("CPF balances updated");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save CPF balances");
    } finally {
      setLoading(false);
    }
  }

  const hasExistingHoldings = holdings.some((h) =>
    ["OA", "SA", "MA"].includes(h.label ?? "")
  );

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant={hasExistingHoldings ? "outline" : "default"}>
          {hasExistingHoldings ? (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              Edit Balances
            </>
          ) : (
            "Set Up CPF Balances"
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>CPF Account Balances</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your CPF balances in SGD
          </p>
          {CPF_SUB_ACCOUNTS.map(({ value, label }) => (
            <div key={value} className="space-y-2">
              <Label htmlFor={value}>
                {label} ({value})
              </Label>
              <Input
                id={value}
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={
                  value === "OA"
                    ? oaBalance
                    : value === "SA"
                      ? saBalance
                      : maBalance
                }
                onChange={(e) => {
                  const val = e.target.value;
                  if (value === "OA") setOaBalance(val);
                  else if (value === "SA") setSaBalance(val);
                  else setMaBalance(val);
                }}
              />
            </div>
          ))}
          <Button type="submit" className="w-full" loading={loading}>
            Save Balances
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
