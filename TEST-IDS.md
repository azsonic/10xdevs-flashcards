# Test IDs Reference

> **Note:** This document provides a reference for all `data-testid` attributes used in E2E tests.  
> For comprehensive E2E testing guides, see [e2e/README.md](e2e/README.md).  
> For Page Object Model patterns, see [e2e/docs/QUICK-REFERENCE.md](e2e/docs/QUICK-REFERENCE.md).

This document lists all `data-testid` attributes used in the application for Playwright E2E tests.

## Authentication Flow Test Scenario

### Scenario Steps:

1. Click on "Sign up"
2. Provide required data
3. Click on "Create Account"
4. Wait for new window to load up (dashboard)
5. Logout
6. Wait for new window load up (login page)
7. Provide the same data used for registering
8. Wait for new window load up (dashboard)
9. Logout

---

## Page-Level Test IDs

### Login Page (`/login`)

| Element        | Test ID      | Description                   |
| -------------- | ------------ | ----------------------------- |
| Page container | `login-page` | Main container for login page |

### Register Page (`/register`)

| Element        | Test ID         | Description                      |
| -------------- | --------------- | -------------------------------- |
| Page container | `register-page` | Main container for register page |

### Dashboard Page (`/`)

| Element         | Test ID             | Description                                       |
| --------------- | ------------------- | ------------------------------------------------- |
| Welcome section | `dashboard-welcome` | Main welcome section confirming user is logged in |

---

## Navigation Bar (`Navbar.astro`)

### Guest State (Not Logged In)

| Element         | Test ID               | Description                                          |
| --------------- | --------------------- | ---------------------------------------------------- |
| Login link      | `nav-login-link`      | Link to login page                                   |
| Login button    | `nav-login-button`    | Button inside login link                             |
| Register link   | `nav-register-link`   | Link to register page (Click this to start scenario) |
| Register button | `nav-register-button` | Button inside register link                          |

### Authenticated State (Logged In)

| Element       | Test ID              | Description                                     |
| ------------- | -------------------- | ----------------------------------------------- |
| User email    | `nav-user-email`     | Display of logged-in user's email               |
| Library link  | `nav-library-link`   | Link to library page                            |
| Logout form   | `nav-logout-form`    | Form that handles logout                        |
| Logout button | `nav-logout-button`  | Button to trigger logout (Click this to logout) |

---

## LoginForm Component (`src/components/auth/LoginForm.tsx`)

### Form Elements

| Element              | Test ID                      | Description                     |
| -------------------- | ---------------------------- | ------------------------------- |
| Card container       | `login-card`                 | Main card container             |
| Title                | `login-title`                | "Login" heading                 |
| Description          | `login-description`          | Form description text           |
| Form                 | `login-form`                 | The actual form element         |
| Email input          | `login-email-input`          | Email input field               |
| Password input       | `login-password-input`       | Password input field            |
| Submit button        | `login-submit-button`        | "Login" submit button           |
| Register link        | `login-register-link`        | "Sign up" link to register page |
| Forgot password link | `login-forgot-password-link` | Link to password reset          |

### Error States

| Element        | Test ID                | Description                  |
| -------------- | ---------------------- | ---------------------------- |
| General error  | `login-error`          | Server/network error message |
| Email error    | `login-email-error`    | Email validation error       |
| Password error | `login-password-error` | Password validation error    |

### Loading States

| Element         | Test ID                 | Description                     |
| --------------- | ----------------------- | ------------------------------- |
| Loading spinner | `login-loading-spinner` | Spinner shown during submission |

---

## RegisterForm Component (`src/components/auth/RegisterForm.tsx`)

### Form Elements

| Element                | Test ID                           | Description                                           |
| ---------------------- | --------------------------------- | ----------------------------------------------------- |
| Card container         | `register-card`                   | Main card container                                   |
| Title                  | `register-title`                  | "Create an account" heading                           |
| Description            | `register-description`            | Form description text                                 |
| Form                   | `register-form`                   | The actual form element                               |
| Email input            | `register-email-input`            | Email input field (Fill this with test email)         |
| Password input         | `register-password-input`         | Password input field (Fill this with test password)   |
| Confirm password input | `register-confirm-password-input` | Confirm password field (Fill this with same password) |
| Submit button          | `register-submit-button`          | "Create account" button (Click this to register)      |
| Login link             | `register-login-link`             | "Login" link to login page                            |

### Error States

| Element                | Test ID                           | Description                  |
| ---------------------- | --------------------------------- | ---------------------------- |
| General error          | `register-error`                  | Server/network error message |
| Email error            | `register-email-error`            | Email validation error       |
| Password error         | `register-password-error`         | Password validation error    |
| Confirm password error | `register-confirm-password-error` | Password match error         |

### Loading States

| Element         | Test ID                    | Description                     |
| --------------- | -------------------------- | ------------------------------- |
| Loading spinner | `register-loading-spinner` | Spinner shown during submission |

---

## Test Scenario Mapping

### Step 1: Click on "Sign up"

```typescript
await page.getByTestId("nav-register-link").click();
// or
await page.getByTestId("nav-register-button").click();
```

### Step 2: Provide required data

```typescript
await page.getByTestId("register-email-input").fill("test@example.com");
await page.getByTestId("register-password-input").fill("password123");
await page.getByTestId("register-confirm-password-input").fill("password123");
```

### Step 3: Click on "Create Account"

```typescript
await page.getByTestId("register-submit-button").click();
```

### Step 4: Wait for dashboard to load

```typescript
await page.waitForURL("/");
await page.getByTestId("dashboard-welcome").waitFor();
// Verify user email is displayed
await expect(page.getByTestId("nav-user-email")).toBeVisible();
await expect(page.getByTestId("nav-user-email")).toHaveText("test@example.com");
```

### Step 5: Logout

```typescript
await page.getByTestId("nav-logout-button").click();
```

### Step 6: Wait for login page to load

```typescript
await page.waitForURL("/login");
await page.getByTestId("login-page").waitFor();
await page.getByTestId("login-card").waitFor();
```

### Step 7: Provide the same data

```typescript
await page.getByTestId("login-email-input").fill("test@example.com");
await page.getByTestId("login-password-input").fill("password123");
await page.getByTestId("login-submit-button").click();
```

### Step 8: Wait for dashboard to load again

```typescript
await page.waitForURL("/");
await page.getByTestId("dashboard-welcome").waitFor();
await expect(page.getByTestId("nav-user-email")).toBeVisible();
```

### Step 9: Logout again

```typescript
await page.getByTestId("nav-logout-button").click();
await page.waitForURL("/login");
```

---

## Complete Test Example

```typescript
import { test, expect } from "@playwright/test";

test("complete authentication flow", async ({ page }) => {
  // Navigate to home page
  await page.goto("/");

  // Step 1: Click on sign up
  await page.getByTestId("nav-register-button").click();

  // Step 2: Provide required data
  await page.getByTestId("register-email-input").fill("test@example.com");
  await page.getByTestId("register-password-input").fill("password123");
  await page.getByTestId("register-confirm-password-input").fill("password123");

  // Step 3: Click on Create Account
  await page.getByTestId("register-submit-button").click();

  // Step 4: Wait for new window to load up (dashboard)
  await page.waitForURL("/");
  await expect(page.getByTestId("dashboard-welcome")).toBeVisible();
  await expect(page.getByTestId("nav-user-email")).toHaveText("test@example.com");

  // Step 5: Logout
  await page.getByTestId("nav-logout-button").click();

  // Step 6: Wait for login page to load
  await page.waitForURL("/login");
  await expect(page.getByTestId("login-card")).toBeVisible();

  // Step 7: Provide the same data used for registering
  await page.getByTestId("login-email-input").fill("test@example.com");
  await page.getByTestId("login-password-input").fill("password123");
  await page.getByTestId("login-submit-button").click();

  // Step 8: Wait for dashboard to load
  await page.waitForURL("/");
  await expect(page.getByTestId("dashboard-welcome")).toBeVisible();
  await expect(page.getByTestId("nav-user-email")).toHaveText("test@example.com");

  // Step 9: Logout
  await page.getByTestId("nav-logout-button").click();
  await page.waitForURL("/login");
});
```

---

## Library Manual Creation Flow

### Scenario Steps:

1. Go to Library page
2. Click on "Add Manual" button
3. Fill in flashcard front and back
4. Click "Create" button
5. Logout

---

## Library Page Components

### LibraryToolbar (`src/components/library/LibraryToolbar.tsx`)

| Element          | Test ID                       | Description                                |
| ---------------- | ----------------------------- | ------------------------------------------ |
| Add Manual button| `library-add-manual-button`   | Button to open create manual dialog        |

### CreateManualDialog (`src/components/library/dialogs/CreateManualDialog.tsx`)

| Element          | Test ID                       | Description                                |
| ---------------- | ----------------------------- | ------------------------------------------ |
| Dialog container | `create-manual-dialog`        | Main dialog container for creating flashcard|

### FlashcardForm (`src/components/shared/forms/FlashcardForm.tsx`)

| Element          | Test ID                       | Description                                |
| ---------------- | ----------------------------- | ------------------------------------------ |
| Front textarea   | `flashcard-form-front`        | Textarea for flashcard front content       |
| Back textarea    | `flashcard-form-back`         | Textarea for flashcard back content        |
| Cancel button    | `flashcard-form-cancel`       | Button to cancel and close dialog          |
| Submit button    | `flashcard-form-submit`       | Button to submit form (Create/Save)        |

---

## Library Manual Creation Test Scenario Mapping

### Step 1: Navigate to Library

```typescript
await page.getByTestId("nav-library-link").click();
await page.waitForURL("/library");
```

### Step 2: Click "Add Manual"

```typescript
await page.getByTestId("library-add-manual-button").click();
await page.getByTestId("create-manual-dialog").waitFor();
```

### Step 3: Fill in flashcard data

```typescript
await page.getByTestId("flashcard-form-front").fill("What is React?");
await page.getByTestId("flashcard-form-back").fill("A JavaScript library for building user interfaces");
```

### Step 4: Submit the form

```typescript
await page.getByTestId("flashcard-form-submit").click();
// Wait for dialog to close and flashcard to appear in list
await page.getByTestId("create-manual-dialog").waitFor({ state: "hidden" });
```

### Step 5: Logout

```typescript
await page.getByTestId("nav-logout-button").click();
await page.waitForURL("/login");
```

---

## Complete Library Manual Creation Example

```typescript
import { test, expect } from "@playwright/test";

test("create flashcard manually and logout", async ({ page }) => {
  // Assume user is already logged in
  await page.goto("/");
  
  // Step 1: Go to library
  await page.getByTestId("nav-library-link").click();
  await page.waitForURL("/library");
  
  // Step 2: Click Add Manual
  await page.getByTestId("library-add-manual-button").click();
  await expect(page.getByTestId("create-manual-dialog")).toBeVisible();
  
  // Step 3: Fill in flashcard data
  await page.getByTestId("flashcard-form-front").fill("What is React?");
  await page.getByTestId("flashcard-form-back").fill("A JavaScript library for building user interfaces");
  
  // Step 4: Submit the form
  await page.getByTestId("flashcard-form-submit").click();
  
  // Wait for dialog to close
  await expect(page.getByTestId("create-manual-dialog")).not.toBeVisible();
  
  // Verify flashcard appears in the list (optional)
  await expect(page.getByText("What is React?")).toBeVisible();
  
  // Step 5: Logout
  await page.getByTestId("nav-logout-button").click();
  await page.waitForURL("/login");
});
```

---

## Notes

- All test IDs follow the pattern: `{component}-{element}-{type}`
- Navigation test IDs are prefixed with `nav-`
- Error messages have their own test IDs for assertion
- Loading states have dedicated test IDs for waiting/assertion
- Page containers have test IDs for page load verification

