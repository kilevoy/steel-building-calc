import { defineConfig } from "vitest/config";

// Unit tests live next to the sources as `src/**/*.test.ts`. Playwright
// owns `tests/e2e/**` — without an explicit include vitest would pick up
// its `*.spec.ts` files and fail on the `@playwright/test` runner.
export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
