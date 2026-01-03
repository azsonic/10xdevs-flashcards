# API Endpoint Implementation Plan: DELETE /api/flashcards/:id

## 1. Endpoint Overview

This endpoint permanently deletes a single flashcard owned by the authenticated user. The deletion is a hard delete operation that removes the flashcard record from the database. Due to the database's foreign key constraints, the `generation_id` field in the `flashcards` table has `ON DELETE SET NULL`, ensuring referential integrity with the `generations` table.

**Key Characteristics:**
- Idempotent operation (multiple DELETE requests to non-existent resource return 404)
- Requires user authentication and ownership verification
- Returns 204 No Content on successful deletion (no response body)
- Implements IDOR protection by validating both flashcard ID and user ownership

## 2. Request Details

**HTTP Method:** DELETE

**URL Structure:** `/api/flashcards/:id`

**Path Parameters:**
- `id` (required, integer) - The unique identifier of the flashcard to delete
  - Must be a positive integer
  - Must be a valid number (not NaN, Infinity, or negative)

**Query Parameters:** None

**Request Headers:**
- `Authorization`: Bearer token (handled by Supabase authentication)
- `Cookie`: Session cookie (alternative authentication method)

**Request Body:** None

## 3. Used Types

### Existing Types (from `src/types.ts`)

**ApiErrorResponse:**
```typescript
interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### New Types to Add

**FlashcardDeletionError** (to be added in `src/lib/flashcard.service.ts`):
```typescript
export class FlashcardDeletionError extends Error {
  constructor(
    public code: "NOT_FOUND" | "DATABASE_ERROR",
    message: string
  ) {
    super(message);
    this.name = "FlashcardDeletionError";
  }
}
```

### Validation Schema

**Path Parameter Schema** (using Zod):
```typescript
import { z } from "zod";

const deleteFlashcardParamsSchema = z.object({
  id: z.string()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z.number()
        .int("ID must be an integer")
        .positive("ID must be a positive number")
    )
});
```

## 4. Response Details

### Success Response

**Status Code:** 204 No Content

**Response Body:** Empty (no content)

**Response Headers:**
- No specific headers required

### Error Responses

#### 400 Bad Request
**Trigger:** Invalid ID format (not a number, negative, zero, NaN, or Infinity)

**Response Body:**
```json
{
  "error": {
    "code": "INVALID_ID",
    "message": "Invalid flashcard ID format. ID must be a positive integer.",
    "details": {
      "issues": [/* Zod validation errors */]
    }
  }
}
```

#### 401 Unauthorized
**Trigger:** Missing or invalid authentication token

**Response Body:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required. Please log in to continue."
  }
}
```

#### 404 Not Found
**Trigger:** 
- Flashcard with the specified ID doesn't exist
- Flashcard exists but belongs to a different user (authorization failure)

**Response Body:**
```json
{
  "error": {
    "code": "FLASHCARD_NOT_FOUND",
    "message": "Flashcard not found or you do not have permission to delete it."
  }
}
```

**Note:** Both "not found" and "not authorized" scenarios return the same 404 response to prevent information leakage about which flashcards exist in the system.

#### 500 Internal Server Error
**Trigger:** Database connection failure or unexpected server error

**Response Body:**
```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred while processing your request."
  }
}
```

## 5. Data Flow

### Request Processing Flow

1. **Request Reception**
   - Astro endpoint receives DELETE request at `/api/flashcards/:id`
   - Extract `id` from URL path parameters

2. **Input Validation**
   - Parse and validate `id` parameter using Zod schema
   - Convert string ID to positive integer
   - Return 400 if validation fails

3. **Authentication Check**
   - Retrieve Supabase client from `context.locals.supabase`
   - Get user session via `supabase.auth.getUser()`
   - Return 401 if no valid session exists

4. **Service Layer Invocation**
   - Extract `user_id` from authenticated session
   - Call `deleteFlashcardForUser({ supabase, id, userId })`

5. **Database Operation**
   - Execute DELETE query with filters:
     - `WHERE id = :id AND user_id = :userId`
   - Check affected row count
   - Throw `FlashcardDeletionError("NOT_FOUND")` if no rows affected
   - Throw `FlashcardDeletionError("DATABASE_ERROR")` on database error

6. **Response Generation**
   - On success: Return 204 No Content
   - On FlashcardDeletionError("NOT_FOUND"): Return 404
   - On FlashcardDeletionError("DATABASE_ERROR"): Return 500
   - On validation error: Return 400

### Database Interaction

**Query Structure:**
```sql
DELETE FROM flashcards
WHERE id = $1 AND user_id = $2
```

**Supabase Client Call:**
```typescript
const { error, count } = await supabase
  .from("flashcards")
  .delete({ count: "exact" })
  .eq("id", id)
  .eq("user_id", userId);
```

**Cascade Behavior:**
- The `generation_id` in other flashcards remains unchanged (no cascade)
- The deleted flashcard's `generation_id` reference is automatically handled by `ON DELETE SET NULL` constraint

## 6. Security Considerations

### Authentication

**Mechanism:** Supabase session-based authentication

**Implementation:**
- Retrieve authenticated user session from `context.locals.supabase`
- Verify session exists before processing deletion
- Extract user ID from verified session

**Failure Handling:**
- Return 401 Unauthorized if session is missing or invalid
- Do not expose details about why authentication failed

### Authorization (IDOR Prevention)

**Protection Strategy:**
- Include `user_id` in the DELETE query's WHERE clause
- Never rely solely on the flashcard ID for deletion
- Return 404 for both "not found" and "unauthorized" cases to prevent information disclosure

**Why 404 Instead of 403:**
- Prevents attackers from enumerating valid flashcard IDs
- Provides consistent user experience (flashcard doesn't exist "for you")
- Follows principle of least information disclosure

### Input Validation

**ID Parameter Validation:**
- Type checking: Must be parseable as integer
- Range checking: Must be positive (> 0)
- Sanitization: Convert string to number, reject special values (NaN, Infinity)

**Protection Against:**
- SQL injection (handled by Supabase parameterized queries)
- Type confusion attacks
- Integer overflow (database uses bigserial)

### Rate Limiting Considerations

While not implemented in this endpoint, consider adding:
- Per-user deletion rate limits
- IP-based rate limiting
- Monitoring for bulk deletion patterns

## 7. Error Handling

### Error Handling Strategy

Follow the existing pattern in `flashcard.service.ts`:
1. Use custom error classes for typed error handling
2. Log errors server-side with context
3. Return user-friendly error messages
4. Never expose internal database errors to clients

### Error Scenarios

| Scenario | Detection | Error Type | HTTP Status | Response Code |
|----------|-----------|------------|-------------|---------------|
| Invalid ID format | Zod validation fails | ZodError | 400 | INVALID_ID |
| ID is negative/zero | Zod validation fails | ZodError | 400 | INVALID_ID |
| No auth session | `getUser()` returns null | - | 401 | UNAUTHORIZED |
| Flashcard not found | No rows affected | FlashcardDeletionError | 404 | FLASHCARD_NOT_FOUND |
| Wrong user ownership | No rows affected | FlashcardDeletionError | 404 | FLASHCARD_NOT_FOUND |
| Database error | Supabase error | FlashcardDeletionError | 500 | INTERNAL_ERROR |
| Network timeout | Supabase error | FlashcardDeletionError | 500 | INTERNAL_ERROR |

### Error Logging

**Server-Side Logging:**
```typescript
console.error("[deleteFlashcardForUser] Error details", {
  error: error,
  id: id,
  userId: userId, // Safe to log (internal)
  timestamp: new Date().toISOString()
});
```

**What to Log:**
- Error type and message
- Flashcard ID (for debugging)
- User ID (for security auditing)
- Timestamp
- Stack trace (for unexpected errors)

**What NOT to Log:**
- Sensitive user data
- Full database connection strings
- Authentication tokens

## 8. Performance Considerations

### Database Performance

**Query Optimization:**
- The DELETE query uses primary key (`id`) and indexed foreign key (`user_id`)
- Both fields are indexed, ensuring fast lookups
- Expected query time: < 10ms for typical cases

**Index Usage:**
```sql
-- Primary key index on id (automatic)
-- Index on user_id (automatic with foreign key)
WHERE id = $1 AND user_id = $2  -- Uses both indexes
```

### Potential Bottlenecks

1. **Database Connection Pool Exhaustion**
   - Mitigation: Ensure proper connection pooling in Supabase client
   - Monitor connection pool metrics

2. **Network Latency**
   - Mitigation: Use connection pooling
   - Consider connection timeout configurations

3. **Authentication Overhead**
   - Session validation adds ~5-10ms
   - Acceptable overhead for security requirement

### Scalability Considerations

- **Concurrent Deletions:** No locking issues (deleting different flashcards)
- **Database Load:** Single-row deletion is lightweight
- **Response Time Target:** < 100ms end-to-end (P95)

### Monitoring Recommendations

- Track deletion success/failure rates
- Monitor response times (P50, P95, P99)
- Alert on elevated 500 error rates
- Log patterns of 404 errors (potential attack indicator)

## 9. Implementation Steps

### Step 1: Add FlashcardDeletionError Class to Service

**File:** `src/lib/flashcard.service.ts`

**Action:** Add the custom error class after existing error classes

```typescript
/**
 * Custom error class for flashcard deletion failures.
 */
export class FlashcardDeletionError extends Error {
  constructor(
    public code: "NOT_FOUND" | "DATABASE_ERROR",
    message: string
  ) {
    super(message);
    this.name = "FlashcardDeletionError";
  }
}
```

### Step 2: Implement deleteFlashcardForUser Service Function

**File:** `src/lib/flashcard.service.ts`

**Action:** Add the deletion service function at the end of the file

```typescript
/**
 * Deletes a flashcard for a user.
 *
 * @param supabase - Supabase client instance
 * @param id - Flashcard ID to delete
 * @param userId - Owner user ID
 * @throws {FlashcardDeletionError} When flashcard is not found or database error occurs
 */
export async function deleteFlashcardForUser({
  supabase,
  id,
  userId,
}: {
  supabase: SupabaseClient;
  id: number;
  userId: string;
}): Promise<void> {
  const { error, count } = await supabase
    .from("flashcards")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[deleteFlashcardForUser] Delete error", { 
      error, 
      id, 
      userId 
    });
    throw new FlashcardDeletionError(
      "DATABASE_ERROR",
      "Failed to delete flashcard."
    );
  }

  // If no rows were affected, the flashcard doesn't exist or doesn't belong to the user
  if (count === 0) {
    throw new FlashcardDeletionError(
      "NOT_FOUND",
      "Flashcard not found or you do not have permission to delete it."
    );
  }
}
```

### Step 3: Create Zod Validation Schema

**File:** `src/pages/api/flashcards/[id].ts` (create if doesn't exist)

**Action:** Define validation schema at the top of the file

```typescript
import { z } from "zod";

const flashcardIdParamSchema = z.object({
  id: z.string()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z.number()
        .int("ID must be an integer")
        .positive("ID must be a positive number")
    )
});
```

### Step 4: Implement DELETE Handler

**File:** `src/pages/api/flashcards/[id].ts`

**Action:** Add DELETE handler function

```typescript
import type { APIRoute } from "astro";
import { z } from "zod";
import type { ApiErrorResponse } from "../../../types";
import {
  deleteFlashcardForUser,
  FlashcardDeletionError,
} from "../../../lib/flashcard.service";

// Prerender must be false for API routes
export const prerender = false;

const flashcardIdParamSchema = z.object({
  id: z.string()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z.number()
        .int("ID must be an integer")
        .positive("ID must be a positive number")
    )
});

export const DELETE: APIRoute = async (context) => {
  // Step 1: Validate path parameter
  const parseResult = flashcardIdParamSchema.safeParse({
    id: context.params.id,
  });

  if (!parseResult.success) {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INVALID_ID",
        message: "Invalid flashcard ID format. ID must be a positive integer.",
        details: parseResult.error.issues,
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = parseResult.data;

  // Step 2: Check authentication
  const supabase = context.locals.supabase;
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required. Please log in to continue.",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Delete flashcard via service
  try {
    await deleteFlashcardForUser({
      supabase,
      id,
      userId: user.id,
    });

    // Step 4: Return 204 No Content on success
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof FlashcardDeletionError) {
      if (error.code === "NOT_FOUND") {
        const errorResponse: ApiErrorResponse = {
          error: {
            code: "FLASHCARD_NOT_FOUND",
            message: error.message,
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // DATABASE_ERROR
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while processing your request.",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Unexpected error
    // eslint-disable-next-line no-console
    console.error("[DELETE /api/flashcards/:id] Unexpected error", { error });
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while processing your request.",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
```

### Step 5: Update Service Exports (if needed)

**File:** `src/lib/flashcard.service.ts`

**Action:** Ensure all new exports are properly exported (TypeScript should handle this automatically with named exports)

Verify exports include:
- `FlashcardDeletionError`
- `deleteFlashcardForUser`

### Step 6: Test the Implementation

**Manual Testing Checklist:**

1. **Success Case (204)**
   - Authenticate as user A
   - Create a flashcard
   - DELETE the flashcard by ID
   - Verify 204 response
   - Verify flashcard no longer exists in database

2. **Invalid ID Format (400)**
   - DELETE `/api/flashcards/abc` → 400
   - DELETE `/api/flashcards/-1` → 400
   - DELETE `/api/flashcards/0` → 400
   - DELETE `/api/flashcards/3.14` → 400

3. **Unauthorized (401)**
   - Send DELETE request without authentication
   - Verify 401 response

4. **Not Found (404)**
   - Authenticate as user A
   - DELETE flashcard ID that doesn't exist → 404
   - Create flashcard as user A
   - Authenticate as user B
   - DELETE user A's flashcard → 404 (authorization failure)

5. **Database Error (500)** (harder to test)
   - Simulate database connection failure
   - Verify 500 response and error logging

**Automated Testing:**

Consider creating unit tests for:
- `deleteFlashcardForUser` function
- Parameter validation schema
- Error handling logic

Consider creating integration tests for:
- Full DELETE endpoint flow
- Authentication/authorization checks
- Database operations

### Step 7: Update API Documentation

**File:** `.ai/api-plan.md` (or relevant API documentation)

**Action:** Ensure the DELETE endpoint documentation matches the implementation:
- Confirm status codes match implementation
- Verify error response structures
- Document any additional behavior or edge cases discovered during implementation

---

## Implementation Checklist

- [ ] Add `FlashcardDeletionError` class to `flashcard.service.ts`
- [ ] Implement `deleteFlashcardForUser` function in `flashcard.service.ts`
- [ ] Create or update `src/pages/api/flashcards/[id].ts`
- [ ] Add Zod validation schema for ID parameter
- [ ] Implement DELETE handler with proper error handling
- [ ] Test all success and error scenarios
- [ ] Run linter and fix issues
- [ ] Update API documentation if needed

## Additional Notes

### Future Enhancements

1. **Soft Delete Implementation**
   - Add `deleted_at` column to flashcards table
   - Modify delete logic to set timestamp instead of removing row
   - Add periodic cleanup job for permanently removing old soft-deleted records

2. **Audit Trail**
   - Log deletion events to separate audit table
   - Track who deleted what and when
   - Useful for debugging and compliance

3. **Bulk Delete**
   - Implement `DELETE /api/flashcards` with array of IDs in body
   - More efficient for deleting multiple flashcards
   - Requires transaction handling

4. **Undo Functionality**
   - Implement soft delete first
   - Add `POST /api/flashcards/:id/restore` endpoint
   - Time-limited restore window (e.g., 30 days)

### Related Endpoints

This endpoint is part of the flashcard CRUD operations:
- `GET /api/flashcards` - List flashcards
- `GET /api/flashcards/:id` - Get single flashcard
- `POST /api/flashcards` - Create flashcards
- `PATCH /api/flashcards/:id` - Update flashcard
- `DELETE /api/flashcards/:id` - Delete flashcard (this endpoint)

Ensure consistency across all endpoints regarding:
- Authentication/authorization patterns
- Error response structures
- Validation approaches
- Logging formats

