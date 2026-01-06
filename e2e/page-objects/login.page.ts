import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";
import { BasePage } from "./base.page";

/**
 * Login Page Object
 * Represents the user login page (/login)
 */
export class LoginPage extends BasePage {
  readonly pageContainer: Locator;
  readonly card: Locator;
  readonly title: Locator;
  readonly description: Locator;
  readonly form: Locator;

  // Form inputs
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  // Links
  readonly registerLink: Locator;
  readonly forgotPasswordLink: Locator;

  // Error messages
  readonly generalError: Locator;
  readonly emailError: Locator;
  readonly passwordError: Locator;

  // Loading state
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    super(page);

    this.pageContainer = page.getByTestId("login-page");
    this.card = page.getByTestId("login-card");
    this.title = page.getByTestId("login-title");
    this.description = page.getByTestId("login-description");
    this.form = page.getByTestId("login-form");

    // Form inputs
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");

    // Links
    this.registerLink = page.getByTestId("login-register-link");
    this.forgotPasswordLink = page.getByTestId("login-forgot-password-link");

    // Error messages
    this.generalError = page.getByTestId("login-error");
    this.emailError = page.getByTestId("login-email-error");
    this.passwordError = page.getByTestId("login-password-error");

    // Loading state
    this.loadingSpinner = page.getByTestId("login-loading-spinner");
  }

  /**
   * Navigate to the login page
   */
  async navigate(): Promise<void> {
    await this.goto("/login");
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
   * Submit the login form
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Click the register link
   */
  async clickRegisterLink(): Promise<void> {
    await this.registerLink.click();
  }

  /**
   * Click the forgot password link
   */
  async clickForgotPasswordLink(): Promise<void> {
    await this.forgotPasswordLink.click();
  }

  /**
   * Wait for the login form to be ready (React hydrated)
   */
  async waitForFormReady(): Promise<void> {
    await expect(this.form).toBeVisible();
    await expect(this.submitButton).toBeEnabled();
  }

  /**
   * Complete login flow with provided credentials
   * Handles React hydration and form interaction
   */
  async login(email: string, password: string): Promise<void> {
    await this.waitForFormReady();
    // Use scoped locators within the form to avoid navbar button conflict
    await this.form.getByLabel("Email").fill(email);
    await this.form.getByLabel("Password").fill(password);
    await this.form.getByRole("button", { name: "Login" }).click();
  }

  /**
   * Verify the page is loaded
   */
  async verifyPageLoaded(): Promise<void> {
    await expect(this.pageContainer).toBeVisible();
    await expect(this.card).toBeVisible();
    await expect(this.title).toHaveText("Login");
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
