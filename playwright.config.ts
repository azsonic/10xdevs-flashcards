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
  reporter: "html",
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
    command: "npm run dev -- --port 3001",
    url: "http://localhost:3001",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      // Pass test environment variables to the dev server
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_KEY: process.env.SUPABASE_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
      E2E_USERNAME: process.env.E2E_USERNAME,
      E2E_PASSWORD: process.env.E2E_PASSWORD,
      E2E_AUTH_USERNAME: process.env.E2E_AUTH_USERNAME,
      E2E_AUTH_PASSWORD: process.env.E2E_AUTH_PASSWORD,
    },
  },
});
