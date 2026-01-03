# Running Playwright E2E Tests

## Port Configuration

- **Dev Server**: `http://localhost:3000` (uses `.env`)
- **E2E Server**: `http://localhost:3001` (uses `.env.test`)

This separation allows:

- Running dev server and E2E tests simultaneously
- Isolated test database from development database
- No conflicts between dev and test environments

## Quick Start

### Option 1: Let Playwright Start the Server (Recommended for CI)

Playwright will automatically start the dev server on port 3001, run tests, and shut it down:

```bash
npm run test:e2e
```

The E2E server uses port 3001 and loads environment variables from `.env.test`, ensuring tests run against the test database.

**Note:** The first startup may take up to 2 minutes. Your dev server on port 3000 can continue running alongside E2E tests.

### Automatic Cleanup

After all tests complete, Playwright automatically cleans up test data:

- **Authentication**: Signs in as the E2E test user to clean up their data
- **Data Deleted**: Flashcards, generations, and error logs created during tests
- **No RLS Issues**: Uses regular authentication (not Service Role Key)
- **Required Variables**: Set `E2E_USERNAME` and `E2E_PASSWORD` in `.env.test`

The cleanup runs via the global teardown script in `e2e/global-teardown.ts`.

### Option 2: Manual Server + Tests (Alternative)

If you prefer to start the E2E server manually:

**Step 1:** Start the E2E server in one terminal:

```bash
npm run dev -- --port 3001
```

Wait for the message: `> Local: http://localhost:3001/`

**Step 2:** In another terminal, run tests:

```bash
# Run all tests
npm run test:e2e

# Or run in UI mode (interactive)
npm run test:e2e:ui

# Or run in debug mode
npm run test:e2e:debug
```

**Note:** Your regular dev server on port 3000 can still run simultaneously.

## Troubleshooting

### Error: "Timed out waiting 120000ms from config.webServer"

**Cause:** The dev server is taking too long to start, or there's a port conflict.

**Solutions:**

1. **Check if port 3001 is already in use:**

   ```bash
   # Windows
   netstat -ano | findstr :3001

   # Mac/Linux
   lsof -i :3001
   ```

2. **Check environment variables:**
   Ensure `.env.test` file has valid values:

   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_KEY=your_anon_key
   E2E_USERNAME=your_e2e_test_user_email
   E2E_PASSWORD=your_e2e_test_user_password
   OPENROUTER_API_KEY=your_openrouter_key
   ```

   **Note:** `E2E_USERNAME` and `E2E_PASSWORD` are optional but recommended for automatic cleanup.

3. **Clear Astro cache:**
   ```bash
   rm -rf .astro
   npm run test:e2e
   ```

### Tests Are Loading But Not Showing

**Cause:** Test files might not be in the correct location or format.

**Solution:** Verify:

- Test files are in the `e2e/` directory
- Files end with `.spec.ts` or `.test.ts`
- Tests use proper Playwright syntax

### "No tests found"

**Cause:** Playwright can't find test files.

**Solution:**

```bash
# List all tests
npx playwright test --list

# Run specific test file
npm run test:e2e -- auth.spec.ts
```

## Running Specific Tests

```bash
# Run a specific test file
npm run test:e2e -- auth.spec.ts

# Run tests matching a pattern
npm run test:e2e -- --grep "registration"

# Run a specific test by line number
npm run test:e2e -- auth.spec.ts:15
```

## Test Modes

### UI Mode (Interactive)

```bash
npm run test:e2e:ui
```

- Visual test runner
- Step through tests
- Time travel debugging
- Watch mode

### Debug Mode

```bash
npm run test:e2e:debug
```

- Opens Playwright Inspector
- Step through each action
- Inspect locators
- View console logs

### Headed Mode (See Browser)

```bash
npx playwright test --headed
```

- See the browser as tests run
- Useful for visual verification

### Generate Tests (Codegen)

```bash
npm run test:e2e:codegen
```

- Record browser actions
- Generate test code automatically
- Great for creating new tests

## Best Practices for Development

1. **Keep dev server running** during development
2. **Use UI mode** for debugging and test development
3. **Use headed mode** to see what's happening visually
4. **Check network tab** in browser dev tools if API calls fail
5. **Use test fixtures** for common setup (authentication, test data)

## Environment Setup

### Required Environment Files

Create `.env.test` for test-specific configuration:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
E2E_USERNAME=your-e2e-test-user@example.com
E2E_PASSWORD=your-e2e-test-password
OPENROUTER_API_KEY=your-openrouter-api-key
BASE_URL=http://localhost:3001
```

**Important Notes:**

- `E2E_USERNAME` and `E2E_PASSWORD` are used for authenticated cleanup
- Create a dedicated test user in Supabase for E2E tests
- The cleanup script signs in as this user to delete test data
- This approach respects RLS policies without needing Service Role Key

### Test Database

For E2E tests, you should ideally use a separate test database or local Supabase instance:

```bash
# Start local Supabase
supabase start

# Run migrations
supabase db push
```

## Continuous Integration

In CI environments (GitHub Actions, etc.), Playwright will:

- Automatically start the server
- Run tests with retries (2 retries configured)
- Use a single worker for stability
- Generate HTML reports
- Save traces on failure

Example CI configuration is already in `playwright.config.ts`.

## Viewing Test Reports

After running tests:

```bash
# View HTML report
npx playwright show-report
```

The report includes:

- Test results
- Screenshots on failure
- Traces for debugging
- Test duration

## Common Commands Reference

```bash
# Development
npm run dev                    # Start dev server
npm run test:e2e:ui           # Run tests in UI mode (interactive)

# Testing
npm run test:e2e              # Run all E2E tests
npm run test:e2e:debug        # Debug mode with inspector
npm run test:e2e:codegen      # Generate test code

# Specific tests
npm run test:e2e -- auth.spec.ts              # Run auth tests
npm run test:e2e -- --grep "registration"     # Run tests matching pattern
npx playwright test --headed                  # See browser while testing

# Reports
npx playwright show-report    # View last test report
```

## Tips

- 💡 **Tip 1:** Use `reuseExistingServer: true` (default in dev) to avoid restarting server
- 💡 **Tip 2:** Use `page.pause()` in tests to pause execution and inspect
- 💡 **Tip 3:** Use `--headed` flag to see what's happening in the browser
- 💡 **Tip 4:** Check the terminal for server startup messages before running tests
- 💡 **Tip 5:** Use UI mode (`test:e2e:ui`) for the best development experience
