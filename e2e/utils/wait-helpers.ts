/**
 * Smart Waiting Helpers
 * Provides intelligent waiting strategies to reduce flakiness
 */

import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { TIMEOUTS } from "../config/timeouts";

/**
 * Wait helpers for common patterns
 */
export class WaitHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for navigation AND page to be fully interactive
   * Use this instead of just waitForURL
   */
  async waitForPageReady(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForURL(urlPattern, { timeout: TIMEOUTS.LONG });
    await this.page.waitForLoadState("domcontentloaded");

    // Wait for any loading spinners to disappear
    await this.page
      .locator('[data-loading="true"]')
      .waitFor({
        state: "hidden",
        timeout: TIMEOUTS.SHORT,
      })
      .catch(() => {
        // Ignore if no loading indicators exist
      });
  }

  /**
   * Wait for element and ensure it's stable (no animations)
   * Use this for elements that may have CSS transitions
   */
  async waitForStableElement(locator: Locator): Promise<void> {
    await locator.waitFor({ state: "visible", timeout: TIMEOUTS.MEDIUM });

    // Wait for animations to complete
    await this.page.waitForTimeout(100);

    // Double-check visibility
    await expect(locator).toBeVisible();
  }

  /**
   * Wait for successful form submission
   * Waits for either success message or navigation
   */
  async waitForFormSuccess(successIndicator: Locator | RegExp): Promise<void> {
    if (successIndicator instanceof RegExp) {
      // Wait for URL navigation
      await this.page.waitForURL(successIndicator, { timeout: TIMEOUTS.MEDIUM });
    } else {
      // Wait for success message
      await successIndicator.waitFor({ state: "visible", timeout: TIMEOUTS.MEDIUM });
    }
  }

  /**
   * Wait for network requests to complete
   * Useful after actions that trigger API calls
   */
  async waitForNetworkIdle(): Promise<void> {
    await this.page.waitForLoadState("networkidle", { timeout: TIMEOUTS.LONG });
  }

  /**
   * Wait for specific API request to complete
   */
  async waitForApiCall(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForResponse(
      (response) => {
        const url = response.url();
        if (typeof urlPattern === "string") {
          return url.includes(urlPattern);
        }
        return urlPattern.test(url);
      },
      { timeout: TIMEOUTS.MEDIUM }
    );
  }

  /**
   * Wait for dialog/modal to appear and be interactive
   */
  async waitForDialog(dialogLocator: Locator): Promise<void> {
    await dialogLocator.waitFor({ state: "visible", timeout: TIMEOUTS.MEDIUM });

    // Wait for dialog to be fully rendered (animations)
    await this.page.waitForTimeout(200);

    // Ensure dialog is in the viewport
    await expect(dialogLocator).toBeInViewport();
  }

  /**
   * Wait for element to disappear
   * More reliable than checking for hidden state
   */
  async waitForElementGone(locator: Locator): Promise<void> {
    await locator.waitFor({ state: "hidden", timeout: TIMEOUTS.MEDIUM });

    // Double-check it's really gone
    await expect(locator).not.toBeVisible();
  }

  /**
   * Retry an action until it succeeds or timeout
   * Useful for flaky operations
   */
  async retryUntilSucceeds<T>(
    action: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delay?: number;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const { maxAttempts = 3, delay = 1000, timeout = TIMEOUTS.MEDIUM } = options;

    const startTime = Date.now();
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (Date.now() - startTime > timeout) {
        throw new Error(`Retry timeout after ${timeout}ms. Last error: ${lastError?.message}`);
      }

      try {
        return await action();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxAttempts) {
          await this.page.waitForTimeout(delay);
        }
      }
    }

    throw new Error(`Failed after ${maxAttempts} attempts. Last error: ${lastError?.message}`);
  }

  /**
   * Wait for text content to change
   * Useful when waiting for dynamic updates
   */
  async waitForTextChange(locator: Locator, previousText: string): Promise<void> {
    await expect(locator).not.toHaveText(previousText, { timeout: TIMEOUTS.MEDIUM });
  }

  /**
   * Wait for count to change (e.g., list items)
   */
  async waitForCountChange(locator: Locator, previousCount: number): Promise<void> {
    await expect(async () => {
      const currentCount = await locator.count();
      expect(currentCount).not.toBe(previousCount);
    }).toPass({ timeout: TIMEOUTS.MEDIUM });
  }
}

/**
 * Standalone helper functions
 */
export const waitHelpers = {
  /**
   * Simple delay helper
   */
  wait: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Wait with exponential backoff
   */
  waitWithBackoff: async (attempt: number, baseDelay = 1000) => {
    const delay = baseDelay * Math.pow(2, attempt - 1);
    await new Promise((resolve) => setTimeout(resolve, delay));
  },
};
