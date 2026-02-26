"use client";

import { useState } from "react";
import { upsertCashHolding } from "@/lib/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { CashHolding } from "@/lib/types";
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from "@/lib/currencies";

export function CashHoldingForm({
  accountId,
  holding,
}: {
  accountId: string;
  holding?: CashHolding;
}) {
  const [open, setOpen] = useState(false);
  const [balance, setBalance] = useState(holding?.balance?.toString() ?? "");
  const [currency, setCurrency] = useState(holding?.currency ?? "USD");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await upsertCashHolding(accountId, parseFloat(balance), currency, holding?.id);
      setOpen(false);
      if (!holding) {
        setBalance("");
        setCurrency("USD");
      }
      toast.success(holding ? "Holding updated" : "Holding added");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save holding");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {holding ? (
          <Button variant="ghost" size="sm">
            Edit
          </Button>
        ) : (
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Holding
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {holding ? "Edit Cash Holding" : "Add Cash Holding"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currency">Currency</Label>
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger id="currency">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_CURRENCIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.symbol} {c.code} - {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="balance">Balance ({getCurrencySymbol(currency)})</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="10000.00"
              required
            />
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            Save
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
