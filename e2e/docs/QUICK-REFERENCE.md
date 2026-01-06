# E2E Testing Quick Reference Card

## 🚀 New Test Template

```typescript
import { test, expect } from "../fixtures";
import { TestApiClient } from "../utils/api-helpers";
import { FlashcardBuilder } from "../utils/test-data-builders";
import { CustomAssertions, TestLogger } from "../utils/custom-assertions";

test.describe("Feature Name", () => {
  test("should do something", async ({ 
    page, 
    libraryPage, 
    createDialog,
    navbar,
    authenticatedUser  // Auto-login!
  }) => {
    // Test code here - already authenticated!
  });
});
```

## 📦 Available Fixtures

Use these in your test signature:

```typescript
async ({ 
  page,              // Playwright page
  loginPage,         // LoginPage instance
  registerPage,      // RegisterPage instance
  libraryPage,       // LibraryPage instance
  generatePage,      // GeneratePage instance
  navbar,            // NavbarComponent instance
  createDialog,      // CreateManualDialogComponent instance
  authenticatedUser  // Auto-login + credentials
}) => { ... }
```

## 🏗️ Test Data Builders

### Flashcard Builder

```typescript
import { FlashcardBuilder } from "../utils/test-data-builders";

// Default flashcard
const flashcard = new FlashcardBuilder().build();

// Custom content
const flashcard = new FlashcardBuilder()
  .withFront("Question?")
  .withBack("Answer")
  .build();

// Pre-built edge cases
const flashcard = new FlashcardBuilder()
  .withLongContent()        // Long text
  .withSpecialCharacters()  // XSS test
  .withEmojis()            // Unicode test
  .withHtmlEntities()      // HTML entities
  .withMultilineText()     // Newlines
  .withMarkdown()          // Markdown-like
  .withCodeSnippet()       // Code
  .withNumbersAndSymbols() // Math
  .withMinimumLength()     // Edge case
  .build();
```

### User Builder

```typescript
import { UserBuilder } from "../utils/test-data-builders";

const user = new UserBuilder()
  .withUniqueEmail()      // Auto-generated unique
  .withStrongPassword()   // Strong password
  .build();

const user = new UserBuilder()
  .withEmail("test@example.com")
  .withPassword("password123")
  .build();
```

### Quick Helpers

```typescript
import { TestData } from "../utils/test-data-builders";

TestData.uniqueEmail()                    // "test123456@example.com"
TestData.randomString(10)                 // "aBcDeF1234"
TestData.simpleFlashcard()                // { front: "...", back: "..." }
TestData.multipleFlashcards(5)            // Array of 5 flashcards
```

## 🚀 API Helpers

### Setup

```typescript
import { TestApiClient } from "../utils/api-helpers";

const api = new TestApiClient();
await api.signIn(authenticatedUser.email, authenticatedUser.password);
```

### Operations

```typescript
// Create one flashcard
const flashcard = await api.createFlashcard("Question", "Answer");

// Create multiple
const flashcards = await api.createFlashcards([
  { front: "Q1", back: "A1" },
  { front: "Q2", back: "A2" },
]);

// Read
const flashcards = await api.getFlashcards();
const flashcard = await api.getFlashcard(id);
const count = await api.countFlashcards();

// Delete
await api.deleteFlashcard(id);
await api.deleteAllFlashcards();

// Cleanup
await api.signOut();
```

## ✅ Custom Assertions

```typescript
import { CustomAssertions } from "../utils/custom-assertions";

// Element visibility
await CustomAssertions.expectVisible(
  locator, 
  "Button", 
  "After clicking submit"
);

await CustomAssertions.expectHidden(
  locator, 
  "Dialog", 
  "After cancel"
);

// Flashcard creation
await CustomAssertions.expectFlashcardCreated(
  page,
  "Question text",
  "After form submission"
);

// Dialog state
await CustomAssertions.expectDialogState(
  dialogLocator,
  "visible",  // or "hidden"
  "Create dialog"
);

// Form validation
await CustomAssertions.expectValidationError(
  errorLocator,
  "Field is required",
  "email"
);

// Navigation
await CustomAssertions.expectNavigation(
  page,
  "/library",
  "/generate",
  "clicking library link"
);

// Element count
await CustomAssertions.expectCount(
  locator,
  5,
  "flashcard items",
  "After creating 5 flashcards"
);

// Text content
await CustomAssertions.expectToContainText(
  locator,
  "expected text",
  "success message"
);
```

## 📝 Test Logging

```typescript
import { TestLogger } from "../utils/custom-assertions";

TestLogger.step("Navigate to library");
TestLogger.action("Click add button");
TestLogger.verify("Dialog is visible");
TestLogger.error("Failed to create", error);

TestLogger.group("Setup phase");
// ... nested operations
TestLogger.groupEnd();

await TestLogger.pageState(page);  // Debug page info
```

## ⏱️ Timeouts

```typescript
import { TIMEOUTS } from "../config/timeouts";

TIMEOUTS.SHORT        // 2 seconds
TIMEOUTS.MEDIUM       // 5 seconds
TIMEOUTS.LONG         // 10 seconds
TIMEOUTS.EXTRA_LONG   // 15 seconds

// Usage
await element.waitFor({ timeout: TIMEOUTS.MEDIUM });
```

## ⏳ Wait Helpers

```typescript
import { WaitHelpers } from "../utils/wait-helpers";

const waitHelper = new WaitHelpers(page);

// Wait for page ready
await waitHelper.waitForPageReady(/\/library/);

// Wait for stable element (no animations)
await waitHelper.waitForStableElement(locator);

// Wait for form success
await waitHelper.waitForFormSuccess(successLocator);
await waitHelper.waitForFormSuccess(/\/success/);

// Wait for network
await waitHelper.waitForNetworkIdle();
await waitHelper.waitForApiCall("/api/flashcards");

// Wait for dialog
await waitHelper.waitForDialog(dialogLocator);

// Wait for element to disappear
await waitHelper.waitForElementGone(locator);

// Retry with backoff
await waitHelper.retryUntilSucceeds(
  async () => { /* action */ },
  { maxAttempts: 3, delay: 1000 }
);

// Wait for changes
await waitHelper.waitForTextChange(locator, "old text");
await waitHelper.waitForCountChange(locator, 5);
```

## 🎯 Common Patterns

### Pattern 1: Setup via API, Verify via UI

```typescript
test("display flashcards", async ({ page, authenticatedUser }) => {
  // Fast setup via API
  const api = new TestApiClient();
  await api.signIn(authenticatedUser.email, authenticatedUser.password);
  await api.createFlashcard("Question", "Answer");
  
  // Verify in UI
  await page.goto("/library");
  await CustomAssertions.expectFlashcardCreated(page, "Question");
});
```

### Pattern 2: Test Data Variations

```typescript
test.describe("Edge Cases", () => {
  const testCases = [
    { name: "special chars", builder: () => new FlashcardBuilder().withSpecialCharacters() },
    { name: "emojis", builder: () => new FlashcardBuilder().withEmojis() },
    { name: "long text", builder: () => new FlashcardBuilder().withLongContent() },
  ];
  
  for (const { name, builder } of testCases) {
    test(`should handle ${name}`, async ({ createDialog }) => {
      const flashcard = builder().build();
      await createDialog.createFlashcard(flashcard.front, flashcard.back);
    });
  }
});
```

### Pattern 3: Clean Slate Setup

```typescript
test("specific scenario", async ({ page, authenticatedUser }) => {
  const api = new TestApiClient();
  await api.signIn(authenticatedUser.email, authenticatedUser.password);
  
  // Clean slate
  await api.deleteAllFlashcards();
  
  // Create specific test data
  await api.createFlashcards(TestData.multipleFlashcards(3));
  
  // Test with known state
  await page.goto("/library");
  // ... assertions
});
```

### Pattern 4: Error Simulation

```typescript
test("handle network error", async ({ page, libraryPage }) => {
  // Simulate error
  await page.route("**/api/flashcards", route => route.abort("failed"));
  
  await libraryPage.navigate();
  // ... verify error handling
});
```

### Pattern 5: Logged Steps

```typescript
test("complete flow", async ({ page, libraryPage, createDialog }) => {
  TestLogger.step("Navigate to library");
  await libraryPage.navigate();
  
  TestLogger.step("Open create dialog");
  await libraryPage.clickAddManual();
  
  TestLogger.step("Create flashcard");
  const flashcard = new FlashcardBuilder().build();
  await createDialog.createFlashcard(flashcard.front, flashcard.back);
  
  TestLogger.verify("Flashcard created successfully");
  await CustomAssertions.expectFlashcardCreated(page, flashcard.front);
});
```

## 🔍 Debugging Tips

### Take Screenshot

```typescript
await page.screenshot({ path: "debug.png", fullPage: true });
```

### Print Page State

```typescript
await TestLogger.pageState(page);
```

### Pause Execution

```typescript
await page.pause();  // Opens Playwright Inspector
```

### Slow Down

```typescript
// In playwright.config.ts
use: {
  launchOptions: {
    slowMo: 1000  // Slow down by 1 second
  }
}
```

## 📚 Documentation

- **Full Review:** `e2e/TEST-ARTIFACTS-REVIEW.md`
- **Migration Guide:** `e2e/examples/MIGRATION-GUIDE.md`
- **Implementation Summary:** `e2e/IMPLEMENTATION-SUMMARY.md`
- **Examples:** `e2e/examples/library-improved.spec.ts`

## ⚡ Quick Commands

```bash
# Run all tests
npm run test:e2e

# Run with UI
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug

# Generate test code
npm run test:e2e:codegen

# Run specific file
npx playwright test library.spec.ts

# Run specific test
npx playwright test -g "should create flashcard"

# Run in headed mode
npx playwright test --headed

# Show report
npx playwright show-report
```

---

**Pro Tip:** Keep this file open in a split pane while writing tests! 🚀

