# Library Page Object Model Documentation

This document describes the Page Object Model implementation for the Library manual flashcard creation flow.

## Overview

The Library POM includes page objects and component classes for testing the flashcard library functionality, specifically:

- Navigating to the library page
- Opening the create manual dialog
- Creating a flashcard manually
- Verifying flashcard creation
- Logging out after creation

## Architecture

```
e2e/
├── page-objects/
│   ├── library.page.ts                   # Library page object
│   ├── create-manual-dialog.component.ts # Create dialog component
│   └── navbar.component.ts               # Updated with library link
└── library.spec.ts                       # Library test suite
```

## Page Objects

### 1. LibraryPage

**File:** `e2e/page-objects/library.page.ts`

**Purpose:** Represents the flashcard library page (`/library`)

**Key Elements:**
- `pageTitle` - "Flashcard Library" heading
- `pageDescription` - Page description text
- `addManualButton` - Button to open create dialog (test-id: `library-add-manual-button`)
- `searchInput` - Search input field

**Key Methods:**

| Method | Description |
|--------|-------------|
| `navigate()` | Navigate to `/library` |
| `verifyPageLoaded()` | Verify page elements are visible |
| `waitForLibrary()` | Wait for page to fully load after navigation |
| `clickAddManual()` | Click the Add Manual button |
| `search(query)` | Search for flashcards |
| `verifyAddManualEnabled()` | Assert Add Manual button is enabled |
| `verifyAddManualDisabled()` | Assert Add Manual button is disabled |
| `verifyFlashcardExists(frontText)` | Verify flashcard appears in list |

**Usage Example:**

```typescript
const libraryPage = new LibraryPage(page);
await libraryPage.navigate();
await libraryPage.verifyPageLoaded();
await libraryPage.clickAddManual();
```

---

### 2. CreateManualDialogComponent

**File:** `e2e/page-objects/create-manual-dialog.component.ts`

**Purpose:** Represents the create manual flashcard dialog

**Key Elements:**
- `dialog` - Dialog container (test-id: `create-manual-dialog`)
- `dialogTitle` - "Create Flashcard" heading
- `frontInput` - Front textarea (test-id: `flashcard-form-front`)
- `backInput` - Back textarea (test-id: `flashcard-form-back`)
- `cancelButton` - Cancel button (test-id: `flashcard-form-cancel`)
- `submitButton` - Submit button (test-id: `flashcard-form-submit`)

**Key Methods:**

| Method | Description |
|--------|-------------|
| `verifyDialogVisible()` | Assert dialog is shown |
| `verifyDialogHidden()` | Assert dialog is hidden |
| `waitForDialog()` | Wait for dialog to appear |
| `waitForDialogClose()` | Wait for dialog to close |
| `fillFront(text)` | Fill the front field |
| `fillBack(text)` | Fill the back field |
| `submit()` | Click submit button |
| `cancel()` | Click cancel button |
| `createFlashcard(front, back)` | **High-level:** Fill both fields and submit |
| `verifySubmitEnabled()` | Assert submit button is enabled |
| `verifySubmitDisabled()` | Assert submit button is disabled |
| `verifySubmitSaving()` | Assert button shows "Saving..." |
| `getFrontValue()` | Get front input value |
| `getBackValue()` | Get back input value |

**Usage Example:**

```typescript
const createDialog = new CreateManualDialogComponent(page);
await createDialog.waitForDialog();
await createDialog.createFlashcard("Question", "Answer");
await createDialog.waitForDialogClose();
```

---

### 3. NavbarComponent (Updated)

**File:** `e2e/page-objects/navbar.component.ts`

**New Addition:** Library navigation link

**New Element:**
- `libraryLink` - Link to library page (test-id: `nav-library-link`)

**New Method:**
- `clickLibrary()` - Navigate to library page

**Usage Example:**

```typescript
const navbar = new NavbarComponent(page);
await navbar.clickLibrary();
await libraryPage.waitForLibrary();
```

---

## Test Scenario: Create Manual Flashcard and Logout

### Complete Flow

```typescript
import { test } from "@playwright/test";
import { LibraryPage, CreateManualDialogComponent, NavbarComponent } from "./page-objects";

test("should create manual flashcard and logout", async ({ page }) => {
  // 1. Initialize page objects
  const libraryPage = new LibraryPage(page);
  const createDialog = new CreateManualDialogComponent(page);
  const navbar = new NavbarComponent(page);

  // 2. Navigate to library
  await page.goto("/");
  await navbar.clickLibrary();
  await libraryPage.waitForLibrary();

  // 3. Open create dialog
  await libraryPage.clickAddManual();
  await createDialog.waitForDialog();
  await createDialog.verifyDialogVisible();

  // 4. Fill in flashcard data
  await createDialog.fillFront("What is React?");
  await createDialog.fillBack("A JavaScript library for building user interfaces");

  // 5. Submit the form
  await createDialog.submit();

  // 6. Verify success
  await createDialog.waitForDialogClose();
  await libraryPage.verifyFlashcardExists("What is React?");

  // 7. Logout
  await navbar.clickLogout();
  await page.waitForURL("/login");
});
```

### Using High-Level Method

```typescript
test("should create flashcard using high-level method", async ({ page }) => {
  const libraryPage = new LibraryPage(page);
  const createDialog = new CreateManualDialogComponent(page);

  await page.goto("/library");
  await libraryPage.verifyPageLoaded();

  // Open dialog
  await libraryPage.clickAddManual();
  await createDialog.waitForDialog();

  // Use high-level method
  await createDialog.createFlashcard(
    "What is TypeScript?",
    "A typed superset of JavaScript"
  );

  // Verify
  await createDialog.waitForDialogClose();
  await libraryPage.verifyFlashcardExists("What is TypeScript?");
});
```

---

## Test ID Reference

All test IDs used in the library flow:

| Element | Test ID | Location |
|---------|---------|----------|
| Library nav link | `nav-library-link` | Navbar |
| Add Manual button | `library-add-manual-button` | Library page |
| Create dialog | `create-manual-dialog` | Dialog container |
| Front input | `flashcard-form-front` | Dialog form |
| Back input | `flashcard-form-back` | Dialog form |
| Cancel button | `flashcard-form-cancel` | Dialog form |
| Submit button | `flashcard-form-submit` | Dialog form |
| Logout button | `nav-logout-button` | Navbar |

See `TEST-IDS.md` for complete reference.

---

## Additional Test Examples

### Test: Cancel Dialog

```typescript
test("should close dialog using cancel", async ({ page }) => {
  const libraryPage = new LibraryPage(page);
  const createDialog = new CreateManualDialogComponent(page);

  await page.goto("/library");
  await libraryPage.clickAddManual();
  await createDialog.verifyDialogVisible();

  await createDialog.cancel();
  await createDialog.verifyDialogHidden();
});
```

### Test: Validation

```typescript
test("should validate required fields", async ({ page }) => {
  const libraryPage = new LibraryPage(page);
  const createDialog = new CreateManualDialogComponent(page);

  await page.goto("/library");
  await libraryPage.clickAddManual();
  await createDialog.waitForDialog();

  // Try to submit without filling fields
  await createDialog.submit();

  // Dialog should still be visible (validation failed)
  await createDialog.verifyDialogVisible();
});
```

### Test: Long Text

```typescript
test("should handle maximum length text", async ({ page }) => {
  const libraryPage = new LibraryPage(page);
  const createDialog = new CreateManualDialogComponent(page);

  const longFront = "A".repeat(200); // Max length
  const longBack = "B".repeat(500); // Max length

  await page.goto("/library");
  await libraryPage.clickAddManual();
  await createDialog.waitForDialog();

  await createDialog.fillFront(longFront);
  await createDialog.fillBack(longBack);

  // Verify values
  await expect(await createDialog.getFrontValue()).toBe(longFront);
  await expect(await createDialog.getBackValue()).toBe(longBack);

  await createDialog.submit();
  await createDialog.waitForDialogClose();
});
```

---

## Running Tests

```bash
# Run all library tests
npx playwright test e2e/library.spec.ts

# Run specific test
npx playwright test e2e/library.spec.ts -g "should create manual flashcard"

# Run in UI mode
npx playwright test e2e/library.spec.ts --ui

# Run with headed browser
npx playwright test e2e/library.spec.ts --headed

# Debug mode
npx playwright test e2e/library.spec.ts --debug
```

---

## Best Practices

### 1. Use High-Level Methods for Common Flows

✅ **Good:**
```typescript
await createDialog.createFlashcard("Question", "Answer");
```

❌ **Bad:**
```typescript
await createDialog.fillFront("Question");
await createDialog.fillBack("Answer");
await createDialog.submit();
```

### 2. Always Wait for Dialog State Changes

✅ **Good:**
```typescript
await libraryPage.clickAddManual();
await createDialog.waitForDialog(); // Wait for dialog to appear
await createDialog.createFlashcard("Q", "A");
await createDialog.waitForDialogClose(); // Wait for dialog to close
```

❌ **Bad:**
```typescript
await libraryPage.clickAddManual();
await createDialog.createFlashcard("Q", "A"); // May fail if dialog not ready
```

### 3. Initialize Page Objects in beforeEach

```typescript
test.describe("Library Tests", () => {
  let libraryPage: LibraryPage;
  let createDialog: CreateManualDialogComponent;
  let navbar: NavbarComponent;

  test.beforeEach(async ({ page }) => {
    libraryPage = new LibraryPage(page);
    createDialog = new CreateManualDialogComponent(page);
    navbar = new NavbarComponent(page);
  });

  test("test case", async () => {
    // Use page objects
  });
});
```

---

## Related Documentation

- [POM.md](./POM.md) - Complete POM documentation
- [TEST-IDS.md](../TEST-IDS.md) - All test IDs reference
- [PLAYWRIGHT-GUIDE.md](../PLAYWRIGHT-GUIDE.md) - Playwright setup

