# API Endpoint Implementation Plan: POST /api/flashcards

## 1. Endpoint Overview

- Purpose: Create one or many flashcards in a single request, supporting manual entries and AI-reviewed cards linked to a prior generation.
- Behavior: Validates payload, optionally verifies `generation_id` ownership, inserts flashcards in one transaction, and updates generation acceptance counters for AI-derived cards.
- Tech context: Astro API route (`src/pages/api/flashcards.ts`), Supabase from `context.locals.supabase`, TypeScript 5, Zod validation, service abstraction under `src/lib/services`.

## 2. Request Details

- HTTP Method: POST
- URL: `/api/flashcards`
- Authentication: Required (use existing auth middleware / Supabase session from locals).
- Body schema (command): `CreateFlashcardsCommand`
  - Required:
    - `flashcards`: array (min 1, max 50) of `{ front, back, source }`
      - `front`: string, required, max 200 chars
      - `back`: string, required, max 500 chars
      - `source`: enum `"manual" | "ai-full" | "ai-edited"`
  - Optional:
    - `generation_id`: number; required when any `source` is `ai-full` or `ai-edited`; must belong to user.
- Additional rules:
  - When `generation_id` is absent, all `source` values must be `manual`; stored as `NULL` in DB.
  - Payload size guards: enforce array limit (50) and string length limits via Zod.

## 3. Used Types

- From `src/types.ts`:
  - `CreateFlashcardsCommand` (request model)
  - `FlashcardToCreate`
  - `CreateFlashcardsResultDto` (service / response payload)
  - `ApiSuccessResponse<T>` and `ApiErrorResponse`
  - `FlashcardDto` for returned rows
- Supabase typing via `Tables<"flashcards">`, `TablesInsert<"flashcards">`.

## 4. Response Details

- Success (201):
  - `ApiSuccessResponse<CreateFlashcardsResultDto>` containing `created_count` and inserted `flashcards` (including ids, timestamps, generation_id/user_id).
- Errors:
  - 400 `VALIDATION_ERROR` with per-field `details`
  - 401 when auth missing/invalid
  - 404 `GENERATION_NOT_FOUND` when generation does not exist or not owned by user
  - 500 `INTERNAL_SERVER_ERROR` fallback for unexpected failures

## 5. Data Flow

1. Auth: read `supabase` and `session` (or user id) from `locals`; reject unauthorized.
2. Parse & validate body with Zod → `CreateFlashcardsCommand`.
3. Derived validation:
   - If any source is AI, require `generation_id`.
   - If `generation_id` omitted, assert all sources are `manual`.
4. If `generation_id` present:
   - Fetch generation by id + user; if missing → 404.
   - Compute `accepted_unedited_count` (ai-full) and `accepted_edited_count` (ai-edited) from payload.
5. Persist in single transaction:
   - Use Postgres RPC (recommended) `create_flashcards_with_generation_update(generation_id, flashcards_json, user_id)` to:
     - Insert flashcards (bulk) with `user_id` and optional `generation_id`.
     - Update `generations.accepted_unedited_count` and `.accepted_edited_count` with incremental values.
     - Return inserted rows.
   - If all sources manual, RPC can ignore generation update and set `generation_id` NULL.
6. Map RPC result to `CreateFlashcardsResultDto` and return 201.
7. Log (server console/structured) unexpected errors; do not write to `generation_error_logs` (that table is for generation failures, not creation).

## 6. Security Considerations

- Authentication: enforce logged-in user via Supabase session.
- Authorization: validate `generation_id` ownership before mutation.
- Input validation: Zod for types, lengths, enum; enforce array limits to prevent abuse.
- Transactional integrity: rely on Postgres function to avoid partial writes.
- Data isolation: always set `user_id` from session, never from client payload.
- Rate/abuse: consider future rate limiting on endpoint; size limits already present (max 50 cards, length caps).
- Logging: avoid leaking sensitive data in error responses; sanitize validation details to only include fields/messages.

## 7. Error Handling

- 400:
  - Invalid JSON or schema violations (front/back length, missing fields, array size, missing generation_id when AI sources used, manual-only rule when generation_id absent).
  - Use structured `ApiErrorResponse` with `details` array.
- 401:
  - Missing/invalid session.
- 404:
  - Generation not found or not owned by user.
- 500:
  - RPC failure, DB error, unexpected exceptions; log server-side, return generic message.

## 8. Performance Considerations

- Single bulk insert via RPC minimizes round trips and ensures transactionality.
- Keep response payload bounded (max 50 rows).
- Index usage: relies on existing PK/FK; ensure `generations.id` lookup uses PK (already indexed).
- Validation happens before DB call to avoid unnecessary transactions.

## 9. Implementation Steps

1. Define Zod schema in `src/pages/api/flashcards.ts` (or shared validator) matching `CreateFlashcardsCommand`, with custom refinements for AI/manual rules and array limits.
2. Add/verify Supabase RPC SQL function `create_flashcards_with_generation_update` to perform transactional insert + generation counter updates and return inserted rows (typed to `flashcards`). Expose via `rpc` name.
3. Implement API handler:
   - Require auth via `locals.supabase.auth.getUser()` (or existing helper); return 401 if missing.
   - Parse JSON body; run Zod validation; on failure return 400 with `VALIDATION_ERROR` details.
   - When `generation_id` present, fetch generation by id/user; return 404 if absent.
   - Compute AI counts from payload for RPC arguments.
   - Call RPC with `user_id`, `generation_id` (nullable), flashcards array.
   - On success, map rows to `CreateFlashcardsResultDto` and respond 201.
4. Add unit/integration tests (if harness present) for:
   - Manual single/multi without generation_id.
   - AI with generation_id present, correct counter updates.
   - Validation errors (length, missing generation_id for AI, manual-only rule).
   - 404 when generation not found or owned by another user.
5. Document endpoint in API docs (if applicable) and ensure types exported remain consistent.
