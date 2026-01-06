import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Library Page Object
 * Represents the flashcard library page (/library)
 */
export class LibraryPage extends BasePage {
  readonly pageContainer: Locator;
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;
  readonly addManualButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);

    this.pageContainer = page.locator(".container");
    this.pageTitle = page.getByRole("heading", { name: "Flashcard Library" });
    this.pageDescription = page.getByText("Manage and organize your flashcards");
    this.addManualButton = page.getByTestId("library-add-manual-button");
    this.searchInput = page.locator('input[type="search"]');
  }

  /**
   * Navigate to the library page
   * Note: Direct navigation may not maintain authentication session properly.
   * Prefer using NavbarComponent.clickLibrary() after authentication.
   */
  async navigate(): Promise<void> {
    await this.goto("/library");
    await this.page.waitForLoadState("networkidle");
    await this.waitForPageLoad();
  }

  /**
   * Verify the page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageDescription).toBeVisible();
    await expect(this.addManualButton).toBeVisible();
  }

  /**
   * Wait for library page to load after navigation
   */
  async waitForLibrary(): Promise<void> {
    await this.page.waitForURL(/\/library$/, { timeout: 10000 });
    await this.page.waitForLoadState("networkidle");
    await this.verifyPageLoaded();
  }

  /**
   * Click the Add Manual button to open create dialog
   */
  async clickAddManual(): Promise<void> {
    await this.addManualButton.click();
  }

  /**
   * Search for flashcards
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  /**
   * Verify add manual button is enabled
   */
  async verifyAddManualEnabled(): Promise<void> {
    await expect(this.addManualButton).toBeEnabled();
  }

  /**
   * Verify add manual button is disabled
   */
  async verifyAddManualDisabled(): Promise<void> {
    await expect(this.addManualButton).toBeDisabled();
  }

  /**
   * Verify flashcard exists in the list
   */
  async verifyFlashcardExists(frontText: string): Promise<void> {
    await expect(this.page.getByText(frontText)).toBeVisible();
  }
}
