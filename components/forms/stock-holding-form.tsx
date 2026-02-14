"use client";

import { useState } from "react";
import { upsertStockHolding } from "@/lib/actions";
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
import { Plus } from "lucide-react";
import type { StockHolding } from "@/lib/types";

export function StockHoldingForm({
  accountId,
  holding,
}: {
  accountId: string;
  holding?: StockHolding;
}) {
  const [open, setOpen] = useState(false);
  const [ticker, setTicker] = useState(holding?.ticker ?? "");
  const [shares, setShares] = useState(holding?.shares?.toString() ?? "");
  const [costBasis, setCostBasis] = useState(
    holding?.cost_basis_per_share?.toString() ?? ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await upsertStockHolding(
        accountId,
        ticker,
        parseFloat(shares),
        parseFloat(costBasis),
        holding?.id
      );
      setOpen(false);
      if (!holding) {
        setTicker("");
        setShares("");
        setCostBasis("");
      }
    } catch (err) {
      console.error(err);
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
            Add Stock
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {holding ? "Edit Stock Holding" : "Add Stock Holding"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ticker">Ticker Symbol</Label>
            <Input
              id="ticker"
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              placeholder="AAPL"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shares">Number of Shares</Label>
            <Input
              id="shares"
              type="number"
              step="0.0001"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              placeholder="100"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="costBasis">Cost Basis per Share ($)</Label>
            <Input
              id="costBasis"
              type="number"
              step="0.01"
              value={costBasis}
              onChange={(e) => setCostBasis(e.target.value)}
              placeholder="150.00"
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
