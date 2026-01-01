import { expect, Locator } from "@playwright/test";

/**
 * Custom matchers and utilities for E2E tests
 */

export const customExpect = {
  /**
   * Assert that an element is visible and has expected text
   */
  async toHaveTextAndBeVisible(locator: Locator, expectedText: string) {
    await expect(locator).toBeVisible();
    await expect(locator).toHaveText(expectedText);
  },

  /**
   * Assert that an element is enabled and clickable
   */
  async toBeClickable(locator: Locator) {
    await expect(locator).toBeVisible();
    await expect(locator).toBeEnabled();
  },
};

/**
 * Common test utilities
 */
export const testUtils = {
  /**
   * Generate random test data
   */
  generateRandomEmail: () => {
    const timestamp = Date.now();
    return `test${timestamp}@example.com`;
  },

  generateRandomUsername: () => {
    const timestamp = Date.now();
    return `user${timestamp}`;
  },

  /**
   * Wait for a specific duration
   */
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),
};
