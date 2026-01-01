import { Page } from "@playwright/test";

/**
 * Base Page Object Model class
 * All page objects should extend this class
 */
export class BasePage {
  constructor(protected page: Page) {}

  async goto(path = "/") {
    await this.page.goto(path);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `./test-results/${name}.png` });
  }
}

/**
 * Example HomePage Page Object
 * Demonstrates the Page Object Model pattern
 */
export class HomePage extends BasePage {
  // Selectors
  private readonly selectors = {
    body: "body",
  };

  async navigate() {
    await this.goto("/");
  }

  async isLoaded() {
    return await this.page.locator(this.selectors.body).isVisible();
  }
}
