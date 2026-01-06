import type { Page, Locator } from "@playwright/test";
import { expect } from "@playwright/test";

/**
 * Navbar Component Page Object
 * Represents the navigation bar component present on all pages
 */
export class NavbarComponent {
  readonly page: Page;

  // Guest state elements
  readonly loginLink: Locator;
  readonly loginButton: Locator;
  readonly registerLink: Locator;
  readonly registerButton: Locator;

  // Authenticated state elements
  readonly userEmail: Locator;
  readonly libraryLink: Locator;
  readonly logoutForm: Locator;
  readonly logoutButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Guest state
    this.loginLink = page.getByTestId("nav-login-link");
    this.loginButton = page.getByTestId("nav-login-button");
    this.registerLink = page.getByTestId("nav-register-link");
    this.registerButton = page.getByTestId("nav-register-button");

    // Authenticated state
    this.userEmail = page.getByTestId("nav-user-email");
    this.libraryLink = page.getByTestId("nav-library-link");
    this.logoutForm = page.getByTestId("nav-logout-form");
    this.logoutButton = page.getByTestId("nav-logout-button");
  }

  /**
   * Click on the login button
   */
  async clickLogin(): Promise<void> {
    await this.loginLink.click();
  }

  /**
   * Click on the register button
   */
  async clickRegister(): Promise<void> {
    await this.registerLink.click();
  }

  /**
   * Click on the library link
   */
  async clickLibrary(): Promise<void> {
    await this.libraryLink.click();
  }

  /**
   * Click on the logout button
   */
  async clickLogout(): Promise<void> {
    await this.logoutButton.click();
  }

  /**
   * Verify user is logged in with correct email
   */
  async verifyUserLoggedIn(email: string): Promise<void> {
    await expect(this.userEmail).toBeVisible();
    await expect(this.userEmail).toHaveText(email);
  }

  /**
   * Verify user is logged out (guest state)
   */
  async verifyUserLoggedOut(): Promise<void> {
    await expect(this.userEmail).not.toBeVisible();
    await expect(this.loginButton).toBeVisible();
    await expect(this.registerButton).toBeVisible();
  }

  /**
   * Check if user is logged in
   */
  async isUserLoggedIn(): Promise<boolean> {
    return await this.userEmail.isVisible();
  }

  /**
   * Get the displayed user email
   */
  async getUserEmail(): Promise<string> {
    return (await this.userEmail.textContent()) || "";
  }
}
