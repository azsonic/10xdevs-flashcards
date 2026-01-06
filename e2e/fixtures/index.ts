/**
 * Playwright Test Fixtures
 * Provides reusable test setup and automatic page object initialization
 */

/* eslint-disable react-hooks/rules-of-hooks */
import { test as base } from "@playwright/test";
import {
  LoginPage,
  RegisterPage,
  LibraryPage,
  NavbarComponent,
  GeneratePage,
  CreateManualDialogComponent,
} from "../page-objects";

/**
 * Extended test fixtures with automatic page object initialization
 */
interface TestFixtures {
  loginPage: LoginPage;
  registerPage: RegisterPage;
  libraryPage: LibraryPage;
  generatePage: GeneratePage;
  navbar: NavbarComponent;
  createDialog: CreateManualDialogComponent;
  authenticatedUser: { email: string; password: string };
}

export const test = base.extend<TestFixtures>({
  // Page object fixtures - automatically initialized
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },

  registerPage: async ({ page }, use) => {
    await use(new RegisterPage(page));
  },

  libraryPage: async ({ page }, use) => {
    await use(new LibraryPage(page));
  },

  generatePage: async ({ page }, use) => {
    await use(new GeneratePage(page));
  },

  navbar: async ({ page }, use) => {
    await use(new NavbarComponent(page));
  },

  createDialog: async ({ page }, use) => {
    await use(new CreateManualDialogComponent(page));
  },

  /**
   * Authenticated user fixture
   * Automatically logs in before test and logs out after
   */
  authenticatedUser: async ({ page, loginPage, navbar }, use) => {
    const testUser = {
      email: process.env.E2E_USERNAME || "",
      password: process.env.E2E_PASSWORD || "",
    };

    if (!testUser.email || !testUser.password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test. See e2e/SETUP.md");
    }

    // Login before test
    await page.goto("/login", { waitUntil: "networkidle" });
    await loginPage.login(testUser.email, testUser.password);
    await page.waitForURL(/\/(generate)?/, { timeout: 15000 });
    await navbar.userEmail.waitFor({ state: "visible", timeout: 5000 });

    // Provide user credentials to test
    await use(testUser);

    // Automatic cleanup: Logout after test
    if (await navbar.isUserLoggedIn()) {
      await navbar.clickLogout();
      await page.waitForURL("/login", { timeout: 5000 });
    }
  },
});

export { expect } from "@playwright/test";
