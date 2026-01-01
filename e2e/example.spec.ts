import { test, expect } from "@playwright/test";

/**
 * Example E2E test
 * This file demonstrates the basic structure for Playwright E2E tests
 */
test.describe("Example E2E Test Suite", () => {
  test("should load the homepage", async ({ page }) => {
    await page.goto("/");

    // Verify page loads successfully
    await expect(page).toHaveTitle(/.*/, { timeout: 5000 });
  });

  test("should have a visible body element", async ({ page }) => {
    await page.goto("/");

    // Check for body element
    const body = page.locator("body");
    await expect(body).toBeVisible();
  });
});
