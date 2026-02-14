"use client";

import { useTransition } from "react";
import { updateBaseCurrency } from "@/lib/actions";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SUPPORTED_CURRENCIES } from "@/lib/currencies";

export function BaseCurrencySelector({
  currentCurrency,
}: {
  currentCurrency: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleChange(value: string) {
    startTransition(async () => {
      try {
        await updateBaseCurrency(value);
      } catch (err) {
        console.error("Failed to update base currency:", err);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">Base currency:</span>
      <Select
        value={currentCurrency}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger className="w-[140px]" size="sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CURRENCIES.map((c) => (
            <SelectItem key={c.code} value={c.code}>
              {c.symbol} {c.code}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
