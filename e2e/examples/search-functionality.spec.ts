/**
 * EXAMPLE: Search Functionality Tests
 * Demonstrates testing a feature that was previously untested
 */

import { test, expect } from "../fixtures";
import { TestApiClient } from "../utils/api-helpers";
import { TestData } from "../utils/test-data-builders";
import { CustomAssertions, TestLogger } from "../utils/custom-assertions";

test.describe("Library - Search Functionality", () => {
  test.beforeEach(async ({ authenticatedUser }) => {
    // Setup test data via API
    const api = new TestApiClient();
    await api.signIn(authenticatedUser.email, authenticatedUser.password);

    // Clean slate
    await api.deleteAllFlashcards();

    // Create diverse flashcards for search testing
    await api.createFlashcards([
      { front: "What is React?", back: "A JavaScript library" },
      { front: "What is TypeScript?", back: "A typed superset of JavaScript" },
      { front: "What is Python?", back: "A high-level programming language" },
      { front: "Explain closures in JavaScript", back: "Functions that retain access to outer scope" },
      { front: "What is Docker?", back: "A containerization platform" },
    ]);
  });

  test("should filter flashcards by search query", async ({ page, libraryPage }) => {
    TestLogger.step("Navigate to library");
    await page.goto("/library");
    await libraryPage.waitForLibrary();

    TestLogger.step("Search for 'React'");
    await libraryPage.search("React");

    // Should show only React flashcard
    await CustomAssertions.expectFlashcardCreated(page, "What is React?");

    // Should not show other flashcards
    await expect(page.getByText("What is TypeScript?")).not.toBeVisible();
    await expect(page.getByText("What is Python?")).not.toBeVisible();
  });

  test("should search case-insensitively", async ({ page, libraryPage }) => {
    await page.goto("/library");
    await libraryPage.waitForLibrary();

    // Search with different cases
    await libraryPage.search("javascript");

    // Should find "JavaScript" flashcards regardless of case
    await CustomAssertions.expectFlashcardCreated(page, "What is React?");
    await CustomAssertions.expectFlashcardCreated(page, "Explain closures in JavaScript");
  });

  test("should search in both front and back text", async ({ page, libraryPage }) => {
    await page.goto("/library");
    await libraryPage.waitForLibrary();

    // Search for text that appears in back content
    await libraryPage.search("containerization");

    await CustomAssertions.expectFlashcardCreated(page, "What is Docker?");
  });

  test("should show all flashcards when search is cleared", async ({ page, libraryPage }) => {
    await page.goto("/library");
    await libraryPage.waitForLibrary();

    // First search to filter
    await libraryPage.search("React");
    await CustomAssertions.expectFlashcardCreated(page, "What is React?");

    // Clear search
    await libraryPage.search("");

    // Should show all flashcards again
    await CustomAssertions.expectFlashcardCreated(page, "What is React?");
    await CustomAssertions.expectFlashcardCreated(page, "What is TypeScript?");
    await CustomAssertions.expectFlashcardCreated(page, "What is Python?");
  });

  test("should show no results message when search has no matches", async ({ page, libraryPage }) => {
    await page.goto("/library");
    await libraryPage.waitForLibrary();

    await libraryPage.search("NonexistentFlashcard12345");

    // Should show appropriate message
    const noResults = page.getByText(/no.*flashcards.*found/i);
    await CustomAssertions.expectVisible(noResults, "No results message", "After search with no matches");
  });

  test("should maintain search across page interactions", async ({ page, libraryPage, createDialog }) => {
    await page.goto("/library");
    await libraryPage.waitForLibrary();

    // Set search filter
    await libraryPage.search("React");

    // Open and close dialog
    await libraryPage.clickAddManual();
    await createDialog.cancel();

    // Search should still be active
    const searchInput = libraryPage.searchInput;
    await expect(searchInput).toHaveValue("React");

    // Filtered results should still show
    await CustomAssertions.expectFlashcardCreated(page, "What is React?");
  });

  test("should debounce search input", async ({ page, libraryPage }) => {
    await page.goto("/library");
    await libraryPage.waitForLibrary();

    // Track API calls
    let searchCallCount = 0;
    await page.route("**/api/flashcards**", (route) => {
      searchCallCount++;
      route.continue();
    });

    // Type quickly (simulating real user typing)
    await libraryPage.searchInput.type("TypeScript", { delay: 50 });

    // Wait for debounce
    await page.waitForTimeout(500);

    // Should not make a call for every keystroke
    expect(searchCallCount).toBeLessThan(10); // "TypeScript" has 10 characters
  });

  test("should handle special characters in search", async ({ page, libraryPage }) => {
    await page.goto("/library");
    await libraryPage.waitForLibrary();

    // Search with special characters
    await libraryPage.search("What is React?");

    // Should still find the flashcard
    await CustomAssertions.expectFlashcardCreated(page, "What is React?");
  });

  test("should show count of filtered results", async ({ page, libraryPage }) => {
    await page.goto("/library");
    await libraryPage.waitForLibrary();

    await libraryPage.search("JavaScript");

    // Get count of visible flashcards
    const flashcardItems = page.locator("[data-flashcard-item]");
    await CustomAssertions.expectCount(flashcardItems, 2, "JavaScript flashcards", "After filtering");
  });
});

test.describe("Library - Search Performance", () => {
  test("should handle large result sets efficiently", async ({ page, libraryPage, authenticatedUser }) => {
    TestLogger.step("Create 50 flashcards via API");
    const api = new TestApiClient();
    await api.signIn(authenticatedUser.email, authenticatedUser.password);

    await api.deleteAllFlashcards();

    // Create many flashcards
    const manyFlashcards = TestData.multipleFlashcards(50);
    await api.createFlashcards(manyFlashcards);

    TestLogger.step("Load library page");
    const startTime = Date.now();
    await page.goto("/library");
    await libraryPage.waitForLibrary();
    const loadTime = Date.now() - startTime;

    TestLogger.action(`Page loaded in ${loadTime}ms`);

    // Page should load in reasonable time
    expect(loadTime).toBeLessThan(5000);

    TestLogger.step("Perform search");
    const searchStart = Date.now();
    await libraryPage.search("Question 1");
    await page.waitForLoadState("networkidle");
    const searchTime = Date.now() - searchStart;

    TestLogger.action(`Search completed in ${searchTime}ms`);

    // Search should be fast
    expect(searchTime).toBeLessThan(2000);
  });
});
