import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    setupFiles: ["./tests/setup.ts"],
    include: ["**/*.test.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "lib/calculations.ts",
        "lib/fire-calculations.ts",
        "lib/currencies.ts",
        "lib/expense-categories.ts",
        "lib/exchange-rates.ts",
        "lib/hooks/*.ts",
      ],
      exclude: [
        "lib/supabase/**",
        "**/*.test.{ts,tsx}",
        "**/types.ts",
      ],
      thresholds: {
        global: {
          statements: 70,
          branches: 70,
          functions: 70,
          lines: 70,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
