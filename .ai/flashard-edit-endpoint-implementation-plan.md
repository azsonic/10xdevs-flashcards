# API Endpoint Implementation Plan: PATCH /api/flashcards/:id

## 1. Endpoint Overview

- Purpose: Update an existing flashcard owned by the authenticated user.
- Scope: Partial update of `front` and/or `back`; preserve other fields. Ensure the card belongs to the caller. Derive a compliant `source` value so the DB `CHECK` constraint remains satisfied (e.g., keep current source; promote `ai-full` → `ai-edited` when user edits content).

## 2. Request Details

- HTTP Method: PATCH
- URL: `/api/flashcards/:id`
- Path params: `id` (integer, required, positive).
- Auth: Supabase session from `context.locals.supabase`; reject if missing or invalid.
- Body (JSON):
  - `front?: string` (max 200 chars, trimmed, non-empty if provided)
  - `back?: string` (max 500 chars, trimmed, non-empty if provided)
  - At least one of `front` or `back` required.
- DTOs/Commands: reuse `UpdateFlashcardCommand` and `FlashcardDto` from `src/types.ts`; response envelope `ApiSuccessResponse<FlashcardDto>` / `ApiErrorResponse`.
- Validation: zod schema for body; guard clause for `id` (coerce to number, finite, >0); enforce max lengths and non-empty strings post-trim.

## 3. Response Details

- Success 200: `{ data: FlashcardDto }` matching spec (includes `id`, `user_id`, `generation_id`, `front`, `back`, `source`, `created_at`, `updated_at`).
- Errors:
  - 400: invalid `id`, empty body, validation failures.
  - 401: unauthenticated.
  - 404: not found or not owned by user.
  - 500: unexpected Supabase or server errors.

## 4. Data Flow

1. Parse `id` from params; validate numeric >0.
2. Authenticate: `context.locals.supabase.auth.getUser()`; 401 if missing.
3. Parse and validate body via zod; require at least one field; trim strings; build `UpdateFlashcardCommand`.
4. Fetch existing flashcard to:
   - ensure `user_id` matches current user (404 if not found for that user),
   - know current `source` to derive new value if needed.
5. Build update payload:
   - include provided `front`/`back`,
   - compute `nextSource`: default to current; if current `source === "ai-full"` and any field changes, set `"ai-edited"`; otherwise keep as-is. Ensure value in allowed enum (`manual`, `ai-edited`, `ai-full` already allowed).
6. Execute Supabase update on `flashcards` where `id` and `user_id` match; set `updated_at` automatically; request `select().single()` to return updated row.
7. On success, return 200 with updated flashcard in `data`.

## 5. Security Considerations

- Authentication required; only use Supabase client from `context.locals` (no direct imports).
- Authorization: scope update to `user_id = currentUser.id`; never trust path ID alone.
- Validation: enforce max lengths and non-empty strings to prevent large payloads or empty updates.
- Avoid leaking existence of others’ flashcards: return 404 for missing/unauthorized.
- Ensure response only contains the updated row; no additional user data.

## 6. Error Handling

- Validation errors → 400 with code/message, include zod issues.
- Missing auth → 401 with generic auth error code.
- Not found/unauthorized → 404 with neutral message.
- Supabase errors → map to 500; log details server-side only.
- Do not log to `generation_error_logs` (table is for generation failures); console/error logger is sufficient.

## 7. Performance

- Single-row fetch and update; minimize columns selected (only needed fields).
- Use combined `update … select().single()` to avoid an extra round-trip where possible; fetch-before-update only if needed for source derivation (cache existing row to avoid duplicate fetches).
- Keep payload small; no heavy computation.

## 8. Implementation Steps

1. Define zod schema for body (front/back optional strings with max lengths; at least one present) and `id` parsing helper.
2. Add/extend `src/lib/services/flashcards.ts` with `getFlashcardByIdForUser` and `updateFlashcardForUser` that accept Supabase client, `id`, `userId`, and payload; handle source derivation there to keep API handler thin.
3. Implement API route `src/pages/api/flashcards/[id].ts`:
   - `export const prerender = false;`
   - Method guard for PATCH only.
   - Get Supabase client from `context.locals`.
   - Authenticate user; 401 if missing.
   - Parse/validate params and body; 400 on failure.
   - Fetch existing card; 404 if not found/owned.
   - Call service update; handle Supabase errors → 500.
   - Return 200 with `ApiSuccessResponse<FlashcardDto>`.
4. Add unit test for service logic (source derivation, ownership guard) and handler-level tests for status codes (Vitest).
5. Run lint/tests; adjust per feedback.
