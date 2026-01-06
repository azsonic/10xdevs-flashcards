/**
 * Custom Assertions with Enhanced Error Messages
 * Provides better context when tests fail
 */

/* eslint-disable @typescript-eslint/no-extraneous-class */
import { expect, type Locator, type Page } from "@playwright/test";
import { TIMEOUTS } from "../config/timeouts";

export class CustomAssertions {
  /**
   * Assert element is visible with custom error message
   */
  static async expectVisible(locator: Locator, elementDescription: string, context?: string): Promise<void> {
    try {
      await expect(locator).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    } catch (error) {
      const page = locator.page();
      throw new Error(
        `Expected ${elementDescription} to be visible\n` +
          (context ? `Context: ${context}\n` : "") +
          `Page URL: ${page.url()}\n` +
          `Original error: ${error}`
      );
    }
  }

  /**
   * Assert element is hidden with custom error message
   */
  static async expectHidden(locator: Locator, elementDescription: string, context?: string): Promise<void> {
    try {
      await expect(locator).not.toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    } catch (error) {
      const page = locator.page();
      throw new Error(
        `Expected ${elementDescription} to be hidden\n` +
          (context ? `Context: ${context}\n` : "") +
          `Page URL: ${page.url()}\n` +
          `Original error: ${error}`
      );
    }
  }

  /**
   * Assert flashcard was created successfully
   */
  static async expectFlashcardCreated(page: Page, frontText: string, context = ""): Promise<void> {
    const flashcardLocator = page.getByText(frontText);

    try {
      await expect(flashcardLocator).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
    } catch (error) {
      // Try to get more context about what went wrong
      const pageContent = await page.textContent("body");
      const hasNoResults = pageContent?.includes("no flashcards") || pageContent?.includes("empty");

      throw new Error(
        `Failed to find flashcard with front text: "${frontText}"\n` +
          (context ? `Context: ${context}\n` : "") +
          `Page URL: ${page.url()}\n` +
          `Page appears empty: ${hasNoResults}\n` +
          `Original error: ${error}`
      );
    }
  }

  /**
   * Assert dialog state with detailed error
   */
  static async expectDialogState(
    dialogLocator: Locator,
    expectedState: "visible" | "hidden",
    dialogName = "Dialog"
  ): Promise<void> {
    try {
      if (expectedState === "visible") {
        await expect(dialogLocator).toBeVisible({ timeout: TIMEOUTS.MEDIUM });
      } else {
        await expect(dialogLocator).not.toBeVisible({ timeout: TIMEOUTS.MEDIUM });
      }
    } catch (error) {
      const page = dialogLocator.page();
      const actualState = (await dialogLocator.isVisible()) ? "visible" : "hidden";

      throw new Error(
        `${dialogName} state assertion failed\n` +
          `Expected: ${expectedState}\n` +
          `Actual: ${actualState}\n` +
          `Page URL: ${page.url()}\n` +
          `Original error: ${error}`
      );
    }
  }

  /**
   * Assert form validation error appears
   */
  static async expectValidationError(errorLocator: Locator, expectedMessage: string, fieldName: string): Promise<void> {
    try {
      await expect(errorLocator).toBeVisible({ timeout: TIMEOUTS.SHORT });
      await expect(errorLocator).toHaveText(expectedMessage);
    } catch (error) {
      const page = errorLocator.page();
      const actualText = await errorLocator.textContent().catch(() => "not found");

      throw new Error(
        `Validation error assertion failed for field: ${fieldName}\n` +
          `Expected message: "${expectedMessage}"\n` +
          `Actual text: "${actualText}"\n` +
          `Page URL: ${page.url()}\n` +
          `Original error: ${error}`
      );
    }
  }

  /**
   * Assert navigation occurred
   */
  static async expectNavigation(
    page: Page,
    expectedUrl: string | RegExp,
    fromUrl: string,
    action: string
  ): Promise<void> {
    try {
      await page.waitForURL(expectedUrl, { timeout: TIMEOUTS.LONG });
    } catch (error) {
      throw new Error(
        `Navigation assertion failed\n` +
          `Action: ${action}\n` +
          `From URL: ${fromUrl}\n` +
          `Expected URL: ${expectedUrl}\n` +
          `Actual URL: ${page.url()}\n` +
          `Original error: ${error}`
      );
    }
  }

  /**
   * Assert API response
   */
  static async expectApiSuccess(page: Page, apiUrlPattern: string | RegExp, expectedStatus = 200): Promise<void> {
    const response = await page.waitForResponse(
      (res) => {
        const url = res.url();
        const matches = typeof apiUrlPattern === "string" ? url.includes(apiUrlPattern) : apiUrlPattern.test(url);
        return matches && res.status() === expectedStatus;
      },
      { timeout: TIMEOUTS.MEDIUM }
    );

    if (!response.ok()) {
      const body = await response.text().catch(() => "Could not read response body");
      throw new Error(
        `API response assertion failed\n` +
          `URL: ${response.url()}\n` +
          `Expected status: ${expectedStatus}\n` +
          `Actual status: ${response.status()}\n` +
          `Response body: ${body}`
      );
    }
  }

  /**
   * Assert element count
   */
  static async expectCount(
    locator: Locator,
    expectedCount: number,
    elementDescription: string,
    context?: string
  ): Promise<void> {
    try {
      await expect(locator).toHaveCount(expectedCount, { timeout: TIMEOUTS.MEDIUM });
    } catch (error) {
      const actualCount = await locator.count();
      const page = locator.page();

      throw new Error(
        `Element count assertion failed for ${elementDescription}\n` +
          (context ? `Context: ${context}\n` : "") +
          `Expected count: ${expectedCount}\n` +
          `Actual count: ${actualCount}\n` +
          `Page URL: ${page.url()}\n` +
          `Original error: ${error}`
      );
    }
  }

  /**
   * Assert element contains text
   */
  static async expectToContainText(locator: Locator, expectedText: string, elementDescription: string): Promise<void> {
    try {
      await expect(locator).toContainText(expectedText, { timeout: TIMEOUTS.MEDIUM });
    } catch (error) {
      const actualText = await locator.textContent().catch(() => "Could not read text");
      const page = locator.page();

      throw new Error(
        `Text assertion failed for ${elementDescription}\n` +
          `Expected to contain: "${expectedText}"\n` +
          `Actual text: "${actualText}"\n` +
          `Page URL: ${page.url()}\n` +
          `Original error: ${error}`
      );
    }
  }
}

/**
 * Test context logger for better debugging
 */
/* eslint-disable no-console */
export class TestLogger {
  private static indent = 0;

  static step(description: string): void {
    console.log(`\n${"  ".repeat(this.indent)}📍 STEP: ${description}`);
  }

  static action(description: string): void {
    console.log(`${"  ".repeat(this.indent)}   ▶ ${description}`);
  }

  static verify(description: string): void {
    console.log(`${"  ".repeat(this.indent)}   ✓ ${description}`);
  }

  static error(description: string, error: unknown): void {
    console.error(`${"  ".repeat(this.indent)}   ❌ ${description}`, error);
  }

  static group(description: string): void {
    console.log(`\n${"  ".repeat(this.indent)}📦 GROUP: ${description}`);
    this.indent++;
  }

  static groupEnd(): void {
    this.indent = Math.max(0, this.indent - 1);
  }

  static async pageState(page: Page): Promise<void> {
    console.log(`\n${"  ".repeat(this.indent)}📊 Page State:`);
    console.log(`${"  ".repeat(this.indent)}   URL: ${page.url()}`);
    console.log(`${"  ".repeat(this.indent)}   Title: ${await page.title()}`);

    const errors = await page.locator('[role="alert"]').allTextContents();
    if (errors.length > 0) {
      console.log(`${"  ".repeat(this.indent)}   Errors: ${errors.join(", ")}`);
    }
  }
}
