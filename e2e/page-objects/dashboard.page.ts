import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Dashboard Page Object
 * Represents the main dashboard/home page (/)
 */
export class DashboardPage extends BasePage {
  readonly welcomeSection: Locator;

  constructor(page: Page) {
    super(page);

    this.welcomeSection = page.getByTestId("dashboard-welcome");
  }

  /**
   * Navigate to the dashboard page
   */
  async navigate(): Promise<void> {
    await this.goto("/");
    await this.waitForPageLoad();
  }

  /**
   * Verify the page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.welcomeSection).toBeVisible();
  }

  /**
   * Wait for dashboard to load after authentication
   */
  async waitForDashboard(): Promise<void> {
    await this.page.waitForURL(/\/$/, { timeout: 10000 });
    await this.page.waitForLoadState("networkidle");
    await this.verifyPageLoaded();
  }
}
