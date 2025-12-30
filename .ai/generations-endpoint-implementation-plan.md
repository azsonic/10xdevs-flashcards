# API Endpoint Implementation Plan: POST /api/generations

## 1. Endpoint Overview
This document outlines the implementation plan for the `POST /api/generations` endpoint. Its primary function is to generate flashcard candidates from a user-provided source text using an external AI service. This endpoint orchestrates input validation, AI interaction, success and error logging, and returns the generated candidates to the client without persisting them as flashcards.

## 2. Request Details
- **HTTP Method**: `POST`
- **URL Structure**: `/api/generations`
- **Authentication**: Required (handled by Astro middleware).
- **Request Body**: The request body must be a JSON object conforming to the `GenerateFlashcardsCommand` type.

```typescript
// src/types.ts
export interface GenerateFlashcardsCommand {
  source_text: string;
}
```

## 3. Used Types
The implementation will utilize the following DTOs and Command Models defined in `src/types.ts`:
- **Command Models**:
  - `GenerateFlashcardsCommand`
- **Data Transfer Objects (DTOs)**:
  - `GenerateFlashcardsResultDto`
  - `FlashcardCandidateDto`
- **API Response Wrappers**:
  - `ApiSuccessResponse<GenerateFlashcardsResultDto>`
  - `ApiErrorResponse`

## 4. Response Details
- **Success (200 OK)**: On successful generation, the endpoint returns a JSON object with the generated candidates and metadata.
  ```json
  {
    "data": {
      "generation_id": 46,
      "model": "gpt-4o-mini",
      "generated_count": 8,
      "generation_duration": 4523,
       "flashcard_candidates": [
        { "front": "...", "back": "..." }
      ],
      "created_at": "2025-12-29T10:20:00Z"
    }
  }
  ```
- **Error**: For failures, the endpoint returns a JSON object with a structured error message. Status codes include `400`, `401`, `408`, and `500`.

## 5. Data Flow
1. A `POST` request is sent to `/api/generations`.
2. Astro middleware intercepts the request to verify the user's authentication status.
3. The API route handler in `src/pages/api/generations/index.ts` receives the request.
4. **Validation**: The `source_text` in the request body is validated using a Zod schema to ensure it's a string between 1000 and 5000 characters.
5. The handler calls the `generateFlashcards` method in `src/lib/generation.service.ts`, passing the `source_text` and the authenticated `user_id`.
6. **Service Logic**:
   a. A SHA-256 hash of the `source_text` is computed.
   b. A timer is started.
   c. An API call is made to the AI service (e.g., OpenRouter) with a 30-second timeout mechanism (`Promise.race`).
   d. The AI service responds with generated flashcard candidates.
   e. The timer is stopped, and the `generation_duration` is calculated.
   f. A new record is inserted into the `generations` table with metadata about the successful event.
   g. The service returns a `GenerateFlashcardsResultDto` object to the route handler.
7. The route handler wraps the result in an `ApiSuccessResponse` and sends it back to the client with a `200 OK` status.

### Error Data Flow
- If Zod validation fails, the handler immediately returns a `400 Bad Request`.
- If any step within the service logic fails (e.g., AI timeout, database error), a structured error is thrown.
- The service's `catch` block logs the failure details to the `generation_error_logs` table.
- The route handler's `catch` block formats the error into an `ApiErrorResponse` and returns it with the appropriate status code (`408` or `500`).

## 6. Security Considerations
- **Authentication**: All requests to this endpoint will be protected by middleware that verifies a valid user session. Unauthenticated requests will be rejected with a `401 Unauthorized`.
- **Authorization**: All database operations will be scoped to the authenticated user's ID, preventing data access or modification across accounts.
- **Input Validation**: Strict validation of `source_text` length prevents abuse with excessively large or small payloads.
- **Rate Limiting**: Middleware should be configured to apply rate limiting to this endpoint to prevent DoS attacks that could lead to high AI service costs.
- **Prompt Engineering**: The system prompt sent to the AI will be carefully crafted to constrain its behavior, ensuring it only generates flashcards in the specified JSON format and does not execute other instructions.

## 7. Error Handling
| Scenario | HTTP Status | Error Code | Action |
|---|---|---|---|
| Invalid `source_text` | `400 Bad Request` | `VALIDATION_ERROR` | Return detailed validation error message. |
| Missing/Invalid Auth Token | `401 Unauthorized` | `UNAUTHORIZED` | Reject request (handled by middleware). |
| Generation > 30s | `408 Request Timeout` | `GENERATION_TIMEOUT` | Log to `generation_error_logs`, return error. |
| AI Service Fails | `500 Internal Server Error` | `AI_SERVICE_ERROR` | Log to `generation_error_logs`, return error. |
| Database Insert Fails | `500 Internal Server Error` | `DATABASE_ERROR` | Log exception, return generic server error. |

## 8. Performance Considerations
- **Primary Bottleneck**: The main performance bottleneck is the latency of the external AI service call.
- **Timeout**: A hard 30-second timeout is implemented to prevent long-running requests from holding up server resources and providing a poor user experience.
- **Asynchronous Operations**: All I/O operations (AI API calls, database queries) will be fully asynchronous to ensure the Node.js event loop is not blocked.

## 9. Implementation Steps
1.  **Create Service File**: Create a new file at `src/lib/generation.service.ts`.
2.  **Define Zod Schema**: In the API route file, define the Zod schema for the `GenerateFlashcardsCommand`.
3.  **Create API Route**: Create the API route file at `src/pages/api/generations/index.ts`.
4.  **Implement POST Handler**:
    -   Define an `export const POST: APIRoute = async ({ request, locals }) => { ... }`.
    -   Ensure a user session exists (`locals.session`), otherwise return a 401 response.
    -   Parse and validate the request body using the Zod schema.
    -   Implement a `try...catch` block to call the generation service and handle any errors.
    -   Format and return the `ApiSuccessResponse` or `ApiErrorResponse`.
5.  **Implement Generation Service Logic**:
    -   Create the main `generateFlashcards` function that accepts `source_text` and `user_id`.
    -   Use the Web Crypto API (`crypto.subtle.digest`) to generate the SHA-256 hash.
    -   Implement the `fetch` call to the AI service.
    -   Wrap the `fetch` call in a `Promise.race` with a `setTimeout` promise to enforce the 30-second timeout.
    -   On success, use the Supabase client to insert a new record into the `generations` table.
    -   On failure, use the Supabase client to insert a new record into the `generation_error_logs` table.
6.  **Add Environment Variables**: Add `OPENROUTER_API_KEY` to the project's environment variables (`.env`).
7.  **Update Middleware**: Verify that the authentication middleware in `src/middleware/index.ts` correctly protects the `/api/generations` route. Consider adding rate-limiting logic.
