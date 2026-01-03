# Comprehensive Test Plan for 10xdevs-flashcards

## 1. Executive Summary

The 10xdevs-flashcards application is a web-based AI-powered flashcard learning tool built with Astro 5, React 19, TypeScript 5, Tailwind 4, and Supabase. The application enables users to generate flashcards from text using AI (via OpenRouter), manually create and manage flashcards, and study them using a spaced repetition system.

**Testing Objectives:**

- Ensure AI flashcard generation is reliable and handles failures gracefully
- Verify data integrity across the flashcard creation pipeline
- Validate authentication security and authorization controls
- Confirm proper error handling and user feedback mechanisms
- Ensure performance requirements (30s generation timeout) are met
- Validate input sanitization and prevent security vulnerabilities

**Current Project State:** Initial development phase with core features implemented but no existing test coverage.

---

## 2. Scope of Testing

### In Scope

**Backend/API Layer:**

- All API endpoints: `/api/auth/*`, `/api/generations`, `/api/flashcards`
- Service layer: `generation.service.ts`, `flashcard.service.ts`, `openrouter.service.ts`
- Database operations: RPC functions, queries, transactions
- Authentication middleware (`src/middleware/index.ts`)
- Input validation (Zod schemas)
- Error handling and custom error classes

**Frontend:**

- React components: GenerationContainer, forms, candidate management
- Client-side API integration (`src/lib/api.ts`)
- State management (Zustand store)
- User feedback mechanisms (toasts, error displays)

**Database:**

- Row Level Security (RLS) policies
- Database migrations and schema
- RPC function: `create_flashcards_with_generation_update`
- Data relationships and constraints

**Integration Points:**

- OpenRouter AI service integration
- Supabase Auth integration
- Cookie-based session management

### Out of Scope

- Supabase platform internals (tested by Supabase)
- OpenRouter API internals (tested by OpenRouter)
- Third-party UI component libraries (Shadcn/ui, Radix)
- Spaced repetition algorithm (future feature, not yet implemented)
- CI/CD pipeline configuration (separate concern)
- Browser compatibility testing (handled by E2E tests naturally)

---

## 3. Testing Strategy

### 3.1 Testing Pyramid Approach

```
    /\
   /E2E\     10% - Critical user journeys
  /------\
 /  INT   \   25% - API + Database integration
/----------\
|   UNIT   |  60% - Service layer, validation, utils
|----------|
|  STATIC  |  5% - Security, linting, type checking
```

### 3.2 Types of Testing

**Unit Tests (60% of effort):**

- Service layer functions in isolation
- Validation schemas (Zod)
- Utility functions and helpers
- Error mapping and handling logic
- Mocked external dependencies (Supabase, OpenRouter)

**Integration Tests (25% of effort):**

- API endpoints with test database
- Database RPC functions
- Authentication flows with Supabase
- Middleware behavior with various route scenarios

**End-to-End Tests (10% of effort):**

- Complete user journeys (signup → generate → save → study)
- Critical paths through the UI
- Authentication flows in browser context

**Security Tests (5% of effort):**

- RLS policy validation
- Authorization bypass attempts
- Input sanitization and XSS prevention
- SQL injection resistance

### 3.3 Component-Level Testing Approach

| Component                                  | Testing Approach                                        |
| ------------------------------------------ | ------------------------------------------------------- |
| **API Routes** (`src/pages/api/*`)         | Integration tests with test database, mocked AI service |
| **Services** (`src/lib/*.service.ts`)      | Unit tests with mocked dependencies                     |
| **Middleware** (`src/middleware/index.ts`) | Integration tests with mocked Supabase responses        |
| **React Components** (`src/components/*`)  | Unit tests with Testing Library                         |
| **Database**                               | Integration tests with Supabase local instance          |
| **Validation**                             | Unit tests for all Zod schemas                          |

---

## 4. Test Environment Requirements

### 4.1 Infrastructure

**Local Development Environment:**

- Node.js 22.14.0 (as specified in `.nvmrc`)
- Supabase CLI for local database
- PostgreSQL 15+ (via Supabase local)
- Environment variables for testing:
  ```
  SUPABASE_URL=http://localhost:54321
  SUPABASE_KEY=test_anon_key
  OPENROUTER_API_KEY=mock_key_for_tests
  MOCK_AI_SERVICE=true
  ```

**CI Environment:**

- GitHub Actions runners
- Supabase local instance (Docker)
- Environment variable injection via secrets

### 4.2 Test Database Strategy

**Approach:** Use Supabase local development with migrations

**Setup Process:**

1. Run `supabase start` for local instance
2. Apply migrations from `supabase/migrations/`
3. Seed test user: `test@example.com` (already in migration)
4. Use test-specific schema or reset between test suites

**Data Management:**

- Create fresh test data for each test suite
- Use transactions and rollback for test isolation
- Seed minimal fixtures (1 test user, 0-2 sample flashcards)

### 4.3 External Service Mocking

**OpenRouter API:**

- Use `MOCK_AI_SERVICE=true` flag (already implemented in `generation.service.ts`)
- Create test fixtures for various AI responses (success, timeout, malformed)
- Mock network errors and rate limiting

**Supabase Auth:**

- Use local Supabase instance with real auth
- Create test users programmatically
- Mock JWT tokens for unit tests

---

## 5. Testing Tools and Frameworks

### 5.1 Recommended Test Stack

| Purpose                      | Tool                   | Justification                                                      |
| ---------------------------- | ---------------------- | ------------------------------------------------------------------ |
| **Unit/Integration Testing** | Vitest                 | Native Vite support, fast, TypeScript-first, compatible with Astro |
| **React Component Testing**  | @testing-library/react | Industry standard, excellent for React 19, accessibility-focused   |
| **E2E Testing**              | Playwright             | Best Astro support, cross-browser, network mocking, screenshots    |
| **API Testing**              | Native fetch + Vitest  | No additional dependencies, leverages existing API client          |
| **Validation Testing**       | Zod (existing)         | Runtime and type-safe validation                                   |
| **Mocking**                  | Vitest vi.mock()       | Built-in mocking capabilities                                      |
| **Test Database**            | Supabase CLI           | Matches production, includes RLS testing                           |
| **Coverage**                 | Vitest --coverage      | Built-in Istanbul/c8 integration                                   |

### 5.2 Installation Commands

```bash
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
npm install -D playwright @playwright/test
npm install -D msw # For HTTP mocking
```

### 5.3 Configuration Files

**vitest.config.ts:**

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "src/test/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

**playwright.config.ts:**

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 6. Test Cases by Priority

### 6.1 Critical Priority Tests

These tests cover core functionality that must work for the application to be viable.

#### TC-CRIT-001: AI Flashcard Generation - Happy Path

**Component:** `src/lib/generation.service.ts`, `POST /api/generations`  
**Test Type:** Integration  
**Description:** Verify successful AI flashcard generation end-to-end  
**Prerequisites:**

- Authenticated user
- Valid OpenRouter API key
- Test database running

**Test Steps:**

1. Send POST request to `/api/generations` with valid source_text (1000-5000 chars)
2. Verify response status is 200
3. Verify response contains `generation_id`, `model`, `generated_count`, `flashcard_candidates`
4. Verify database `generations` table has new row with correct `user_id`
5. Verify `source_text_hash` is SHA-256 hash of input
6. Verify `generation_duration` is reasonable (< 30000ms)
7. Verify `flashcard_candidates` array contains valid flashcards with `front` and `back`

**Expected Results:**

- Response matches `GenerateFlashcardsResultDto` schema
- Database record created with all required fields
- Candidates are parsable and usable

---

#### TC-CRIT-002: AI Generation Timeout Handling

**Component:** `src/lib/generation.service.ts`  
**Test Type:** Unit/Integration  
**Description:** Verify 30-second timeout is enforced and handled gracefully

**Test Steps:**

1. Mock OpenRouter service to delay response by 31 seconds
2. Call `generateFlashcards()` with valid input
3. Verify function throws `GenerationError` with code `GENERATION_TIMEOUT`
4. Verify error is logged to `generation_error_logs` table
5. Verify API returns 408 Request Timeout status

**Expected Results:**

- Timeout error thrown after 30 seconds
- Error logged to database
- Client receives actionable error message

---

#### TC-CRIT-003: Bulk Flashcard Creation with Generation Update

**Component:** `src/lib/flashcard.service.ts`, Database RPC  
**Test Type:** Integration  
**Description:** Verify atomic transaction for creating flashcards and updating generation counters

**Test Steps:**

1. Create a generation record (POST /api/generations)
2. Submit 5 flashcards: 2 ai-full, 2 ai-edited, 1 manual
3. Verify all 5 flashcards inserted with correct `user_id` and `generation_id`
4. Verify generation record updated: `accepted_unedited_count=2`, `accepted_edited_count=2`
5. Verify transaction atomicity by simulating failure mid-operation

**Expected Results:**

- All flashcards created or none (atomic)
- Generation counters accurate
- Manual cards allowed with generation_id

---

#### TC-CRIT-004: Authentication Middleware - Protected Route

**Component:** `src/middleware/index.ts`  
**Test Type:** Integration  
**Description:** Verify unauthenticated users cannot access protected routes

**Test Steps:**

1. Clear all authentication cookies
2. Attempt to access `/generate` (protected)
3. Verify redirect to `/login`
4. Attempt to access `/api/flashcards` (protected API)
5. Verify 401 Unauthorized response

**Expected Results:**

- Redirects to login for page routes
- Returns 401 for API routes
- No data leakage

---

#### TC-CRIT-005: RLS Policy - User Data Isolation

**Component:** Database RLS policies  
**Test Type:** Security/Integration  
**Description:** Verify users can only access their own flashcards

**Test Steps:**

1. Create user A and user B
2. User A creates 3 flashcards
3. User B creates 2 flashcards
4. Attempt to query flashcards as User A
5. Verify only User A's 3 flashcards returned
6. Attempt to update User A's flashcard as User B (via direct Supabase query)
7. Verify operation fails or silently ignored

**Expected Results:**

- RLS enforces `user_id = auth.uid()`
- No cross-user data access possible

---

#### TC-CRIT-006: User Registration and Login

**Component:** `POST /api/auth/register`, `POST /api/auth/login`  
**Test Type:** Integration  
**Description:** Verify complete authentication flow

**Test Steps:**

1. Register new user with email and password (min 6 chars)
2. Verify 200 response with user object
3. Verify session cookies set (httpOnly, secure)
4. Login with same credentials
5. Verify 200 response and session established
6. Attempt login with wrong password
7. Verify 401 response

**Expected Results:**

- Registration creates Supabase auth user
- Login establishes session
- Invalid credentials rejected

---

### 6.2 High Priority Tests

Important features and common user flows.

#### TC-HIGH-001: Input Validation - Source Text Length

**Component:** `POST /api/generations`, Zod schema  
**Test Type:** Unit  
**Description:** Verify source text length constraints (1000-5000 chars)

**Test Steps:**

1. Submit source_text with 999 characters → expect 400 with validation error
2. Submit source_text with 1000 characters → expect 200
3. Submit source_text with 5000 characters → expect 200
4. Submit source_text with 5001 characters → expect 400

**Expected Results:**

- Validation errors returned with specific messages
- Valid lengths accepted

---

#### TC-HIGH-002: Flashcard Character Limits

**Component:** `POST /api/flashcards`, Zod schema  
**Test Type:** Unit  
**Description:** Verify front (200) and back (500) character limits

**Test Steps:**

1. Create flashcard with front=201 chars → expect 400
2. Create flashcard with back=501 chars → expect 400
3. Create flashcard with front=200, back=500 → expect 201
4. Verify validation error messages are user-friendly

**Expected Results:**

- Limits enforced at API level
- Clear error messages

---

#### TC-HIGH-003: Generation Error Logging

**Component:** `src/lib/generation.service.ts`, `generation_error_logs` table  
**Test Type:** Integration  
**Description:** Verify failed generations logged for debugging

**Test Steps:**

1. Mock OpenRouter to return 500 error
2. Attempt generation
3. Verify `generation_error_logs` table has new row with:
   - `user_id`
   - `error_type`: "AI_SERVICE_ERROR"
   - `error_message`
   - `source_text_hash`
4. Verify client receives 500 error

**Expected Results:**

- All errors logged for analytics
- Sensitive data (source text) not logged, only hash

---

#### TC-HIGH-004: Client-Side Generation Flow State Machine

**Component:** `src/components/GenerationContainer.tsx`, Zustand store  
**Test Type:** Unit (React Testing Library)  
**Description:** Verify state transitions: input → generating → review → saving

**Test Steps:**

1. Render GenerationContainer
2. Verify initial state is "input"
3. Submit text → verify state transitions to "generating"
4. Mock successful API response → verify state transitions to "review"
5. Accept candidates and save → verify state transitions to "saving"
6. Mock save success → verify redirect or success message

**Expected Results:**

- State machine transitions correctly
- UI updates reflect state
- Error states handled

---

#### TC-HIGH-005: Candidate Card Editing Before Save

**Component:** `src/components/CandidateCard.tsx`, Zustand store  
**Test Type:** Unit  
**Description:** Verify users can edit AI-generated candidates before saving

**Test Steps:**

1. Generate 3 candidates
2. Edit front of candidate 1
3. Verify candidate marked as "ai-edited"
4. Edit back of candidate 2
5. Save candidates
6. Verify saved flashcards have `source="ai-edited"` for edited ones

**Expected Results:**

- Edits tracked correctly
- Source field updated to "ai-edited"

---

#### TC-HIGH-006: Generation Ownership Verification

**Component:** `src/lib/flashcard.service.ts`  
**Test Type:** Integration  
**Description:** Verify users can only save flashcards linked to their generations

**Test Steps:**

1. User A creates generation (generation_id=1)
2. User B attempts to create flashcards with generation_id=1
3. Verify operation fails with GENERATION_NOT_FOUND error
4. Verify User A can successfully create flashcards with generation_id=1

**Expected Results:**

- Generation ownership enforced
- 404 error for invalid/unauthorized generation_id

---

#### TC-HIGH-007: Middleware - Public vs Protected Paths

**Component:** `src/middleware/index.ts`  
**Test Type:** Integration  
**Description:** Verify PUBLIC_PATHS array correctly excludes routes from auth check

**Test Steps:**

1. Access `/login` without auth → expect 200 (page loads)
2. Access `/register` without auth → expect 200
3. Access `/api/auth/login` without auth → expect to reach handler (not redirected)
4. Access `/generate` without auth → expect redirect to `/login`
5. Access `/api/flashcards` without auth → expect 401

**Expected Results:**

- Public paths accessible
- Protected paths blocked

---

### 6.3 Medium Priority Tests

Secondary features and edge cases.

#### TC-MED-001: Multiple Candidate Rejection

**Component:** `src/components/CandidateList.tsx`  
**Test Type:** Unit  
**Description:** Verify empty state when all candidates rejected

**Test Steps:**

1. Generate 5 candidates
2. Reject all 5
3. Verify empty state displayed with message
4. Verify save button disabled (0 accepted)

**Expected Results:**

- Empty state UI shown
- Clear messaging to user

---

#### TC-MED-002: OpenRouter Service Retry Logic

**Component:** `src/lib/openrouter.service.ts`  
**Test Type:** Unit  
**Description:** Verify retry mechanism for transient failures

**Test Steps:**

1. Mock OpenRouter to return 503 (Service Unavailable)
2. Verify service retries up to max_retries (default 2)
3. Verify exponential backoff applied
4. On 3rd attempt, return success
5. Verify request eventually succeeds

**Expected Results:**

- Retries on 5xx errors
- Backoff delays increase
- Max retries respected

---

#### TC-MED-003: Malformed AI Response Handling

**Component:** `src/lib/generation.service.ts`  
**Test Type:** Unit  
**Description:** Verify graceful handling when AI returns invalid JSON

**Test Steps:**

1. Mock OpenRouter to return non-JSON response
2. Verify `GenerationError` thrown with code "AI_SERVICE_ERROR"
3. Mock OpenRouter to return JSON without `flashcard_candidates` key
4. Verify error thrown with meaningful message

**Expected Results:**

- Invalid responses caught
- Error logged to `generation_error_logs`

---

#### TC-MED-004: Session Cookie Security Attributes

**Component:** `src/db/supabase.client.ts`, cookieOptions  
**Test Type:** Integration  
**Description:** Verify cookies have secure, httpOnly, sameSite attributes

**Test Steps:**

1. Complete login flow
2. Inspect Set-Cookie headers
3. Verify attributes: `HttpOnly=true`, `Secure=true`, `SameSite=Lax`
4. Attempt to access cookie via JavaScript (should fail)

**Expected Results:**

- Cookies inaccessible to JavaScript
- CSRF protection via SameSite

---

#### TC-MED-005: Logout and Session Invalidation

**Component:** `POST /api/auth/logout`  
**Test Type:** Integration  
**Description:** Verify logout clears session and cookies

**Test Steps:**

1. Login as user
2. Verify access to `/generate` works
3. Call logout endpoint
4. Verify cookies cleared
5. Attempt to access `/generate` → expect redirect to `/login`
6. Attempt API call → expect 401

**Expected Results:**

- Session invalidated in Supabase
- Cookies removed
- Protected resources inaccessible

---

#### TC-MED-006: Maximum Flashcards Per Request

**Component:** `POST /api/flashcards`, Zod validation  
**Test Type:** Unit  
**Description:** Verify max 50 flashcards per batch

**Test Steps:**

1. Submit request with 50 flashcards → expect 201
2. Submit request with 51 flashcards → expect 400
3. Verify error message indicates limit

**Expected Results:**

- Limit enforced
- Clear error message

---

#### TC-MED-007: Empty Flashcard Fields Rejection

**Component:** Zod validation  
**Test Type:** Unit  
**Description:** Verify front and back cannot be empty

**Test Steps:**

1. Submit flashcard with front="" → expect 400
2. Submit flashcard with back="" → expect 400
3. Submit flashcard with whitespace-only fields → expect 400

**Expected Results:**

- Empty fields rejected
- Whitespace-only rejected

---

### 6.4 Low Priority Tests

Nice-to-have validations and rare edge cases.

#### TC-LOW-001: Concurrent Generation Requests

**Component:** API rate limiting (future)  
**Test Type:** Performance  
**Description:** Verify system handles multiple simultaneous generations

**Test Steps:**

1. Send 5 concurrent POST /api/generations requests
2. Verify all complete (or rate limited gracefully)
3. Verify no race conditions in database

**Expected Results:**

- Requests handled independently
- No data corruption

---

#### TC-LOW-002: Very Long AI Generation Duration

**Component:** `generation_duration` field  
**Test Type:** Integration  
**Description:** Verify generation duration tracking accuracy

**Test Steps:**

1. Mock AI response with 25-second delay
2. Verify `generation_duration` field is ~25000ms
3. Verify duration logged accurately

**Expected Results:**

- Duration tracked with millisecond precision

---

#### TC-LOW-003: Special Characters in Flashcard Content

**Component:** Input sanitization  
**Test Type:** Security  
**Description:** Verify special characters don't cause issues

**Test Steps:**

1. Create flashcard with front="<script>alert('xss')</script>"
2. Retrieve flashcard via API
3. Render flashcard in UI
4. Verify content displayed as text (not executed)
5. Test various special chars: quotes, angle brackets, emojis

**Expected Results:**

- Content stored and displayed as-is
- No XSS vulnerabilities

---

#### TC-LOW-004: Timestamp Auto-Update on Edit

**Component:** Database trigger, `updated_at` field  
**Test Type:** Integration  
**Description:** Verify `updated_at` automatically updates on PATCH

**Test Steps:**

1. Create flashcard (note `created_at` and `updated_at`)
2. Wait 1 second
3. Update flashcard front
4. Verify `updated_at` is newer than original
5. Verify `created_at` unchanged

**Expected Results:**

- Trigger updates `updated_at` automatically

---

#### TC-LOW-005: User Redirected from Auth Pages When Logged In

**Component:** Middleware  
**Test Type:** Integration  
**Description:** Verify logged-in users redirected from /login to /

**Test Steps:**

1. Login as user
2. Navigate to `/login`
3. Verify redirect to `/`
4. Navigate to `/register`
5. Verify redirect to `/`

**Expected Results:**

- Unnecessary auth pages skipped

---

## 7. Integration Testing Strategy

### 7.1 API Integration Tests

**Approach:** Test API endpoints with real Supabase local instance, mocked AI service

**Test Structure:**

```
tests/integration/api/
  ├── auth.test.ts
  ├── generations.test.ts
  ├── flashcards.test.ts
  └── middleware.test.ts
```

**Setup/Teardown:**

- `beforeAll`: Start Supabase local, run migrations
- `beforeEach`: Create test user, get auth token
- `afterEach`: Clean up test data (delete flashcards, generations)
- `afterAll`: Stop Supabase local

**Example Test Pattern:**

```typescript
describe("POST /api/flashcards", () => {
  let authToken: string;
  let userId: string;

  beforeEach(async () => {
    const { token, id } = await createTestUser();
    authToken = token;
    userId = id;
  });

  it("creates flashcards with valid generation_id", async () => {
    // Arrange: Create generation first
    const generation = await createTestGeneration(userId);

    // Act: Create flashcards
    const response = await fetch("/api/flashcards", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        generation_id: generation.id,
        flashcards: [{ front: "Q1", back: "A1", source: "ai-full" }],
      }),
    });

    // Assert
    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.data.created_count).toBe(1);
  });
});
```

### 7.2 Database Integration Tests

**Focus:** RPC functions, RLS policies, triggers

**Test Structure:**

```
tests/integration/database/
  ├── rls-policies.test.ts
  ├── rpc-functions.test.ts
  └── triggers.test.ts
```

**Example RLS Test:**

```typescript
it("prevents user from accessing other users flashcards", async () => {
  const userA = await createTestUser("a@test.com");
  const userB = await createTestUser("b@test.com");

  // User A creates flashcard
  const { data: flashcard } = await supabaseAsUserA
    .from("flashcards")
    .insert({ front: "Q", back: "A", source: "manual" })
    .select()
    .single();

  // User B attempts to query
  const { data, error } = await supabaseAsUserB.from("flashcards").select().eq("id", flashcard.id);

  expect(data).toHaveLength(0); // RLS hides it
});
```

### 7.3 Service Layer Integration Tests

**Focus:** Services interacting with real dependencies (Supabase, mocked AI)

**Example:**

```typescript
describe("generation.service.ts", () => {
  it("stores generation record on successful AI call", async () => {
    const result = await generateFlashcards({
      source_text: "A".repeat(1500),
      user_id: testUser.id,
      supabase: testSupabaseClient,
    });

    expect(result.generation_id).toBeDefined();

    // Verify database record
    const { data } = await testSupabaseClient.from("generations").select().eq("id", result.generation_id).single();

    expect(data.user_id).toBe(testUser.id);
    expect(data.generated_count).toBe(result.flashcard_candidates.length);
  });
});
```

---

## 8. Performance Testing Considerations

### 8.1 Key Performance Metrics

| Metric                      | Target                 | Test Method                       |
| --------------------------- | ---------------------- | --------------------------------- |
| AI generation response time | < 30s (hard timeout)   | Load test with real AI calls      |
| API endpoint response time  | < 500ms (excluding AI) | Artillery or k6 load tests        |
| Bulk flashcard creation     | < 2s for 50 cards      | Integration test timing           |
| Page load time              | < 2s (SSR)             | Lighthouse in CI                  |
| Database query time         | < 100ms per query      | Query timing in integration tests |

### 8.2 Performance Test Scenarios

**PT-001: AI Generation Under Load**

- 10 concurrent users triggering generation
- Measure: success rate, avg/p95/p99 latency
- Expected: No failures, p95 < 25s

**PT-002: Bulk Flashcard Creation**

- Create 50 flashcards in single request
- Measure: transaction time, database locks
- Expected: < 2 seconds, no deadlocks

**PT-003: Database Query Performance**

- Query flashcards with pagination (limit=20, page=1)
- With 1000 flashcards in database
- Measure: query execution time
- Expected: < 100ms

### 8.3 Performance Testing Tools

- **Artillery or k6:** API load testing
- **Lighthouse CI:** Frontend performance metrics
- **Supabase Dashboard:** Database query profiling

---

## 9. Security Testing Requirements

### 9.1 Authentication & Authorization Tests

**SEC-001: JWT Token Tampering**

- Modify JWT token payload
- Attempt to access protected endpoint
- Expected: 401 Unauthorized

**SEC-002: Session Fixation**

- Attempt to reuse old session token after logout
- Expected: 401 Unauthorized

**SEC-003: RLS Policy Bypass Attempts**

- Direct Supabase queries bypassing middleware
- Attempt cross-user data access
- Expected: RLS blocks access

**SEC-004: Middleware Bypass via Direct API Calls**

- Call API endpoints without cookies
- Expected: 401 Unauthorized

### 9.2 Input Validation Security Tests

**SEC-005: XSS in Flashcard Content**

- Submit flashcard with `<script>` tags
- Verify content rendered as text, not executed
- Test in React components

**SEC-006: SQL Injection via Supabase Client**

- Attempt SQL injection in search parameter
- Expected: Parameterized queries prevent injection

**SEC-007: Oversized Payloads**

- Submit 10MB JSON payload
- Expected: Request rejected before processing

**SEC-008: CSRF Protection**

- Attempt cross-origin request without proper headers
- Expected: SameSite cookies prevent CSRF

### 9.3 Data Privacy Tests

**SEC-009: Source Text Privacy**

- Verify source text not stored (only hash)
- Check `generation_error_logs` for PII leakage

**SEC-010: User Data Isolation**

- Verify user A cannot query user B's generations
- Test via API and direct database queries

---

## 10. Test Data Management

### 10.1 Test User Accounts

**Standard Test Users:**

```typescript
const TEST_USERS = {
  alice: { email: "alice@test.com", password: "password123" },
  bob: { email: "bob@test.com", password: "password456" },
  admin: { email: "admin@test.com", password: "admin123" },
};
```

**Creation Strategy:**

- Create programmatically in `beforeEach` for integration tests
- Use Supabase Auth `signUp()` method
- Store in test database, clean up in `afterEach`

### 10.2 Test Flashcard Fixtures

**Fixture File:** `tests/fixtures/flashcards.ts`

```typescript
export const SAMPLE_FLASHCARDS = [
  { front: "What is Astro?", back: "A web framework", source: "manual" },
  { front: "What is React?", back: "A UI library", source: "ai-full" },
  // ... more
];

export const SAMPLE_SOURCE_TEXT = "A".repeat(1500); // 1500 chars
```

### 10.3 Data Cleanup Strategy

**After Each Test:**

```typescript
afterEach(async () => {
  await supabase.from("flashcards").delete().eq("user_id", testUser.id);
  await supabase.from("generations").delete().eq("user_id", testUser.id);
  await supabase.auth.admin.deleteUser(testUser.id);
});
```

**Alternatively:** Use database transactions and rollback:

```typescript
beforeEach(() => supabase.query("BEGIN"));
afterEach(() => supabase.query("ROLLBACK"));
```

---

## 11. Acceptance Criteria

Testing is considered complete when:

### 11.1 Coverage Metrics

- **Overall code coverage:** ≥ 80%
- **Service layer coverage:** ≥ 90%
- **API endpoint coverage:** 100% (all endpoints tested)
- **Critical path coverage:** 100% (auth, generation, save flows)

### 11.2 Test Execution Criteria

- **All critical priority tests:** 100% passing
- **All high priority tests:** ≥ 95% passing
- **All medium/low priority tests:** ≥ 80% passing
- **Test execution time:** < 5 minutes for unit+integration, < 10 minutes for E2E
- **Flakiness rate:** < 1% (tests should be deterministic)

### 11.3 Quality Gates

- **Zero critical security vulnerabilities** (RLS bypass, auth bypass)
- **Zero data corruption bugs** in integration tests
- **All API endpoints return correct status codes** and error messages
- **Performance targets met** (30s AI timeout, < 500ms API responses)

### 11.4 Documentation Criteria

- **Test README:** Setup instructions, running tests, CI integration
- **Test coverage report:** Generated and reviewed
- **Known issues documented:** Any skipped tests or TODO items tracked

---

## 12. Risks and Mitigation

### 12.1 Testing Risks

| Risk                                        | Impact | Probability | Mitigation                                                          |
| ------------------------------------------- | ------ | ----------- | ------------------------------------------------------------------- |
| **OpenRouter API unavailable during tests** | High   | Medium      | Use `MOCK_AI_SERVICE=true` by default, dedicated tests for real API |
| **Supabase local instance failures**        | High   | Low         | Document setup, use Docker compose, fallback to cloud test project  |
| **Flaky E2E tests**                         | Medium | Medium      | Implement proper waits, retry logic, isolate tests                  |
| **Test data pollution**                     | High   | Medium      | Robust cleanup in `afterEach`, use unique test user emails          |
| **Slow test execution**                     | Low    | High        | Parallelize tests, optimize database resets, mock heavy operations  |
| **Missing edge cases**                      | Medium | Medium      | Code review of tests, exploratory testing sessions                  |

### 12.2 Integration Risk: OpenRouter Service

**Risk:** Tests depend on external AI service

**Mitigation:**

1. Use mock by default (`MOCK_AI_SERVICE=true`)
2. Create dedicated suite for real API integration (run separately)
3. Implement contract tests verifying request/response structure
4. Monitor OpenRouter API status before test runs

### 12.3 Integration Risk: Supabase Auth

**Risk:** Auth flows complex, potential for false positives

**Mitigation:**

1. Use real Supabase local instance (not mocked)
2. Test complete flows (register → login → protected access)
3. Verify cookies and session state explicitly
4. Test token expiration and refresh

### 12.4 Database Migration Risk

**Risk:** Schema changes break existing tests

**Mitigation:**

1. Run migrations before each test suite
2. Version migrations and test against specific schema version
3. Use TypeScript types generated from schema (already in `database.types.ts`)
4. Alert on type mismatches in CI

---

## 13. Test Plan Execution Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Install and configure testing tools (Vitest, Playwright, Testing Library)
- [ ] Set up Supabase local for tests
- [ ] Create test utilities (createTestUser, cleanup helpers)
- [ ] Implement first critical test (TC-CRIT-001)
- [ ] Configure CI pipeline for test execution

### Phase 2: Core Coverage (Week 3-4)

- [ ] Complete all Critical Priority tests (TC-CRIT-001 to TC-CRIT-006)
- [ ] Implement High Priority tests (TC-HIGH-001 to TC-HIGH-007)
- [ ] Set up coverage reporting
- [ ] Document test patterns and conventions

### Phase 3: Comprehensive Coverage (Week 5-6)

- [ ] Complete Medium Priority tests
- [ ] Implement E2E tests for critical flows
- [ ] Security testing (RLS, auth bypass attempts)
- [ ] Performance baseline tests

### Phase 4: Polish and Automation (Week 7-8)

- [ ] Low Priority tests
- [ ] Flakiness fixes
- [ ] CI/CD optimization (parallel execution, caching)
- [ ] Test documentation finalization
- [ ] Team training on test practices

---

## 14. Continuous Integration Integration

### 14.1 GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: supabase/postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "22.14.0"

      - name: Install dependencies
        run: npm ci

      - name: Start Supabase local
        run: npx supabase start

      - name: Run migrations
        run: npx supabase db reset

      - name: Run unit + integration tests
        run: npm run test
        env:
          MOCK_AI_SERVICE: true
          SUPABASE_URL: http://localhost:54321

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### 14.2 Quality Gates in CI

- **Fail if coverage drops below 80%**
- **Fail if any critical test fails**
- **Warn if execution time exceeds 10 minutes**
- **Fail on linter errors** (ESLint already configured)

---

## 15. Appendix: Test Scripts

### 15.1 Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:integration": "vitest run tests/integration",
    "test:unit": "vitest run tests/unit"
  }
}
```

### 15.2 Test File Naming Convention

- **Unit tests:** `*.test.ts` (e.g., `generation.service.test.ts`)
- **Integration tests:** `*.integration.test.ts`
- **E2E tests:** `*.e2e.test.ts`
- **Component tests:** `*.component.test.tsx`

### 15.3 Test Directory Structure

```
tests/
├── unit/
│   ├── services/
│   │   ├── generation.service.test.ts
│   │   ├── flashcard.service.test.ts
│   │   └── openrouter.service.test.ts
│   ├── validation/
│   │   └── schemas.test.ts
│   └── utils/
│       └── helpers.test.ts
├── integration/
│   ├── api/
│   │   ├── auth.test.ts
│   │   ├── generations.test.ts
│   │   └── flashcards.test.ts
│   ├── database/
│   │   ├── rls-policies.test.ts
│   │   └── rpc-functions.test.ts
│   └── middleware.test.ts
├── e2e/
│   ├── auth-flow.e2e.test.ts
│   ├── generation-flow.e2e.test.ts
│   └── flashcard-management.e2e.test.ts
├── fixtures/
│   ├── flashcards.ts
│   ├── users.ts
│   └── generations.ts
└── helpers/
    ├── test-db.ts
    ├── test-auth.ts
    └── test-server.ts
```

---

## 16. Success Metrics

After implementing this test plan, success will be measured by:

1. **Defect Reduction:** 80% fewer bugs reaching production
2. **Confidence in Deployments:** Team comfortable with automated deployments
3. **Refactoring Safety:** Can refactor code with confidence tests will catch regressions
4. **Onboarding Speed:** New developers can understand system through tests
5. **Documentation Value:** Tests serve as living documentation of expected behavior

**Review Cadence:** Test plan reviewed and updated quarterly or after major feature additions.
