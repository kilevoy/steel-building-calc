import { defineConfig, devices } from "@playwright/test";

// Vite serves the app under `base: "/steel-building-calc/"` (GitHub Pages
// path), so the preview URL includes the same prefix. Tests navigate with
// relative URLs ("./") which resolve against this baseURL.
const baseURL = "http://127.0.0.1:4174/steel-building-calc/";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "list" : "html",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: "node scripts/run-playwright-server.mjs",
    url: baseURL,
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
