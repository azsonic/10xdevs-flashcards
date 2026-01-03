# API Endpoint Implementation Plan: GET /api/flashcards/:id

## 1. Endpoint Overview

This endpoint retrieves a single flashcard by its unique identifier. It ensures that the user is authenticated and that the flashcard belongs to the requesting user.

## 2. Request Details

- **HTTP Method**: `GET`
- **URL Structure**: `/api/flashcards/:id`
- **Parameters**:
  - **Required**: `id` (path parameter) - The unique integer identifier of the flashcard.
  - **Optional**: None.
- **Request Body**: None.

## 3. Used Types

- **DTOs**:
  - `FlashcardDto` (from `@src/types.ts`): The structure of the returned flashcard data.
  - `ApiSuccessResponse<FlashcardDto>` (from `@src/types.ts`): Wrapper for successful response.
  - `ApiErrorResponse` (from `@src/types.ts`): Wrapper for error responses.
- **Service Functions**:
  - `getFlashcardByIdForUser` (from `@src/lib/flashcard.service.ts`): Function to retrieve the flashcard from the database.

## 3. Response Details

The endpoint returns a JSON response.

### Success (200 OK)

```json
{
  "data": {
    "id": 123,
    "user_id": "uuid-string",
    "generation_id": 45,
    "front": "Front content",
    "back": "Back content",
    "source": "ai-full",
    "created_at": "2025-12-29T10:00:00Z",
    "updated_at": "2025-12-29T10:00:00Z"
  }
}
```

### Error Responses

- **400 Bad Request**: Invalid ID format (e.g., non-integer, negative).
- **401 Unauthorized**: User is not authenticated.
- **404 Not Found**: Flashcard does not exist or does not belong to the user.
- **500 Internal Server Error**: Database or server error.

## 4. Data Flow

1. **Request Reception**: The `GET` request is routed to `src/pages/api/flashcards/[id].ts`.
2. **Authentication Check**: Access `locals.user` provided by the middleware to verify authentication.
3. **Input Validation**: Parse and validate the `id` parameter using `parseFlashcardId` helper.
4. **Service Call**: Invoke `getFlashcardByIdForUser` with the validated `id` and `user.id`.
5. **Database Interaction**: The service queries the `flashcards` table via Supabase, filtering by `id` and `user_id`.
6. **Response Construction**:
   - If found, wrap data in the success response format and return 200.
   - If not found (service returns `null`), return 404.
   - If an error occurs, return appropriate error status and message.

## 5. Security Considerations

- **Authentication**: Strict check for `locals.user`. Return 401 if missing.
- **Authorization**: The query explicitly filters by `user_id` (`.eq("user_id", userId)` in the service), ensuring users can only access their own flashcards. This acts as an application-level Row Level Security (RLS) enforcement.
- **Input Validation**: Strict integer parsing for `id` prevents SQL injection or invalid query attempts.

## 6. Error Handling

- **Invalid ID**: Return 400 with code `VALIDATION_ERROR`.
- **Not Found**: Return 404 with code `NOT_FOUND` if the service returns `null`.
- **Database Errors**: Catch `FlashcardUpdateError` (or generic errors) from the service and return 500 with code `DATABASE_ERROR` or `INTERNAL_ERROR`.

## 7. Performance Considerations

- **Indexing**: The `id` column is the primary key, ensuring O(1) lookup performance.
- **Efficient Querying**: The service uses `.maybeSingle()` which is optimized for fetching single rows.
- **Prerendering**: `export const prerender = false;` is already set in the file to ensure dynamic handling.

## 8. Implementation Steps

1. **Locate File**: Open `src/pages/api/flashcards/[id].ts`.
2. **Add GET Handler**: Implement the `export const GET: APIRoute = async ...` function.
3. **Reuse Helpers**: Use the existing `parseFlashcardId` function for ID validation.
4. **Implement Logic**:
   - Extract `user` and `supabase` from `locals`.
   - Validate auth (401).
   - Parse `id` (400).
   - Call `getFlashcardByIdForUser`.
   - specific check for `null` result (404).
   - Return JSON response (200).
   - Add try-catch block for error handling.
5. **Verify Types**: Ensure response matches `ApiSuccessResponse<FlashcardDto>`.
