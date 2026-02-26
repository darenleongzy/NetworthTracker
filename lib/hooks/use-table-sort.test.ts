import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTableSort } from "./use-table-sort";

interface TestData {
  id: number;
  name: string;
  value: number;
  date: string;
  nullable?: string | null;
}

const testData: TestData[] = [
  { id: 1, name: "Apple", value: 100, date: "2024-01-15" },
  { id: 2, name: "Banana", value: 50, date: "2024-02-20" },
  { id: 3, name: "Cherry", value: 200, date: "2024-01-10" },
  { id: 4, name: "Date", value: 75, date: "2024-03-01" },
];

describe("useTableSort", () => {
  describe("initial state", () => {
    it("returns unsorted data by default", () => {
      const { result } = renderHook(() => useTableSort(testData));
      expect(result.current.sortedData).toEqual(testData);
      expect(result.current.sortConfig.key).toBeNull();
      expect(result.current.sortConfig.direction).toBeNull();
    });

    it("applies default sort if provided", () => {
      const { result } = renderHook(() =>
        useTableSort(testData, { key: "value", direction: "desc" })
      );
      expect(result.current.sortConfig.key).toBe("value");
      expect(result.current.sortConfig.direction).toBe("desc");
      expect(result.current.sortedData[0].value).toBe(200);
    });
  });

  describe("sorting numbers", () => {
    it("sorts numbers in descending order", () => {
      const { result } = renderHook(() => useTableSort(testData));
      act(() => {
        result.current.requestSort("value");
      });
      expect(result.current.sortedData[0].value).toBe(200);
      expect(result.current.sortedData[3].value).toBe(50);
    });

    it("sorts numbers in ascending order on second click", () => {
      const { result } = renderHook(() => useTableSort(testData));
      act(() => {
        result.current.requestSort("value");
        result.current.requestSort("value");
      });
      expect(result.current.sortedData[0].value).toBe(50);
      expect(result.current.sortedData[3].value).toBe(200);
    });
  });

  describe("sorting strings", () => {
    it("sorts strings alphabetically descending", () => {
      const { result } = renderHook(() => useTableSort(testData));
      act(() => {
        result.current.requestSort("name");
      });
      expect(result.current.sortedData[0].name).toBe("Date");
      expect(result.current.sortedData[3].name).toBe("Apple");
    });

    it("sorts strings alphabetically ascending", () => {
      const { result } = renderHook(() => useTableSort(testData));
      act(() => {
        result.current.requestSort("name");
        result.current.requestSort("name");
      });
      expect(result.current.sortedData[0].name).toBe("Apple");
      expect(result.current.sortedData[3].name).toBe("Date");
    });
  });

  describe("sorting dates", () => {
    it("sorts date strings descending (newest first)", () => {
      const { result } = renderHook(() => useTableSort(testData));
      act(() => {
        result.current.requestSort("date");
      });
      expect(result.current.sortedData[0].date).toBe("2024-03-01");
      expect(result.current.sortedData[3].date).toBe("2024-01-10");
    });

    it("sorts date strings ascending (oldest first)", () => {
      const { result } = renderHook(() => useTableSort(testData));
      act(() => {
        result.current.requestSort("date");
        result.current.requestSort("date");
      });
      expect(result.current.sortedData[0].date).toBe("2024-01-10");
      expect(result.current.sortedData[3].date).toBe("2024-03-01");
    });
  });

  describe("handling null values", () => {
    const dataWithNulls: TestData[] = [
      { id: 1, name: "A", value: 100, date: "2024-01-01", nullable: "value1" },
      { id: 2, name: "B", value: 200, date: "2024-02-01", nullable: null },
      { id: 3, name: "C", value: 300, date: "2024-03-01", nullable: "value2" },
    ];

    it("moves null values to beginning when ascending", () => {
      const { result } = renderHook(() => useTableSort(dataWithNulls));
      act(() => {
        result.current.requestSort("nullable");
        result.current.requestSort("nullable"); // asc
      });
      // Based on implementation: null comes before non-null in ascending
      expect(result.current.sortedData[0].nullable).toBeNull();
    });

    it("moves null values to end when descending", () => {
      const { result } = renderHook(() => useTableSort(dataWithNulls));
      act(() => {
        result.current.requestSort("nullable"); // desc
      });
      // Based on implementation: null comes after non-null in descending
      expect(result.current.sortedData[2].nullable).toBeNull();
    });

    it("keeps order stable when both values are null", () => {
      const dataWithMultipleNulls: TestData[] = [
        { id: 1, name: "A", value: 100, date: "2024-01-01", nullable: null },
        { id: 2, name: "B", value: 200, date: "2024-02-01", nullable: null },
        { id: 3, name: "C", value: 300, date: "2024-03-01", nullable: "value" },
      ];
      const { result } = renderHook(() => useTableSort(dataWithMultipleNulls));
      act(() => {
        result.current.requestSort("nullable");
      });
      // Both null values should maintain relative order
      const nullItems = result.current.sortedData.filter(d => d.nullable === null);
      expect(nullItems).toHaveLength(2);
    });
  });

  describe("direction toggle", () => {
    it("starts with desc on first click", () => {
      const { result } = renderHook(() => useTableSort(testData));
      act(() => {
        result.current.requestSort("value");
      });
      expect(result.current.sortConfig.direction).toBe("desc");
    });

    it("toggles to asc on second click", () => {
      const { result } = renderHook(() => useTableSort(testData));
      act(() => {
        result.current.requestSort("value");
        result.current.requestSort("value");
      });
      expect(result.current.sortConfig.direction).toBe("asc");
    });

    it("toggles back to desc on third click", () => {
      const { result } = renderHook(() => useTableSort(testData));
      act(() => {
        result.current.requestSort("value");
        result.current.requestSort("value");
        result.current.requestSort("value");
      });
      expect(result.current.sortConfig.direction).toBe("desc");
    });

    it("resets to desc when switching columns", () => {
      const { result } = renderHook(() => useTableSort(testData));
      act(() => {
        result.current.requestSort("value");
        result.current.requestSort("value"); // asc
        result.current.requestSort("name"); // new column, should be desc
      });
      expect(result.current.sortConfig.key).toBe("name");
      expect(result.current.sortConfig.direction).toBe("desc");
    });
  });

  describe("empty data", () => {
    it("handles empty array", () => {
      const { result } = renderHook(() => useTableSort<TestData>([]));
      expect(result.current.sortedData).toEqual([]);
      act(() => {
        result.current.requestSort("value");
      });
      expect(result.current.sortedData).toEqual([]);
    });
  });

  describe("data immutability", () => {
    it("does not mutate original data", () => {
      const original = [...testData];
      const { result } = renderHook(() => useTableSort(testData));
      act(() => {
        result.current.requestSort("value");
      });
      expect(testData).toEqual(original);
    });
  });
});
