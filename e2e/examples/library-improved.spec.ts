/**
 * EXAMPLE: Improved Library Tests Using New Fixtures and Helpers
 * This demonstrates how to use the new testing utilities
 *
 * Compare with: e2e/library.spec.ts
 */

import { test, expect } from "../fixtures";
import { TestApiClient } from "../utils/api-helpers";
import { FlashcardBuilder, TestData } from "../utils/test-data-builders";
import { CustomAssertions, TestLogger } from "../utils/custom-assertions";
import { WaitHelpers } from "../utils/wait-helpers";

test.describe("Library - Manual Flashcard Creation (Improved)", () => {
  /**
   * IMPROVEMENT: No beforeEach needed!
   * Fixtures automatically provide page objects and authentication
   */
  test("should create a manual flashcard", async ({ page, libraryPage, createDialog, navbar }) => {
    TestLogger.step("Navigate to library");
    await navbar.clickLibrary();
    await libraryPage.waitForLibrary();

    TestLogger.step("Open create dialog");
    await libraryPage.clickAddManual();
    await createDialog.waitForDialog();

    TestLogger.step("Fill flashcard data using builder");
    const flashcard = new FlashcardBuilder().withFront("What is React?").withBack("A JavaScript library").build();

    await createDialog.createFlashcard(flashcard.front, flashcard.back);

    TestLogger.step("Verify flashcard was created");
    await createDialog.waitForDialogClose();
    await CustomAssertions.expectFlashcardCreated(page, flashcard.front, "After manual creation");

    // No need to manually logout - fixture handles it!
  });

  test("should create flashcard with special characters", async ({ page, libraryPage, createDialog }) => {
    const flashcard = new FlashcardBuilder().withSpecialCharacters().build();

    await libraryPage.navigate();
    await libraryPage.clickAddManual();
    await createDialog.createFlashcard(flashcard.front, flashcard.back);

    await CustomAssertions.expectFlashcardCreated(page, flashcard.front);
  });

  test("should handle long text content", async ({ libraryPage, createDialog }) => {
    const flashcard = new FlashcardBuilder().withLongContent().build();

    await libraryPage.navigate();
    await libraryPage.clickAddManual();

    await createDialog.fillFront(flashcard.front);
    await createDialog.fillBack(flashcard.back);

    // Verify values are set correctly
    const frontValue = await createDialog.getFrontValue();
    const backValue = await createDialog.getBackValue();

    expect(frontValue).toBe(flashcard.front);
    expect(backValue).toBe(flashcard.back);

    await createDialog.submit();
    await createDialog.waitForDialogClose();
  });

  test("should create flashcard with emojis", async ({ page, libraryPage, createDialog }) => {
    const flashcard = new FlashcardBuilder().withEmojis().build();

    await libraryPage.navigate();
    await libraryPage.clickAddManual();
    await createDialog.createFlashcard(flashcard.front, flashcard.back);
    await createDialog.waitForDialogClose();

    await CustomAssertions.expectFlashcardCreated(page, flashcard.front);
  });
});

test.describe("Library - Dialog Interaction (Improved)", () => {
  test("should open and close create dialog using cancel", async ({ libraryPage, createDialog, navbar }) => {
    await navbar.clickLibrary();
    await libraryPage.waitForLibrary();

    await libraryPage.clickAddManual();
    await CustomAssertions.expectDialogState(createDialog.dialog, "visible", "Create flashcard dialog");

    await createDialog.cancel();
    await CustomAssertions.expectDialogState(createDialog.dialog, "hidden", "Create flashcard dialog");
  });

  test("should validate required fields", async ({ page, libraryPage, createDialog, navbar }) => {
    await navbar.clickLibrary();
    await libraryPage.waitForLibrary();

    await libraryPage.clickAddManual();
    await createDialog.waitForDialog();

    // Try to submit without filling fields
    await createDialog.submit();

    // Use wait helper to ensure form is still visible after validation
    const waitHelper = new WaitHelpers(page);
    await waitHelper.waitForStableElement(createDialog.dialog);

    await CustomAssertions.expectDialogState(createDialog.dialog, "visible", "Create dialog after validation error");
  });
});

test.describe("Library - API Integration (New!)", () => {
  /**
   * IMPROVEMENT: Use API for setup, UI for verification
   * This is much faster than creating flashcards through UI
   */
  test("should display flashcards created via API", async ({ page, libraryPage, authenticatedUser }) => {
    TestLogger.step("Create flashcard via API (faster)");
    const api = new TestApiClient();
    await api.signIn(authenticatedUser.email, authenticatedUser.password);

    const flashcard = new FlashcardBuilder().withFront("API Created Flashcard").withBack("Via API").build();

    const created = await api.createFlashcard(flashcard.front, flashcard.back);
    TestLogger.action(`Created flashcard with ID: ${created.id}`);

    TestLogger.step("Verify flashcard appears in UI");
    await page.goto("/library");
    await libraryPage.waitForLibrary();

    await CustomAssertions.expectFlashcardCreated(page, flashcard.front, "After API creation");

    TestLogger.step("Verify via API");
    const flashcards = await api.getFlashcards();
    expect(flashcards).toContainEqual(expect.objectContaining({ id: created.id }));
  });

  test("should display multiple flashcards created via API", async ({ page, libraryPage, authenticatedUser }) => {
    const api = new TestApiClient();
    await api.signIn(authenticatedUser.email, authenticatedUser.password);

    // Create multiple flashcards quickly via API
    const testFlashcards = TestData.multipleFlashcards(5);
    await api.createFlashcards(testFlashcards);

    await page.goto("/library");
    await libraryPage.waitForLibrary();

    // Verify all flashcards appear
    for (const fc of testFlashcards) {
      await CustomAssertions.expectFlashcardCreated(page, fc.front);
    }
  });

  test("should verify flashcard count matches API", async ({ page, libraryPage, authenticatedUser }) => {
    const api = new TestApiClient();
    await api.signIn(authenticatedUser.email, authenticatedUser.password);

    // Clean slate
    await api.deleteAllFlashcards();

    // Create known number of flashcards
    const flashcards = TestData.multipleFlashcards(3);
    await api.createFlashcards(flashcards);

    await page.goto("/library");
    await libraryPage.waitForLibrary();

    // Count flashcards in UI
    const flashcardElements = page.locator("[data-flashcard-item]");
    await CustomAssertions.expectCount(flashcardElements, 3, "flashcard items", "After creating 3 via API");

    // Verify API count matches
    const apiCount = await api.countFlashcards();
    expect(apiCount).toBe(3);
  });
});

test.describe("Library - Error Handling (New!)", () => {
  test("should handle network errors gracefully", async ({ page, libraryPage, createDialog, navbar }) => {
    // Simulate network failure
    await page.route("**/api/flashcards", (route) => {
      route.abort("failed");
    });

    await navbar.clickLibrary();
    await libraryPage.waitForLibrary();

    await libraryPage.clickAddManual();
    await createDialog.createFlashcard("Test", "Test");

    // Should show error message
    const errorMessage = page.locator('[role="alert"]');
    await CustomAssertions.expectVisible(errorMessage, "Error alert", "After network failure");
  });

  test("should handle API errors with proper messages", async ({ page, libraryPage, createDialog, navbar }) => {
    // Simulate API error response
    await page.route("**/api/flashcards", (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Internal server error" }),
      });
    });

    await navbar.clickLibrary();
    await libraryPage.waitForLibrary();

    await libraryPage.clickAddManual();
    await createDialog.createFlashcard("Test", "Test");

    // Should show error
    const errorAlert = page.locator('[role="alert"]');
    await CustomAssertions.expectVisible(errorAlert, "Error alert", "After API error");
  });
});
