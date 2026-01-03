import type { Page, Locator } from "@playwright/test";

/**
 * Base Page Object class
 * Contains common functionality shared across all pages
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific URL
   */
  async goto(path: string): Promise<void> {
    await this.page.goto(path);
  }

  /**
   * Wait for the page to load completely
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string): Locator {
    return this.page.getByTestId(testId);
  }

  /**
   * Wait for URL to match
   */
  async waitForURL(path: string): Promise<void> {
    await this.page.waitForURL(path);
  }

  /**
   * Get current URL
   */
  getCurrentURL(): string {
    return this.page.url();
  }

  /**
   * Take a screenshot
   */
  async screenshot(options?: { path: string; fullPage?: boolean }): Promise<Buffer> {
    return await this.page.screenshot(options);
  }
}
