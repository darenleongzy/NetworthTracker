import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "happy-dom",
    include: ["apps/mobile/**/*.test.{ts,tsx}"],
    setupFiles: ["./tests/mobile.setup.ts"],
  },
  resolve: {
    alias: [
      {
        find: /^@\/src\//,
        replacement: `${path.resolve(__dirname, "./apps/mobile/src")}/`,
      },
      {
        find: /^@\//,
        replacement: `${path.resolve(__dirname, "./")}/`,
      },
      {
        find: "react",
        replacement: path.resolve(__dirname, "./node_modules/react"),
      },
      {
        find: "react/jsx-runtime",
        replacement: path.resolve(__dirname, "./node_modules/react/jsx-runtime"),
      },
    ],
  },
});
