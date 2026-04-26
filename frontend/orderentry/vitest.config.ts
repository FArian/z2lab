import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    // All current tests are pure logic (domain / application / infrastructure / API).
    // No `.tsx` component tests, no `toBeInTheDocument` matchers anywhere.
    // Per-file override: add `// @vitest-environment jsdom` at the top of a UI test.
    environment: "node",
    setupFiles: ["./vitest.setup.ts"],

    include: [
      "tests/**/*.{test,spec}.{ts,tsx}",
      "src/**/*.{test,spec}.{ts,tsx}",
    ],

    pool: "threads",
    fileParallelism: false,

    coverage: {
      provider: "v8",
      include: [
        "src/domain/**/*.ts",
        "src/application/**/*.ts",
        "src/infrastructure/fhir/**/*.ts",
        "src/infrastructure/repositories/**/*.ts",
        "src/infrastructure/api/**/*.ts",
      ],
      thresholds: {
        branches: 70,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});