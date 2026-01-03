import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Generate Page Object
 * Represents the flashcard generation page (/generate)
 */
export class GeneratePage extends BasePage {
  readonly pageContainer: Locator;
  readonly pageTitle: Locator;
  readonly pageDescription: Locator;
  readonly sourceTextArea: Locator;
  readonly generateButton: Locator;
  readonly charCount: Locator;

  constructor(page: Page) {
    super(page);

    this.pageContainer = page.locator(".container");
    this.pageTitle = page.getByRole("heading", { name: "Generate Flashcards" });
    this.pageDescription = page.getByText("Paste your study material below and let AI generate flashcards for you.");
    this.sourceTextArea = page.locator("#source-text");
    this.generateButton = page.getByRole("button", { name: "Generate flashcards from source text" });
    this.charCount = page.locator("#char-count");
  }

  /**
   * Navigate to the generate page
   */
  async navigate(): Promise<void> {
    await this.goto("/generate");
    await this.waitForPageLoad();
  }

  /**
   * Verify the page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageTitle).toBeVisible();
    await expect(this.pageDescription).toBeVisible();
    await expect(this.sourceTextArea).toBeVisible();
  }

  /**
   * Wait for generate page to load after authentication
   */
  async waitForGenerate(): Promise<void> {
    await this.page.waitForURL(/\/generate$/, { timeout: 10000 });
    await this.page.waitForLoadState("networkidle");
    await this.verifyPageLoaded();
  }

  /**
   * Fill the source text area
   */
  async fillSourceText(text: string): Promise<void> {
    await this.sourceTextArea.fill(text);
  }

  /**
   * Click the generate button
   */
  async clickGenerate(): Promise<void> {
    await this.generateButton.click();
  }

  /**
   * Verify generate button is disabled
   */
  async verifyGenerateDisabled(): Promise<void> {
    await expect(this.generateButton).toBeDisabled();
  }

  /**
   * Verify generate button is enabled
   */
  async verifyGenerateEnabled(): Promise<void> {
    await expect(this.generateButton).toBeEnabled();
  }
}
