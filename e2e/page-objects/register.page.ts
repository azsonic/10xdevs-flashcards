import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Register Page Object
 * Represents the user registration page (/register)
 */
export class RegisterPage extends BasePage {
  readonly pageContainer: Locator;
  readonly card: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly form: Locator;

  // Form inputs
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;

  // Links
  readonly loginLink: Locator;

  // Error messages
  readonly generalError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly confirmPasswordError: Locator;

  // Loading state
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    super(page);

    this.pageContainer = page.getByTestId("register-page");
    this.card = page.getByTestId("register-card");
    this.title = page.getByTestId("register-title");
    this.description = page.getByTestId("register-description");
    this.form = page.getByTestId("register-form");

    // Form inputs
    this.emailInput = page.getByTestId("register-email-input");
    this.passwordInput = page.getByTestId("register-password-input");
    this.confirmPasswordInput = page.getByTestId("register-confirm-password-input");
    this.submitButton = page.getByTestId("register-submit-button");

    // Links
    this.loginLink = page.getByTestId("register-login-link");

    // Error messages
    this.generalError = page.getByTestId("register-error");
    this.emailError = page.getByTestId("register-email-error");
    this.passwordError = page.getByTestId("register-password-error");
    this.confirmPasswordError = page.getByTestId("register-confirm-password-error");

    // Loading state
    this.loadingSpinner = page.getByTestId("register-loading-spinner");
  }

  /**
   * Navigate to the register page
   */
  async navigate(): Promise<void> {
    await this.goto("/register");
    await this.waitForPageLoad();
  }

  /**
   * Fill the email input
   */
  async fillEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  /**
   * Fill the password input
   */
  async fillPassword(password: string): Promise<void> {
    await this.passwordInput.fill(password);
  }

  /**
   * Fill the confirm password input
   */
  async fillConfirmPassword(password: string): Promise<void> {
    await this.confirmPasswordInput.fill(password);
  }

  /**
   * Submit the registration form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Click the login link
   */
  async clickLoginLink(): Promise<void> {
    await this.loginLink.click();
  }

  /**
   * Complete registration flow with provided credentials
   */
  async register(email: string, password: string): Promise<void> {
    // Wait for form to be fully interactive (React hydrated)
    await this.page.waitForLoadState("networkidle");
    await this.emailInput.click();

    // Use pressSequentially for controlled React inputs to ensure values are set
    await this.emailInput.pressSequentially(email, { delay: 50 });
    await this.passwordInput.click();
    await this.passwordInput.pressSequentially(password, { delay: 50 });
    await this.confirmPasswordInput.click();
    await this.confirmPasswordInput.pressSequentially(password, { delay: 50 });

    // Verify form is valid before submitting (email error should not exist)
    await expect(this.emailError).not.toBeAttached();
    await this.submitButton.click();
  }

  /**
   * Verify the page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageContainer).toBeVisible();
    await expect(this.card).toBeVisible();
    await expect(this.title).toHaveText("Create an account");
  }

  /**
   * Verify email validation error is displayed
   */
  async verifyEmailError(expectedMessage: string): Promise<void> {
    await expect(this.emailError).toBeVisible({ timeout: 5000 });
    await expect(this.emailError).toHaveText(expectedMessage);
  }

  /**
   * Verify password validation error is displayed
   */
  async verifyPasswordError(expectedMessage: string): Promise<void> {
    await expect(this.passwordError).toBeVisible({ timeout: 5000 });
    await expect(this.passwordError).toHaveText(expectedMessage);
  }

  /**
   * Verify confirm password validation error is displayed
   */
  async verifyConfirmPasswordError(expectedMessage: string): Promise<void> {
    await expect(this.confirmPasswordError).toBeVisible({ timeout: 5000 });
    await expect(this.confirmPasswordError).toHaveText(expectedMessage);
  }

  /**
   * Verify general error is displayed
   */
  async verifyGeneralError(expectedMessage: string): Promise<void> {
    await expect(this.generalError).toBeVisible();
    await expect(this.generalError).toHaveText(expectedMessage);
  }

  /**
   * Verify loading spinner is displayed
   */
  async verifyLoading(): Promise<void> {
    await expect(this.loadingSpinner).toBeVisible();
  }

  /**
   * Verify submit button is disabled
   */
  async verifySubmitDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Verify submit button is enabled
   */
  async verifySubmitEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }
}
