# API Endpoint Implementation Plan: GET /api/flashcards

## 1. Endpoint Overview

This endpoint retrieves a paginated list of flashcards belonging to the authenticated user. It supports optional search filtering to find flashcards by their front or back content. The endpoint implements secure, user-scoped queries with pagination to ensure good performance and user experience.

**Key Features:**

- User-scoped data retrieval (only authenticated user's flashcards)
- Pagination support with configurable page size
- Optional full-text search across front and back content
- Efficient database queries with proper indexing considerations

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/flashcards`
- **Authentication**: Required (Supabase auth session)

### Query Parameters:

**Optional Parameters:**

- `page` (integer, default: 1)
  - Must be >= 1
  - Determines which page of results to return
  - Example: `?page=2`

- `limit` (integer, default: 20)
  - Must be between 1 and 100 (inclusive)
  - Determines number of items per page
  - Example: `?limit=50`

- `search` (string, optional)
  - Filters flashcards where front or back content contains the search term
  - Case-insensitive search
  - Example: `?search=javascript`

**Example Requests:**

```
GET /api/flashcards
GET /api/flashcards?page=1&limit=20
GET /api/flashcards?search=algorithm
GET /api/flashcards?page=2&limit=50&search=python
```

### Request Body:

None (GET request)

## 3. Used Types

### Existing Types (from `src/types.ts`):

```typescript
// Response DTO
export type FlashcardDto = Tables<"flashcards">;

export interface PaginationDto {
  page: number;
  limit: number;
  total_items: number;
  total_pages: number;
}

export interface PaginatedFlashcardsDto {
  data: FlashcardDto[];
  pagination: PaginationDto;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
```

### New Validation Schema (to be created):

**Location**: `src/pages/api/flashcards/index.ts` (inline) or `src/lib/schemas/flashcards.schema.ts` (if extracted)

```typescript
import { z } from "zod";

const ListFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

export type ListFlashcardsQuery = z.infer<typeof ListFlashcardsQuerySchema>;
```

## 4. Response Details

### Success Response (200 OK):

```json
{
  "data": [
    {
      "id": 123,
      "user_id": "uuid-string",
      "generation_id": 45,
      "front": "What is a closure in JavaScript?",
      "back": "A closure is a function that has access to variables in its outer scope",
      "source": "ai-full",
      "created_at": "2025-12-29T10:00:00Z",
      "updated_at": "2025-12-29T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 150,
    "total_pages": 8
  }
}
```

**Type**: `PaginatedFlashcardsDto`

### Error Responses:

**401 Unauthorized** - Missing or invalid authentication:

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**400 Bad Request** - Invalid query parameters:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "page": "Must be at least 1",
      "limit": "Must not exceed 100"
    }
  }
}
```

**500 Internal Server Error** - Server-side errors:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred"
  }
}
```

## 5. Data Flow

### Request Flow:

1. **Request Received**: Astro API endpoint receives GET request
2. **Authentication Check**: Validate user session via `context.locals.supabase`
3. **Parameter Validation**: Parse and validate query parameters using Zod schema
4. **Service Call**: Call `FlashcardsService.listFlashcards()` with validated parameters
5. **Database Query**: Service executes Supabase query with:
   - User ID filter (from authenticated session)
   - Pagination (LIMIT and OFFSET)
   - Optional search filter (ILIKE on front and back columns)
   - Count query for total items
6. **Response Transformation**: Format data into `PaginatedFlashcardsDto`
7. **Response Return**: Return JSON response with 200 status code

### Database Interactions:

**Main Query (Flashcards Retrieval):**

```typescript
const { data, error } = await supabase
  .from("flashcards")
  .select("*")
  .eq("user_id", userId)
  .ilike("front", `%${search}%`) // if search provided
  .or(`back.ilike.%${search}%`) // if search provided
  .order("created_at", { ascending: false })
  .range(offset, offset + limit - 1);
```

**Count Query (Total Items):**

```typescript
const { count, error } = await supabase
  .from("flashcards")
  .select("*", { count: "exact", head: true })
  .eq("user_id", userId)
  .ilike("front", `%${search}%`) // if search provided
  .or(`back.ilike.%${search}%`); // if search provided
```

### Service Layer Structure:

**Location**: `src/lib/services/flashcards.service.ts`

```typescript
export class FlashcardsService {
  async listFlashcards(
    supabase: SupabaseClient,
    userId: string,
    page: number,
    limit: number,
    search?: string
  ): Promise<PaginatedFlashcardsDto> {
    // Calculate offset
    // Build query with filters
    // Execute data and count queries
    // Calculate total_pages
    // Return formatted response
  }
}
```

## 6. Security Considerations

### Authentication:

1. **Session Validation**:
   - Use `context.locals.supabase.auth.getUser()` to get authenticated user
   - Return 401 if no valid session exists
   - Extract `user.id` for data scoping

2. **Session Handling**:
   - Leverage Astro middleware for session management
   - Use `context.locals.supabase` (never import client directly)

### Authorization:

1. **User-Scoped Queries**:
   - Always filter by `user_id = authenticated_user.id`
   - Never expose other users' flashcards
   - Enforce at both service and database level

2. **Row Level Security (RLS)**:
   - Ensure Supabase RLS policies are enabled on `flashcards` table
   - RLS policy should enforce: `auth.uid() = user_id`
   - Provides defense-in-depth even if application code has bugs

### Input Validation:

1. **Query Parameter Sanitization**:
   - Use Zod for type coercion and validation
   - Enforce min/max constraints on page and limit
   - Trim and sanitize search strings
   - Reject malformed inputs with 400 status

2. **SQL Injection Prevention**:
   - Use Supabase client's parameterized queries
   - Never concatenate user input into raw SQL
   - Supabase handles escaping automatically

3. **Search Input Handling**:
   - Limit search string length (e.g., max 100 characters)
   - Consider stripping special characters if needed
   - Use `.ilike()` operator which is parameterized

### Rate Limiting:

Consider implementing rate limiting to prevent:

- Excessive pagination requests
- Search query abuse
- Potential DoS attacks

Implementation options:

- Middleware-based rate limiting
- Cloudflare or reverse proxy rate limiting
- Supabase edge functions rate limiting

## 7. Error Handling

### Error Scenarios:

| Scenario                     | Status Code | Error Code         | Action                            |
| ---------------------------- | ----------- | ------------------ | --------------------------------- |
| No authentication token      | 401         | `UNAUTHORIZED`     | Return error, log attempt         |
| Invalid/expired token        | 401         | `UNAUTHORIZED`     | Return error, log attempt         |
| `page < 1`                   | 400         | `VALIDATION_ERROR` | Return validation details         |
| `limit < 1` or `limit > 100` | 400         | `VALIDATION_ERROR` | Return validation details         |
| Invalid parameter types      | 400         | `VALIDATION_ERROR` | Return Zod error details          |
| Database connection error    | 500         | `INTERNAL_ERROR`   | Log error, return generic message |
| Supabase query error         | 500         | `INTERNAL_ERROR`   | Log error, return generic message |
| Unexpected exceptions        | 500         | `INTERNAL_ERROR`   | Log error, return generic message |

### Error Response Format:

All errors should follow the `ApiErrorResponse` interface:

```typescript
return new Response(
  JSON.stringify({
    error: {
      code: "ERROR_CODE",
      message: "User-friendly message",
      details: optionalDetails, // Only for 400 errors
    },
  }),
  {
    status: statusCode,
    headers: { "Content-Type": "application/json" },
  }
);
```

### Error Logging:

1. **Authentication Errors**: Log with user context (IP, timestamp)
2. **Validation Errors**: Debug-level logging only
3. **Database Errors**: Error-level logging with full stack trace
4. **Unexpected Errors**: Critical-level logging with full context

### Implementation Strategy:

```typescript
export const GET: APIRoute = async (context) => {
  try {
    // Auth check (early return pattern)
    const {
      data: { user },
      error: authError,
    } = await context.locals.supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: {
            code: "UNAUTHORIZED",
            message: "Authentication required",
          },
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validation (early return pattern)
    const validationResult = ListFlashcardsQuerySchema.safeParse({
      page: context.url.searchParams.get("page"),
      limit: context.url.searchParams.get("limit"),
      search: context.url.searchParams.get("search"),
    });

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: validationResult.error.flatten(),
          },
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Business logic
    const result = await flashcardsService.listFlashcards(
      context.locals.supabase,
      user.id,
      validationResult.data.page,
      validationResult.data.limit,
      validationResult.data.search
    );

    // Success response
    return new Response(JSON.stringify(result), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    // Unexpected errors
    console.error("Error listing flashcards:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
```

## 8. Performance Considerations

### Database Optimization:

1. **Indexes**:
   - Ensure index exists on `flashcards.user_id` for efficient filtering
   - Consider composite index on `(user_id, created_at)` for sorted queries
   - For search functionality, consider GIN index on front and back columns:
     ```sql
     CREATE INDEX idx_flashcards_search ON flashcards
     USING gin(to_tsvector('english', front || ' ' || back));
     ```

2. **Query Efficiency**:
   - Use `range()` for pagination (more efficient than OFFSET)
   - Consider separate count query only when necessary
   - Limit result set with max `limit` of 100

3. **N+1 Query Prevention**:
   - Single query retrieves all flashcard data
   - No need for join with generations table (generation_id is sufficient)

### Caching Strategy:

Consider implementing caching for:

- **Response Caching**: Cache paginated results for short duration (e.g., 30 seconds)
- **Count Caching**: Cache total count separately with longer TTL
- **Cache Invalidation**: Invalidate on POST/PATCH/DELETE operations

### Pagination Best Practices:

1. **Reasonable Defaults**: Default to 20 items per page
2. **Maximum Limit**: Cap at 100 items to prevent excessive data transfer
3. **Empty Results**: Return empty array with valid pagination metadata
4. **Total Pages Calculation**: `Math.ceil(total_items / limit)`

### Potential Bottlenecks:

1. **Large Result Sets**: User with thousands of flashcards
   - Mitigation: Enforce max limit, use cursor-based pagination in future
2. **Search Performance**: Full-text search on large datasets
   - Mitigation: Use database indexes, consider search debouncing on frontend
3. **Count Queries**: Expensive on large tables
   - Mitigation: Cache counts, consider approximate counts for very large datasets

## 9. Implementation Steps

### Step 1: Create Validation Schema

**File**: `src/lib/schemas/flashcards.schema.ts` (or inline in endpoint)

1. Import Zod
2. Define `ListFlashcardsQuerySchema`:
   - `page`: coerce to number, integer, min 1, default 1
   - `limit`: coerce to number, integer, min 1, max 100, default 20
   - `search`: optional string, trim whitespace
3. Export schema and inferred type

### Step 2: Create Flashcards Service

**File**: `src/lib/services/flashcards.service.ts`

1. Create `FlashcardsService` class or module with functions
2. Implement `listFlashcards()` method:
   - Accept parameters: `supabase`, `userId`, `page`, `limit`, `search?`
   - Calculate offset: `(page - 1) * limit`
   - Build base query with user_id filter
   - Add search filter if provided (using `.or()` with `.ilike()`)
   - Add ordering: `created_at DESC`
   - Execute data query with `range(offset, offset + limit - 1)`
   - Execute count query with same filters
   - Calculate `total_pages`: `Math.ceil(count / limit)`
   - Return `PaginatedFlashcardsDto` object
3. Add proper error handling for database errors
4. Add JSDoc comments

### Step 3: Create API Endpoint File

**File**: `src/pages/api/flashcards/index.ts`

1. Create file with `export const prerender = false`
2. Import required types and dependencies:
   - `APIRoute` from `astro`
   - `FlashcardsService`
   - Validation schema
   - DTO types
3. Create skeleton for GET handler

### Step 4: Implement Authentication Check

In the GET handler:

1. Call `context.locals.supabase.auth.getUser()`
2. Check for errors or missing user
3. Return 401 response if authentication fails
4. Extract `user.id` for later use

### Step 5: Implement Input Validation

1. Extract query parameters from `context.url.searchParams`
2. Parse with Zod using `safeParse()`
3. Check validation result
4. Return 400 response with validation errors if failed
5. Extract validated data for service call

### Step 6: Implement Service Call

1. Instantiate or import `FlashcardsService`
2. Call `listFlashcards()` with:
   - `context.locals.supabase`
   - `user.id`
   - Validated `page`, `limit`, `search` parameters
3. Await the result

### Step 7: Implement Success Response

1. Return `Response` object with:
   - Stringified result data
   - Status 200
   - Content-Type: application/json header

### Step 8: Implement Error Handling

1. Wrap entire handler in try-catch
2. Catch unexpected errors
3. Log errors appropriately
4. Return 500 response with generic error message

### Step 11: Write Unit Tests

**File**: `src/lib/services/flashcards.service.test.ts`

1. Test `listFlashcards()` method:
   - Test successful retrieval with various page/limit combinations
   - Test search functionality
   - Test empty results
   - Test pagination calculations
   - Mock Supabase client responses

### Step 12: Write Integration Tests

**File**: `tests/api/flashcards.test.ts`

1. Test GET /api/flashcards endpoint:
   - Test with authentication
   - Test without authentication (401)
   - Test with invalid parameters (400)
   - Test pagination
   - Test search functionality
   - Test empty results
   - Test data isolation (user can't see others' flashcards)

### Step 13: Test Manually

1. Start dev server
2. Use Postman/Insomnia or curl to test:
   - Basic retrieval
   - Pagination
   - Search
   - Error cases
3. Verify responses match specification

### Step 14: Update API Documentation

1. Update OpenAPI/Swagger spec if present
2. Add JSDoc comments to endpoint
3. Update README or API docs

---

## Additional Notes

### Future Enhancements:

1. **Cursor-based Pagination**: For better performance with large datasets
2. **Advanced Search**: Full-text search with ranking, phrase matching
3. **Filtering**: Filter by source type, date ranges, tags (if added later)
4. **Sorting Options**: Allow sorting by different fields (e.g., updated_at, front)
5. **Response Compression**: Gzip compression for large responses
6. **Caching Headers**: Add appropriate Cache-Control headers

### Testing Checklist:

- [ ] Authentication required and working
- [ ] User can only see their own flashcards
- [ ] Pagination works correctly
- [ ] Search works on front content
- [ ] Search works on back content
- [ ] Default values applied correctly
- [ ] Validation rejects invalid inputs
- [ ] Empty results handled gracefully
- [ ] Error responses follow specification
- [ ] Performance is acceptable with large datasets
- [ ] RLS policies are enforced
- [ ] Database indexes are in place

### Dependencies:

- `zod`: For validation schemas
- `@supabase/supabase-js`: Supabase client (already included)
- Astro API routes (already configured)

### Environment Variables:

No additional environment variables needed (uses existing Supabase configuration).
