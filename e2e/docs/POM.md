# Page Object Model (POM) Documentation

This document describes the Page Object Model implementation for E2E tests in the 10xDevs Flashcards application.

## Overview

The Page Object Model (POM) is a design pattern that creates an object repository for web UI elements. It helps make tests more maintainable, reusable, and readable by separating test logic from page structure.

## Architecture

```
e2e/
├── page-objects/
│   ├── index.ts                          # Central export point
│   ├── base.page.ts                      # Base page class with common functionality
│   ├── navbar.component.ts               # Navbar component (used across all pages)
│   ├── login.page.ts                     # Login page (/login)
│   ├── register.page.ts                  # Register page (/register)
│   ├── dashboard.page.ts                 # Dashboard page (/)
│   ├── generate.page.ts                  # Generate page (/generate)
│   ├── library.page.ts                   # Library page (/library)
│   └── create-manual-dialog.component.ts # Create manual dialog component
├── utils/
│   └── test-helpers.ts                   # Utility functions for tests
├── auth.spec.ts                          # Authentication flow tests
└── library.spec.ts                       # Library flow tests
```

## Page Objects

### BasePage (`base.page.ts`)

Base class that all page objects extend. Provides common functionality:

**Key Methods:**

- `goto(path: string)` - Navigate to a URL
- `waitForPageLoad()` - Wait for page to load
- `getByTestId(testId: string)` - Get element by test ID
- `waitForURL(path: string)` - Wait for URL to match
- `getCurrentURL()` - Get current URL
- `screenshot(options)` - Take screenshot

**Usage:**

```typescript
export class MyPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }
}
```

---

### NavbarComponent (`navbar.component.ts`)

Represents the navigation bar component present on all pages.

**Elements:**

- Guest state: `loginLink`, `loginButton`, `registerLink`, `registerButton`
- Authenticated state: `userEmail`, `libraryLink`, `logoutForm`, `logoutButton`

**Key Methods:**

- `clickLogin()` - Navigate to login page
- `clickRegister()` - Navigate to register page
- `clickLibrary()` - Navigate to library page
- `clickLogout()` - Logout user
- `verifyUserLoggedIn(email: string)` - Verify user is authenticated
- `verifyUserLoggedOut()` - Verify user is not authenticated
- `isUserLoggedIn()` - Check authentication status
- `getUserEmail()` - Get displayed user email

**Usage:**

```typescript
const navbar = new NavbarComponent(page);
await navbar.clickRegister();
await navbar.verifyUserLoggedIn("test@example.com");
```

---

### RegisterPage (`register.page.ts`)

Represents the registration page at `/register`.

**Elements:**

- Form inputs: `emailInput`, `passwordInput`, `confirmPasswordInput`, `submitButton`
- Links: `loginLink`
- Errors: `generalError`, `emailError`, `passwordError`, `confirmPasswordError`
- Loading: `loadingSpinner`

**Key Methods:**

- `navigate()` - Go to register page
- `fillEmail(email: string)` - Fill email field
- `fillPassword(password: string)` - Fill password field
- `fillConfirmPassword(password: string)` - Fill confirm password field
- `submit()` - Submit the form
- `register(email: string, password: string)` - Complete registration flow
- `verifyPageLoaded()` - Verify page is loaded
- `verifyEmailError(message: string)` - Verify email validation error
- `verifyPasswordError(message: string)` - Verify password validation error
- `verifyConfirmPasswordError(message: string)` - Verify confirm password error
- `verifyGeneralError(message: string)` - Verify general error message

**Usage:**

```typescript
const registerPage = new RegisterPage(page);
await registerPage.navigate();
await registerPage.register("test@example.com", "password123");
```

---

### LoginPage (`login.page.ts`)

Represents the login page at `/login`.

**Elements:**

- Form inputs: `emailInput`, `passwordInput`, `submitButton`
- Links: `registerLink`, `forgotPasswordLink`
- Errors: `generalError`, `emailError`, `passwordError`
- Loading: `loadingSpinner`

**Key Methods:**

- `navigate()` - Go to login page
- `fillEmail(email: string)` - Fill email field
- `fillPassword(password: string)` - Fill password field
- `submit()` - Submit the form
- `login(email: string, password: string)` - Complete login flow
- `verifyPageLoaded()` - Verify page is loaded
- `verifyEmailError(message: string)` - Verify email validation error
- `verifyPasswordError(message: string)` - Verify password validation error
- `verifyGeneralError(message: string)` - Verify general error message
- `clickRegisterLink()` - Navigate to register page
- `clickForgotPasswordLink()` - Navigate to forgot password page

**Usage:**

```typescript
const loginPage = new LoginPage(page);
await loginPage.navigate();
await loginPage.login("test@example.com", "password123");
```

---

### DashboardPage (`dashboard.page.ts`)

Represents the main dashboard/home page at `/`.

**Elements:**

- `welcomeSection` - Main welcome section

**Key Methods:**

- `navigate()` - Go to dashboard
- `verifyPageLoaded()` - Verify page is loaded
- `waitForDashboard()` - Wait for dashboard after authentication

**Usage:**

```typescript
const dashboardPage = new DashboardPage(page);
await dashboardPage.waitForDashboard();
await dashboardPage.verifyPageLoaded();
```

---

### LibraryPage (`library.page.ts`)

Represents the flashcard library page at `/library`.

**Elements:**

- Main elements: `pageContainer`, `pageTitle`, `pageDescription`
- Actions: `addManualButton`, `searchInput`

**Key Methods:**

- `navigate()` - Go to library page
- `verifyPageLoaded()` - Verify page is loaded
- `waitForLibrary()` - Wait for library after navigation
- `clickAddManual()` - Open create manual dialog
- `search(query: string)` - Search for flashcards
- `verifyAddManualEnabled()` - Verify add button is enabled
- `verifyAddManualDisabled()` - Verify add button is disabled
- `verifyFlashcardExists(frontText: string)` - Verify flashcard exists in list

**Usage:**

```typescript
const libraryPage = new LibraryPage(page);
await libraryPage.navigate();
await libraryPage.clickAddManual();
await libraryPage.verifyFlashcardExists("What is React?");
```

---

### CreateManualDialogComponent (`create-manual-dialog.component.ts`)

Represents the create manual flashcard dialog component.

**Elements:**

- Dialog elements: `dialog`, `dialogTitle`, `dialogDescription`
- Form inputs: `frontInput`, `backInput`
- Actions: `cancelButton`, `submitButton`

**Key Methods:**

- `verifyDialogVisible()` - Verify dialog is shown
- `verifyDialogHidden()` - Verify dialog is hidden
- `waitForDialog()` - Wait for dialog to appear
- `waitForDialogClose()` - Wait for dialog to close
- `fillFront(text: string)` - Fill front field
- `fillBack(text: string)` - Fill back field
- `submit()` - Submit the form
- `cancel()` - Cancel and close dialog
- `createFlashcard(front: string, back: string)` - Complete creation flow
- `verifySubmitEnabled()` - Verify submit button is enabled
- `verifySubmitDisabled()` - Verify submit button is disabled
- `verifySubmitSaving()` - Verify saving state
- `getFrontValue()` - Get front input value
- `getBackValue()` - Get back input value

**Usage:**

```typescript
const createDialog = new CreateManualDialogComponent(page);
await libraryPage.clickAddManual();
await createDialog.waitForDialog();
await createDialog.createFlashcard("Question", "Answer");
await createDialog.waitForDialogClose();
```

---

## Test Examples

### Complete Authentication Flow

```typescript
import { test } from "@playwright/test";
import { LoginPage, RegisterPage, DashboardPage, NavbarComponent } from "./page-objects";

test("complete auth cycle", async ({ page }) => {
  const registerPage = new RegisterPage(page);
  const loginPage = new LoginPage(page);
  const dashboardPage = new DashboardPage(page);
  const navbar = new NavbarComponent(page);

  // Register
  await page.goto("/");
  await navbar.clickRegister();
  await registerPage.register("test@example.com", "password123");

  // Verify logged in
  await dashboardPage.waitForDashboard();
  await navbar.verifyUserLoggedIn("test@example.com");

  // Logout
  await navbar.clickLogout();
  await loginPage.verifyPageLoaded();

  // Login
  await loginPage.login("test@example.com", "password123");
  await dashboardPage.waitForDashboard();

  // Logout again
  await navbar.clickLogout();
});
```

### Validation Testing

```typescript
test("should validate email format", async ({ page }) => {
  const loginPage = new LoginPage(page);

  await loginPage.navigate();
  await loginPage.fillEmail("invalid-email");
  await loginPage.fillPassword("password123");
  await loginPage.emailInput.blur();

  await loginPage.verifyEmailError("Invalid email address");
});
```

---

## Best Practices

### 1. Initialize Page Objects in beforeEach

```typescript
test.describe("My Tests", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
  });

  test("test case", async () => {
    await loginPage.navigate();
    // ...
  });
});
```

### 2. Use High-Level Methods

✅ **Good:**

```typescript
await registerPage.register(email, password);
```

❌ **Bad:**

```typescript
await registerPage.fillEmail(email);
await registerPage.fillPassword(password);
await registerPage.fillConfirmPassword(password);
await registerPage.submit();
```

### 3. Keep Test Logic in Tests, Not in Page Objects

Page objects should provide actions and verifications, but test logic should remain in test files.

✅ **Good:**

```typescript
// In test file
test("should allow registration", async () => {
  await registerPage.register(email, password);
  await dashboardPage.verifyPageLoaded();
  await navbar.verifyUserLoggedIn(email);
});
```

❌ **Bad:**

```typescript
// In page object
async registerAndVerify(email: string, password: string) {
  await this.register(email, password);
  const dashboard = new DashboardPage(this.page);
  await dashboard.verifyPageLoaded();
  // Too much logic in page object
}
```

### Complete Library Manual Creation Flow

```typescript
import { test } from "@playwright/test";
import { LibraryPage, CreateManualDialogComponent, NavbarComponent } from "./page-objects";

test("should create manual flashcard and logout", async ({ page }) => {
  const libraryPage = new LibraryPage(page);
  const createDialog = new CreateManualDialogComponent(page);
  const navbar = new NavbarComponent(page);

  // Navigate to library
  await page.goto("/");
  await navbar.clickLibrary();
  await libraryPage.waitForLibrary();

  // Open create dialog
  await libraryPage.clickAddManual();
  await createDialog.waitForDialog();

  // Create flashcard
  await createDialog.createFlashcard("What is React?", "A JavaScript library for building user interfaces");

  // Verify success
  await createDialog.waitForDialogClose();
  await libraryPage.verifyFlashcardExists("What is React?");

  // Logout
  await navbar.clickLogout();
  await page.waitForURL("/login");
});
```

### 4. Use Descriptive Method Names

- `clickLoginButton()` instead of `click()`
- `verifyUserLoggedIn()` instead of `check()`
- `fillEmail()` instead of `input()`

### 5. Return Page Objects for Fluent Interface (Optional)

```typescript
async fillEmail(email: string): Promise<this> {
  await this.emailInput.fill(email);
  return this;
}

// Usage:
await loginPage
  .fillEmail(email)
  .fillPassword(password)
  .submit();
```

---

## Test Data Management

Use the test utilities for generating unique test data:

```typescript
import { testUtils } from "./utils/test-helpers";

const testUser = {
  email: testUtils.generateRandomEmail(), // test1234567890@example.com
  password: "TestPassword123!",
};
```

---

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/auth.spec.ts

# Run in UI mode
npx playwright test --ui

# Run with headed browser
npx playwright test --headed

# Generate test report
npx playwright show-report
```

---

## Test IDs Reference

All page objects use `data-test-id` attributes for element selection. See `TEST-IDS.md` for complete reference.

**Convention:** `{component}-{element}-{type}`

Examples:

- `login-email-input`
- `register-submit-button`
- `nav-logout-button`
- `dashboard-welcome`

---

## Extending POM

### Adding a New Page Object

1. Create a new file in `e2e/page-objects/`
2. Extend `BasePage`
3. Define locators in constructor
4. Add methods for interactions and verifications
5. Export from `index.ts`

**Example:**

```typescript
import { Page, Locator, expect } from "@playwright/test";
import { BasePage } from "./base.page";

export class ForgotPasswordPage extends BasePage {
  readonly emailInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.getByTestId("forgot-password-email-input");
    this.submitButton = page.getByTestId("forgot-password-submit-button");
  }

  async navigate(): Promise<void> {
    await this.goto("/forgot-password");
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.submitButton.click();
  }
}
```

---

## Troubleshooting

### Element Not Found

- Verify the element has a `data-test-id` attribute
- Check `TEST-IDS.md` for correct test ID name
- Ensure the page is loaded before accessing elements

### Timing Issues

- Use `waitForPageLoad()` after navigation
- Use `waitForURL()` to verify page transitions
- Add explicit waits with `expect(element).toBeVisible()`

### Test Flakiness

- Initialize page objects in `beforeEach`
- Use unique test data for each test
- Avoid hardcoded waits; use Playwright's built-in waiting mechanisms

---

## Related Documentation

- [TEST-IDS.md](../TEST-IDS.md) - Complete test ID reference
- [PLAYWRIGHT-GUIDE.md](../PLAYWRIGHT-GUIDE.md) - Playwright setup and configuration
- [TESTING.md](../TESTING.md) - Overall testing strategy
