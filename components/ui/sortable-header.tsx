"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { TableHead } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { SortDirection } from "@/lib/hooks/use-table-sort";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  direction: SortDirection;
  onSort: () => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  currentSortKey,
  direction,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentSortKey === sortKey;
  const isRightAligned = className?.includes("text-right");

  return (
    <TableHead className={cn("cursor-pointer select-none", className)}>
      <button
        type="button"
        onClick={onSort}
        className={cn(
          "flex items-center gap-1 hover:text-foreground transition-colors",
          isRightAligned && "ml-auto"
        )}
      >
        {label}
        {isActive && direction === "desc" ? (
          <ArrowDown className="h-4 w-4" />
        ) : isActive && direction === "asc" ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </button>
    </TableHead>
  );
}
