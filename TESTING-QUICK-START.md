# Testing Quick Start

Quick reference for running and writing tests in this project.

## 🚀 Running Tests

### Unit Tests (Vitest)
```bash
npm test                  # Run once
npm run test:watch       # Watch mode
npm run test:ui          # Interactive UI
npm run test:coverage    # With coverage
```

### E2E Tests (Playwright)
```bash
npm run test:e2e         # Run all E2E tests
npm run test:e2e:ui      # Interactive UI mode
npm run test:e2e:debug   # Debug mode
npm run test:e2e:codegen # Generate test code
```

## ✍️ Writing Tests

### Unit Test Template

Create file: `src/[feature]/[name].test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Feature Name', () => {
  it('should do something', () => {
    // Arrange
    const input = 'value';
    
    // Act
    const result = functionToTest(input);
    
    // Assert
    expect(result).toBe('expected');
  });
});
```

### E2E Test Template

Create file: `e2e/[feature].spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should complete user flow', async ({ page }) => {
    await page.goto('/');
    
    await page.click('[data-testid="button"]');
    
    await expect(page.locator('[data-testid="result"]')).toBeVisible();
  });
});
```

## 🛠️ Useful Mocks

```typescript
import { 
  createMockSupabaseClient,
  createMockApiResponse 
} from '@/test/mocks/factories';

// Mock Supabase
const mockClient = createMockSupabaseClient();
mockClient.auth.signIn.mockResolvedValue({ data: { user }, error: null });

// Mock API response
const response = createMockApiResponse({ id: '123' });
```

## 📋 Common Patterns

### Test React Component
```typescript
import { render, screen } from '@testing-library/react';
import { Component } from './Component';

it('should render component', () => {
  render(<Component />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Test User Interaction
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('should handle click', async () => {
  const user = userEvent.setup();
  render(<Button />);
  
  await user.click(screen.getByRole('button'));
  
  expect(screen.getByText('Clicked')).toBeVisible();
});
```

### Page Object Model
```typescript
import { HomePage } from './page-objects/BasePage';

test('should navigate', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.navigate();
  
  expect(await homePage.isLoaded()).toBe(true);
});
```

## 🐛 Debugging

### Unit Tests
```bash
# Run specific test
npm test -- src/test/example.test.ts

# Run tests matching name
npm test -- -t "login"

# UI mode (recommended)
npm run test:ui
```

### E2E Tests
```bash
# Debug mode (step through)
npm run test:e2e:debug

# UI mode (interactive)
npm run test:e2e:ui

# View last report
npx playwright show-report
```

## 📚 Documentation

- Full guide: `TESTING.md`
- Setup summary: `.ai/testing-setup-summary.md`
- Vitest docs: https://vitest.dev/
- Playwright docs: https://playwright.dev/

