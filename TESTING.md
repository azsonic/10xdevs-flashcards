# Testing Guide

This document provides comprehensive information about the testing setup and guidelines for the 10xdevs-flashcards project.

## Overview

The project uses two testing frameworks:
- **Vitest** - For unit and integration tests
- **Playwright** - For end-to-end (E2E) tests

## Tech Stack

- **Vitest 4** - Fast unit testing framework with Jest-compatible API
- **React Testing Library** - Testing utilities for React components
- **@testing-library/jest-dom** - Custom matchers for DOM assertions
- **Playwright** - Reliable E2E testing framework
- **jsdom** - DOM implementation for Node.js (used by Vitest)

## Directory Structure

```
project-root/
├── src/
│   └── test/
│       ├── setup.ts              # Vitest global setup
│       ├── example.test.ts       # Example unit test
│       ├── mocks/
│       │   └── factories.ts      # Mock factories
│       └── utils/
│           └── test-helpers.ts   # Test utilities
├── e2e/
│   ├── example.spec.ts           # Example E2E test
│   ├── page-objects/
│   │   └── BasePage.ts          # Page Object Model base class
│   └── utils/
│       └── test-helpers.ts      # E2E test utilities
├── vitest.config.ts              # Vitest configuration
└── playwright.config.ts          # Playwright configuration
```

## Unit Testing with Vitest

### Running Tests

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Writing Unit Tests

Create test files with `.test.ts` or `.spec.ts` extension:

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Component or Function', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Key Guidelines

1. **Use `vi` object for mocks** - `vi.fn()`, `vi.spyOn()`, `vi.stubGlobal()`
2. **Master `vi.mock()` factory patterns** - Place at top level
3. **Create setup files** - For reusable configuration
4. **Use inline snapshots** - `expect(value).toMatchInlineSnapshot()`
5. **Configure jsdom** - Already set in `vitest.config.ts`
6. **Structure tests** - Use Arrange-Act-Assert pattern
7. **TypeScript type checking** - Enable strict typing

### Example Unit Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { createMockSupabaseClient } from '@/test/mocks/factories';

describe('Authentication Service', () => {
  it('should sign in user successfully', async () => {
    // Arrange
    const mockClient = createMockSupabaseClient();
    mockClient.auth.signInWithPassword.mockResolvedValue({
      data: { user: { id: '123' } },
      error: null,
    });

    // Act
    const result = await mockClient.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'password',
    });

    // Assert
    expect(result.data.user).toBeDefined();
    expect(mockClient.auth.signInWithPassword).toHaveBeenCalledTimes(1);
  });
});
```

## E2E Testing with Playwright

### Running E2E Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI mode
npm run test:e2e:ui

# Run E2E tests in debug mode
npm run test:e2e:debug

# Generate test code with codegen
npm run test:e2e:codegen
```

### Writing E2E Tests

Create test files with `.spec.ts` extension in the `e2e/` directory:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should perform action', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
```

### Key Guidelines

1. **Use Chromium only** - Configuration uses Desktop Chrome
2. **Browser contexts** - For test isolation
3. **Page Object Model** - For maintainable tests
4. **Use locators** - For resilient element selection
5. **API testing** - For backend validation
6. **Visual comparison** - `expect(page).toHaveScreenshot()`
7. **Codegen tool** - For test recording
8. **Trace viewer** - For debugging failures
9. **Test hooks** - Setup and teardown
10. **Parallel execution** - Enabled by default

### Example E2E Test with Page Object Model

```typescript
import { test, expect } from '@playwright/test';
import { HomePage } from './page-objects/BasePage';

test.describe('Homepage Tests', () => {
  test('should load homepage successfully', async ({ page }) => {
    const homePage = new HomePage(page);
    
    await homePage.navigate();
    await homePage.waitForPageLoad();
    
    expect(await homePage.isLoaded()).toBe(true);
  });
});
```

## Configuration Files

### vitest.config.ts

- **Environment**: jsdom (for DOM testing)
- **Setup files**: `src/test/setup.ts`
- **Coverage**: v8 provider with text, JSON, and HTML reporters
- **Excludes**: node_modules, dist, .astro, e2e

### playwright.config.ts

- **Test directory**: `./e2e`
- **Base URL**: `http://localhost:4321`
- **Browser**: Chromium (Desktop Chrome)
- **Parallel execution**: Enabled
- **Retries**: 2 in CI, 0 locally
- **Trace**: On first retry
- **Screenshots**: On failure

## Test Utilities

### Unit Test Helpers (`src/test/utils/test-helpers.ts`)

- `delay(ms)` - Create async delays
- `generateTestData` - Generate random test data
- `createMockEvent()` - Create mock event objects
- `waitFor()` - Wait for conditions

### Unit Test Mocks (`src/test/mocks/factories.ts`)

- `createMockSupabaseClient()` - Mock Supabase client
- `createMockFetchResponse()` - Mock fetch responses
- `createMockApiResponse()` - Mock API responses

### E2E Test Helpers (`e2e/utils/test-helpers.ts`)

- `customExpect.toHaveTextAndBeVisible()` - Combined assertions
- `customExpect.toBeClickable()` - Clickability check
- `testUtils.generateRandomEmail()` - Random email generator
- `testUtils.generateRandomUsername()` - Random username generator

## Best Practices

### Unit Tests

1. **Test behavior, not implementation** - Focus on what code does, not how
2. **Keep tests isolated** - No shared state between tests
3. **Use descriptive test names** - "should do X when Y happens"
4. **Mock external dependencies** - Database, APIs, etc.
5. **Test edge cases** - Empty inputs, errors, boundaries
6. **Keep tests fast** - Unit tests should run in milliseconds

### E2E Tests

1. **Test user journeys** - Complete flows from start to finish
2. **Use data-testid attributes** - For stable element selection
3. **Wait for elements properly** - Use Playwright's auto-waiting
4. **Test critical paths first** - Authentication, core features
5. **Keep tests independent** - Each test should work in isolation
6. **Use fixtures for setup** - Reusable test data and state

## Debugging

### Unit Tests

```bash
# Run specific test file
npm test -- src/test/example.test.ts

# Run tests matching pattern
npm test -- -t "authentication"

# Run with UI for visual debugging
npm run test:ui
```

### E2E Tests

```bash
# Run in debug mode (step through tests)
npm run test:e2e:debug

# Run with UI mode (interactive)
npm run test:e2e:ui

# View trace after failure
npx playwright show-report
```

## Coverage

Run tests with coverage:

```bash
npm run test:coverage
```

Coverage reports are generated in:
- **Terminal**: Summary view
- **HTML**: `coverage/index.html`
- **JSON**: `coverage/coverage-final.json`

Coverage thresholds and configuration can be adjusted in `vitest.config.ts`.

## CI/CD Integration

The test setup is configured for CI environments:
- Playwright retries tests 2 times in CI
- Uses single worker in CI for stability
- Generates HTML reports for test results

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [React Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)

## Getting Help

For questions or issues with testing:
1. Check the documentation above
2. Review existing test examples
3. Check the configuration files
4. Consult the official documentation for the testing frameworks

