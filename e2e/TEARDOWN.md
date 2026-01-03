# E2E Test Cleanup

## Overview

This directory contains the global teardown script that automatically cleans up test data from Supabase after all E2E tests complete.

## How It Works

### Authentication Approach

Instead of using a Service Role Key (which bypasses RLS), this implementation uses **regular authentication**:

1. Signs in as the E2E test user (`E2E_USERNAME` / `E2E_PASSWORD`)
2. Deletes data created by this user during tests
3. Respects Row Level Security (RLS) policies
4. Signs out after cleanup

This approach is **safer and simpler** than using admin privileges.

### Cleanup Process

1. **Trigger**: Runs automatically after all Playwright tests complete
2. **Authentication**: Signs in as E2E test user with credentials from `.env.test`
3. **Data Deletion**: Deletes all records owned by this user:
   - Flashcards (`flashcards` table)
   - Generations (`generations` table)
   - Generation error logs (`generation_error_logs` table)
4. **Logging**: Provides detailed console output of operations
5. **Sign Out**: Cleans up the authentication session

### Configuration

The teardown is configured in `playwright.config.ts`:

```typescript
export default defineConfig({
  // ... other config
  globalTeardown: "./e2e/global-teardown.ts",
});
```

## Environment Variables

Required in `.env.test`:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
E2E_USERNAME=e2e-test@example.com
E2E_PASSWORD=your-secure-password
```

**Important**: 
- Create a dedicated test user in Supabase for E2E tests
- Use this user's credentials for `E2E_USERNAME` and `E2E_PASSWORD`
- The cleanup script will delete all data owned by this user
- No Service Role Key needed!

## Logging

The teardown script provides detailed console output:

```
🧹 Starting E2E test cleanup...
✓ Signed in as: e2e-test@example.com
   ✓ Deleted 5 flashcard(s)
   ✓ Deleted 2 generation(s)
   ✓ Deleted 1 error log(s)

✨ Cleanup completed successfully
```

## Error Handling

The script handles various error scenarios:

- **Missing environment variables**: Logs info message and skips cleanup gracefully
- **Sign-in failure**: Logs error with helpful message about credentials
- **Failed data deletion**: Logs error but continues with other tables
- **Unexpected errors**: Catches and logs any uncaught exceptions

## Safety Features

1. **RLS Compliant**: Uses regular authentication, respecting security policies
2. **User Isolation**: Only deletes data owned by the E2E test user
3. **No Admin Privileges**: Doesn't require or use Service Role Key
4. **Graceful Degradation**: Skips cleanup if credentials not configured
5. **Detailed Logging**: Clear visibility into what was deleted
6. **Idempotent**: Safe to run multiple times

## Setup Instructions

### 1. Create E2E Test User

In your Supabase project:
1. Go to Authentication → Users
2. Create a new user:
   - Email: `e2e-test@example.com` (or your preferred email)
   - Password: Choose a strong password
   - Confirm email (if email confirmation is enabled)

### 2. Configure Environment

Add to `.env.test`:
```env
E2E_USERNAME=e2e-test@example.com
E2E_PASSWORD=your-chosen-password
```

### 3. Update Test Configuration

If your tests currently create new users for each test, consider updating them to:
- Use the E2E test user credentials
- Sign in as this user instead of registering new users
- Or: Keep current approach but use this user for cleanup

## Testing Locally

To see the cleanup in action:

```bash
# Run E2E tests
npm run test:e2e

# Watch the console output at the end for cleanup logs
```

## Troubleshooting

### Cleanup not running

**Symptom**: No cleanup logs appear after tests complete

**Solutions**:
1. Verify `E2E_USERNAME` and `E2E_PASSWORD` are set in `.env.test`
2. Check that `.env.test` is being loaded (not `.env`)
3. Verify the `globalTeardown` setting in `playwright.config.ts`

### Data not being deleted

**Symptom**: Cleanup runs but data remains in database

**Solutions**:
1. Verify the E2E user exists in Supabase
2. Check that tests are using this user's account
3. Verify RLS policies allow user to delete their own data
4. Look for error messages in the console output

### Authentication errors

**Symptom**: "Failed to sign in as E2E user" error

**Solutions**:
1. Confirm credentials in `.env.test` are correct
2. Verify the user exists in Supabase Auth
3. Check if email confirmation is required
4. Ensure the user account is not locked or disabled

## Database Schema

The cleanup works with the following tables:

```sql
-- Flashcards table
CREATE TABLE flashcards (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... other columns
);

-- Generations table
CREATE TABLE generations (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... other columns
);

-- Generation error logs
CREATE TABLE generation_error_logs (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  -- ... other columns
);
```

**Note**: The cleanup script deletes data directly from these tables. It doesn't delete the E2E test user itself, so the user can be reused across multiple test runs.

## Advantages Over Service Role Key Approach

✅ **Security**: No need to expose Service Role Key  
✅ **Simplicity**: Regular authentication is simpler to set up  
✅ **RLS Compliant**: Respects database security policies  
✅ **Testing**: Same authentication flow as production  
✅ **Maintainability**: Easier to understand and debug  

## Future Improvements

Possible enhancements:

- [ ] Add selective cleanup (e.g., only delete old data)
- [ ] Add cleanup metrics/reporting
- [ ] Support for manual cleanup via CLI command
- [ ] Cleanup dry-run mode for testing
- [ ] Parallel deletion for faster cleanup

