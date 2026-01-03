# E2E Testing with Playwright

This directory contains End-to-End (E2E) tests for the 10xDevs Flashcards application using Playwright and the Page Object Model (POM) pattern.

## 📁 Directory Structure

```
e2e/
├── page-objects/          # Page Object Model classes
│   ├── index.ts          # Central export point
│   ├── base.page.ts      # Base page class
│   ├── navbar.component.ts
│   ├── login.page.ts
│   ├── register.page.ts
│   └── dashboard.page.ts
│
├── utils/                # Test utilities
│   └── test-helpers.ts   # Helper functions
│
├── auth.spec.ts          # Authentication flow tests
├── example.spec.ts       # Example test file
├── POM.md                # Page Object Model documentation
└── README.md             # This file
```

## 🚀 Quick Start

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npx playwright test e2e/auth.spec.ts
```

### Run in UI Mode (Interactive)
```bash
npx playwright test --ui
```

### Run with Headed Browser
```bash
npx playwright test --headed
```

### Generate Test Report
```bash
npx playwright show-report
```

## 📖 Documentation

- **[POM.md](./POM.md)** - Complete Page Object Model documentation
- **[TEST-IDS.md](../TEST-IDS.md)** - Test ID reference for all components
- **[PLAYWRIGHT-GUIDE.md](../PLAYWRIGHT-GUIDE.md)** - Playwright configuration and setup

## 🎯 Test Coverage

### Authentication Flow (`auth.spec.ts`)
- ✅ User registration (US-001)
- ✅ User login (US-002)
- ✅ User logout (US-003)
- ✅ Complete authentication cycle
- ✅ Email validation
- ✅ Password validation
- ✅ Navigation between pages

## 🏗️ Page Object Model

This project uses the Page Object Model (POM) pattern for maintainable and reusable test code.

### Available Page Objects

| Class | Description | Path |
|-------|-------------|------|
| `BasePage` | Base class with common functionality | `page-objects/base.page.ts` |
| `NavbarComponent` | Navigation bar (all pages) | `page-objects/navbar.component.ts` |
| `LoginPage` | Login page (`/login`) | `page-objects/login.page.ts` |
| `RegisterPage` | Registration page (`/register`) | `page-objects/register.page.ts` |
| `DashboardPage` | Dashboard (`/`) | `page-objects/dashboard.page.ts` |

### Example Usage

```typescript
import { test } from "@playwright/test";
import { LoginPage, NavbarComponent, DashboardPage } from "./page-objects";

test("user can login", async ({ page }) => {
  const loginPage = new LoginPage(page);
  const navbar = new NavbarComponent(page);
  const dashboardPage = new DashboardPage(page);

  // Navigate and login
  await loginPage.navigate();
  await loginPage.login("test@example.com", "password123");

  // Verify
  await dashboardPage.waitForDashboard();
  await navbar.verifyUserLoggedIn("test@example.com");
});
```

## 🧪 Writing New Tests

### 1. Create Test File

Create a new file in the `e2e/` directory:

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from "@playwright/test";
import { LoginPage, DashboardPage } from "./page-objects";

test.describe("My Feature", () => {
  test("should do something", async ({ page }) => {
    // Your test here
  });
});
```

### 2. Use Page Objects

Import and initialize page objects in your tests:

```typescript
let loginPage: LoginPage;

test.beforeEach(async ({ page }) => {
  loginPage = new LoginPage(page);
});
```

### 3. Follow POM Best Practices

- ✅ Use high-level methods (`login()` instead of `fillEmail()` + `fillPassword()` + `submit()`)
- ✅ Keep test logic in test files, not in page objects
- ✅ Use descriptive method names
- ✅ Use test IDs for element selection

See [POM.md](./POM.md) for detailed guidelines.

## 🔧 Test Utilities

### Generate Test Data

```typescript
import { testUtils } from "./utils/test-helpers";

const email = testUtils.generateRandomEmail();  // test1234567890@example.com
const username = testUtils.generateRandomUsername();  // user1234567890
```

### Custom Expectations

```typescript
import { customExpect } from "./utils/test-helpers";

await customExpect.toHaveTextAndBeVisible(locator, "Expected Text");
await customExpect.toBeClickable(locator);
```

## 📝 Test IDs

All elements use `data-test-id` attributes for reliable selection:

```typescript
// Using page objects (recommended)
await loginPage.emailInput.fill("test@example.com");

// Direct access (if needed)
await page.getByTestId("login-email-input").fill("test@example.com");
```

See [TEST-IDS.md](../TEST-IDS.md) for complete reference.

## 🎨 Test Patterns

### Authentication Required

```typescript
test.describe("Protected Feature", () => {
  test.beforeEach(async ({ page }) => {
    const registerPage = new RegisterPage(page);
    const dashboardPage = new DashboardPage(page);
    
    // Setup: Register and login
    await page.goto("/");
    await registerPage.register(email, password);
    await dashboardPage.waitForDashboard();
  });

  test("can access protected feature", async ({ page }) => {
    // Test your protected feature
  });
});
```

### Test Isolation

Each test should be independent:

```typescript
test("test 1", async ({ page }) => {
  const email = testUtils.generateRandomEmail();  // Unique per test
  // ...
});

test("test 2", async ({ page }) => {
  const email = testUtils.generateRandomEmail();  // Different email
  // ...
});
```

### Error Handling

```typescript
test("should show error for invalid credentials", async ({ page }) => {
  const loginPage = new LoginPage(page);
  
  await loginPage.navigate();
  await loginPage.login("wrong@example.com", "wrongpassword");
  
  await loginPage.verifyGeneralError("Invalid login credentials");
});
```

## 🐛 Debugging

### View Trace

When a test fails, a trace is automatically saved:

```bash
npx playwright show-trace test-results/.../trace.zip
```

### Run with Debug Mode

```bash
npx playwright test --debug
```

### Take Screenshots

```typescript
// Using page directly
await page.screenshot({ path: 'screenshot.png' });

// Using page object
await loginPage.screenshot({ path: 'login-page.png', fullPage: true });
```

## 📊 Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

The report includes:
- Test results (pass/fail)
- Execution time
- Screenshots on failure
- Trace files for debugging

## 🔄 CI/CD Integration

Tests run automatically on:
- Pull requests
- Commits to main branch

See `.github/workflows/` for CI configuration.

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Page Object Model Pattern](https://playwright.dev/docs/pom)
- [Best Practices](https://playwright.dev/docs/best-practices)

## 🤝 Contributing

When adding new tests:

1. Follow the POM pattern
2. Add test IDs to new elements
3. Update documentation
4. Run linter: `npm run lint`
5. Ensure all tests pass

---

For detailed POM documentation, see [POM.md](./POM.md)

