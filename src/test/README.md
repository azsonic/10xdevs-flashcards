# Testing Strategy & Guidelines

## Overview

This directory contains all unit and integration tests for the 10xdevs-flashcards application. Our testing strategy follows the testing pyramid principle: heavy focus on unit tests, moderate integration tests, and selective E2E tests.

## Testing Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /----\     - Critical user journeys
     /      \    - Full system integration
    /--------\   
   /          \  Integration Tests (20%)
  /------------\ - API endpoints with DB
 /              \- Service interactions
/----------------\- Middleware testing
__________________
                  Unit Tests (70%)
                  - Business logic
                  - Components
                  - Services
                  - Pure functions
```

## Directory Structure

```
src/test/
├── README.md                    ← This file
├── setup.ts                     ← Global test setup
│
├── unit/                        ← Unit tests (isolated, mocked)
│   ├── lib/                     ← Business logic & services
│   ├── components/              ← React components
│   │   ├── auth/
│   │   ├── generation/
│   │   ├── library/
│   │   └── shared/
│   └── hooks/                   ← Custom React hooks
│
├── integration/                 ← Integration tests (real dependencies)
│   ├── api/                     ← API endpoint tests
│   │   ├── auth/
│   │   ├── flashcards/
│   │   └── generation/
│   ├── services/                ← Service integration tests
│   └── middleware/              ← Middleware tests
│
├── fixtures/                    ← Shared test data
├── builders/                    ← Test data builders
├── mocks/                       ← Mock implementations
├── utils/                       ← Test utilities
└── examples/                    ← Example tests & patterns
```

## Test Categories

### Unit Tests (`src/test/unit/`)

**Purpose:** Test individual units in complete isolation

**Characteristics:**
- ✅ Fast (< 100ms per test)
- ✅ No external dependencies
- ✅ All dependencies mocked
- ✅ Deterministic results
- ✅ Test one thing at a time

**What to Test:**
- Pure functions (validation, calculations)
- Business logic (service methods)
- Component behavior (rendering, interactions)
- Custom hooks
- Utility functions

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { validateFlashcardContent } from '@/lib/validation';

describe('validateFlashcardContent', () => {
  it('should validate correct content', () => {
    const result = validateFlashcardContent('Question', 'Answer');
    expect(result.isValid).toBe(true);
  });
});
```

### Integration Tests (`src/test/integration/`)

**Purpose:** Test multiple units working together with real dependencies

**Characteristics:**
- ⚡ Moderate speed (< 5s per test)
- 🔌 Real database/Supabase connections
- 📦 Multiple units tested together
- 🎯 Test interactions between layers

**What to Test:**
- API endpoints with database
- Service methods with Supabase
- Middleware with request/response
- Database queries and transactions

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { GET } from '@/pages/api/flashcards/index';

describe('GET /api/flashcards', () => {
  it('should return user flashcards', async () => {
    const response = await GET(mockContext);
    expect(response.status).toBe(200);
  });
});
```

## Writing Tests

### AAA Pattern (Arrange-Act-Assert)

Always structure tests with three clear sections:

```typescript
it('should do something', () => {
  // ========== ARRANGE ==========
  // Set up test data and mocks
  const flashcard = new FlashcardBuilder()
    .withFront('Question')
    .build();

  // ========== ACT ==========
  // Perform the action being tested
  const result = processFlashcard(flashcard);

  // ========== ASSERT ==========
  // Verify the outcome
  expect(result).toBe(expected);
});
```

### Using Test Utilities

#### 1. Test Data Builders

Use builders instead of manual object creation:

```typescript
import { FlashcardBuilder } from '@/test/builders';

// ❌ Don't: Manual creation
const flashcard = {
  id: 1,
  user_id: 'test',
  front: 'Q',
  back: 'A',
  // ... 10 more fields
};

// ✅ Do: Use builder
const flashcard = new FlashcardBuilder()
  .withFront('Q')
  .withBack('A')
  .build();
```

#### 2. Shared Fixtures

Use fixtures for common test data:

```typescript
import { VALID_FLASHCARD, AI_GENERATED_FLASHCARD } from '@/test/fixtures';

it('should display flashcard', () => {
  render(<Card flashcard={VALID_FLASHCARD} />);
});
```

#### 3. Mock Builders

Use mock builders for external dependencies:

```typescript
import { createMockSupabase } from '@/test/mocks';

const supabase = createMockSupabase()
  .withSuccessfulSignIn()
  .build();
```

#### 4. Wait Helpers

Use wait helpers for async operations:

```typescript
import { waitForAsync, waitForCondition } from '@/test/utils';

await waitForAsync(100);
await waitForCondition(() => value === expected);
```

## Test Naming Conventions

### File Names

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.ts`
- Location: Same directory structure as source code

### Test Names

Use descriptive names that explain what is being tested:

```typescript
// ❌ Bad
it('works', () => {});
it('test 1', () => {});

// ✅ Good
it('should display error when login fails', () => {});
it('should disable save button when form is invalid', () => {});
it('should trim whitespace before saving', () => {});
```

### Describe Blocks

Organize tests with nested describe blocks:

```typescript
describe('FlashcardService', () => {
  describe('createFlashcard', () => {
    describe('Success cases', () => {
      it('should create manual flashcard', () => {});
      it('should create AI-generated flashcard', () => {});
    });

    describe('Error cases', () => {
      it('should throw error when content is empty', () => {});
      it('should throw error when content exceeds max length', () => {});
    });
  });
});
```

## Best Practices

### Do's ✅

1. **Test behavior, not implementation**
   ```typescript
   // ✅ Test what it does
   expect(screen.getByText('Welcome')).toBeInTheDocument();
   
   // ❌ Don't test how it does it
   expect(component.state.message).toBe('Welcome');
   ```

2. **Keep tests isolated**
   - No shared state between tests
   - Each test should run independently
   - Use `beforeEach` for setup

3. **Test edge cases**
   - Empty inputs
   - Maximum values
   - Null/undefined
   - Special characters
   - Error conditions

4. **Use descriptive assertions**
   ```typescript
   // ✅ Clear expectation
   expect(flashcards).toHaveLength(5);
   expect(error.message).toContain('Invalid input');
   
   // ❌ Vague expectation
   expect(flashcards.length > 0).toBe(true);
   ```

5. **Mock external dependencies**
   - Database calls
   - API requests
   - File system operations
   - Date/time functions

### Don'ts ❌

1. **Don't test implementation details**
   ```typescript
   // ❌ Testing internal state
   expect(component.state.isLoading).toBe(false);
   
   // ✅ Testing behavior
   expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
   ```

2. **Don't have dependencies between tests**
   ```typescript
   // ❌ Test depends on previous test
   let userId;
   it('should create user', () => { userId = 123; });
   it('should get user', () => { getUser(userId); }); // BAD!
   
   // ✅ Each test is independent
   it('should get user', () => {
     const userId = 123;
     getUser(userId);
   });
   ```

3. **Don't use real external services**
   - Always mock database calls in unit tests
   - Use test database for integration tests
   - Never hit production services

4. **Don't make slow unit tests**
   - No setTimeout delays
   - No real HTTP requests
   - No file I/O operations

## Running Tests

### All Tests
```bash
npm test                      # Run all unit & integration tests
npm run test:all              # Run unit, integration, AND e2e tests
```

### By Category
```bash
npm run test:unit             # Run only unit tests
npm run test:integration      # Run only integration tests
npm run test:e2e              # Run only E2E tests
```

### Watch Mode
```bash
npm run test:watch            # Watch all tests
npm run test:watch:unit       # Watch unit tests
npm run test:watch:integration # Watch integration tests
```

### Coverage
```bash
npm run test:coverage         # Coverage for all tests
npm run test:coverage:unit    # Coverage for unit tests only
```

### UI Mode
```bash
npm run test:ui               # Visual test runner
```

### Specific Tests
```bash
# Run specific file
npm test -- src/test/unit/lib/validation.test.ts

# Run tests matching pattern
npm test -- -t "should validate"

# Run in specific directory
npm test -- src/test/unit/components
```

## Coverage Targets

| Category | Target | Priority |
|----------|--------|----------|
| Overall | 80% | Required |
| Business Logic | 90% | Critical |
| Services | 85% | High |
| Components | 75% | Medium |
| API Endpoints | 90% | Critical |
| Middleware | 80% | High |
| Utilities | 90% | High |

## Examples

See `src/test/examples/` for complete working examples:

- `using-new-patterns.test.ts` - All patterns demonstrated
- Look at existing tests in `unit/` and `integration/` for real examples

## Troubleshooting

### Tests Are Slow

1. Check if unit tests have real dependencies (should be mocked)
2. Use `npm run test:unit` to isolate slow tests
3. Profile with `npm run test:ui`

### Tests Are Flaky

1. Look for race conditions
2. Check for shared state between tests
3. Ensure proper cleanup in `afterEach`
4. Use wait helpers for async operations

### Import Errors

1. Check path aliases in `vitest.config.ts`
2. Verify `@/` alias points to `./src`
3. Use absolute imports: `@/lib/utils` not `../../../lib/utils`

### Mock Issues

1. Ensure mocks are properly reset between tests
2. Check mock is called before assertions
3. Use `vi.clearAllMocks()` in `beforeEach`

## Resources

### Internal Documentation
- [Main Test Review](../../TEST-STRUCTURE-REVIEW.md) - Complete analysis
- [Quick Start Guide](../../TEST-IMPROVEMENTS-QUICKSTART.md) - Implementation guide
- [E2E Testing Guide](../../e2e/README.md) - E2E patterns (excellent reference!)

### External Resources
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Getting Help

1. Check this README first
2. Look at example tests in `src/test/examples/`
3. Review E2E tests for patterns (very well organized!)
4. Consult TEST-STRUCTURE-REVIEW.md for detailed guidance

---

**Remember:** Good tests are an investment that pays dividends in confidence, maintainability, and development speed.

**Quick Start:** Check out `src/test/examples/using-new-patterns.test.ts` for working examples of all patterns!

