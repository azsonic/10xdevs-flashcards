/**
 * Library E2E Tests
 *
 * These tests use a FIXED test user (E2E_USERNAME/E2E_PASSWORD from .env.test)
 * This allows proper cleanup of test data after all tests complete.
 *
 * The fixed user must exist before running tests.
 */

import { test, expect } from "@playwright/test";
import { LibraryPage, CreateManualDialogComponent, NavbarComponent, LoginPage } from "./page-objects";

// Shared test user - read once at describe level
let testUser: { email: string; password: string };

/**
 * Shared login helper for library tests
 */
async function loginAsTestUser(page: import("@playwright/test").Page, loginPage: LoginPage, navbar: NavbarComponent) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await loginPage.login(testUser.email, testUser.password);
  await page.waitForURL(/\/(generate)?/, { timeout: 15000 });
  await expect(navbar.userEmail).toBeVisible({ timeout: 5000 });
}

test.describe("Library - Manual Flashcard Creation", () => {
  let libraryPage: LibraryPage;
  let createDialog: CreateManualDialogComponent;
  let navbar: NavbarComponent;
  let loginPage: LoginPage;

  test.beforeAll(() => {
    testUser = {
      email: process.env.E2E_USERNAME || "",
      password: process.env.E2E_PASSWORD || "",
    };
    if (!testUser.email || !testUser.password) {
      throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test. See e2e/SETUP.md");
    }
  });

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page);
    createDialog = new CreateManualDialogComponent(page);
    navbar = new NavbarComponent(page);
    loginPage = new LoginPage(page);

    await loginAsTestUser(page, loginPage, navbar);
  });

  test("should create a manual flashcard and logout", async ({ page }) => {
    // Arrange - user is already logged in from beforeEach
    const flashcardData = {
      front: "What is React?",
      back: "A JavaScript library for building user interfaces",
    };

    // Navigate to library page
    await navbar.clickLibrary();
    await libraryPage.waitForLibrary();

    // Act - Open create dialog
    await libraryPage.clickAddManual();
    await createDialog.waitForDialog();
    await createDialog.verifyDialogVisible();

    // Fill in flashcard data
    await createDialog.fillFront(flashcardData.front);
    await createDialog.fillBack(flashcardData.back);

    // Submit the form
    await createDialog.submit();

    // Assert - Verify dialog closes and flashcard appears
    await createDialog.waitForDialogClose();
    await createDialog.verifyDialogHidden();
    await libraryPage.verifyFlashcardExists(flashcardData.front);

    // Logout
    await navbar.clickLogout();
    await page.waitForURL("/login");
  });

  test("should open and close create dialog using cancel", async () => {
    // Navigate to library using navbar (maintains session)
    await navbar.clickLibrary();
    await libraryPage.waitForLibrary();

    // Open dialog
    await libraryPage.clickAddManual();
    await createDialog.verifyDialogVisible();

    // Cancel without creating
    await createDialog.cancel();
    await createDialog.verifyDialogHidden();
  });

  test("should validate required fields in create dialog", async () => {
    // Navigate to library using navbar (maintains session)
    await navbar.clickLibrary();
    await libraryPage.waitForLibrary();

    // Open dialog
    await libraryPage.clickAddManual();
    await createDialog.waitForDialog();

    // Try to submit without filling fields
    await createDialog.submit();

    // Dialog should still be visible (validation failed)
    await createDialog.verifyDialogVisible();
  });

  test("should create flashcard using high-level method", async () => {
    // Navigate to library using navbar (maintains session)
    await navbar.clickLibrary();
    await libraryPage.waitForLibrary();

    // Open dialog
    await libraryPage.clickAddManual();
    await createDialog.waitForDialog();

    // Use high-level method to create flashcard
    await createDialog.createFlashcard(
      "What is TypeScript?",
      "A typed superset of JavaScript that compiles to plain JavaScript"
    );

    // Verify success
    await createDialog.waitForDialogClose();
    await libraryPage.verifyFlashcardExists("What is TypeScript?");
  });

  test("should handle long text in flashcard fields", async () => {
    // Use moderately long text that tests the functionality without overflowing the dialog
    const longFront = "This is a longer question that spans multiple words to test text handling in the front field";
    const longBack =
      "This is a comprehensive answer with multiple sentences. It tests how the dialog handles longer content.";

    // Navigate to library
    await navbar.clickLibrary();
    await libraryPage.waitForLibrary();
    await libraryPage.clickAddManual();
    await createDialog.waitForDialog();

    // Fill with long text
    await createDialog.fillFront(longFront);
    await createDialog.fillBack(longBack);

    // Verify values are set correctly
    expect(await createDialog.getFrontValue()).toBe(longFront);
    expect(await createDialog.getBackValue()).toBe(longBack);

    // Submit the form
    await createDialog.submit();
    await createDialog.waitForDialogClose();

    // Verify flashcard was created
    await libraryPage.verifyFlashcardExists(longFront.substring(0, 30));
  });
});

test.describe("Library - Navigation", () => {
  let libraryPage: LibraryPage;
  let navbar: NavbarComponent;
  let loginPage: LoginPage;

  test.beforeAll(() => {
    // Ensure testUser is initialized (may run before first describe block)
    if (!testUser?.email) {
      testUser = {
        email: process.env.E2E_USERNAME || "",
        password: process.env.E2E_PASSWORD || "",
      };
      if (!testUser.email || !testUser.password) {
        throw new Error("E2E_USERNAME and E2E_PASSWORD must be set in .env.test. See e2e/SETUP.md");
      }
    }
  });

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page);
    navbar = new NavbarComponent(page);
    loginPage = new LoginPage(page);

    await loginAsTestUser(page, loginPage, navbar);
  });

  test("should navigate to library from navbar", async ({ page }) => {
    // User is already logged in from beforeEach
    // Verify we can navigate to library
    await expect(page).toHaveURL(/\/generate/);

    // Click library link in navbar
    await navbar.clickLibrary();

    // Verify library page loaded
    await libraryPage.waitForLibrary();
    await expect(page).toHaveURL("/library");
  });

  test("should display library page elements", async () => {
    // User is already logged in from beforeEach
    await navbar.clickLibrary();
    await libraryPage.waitForLibrary();
    await libraryPage.verifyAddManualEnabled();
  });
});
