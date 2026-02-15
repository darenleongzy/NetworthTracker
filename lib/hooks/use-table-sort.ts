"use client";

import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc" | null;

export type SortConfig<T> = {
  key: keyof T | null;
  direction: SortDirection;
};

export function useTableSort<T>(
  data: T[],
  defaultSort?: { key: keyof T; direction: SortDirection }
) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>({
    key: defaultSort?.key ?? null,
    direction: defaultSort?.direction ?? null,
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) {
      return data;
    }

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];

      // Handle null/undefined
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortConfig.direction === "asc" ? -1 : 1;
      if (bValue == null) return sortConfig.direction === "asc" ? 1 : -1;

      // Handle dates (string format)
      if (typeof aValue === "string" && typeof bValue === "string") {
        const aDate = Date.parse(aValue);
        const bDate = Date.parse(bValue);
        if (!isNaN(aDate) && !isNaN(bDate)) {
          return sortConfig.direction === "asc" ? aDate - bDate : bDate - aDate;
        }
      }

      // Handle numbers
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortConfig.direction === "asc"
          ? aValue - bValue
          : bValue - aValue;
      }

      // Handle strings
      const aStr = String(aValue);
      const bStr = String(bValue);
      return sortConfig.direction === "asc"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  }, [data, sortConfig]);

  const requestSort = (key: keyof T) => {
    setSortConfig((current) => {
      if (current.key !== key) {
        // New column: start with desc (highest first)
        return { key, direction: "desc" };
      }
      // Same column: toggle desc -> asc -> desc
      if (current.direction === "desc") {
        return { key, direction: "asc" };
      }
      return { key, direction: "desc" };
    });
  };

  return { sortedData, sortConfig, requestSort };
}
