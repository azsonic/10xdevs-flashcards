import { defineConfig, devices } from "@playwright/test";

import dotenv from "dotenv";
import path from "path";

// Only load .env.test if not in CI (GitHub Actions provides env vars directly)
if (!process.env.CI) {
  dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });
}

/**
 * Playwright configuration for E2E testing
 * Following guidelines: Initialize with Chromium/Desktop Chrome only
 */
export default defineConfig({
  testDir: "./e2e",
  testIgnore: "**/examples/**", // Exclude example/demonstration tests
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "html",
  timeout: 15_000, // 15s per test
  expect: { timeout: 5_000 }, // 5s for assertions
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3001",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    testIdAttribute: "data-test-id", // Use data-test-id instead of default data-testid
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Clean up test data after all tests complete
  globalTeardown: "./e2e/global-teardown.ts",

  webServer: {
    // CI: env vars come from GitHub Secrets, no .env.test file exists
    // Local: use dotenv-cli to load .env.test and set E2E_TEST flag
    command: process.env.CI
      ? "npm run dev -- --port 3001"
      : "npx dotenv -e .env.test -v E2E_TEST=true -- npm run dev -- --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    // CI: pass all env vars from GitHub Secrets + E2E_TEST flag
    env: process.env.CI ? { ...process.env, E2E_TEST: "true" } : undefined,
  },
});
