# E2E Test Setup Guide

## Prerequisites

Before running E2E tests, you need to set up:
1. **Fixed test user** for library/feature tests (enables data cleanup)
2. **Service Role Key** for authentication test cleanup (deletes auth users)

## Quick Setup

### Step 1: Add Service Role Key to .env.test

```env
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-from-dashboard
```

### Step 2: Configure Test Users

You need **two test users**:

#### A. Library Test User (E2E_USERNAME)

**Option 1: Create User via Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **Authentication → Users**
3. Click "Add user" → "Create new user"
4. Enter credentials matching your `.env.test` file:
   - **Email**: Value from `E2E_USERNAME`
   - **Password**: Value from `E2E_PASSWORD`
   - **Email Confirm**: Enable "Auto Confirm User" ✅
5. Click "Create user"

### Option 2: Create User via Registration (Manual)

1. Start the dev server: `npm run dev`
2. Open browser to `http://localhost:4321/register`
3. Register with credentials from `.env.test`:
   - **Email**: Value from `E2E_USERNAME`
   - **Password**: Value from `E2E_PASSWORD`
4. Complete email confirmation if required

**Option 3: Use Existing User**

Update `.env.test` with an existing user's credentials:

```env
E2E_USERNAME=your-existing-user@example.com
E2E_PASSWORD=your-existing-password
```

#### B. Auth Test User (E2E_AUTH_USERNAME)

**Do NOT create this user manually** - it will be created automatically during auth tests.

Just add credentials to `.env.test`:

```env
E2E_AUTH_USERNAME=auth-test@example.com  # Any valid email format
E2E_AUTH_PASSWORD=SecurePassword123!      # Must meet Supabase password requirements
```

This user will be:
- ✅ Created during the first auth test (registration)
- ✅ Used for testing login/logout
- ✅ Automatically deleted after auth tests complete

## Verify Setup

Run a single library test to verify:

```bash
npm run test:e2e -- e2e/library.spec.ts --grep "should display library page elements"
```

If setup is correct, you should see:
- ✅ Test passes
- ✅ Cleanup message shows: `✓ Signed in as: [your-e2e-user-email]`

## Test Strategy

### Authentication Tests (`auth.spec.ts`)
- ✅ Create **fixed test user** (`E2E_AUTH_USERNAME` / `E2E_AUTH_PASSWORD`)
- ✅ Test user registration functionality
- ✅ **Cleanup**: User is deleted after tests (requires `SUPABASE_SERVICE_ROLE_KEY`)

### Library Tests (`library.spec.ts`)
- ✅ Use **fixed test user** (`E2E_USERNAME` / `E2E_PASSWORD`)
- ✅ Test flashcard CRUD operations
- ✅ Cleanup runs after tests complete

### Other Feature Tests (future)
- ✅ Use **fixed test user** for consistency
- ✅ Cleanup handled automatically

## Environment Variables

Required in `.env.test`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # For auth user cleanup

# Fixed Test User (for library/feature tests)
E2E_USERNAME=your-test-user@example.com
E2E_PASSWORD=your-secure-password

# Fixed Auth Test User (for authentication tests)
E2E_AUTH_USERNAME=auth-test@example.com
E2E_AUTH_PASSWORD=your-secure-password

# OpenRouter API (for generation tests)
OPENROUTER_API_KEY=your-api-key
```

### Getting Service Role Key

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Under "Project API keys", find **service_role key** (secret)
3. Copy and add to `.env.test` as `SUPABASE_SERVICE_ROLE_KEY`

⚠️ **Security Note**: Service Role Key bypasses Row Level Security. Keep it secret!

## Troubleshooting

### "Failed to sign in as E2E user: Invalid login credentials"

**Problem:** Test user doesn't exist or credentials are wrong.

**Solutions:**
1. Create the user following Option 1 above
2. Verify credentials in `.env.test` match the user in Supabase
3. Ensure user's email is confirmed

### "Tests fail with redirect to /login"

**Problem:** Authentication session is not maintained.

**Solutions:**
1. Verify test user exists and can log in manually
2. Check that cookies are enabled in test browser
3. Ensure `.env.test` is loaded (check terminal output)

### "Cleanup shows deleted 0 items"

**Status:** ✅ This is normal! It means:
- Previous cleanup was successful, OR
- Tests didn't create any data (they were skipped)

### "SUPABASE_SERVICE_ROLE_KEY not set - skipping auth user cleanup"

**Problem:** Auth test user won't be deleted after tests.

**Solutions:**
1. Add `SUPABASE_SERVICE_ROLE_KEY` to `.env.test`
2. Get it from: Supabase Dashboard → Settings → API → service_role key

**Impact:** Without this key:
- ✅ Tests still pass normally
- ⚠️ Auth test user remains in database
- Manual cleanup needed: Delete user from Supabase Dashboard

## Running Tests

```bash
# All tests (auth + library)
npm run test:e2e

# Only library tests
npm run test:e2e -- e2e/library.spec.ts

# Only auth tests
npm run test:e2e -- e2e/auth.spec.ts

# With UI mode (visual debugging)
npm run test:e2e:ui

# Debug mode (step through)
npm run test:e2e:debug
```

## Cleanup Behavior

After all tests complete, the `global-teardown.ts` script:

1. ✅ Signs in as E2E test user
2. ✅ Deletes all flashcards created by that user
3. ✅ Deletes all generations created by that user
4. ✅ Deletes all error logs created by that user
5. ✅ Signs out

This ensures the E2E test user's data is clean for the next test run.

## Security Notes

- ⚠️ **Never commit** `.env.test` to version control
- ✅ Use `.env.test.example` as a template
- ✅ Test user should have **no special privileges**
- ✅ Test user should be used **only for testing**

