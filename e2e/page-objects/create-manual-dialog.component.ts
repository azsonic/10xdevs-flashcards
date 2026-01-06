import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Create Manual Dialog Component
 * Represents the create flashcard dialog component
 */
export class CreateManualDialogComponent {
  readonly page: Page;
  readonly dialog: Locator;
  readonly dialogTitle: Locator;
  readonly dialogDescription: Locator;
  readonly frontInput: Locator;
  readonly backInput: Locator;
  readonly cancelButton: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;

    this.dialog = page.getByTestId("create-manual-dialog");
    this.dialogTitle = page.getByRole("heading", { name: "Create Flashcard" });
    this.dialogDescription = page.getByText(
      "Create a new flashcard by entering the question on the front and the answer on the back."
    );
    this.frontInput = page.getByTestId("flashcard-form-front");
    this.backInput = page.getByTestId("flashcard-form-back");
    this.cancelButton = page.getByTestId("flashcard-form-cancel");
    this.submitButton = page.getByTestId("flashcard-form-submit");
  }

  /**
   * Verify the dialog is visible
   */
  async verifyDialogVisible(): Promise<void> {
    await expect(this.dialog).toBeVisible();
    await expect(this.dialogTitle).toBeVisible();
  }

  /**
   * Verify the dialog is hidden
   */
  async verifyDialogHidden(): Promise<void> {
    await expect(this.dialog).not.toBeVisible();
  }

  /**
   * Wait for the dialog to appear
   */
  async waitForDialog(): Promise<void> {
    await this.dialog.waitFor({ state: "visible", timeout: 5000 });
  }

  /**
   * Wait for the dialog to close
   */
  async waitForDialogClose(): Promise<void> {
    await this.dialog.waitFor({ state: "hidden", timeout: 5000 });
  }

  /**
   * Fill the front field
   */
  async fillFront(text: string): Promise<void> {
    await this.frontInput.fill(text);
  }

  /**
   * Fill the back field
   */
  async fillBack(text: string): Promise<void> {
    await this.backInput.fill(text);
  }

  /**
   * Click the submit button
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Click the cancel button
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Complete the flashcard creation flow
   * @param front - Front content of the flashcard
   * @param back - Back content of the flashcard
   */
  async createFlashcard(front: string, back: string): Promise<void> {
    await this.fillFront(front);
    await this.fillBack(back);
    await this.submit();
  }

  /**
   * Verify submit button is enabled
   */
  async verifySubmitEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }

  /**
   * Verify submit button is disabled
   */
  async verifySubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Verify submit button shows saving state
   */
  async verifySubmitSaving(): Promise<void> {
    await expect(this.submitButton).toHaveText("Saving...");
  }

  /**
   * Get the front input value
   */
  async getFrontValue(): Promise<string> {
    return (await this.frontInput.inputValue()) || "";
  }

  /**
   * Get the back input value
   */
  async getBackValue(): Promise<string> {
    return (await this.backInput.inputValue()) || "";
  }
}
