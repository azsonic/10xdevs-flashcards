# REST API Plan - 10xdevs-flashcards

## 1. Resources

The API exposes the following main resources, mapped to database entities:

| Resource | Database Table | Description |
|----------|----------------|-------------|
| `flashcards` | `flashcards` | Individual flashcard items owned by users |
| `generations` | `generations` | AI generation event logs and metadata |
| `generation-errors` | `generation_error_logs` | Failed AI generation attempt logs (internal) |

**Note on Authentication**: User authentication is handled by Supabase Auth. The API relies on Supabase's built-in authentication system rather than custom authentication endpoints.

## 2. Endpoints

### 2.1 Flashcards Resource

#### GET /api/flashcards

Retrieve a paginated list of the authenticated user's flashcards with optional search filtering.

**Authentication**: Required

**Query Parameters**:
- `page` (integer, optional, default: 1) - Page number for pagination
- `limit` (integer, optional, default: 20, max: 100) - Number of items per page
- `search` (string, optional) - Search query to filter flashcards by front or back content

**Request Payload**: None

**Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": 123,
      "user_id": "uuid-string",
      "generation_id": 45,
      "front": "Front content",
      "back": "Back content",
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

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication
- `400 Bad Request`: Invalid query parameters (e.g., page < 1, limit > 100)

---

#### GET /api/flashcards/:id

Retrieve a single flashcard by ID.

**Authentication**: Required

**Path Parameters**:
- `id` (integer, required) - Flashcard ID

**Request Payload**: None

**Success Response** (200 OK):
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

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Flashcard with specified ID does not exist or does not belong to user
- `400 Bad Request`: Invalid ID format

---

#### POST /api/flashcards

Create one or more flashcards manually or from AI generation. This unified endpoint handles both single and bulk creation for any source type.

**Authentication**: Required

**Request Payload**:
```json
{
  "generation_id": 45,
  "flashcards": [
    {
      "front": "Front content (max 200 chars)",
      "back": "Back content (max 500 chars)",
      "source": "ai-full"
    },
    {
      "front": "Edited front",
      "back": "Edited back",
      "source": "ai-edited"
    }
  ]
}
```

**Validation Rules**:
- `generation_id` (integer, optional) - Required only when `source` is 'ai-full' or 'ai-edited'. Must reference a valid generation owned by the user.
- `flashcards` (array, required, min: 1, max: 50) - Array of flashcard objects
- Each flashcard must have:
  - `front` (string, required, max 200 chars)
  - `back` (string, required, max 500 chars)
  - `source` (enum, required) - One of: 'manual', 'ai-full', 'ai-edited'

**Use Cases**:

*Manual Single Card*:
```json
{
  "flashcards": [
    {
      "front": "Front content",
      "back": "Back content",
      "source": "manual"
    }
  ]
}
```

*Manual Multiple Cards*:
```json
{
  "flashcards": [
    {
      "front": "Card 1 front",
      "back": "Card 1 back",
      "source": "manual"
    },
    {
      "front": "Card 2 front",
      "back": "Card 2 back",
      "source": "manual"
    }
  ]
}
```

*AI-Generated Cards (after review)*:
```json
{
  "generation_id": 45,
  "flashcards": [
    {
      "front": "AI generated front",
      "back": "AI generated back",
      "source": "ai-full"
    },
    {
      "front": "User edited front",
      "back": "User edited back",
      "source": "ai-edited"
    }
  ]
}
```

**Success Response** (201 Created):

*Single Card*:
```json
{
  "data": {
    "created_count": 1,
    "flashcards": [
      {
        "id": 124,
        "user_id": "uuid-string",
        "generation_id": null,
        "front": "Front content",
        "back": "Back content",
        "source": "manual",
        "created_at": "2025-12-29T10:05:00Z",
        "updated_at": "2025-12-29T10:05:00Z"
      }
    ]
  }
}
```

*Multiple Cards*:
```json
{
  "data": {
    "created_count": 2,
    "flashcards": [
      {
        "id": 125,
        "user_id": "uuid-string",
        "generation_id": 45,
        "front": "Front content",
        "back": "Back content",
        "source": "ai-full",
        "created_at": "2025-12-29T10:10:00Z",
        "updated_at": "2025-12-29T10:10:00Z"
      },
      {
        "id": 126,
        "user_id": "uuid-string",
        "generation_id": 45,
        "front": "Edited front",
        "back": "Edited back",
        "source": "ai-edited",
        "created_at": "2025-12-29T10:10:00Z",
        "updated_at": "2025-12-29T10:10:00Z"
      }
    ]
  }
}
```

**Business Logic**:
- All flashcards are created in a single database transaction
- If any flashcard fails validation, the entire operation is rolled back
- When `generation_id` is provided (AI-generated cards):
  - Updates the `generations` record with `accepted_unedited_count` (count of 'ai-full') and `accepted_edited_count` (count of 'ai-edited')
  - Validates that the generation exists and belongs to the authenticated user
- When `generation_id` is omitted (manual cards):
  - All flashcards must have `source: "manual"`
  - `generation_id` is set to NULL in the database

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication
- `400 Bad Request`: Validation errors
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Validation failed",
      "details": [
        {
          "field": "flashcards[0].front",
          "message": "Front content is required and must not exceed 200 characters"
        },
        {
          "field": "generation_id",
          "message": "generation_id is required when source is 'ai-full' or 'ai-edited'"
        }
      ]
    }
  }
  ```
- `404 Not Found`: Generation ID does not exist or does not belong to user
  ```json
  {
    "error": {
      "code": "GENERATION_NOT_FOUND",
      "message": "The specified generation does not exist or does not belong to you"
    }
  }
  ```

---

#### PATCH /api/flashcards/:id

Update an existing flashcard.

**Authentication**: Required

**Path Parameters**:
- `id` (integer, required) - Flashcard ID

**Request Payload** (all fields optional):
```json
{
  "front": "Updated front content",
  "back": "Updated back content"
}
```

**Success Response** (200 OK):
```json
{
  "data": {
    "id": 123,
    "user_id": "uuid-string",
    "generation_id": 45,
    "front": "Updated front content",
    "back": "Updated back content",
    "source": "ai-full",
    "created_at": "2025-12-29T10:00:00Z",
    "updated_at": "2025-12-29T10:15:00Z"
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Flashcard does not exist or does not belong to user
- `400 Bad Request`: Validation errors (e.g., exceeding character limits)

**Validation Rules**:
  - `front` (string, required, max 200 chars)
  - `back` (string, required, max 500 chars)
  - `source` (enum, required) - One of: 'manual', 'ai-edited'

---

#### DELETE /api/flashcards/:id

Delete a flashcard permanently.

**Authentication**: Required

**Path Parameters**:
- `id` (integer, required) - Flashcard ID

**Request Payload**: None

**Success Response** (204 No Content): Empty response body

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication
- `404 Not Found`: Flashcard does not exist or does not belong to user
- `400 Bad Request`: Invalid ID format

---

### 2.2 Generations Resource

#### POST /api/generations

Generate flashcard candidates from source text using AI. This endpoint calls the AI service, logs the generation event, and returns candidate flashcards that are NOT automatically saved.

**Authentication**: Required

**Request Payload**:
```json
{
  "source_text": "The text to generate flashcards from (1000-5000 characters)",
}
```

**Validation Rules**:
- `source_text` (string, required, min: 1000 chars, max: 5000 chars)
<!-- - `model` (string, optional, default: "gpt-4o-mini") - AI model identifier -->

**Success Response** (200 OK):
```json
{
  "data": {
    "generation_id": 46,
    "model": "gpt-4o-mini",
    "generated_count": 8,
    "generation_duration": 4523,
    "flashcard_candidates": [
      {
        "front": "What is a REST API?",
        "back": "A REST API is an architectural style for building web services..."
      },
      {
        "front": "What does HTTP stand for?",
        "back": "HyperText Transfer Protocol"
      }
    ],
    "created_at": "2025-12-29T10:20:00Z"
  }
}
```

**Business Logic**:
- Creates a SHA-256 hash of `source_text` for logging
- Records `source_text_length`, `model`, `generated_count`, and `generation_duration` in the `generations` table
- Returns candidates without saving them as flashcards
- The `generation_id` is returned and must be included when saving accepted candidates via `POST /api/flashcards`
- Request timeout: 30 seconds

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication
- `400 Bad Request`: Validation errors
  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Source text must be between 1000 and 5000 characters",
      "details": {
        "field": "source_text",
        "current_length": 500,
        "min_length": 1000,
        "max_length": 5000
      }
    }
  }
  ```
- `408 Request Timeout`: Generation exceeded 30-second timeout
  ```json
  {
    "error": {
      "code": "GENERATION_TIMEOUT",
      "message": "The AI generation process took too long and was cancelled. Please try again."
    }
  }
  ```
- `500 Internal Server Error`: AI service failure
  ```json
  {
    "error": {
      "code": "AI_SERVICE_ERROR",
      "message": "Failed to generate flashcards. Please try again.",
      "details": {
        "error_log_id": 12
      }
    }
  }
  ```

**Error Logging**: When generation fails, an entry is automatically created in `generation_error_logs` with the error details, including `error_code`, `error_message`, `source_text_hash`, and `source_text_length`.

---

#### GET /api/generations

Retrieve a paginated list of the authenticated user's generation history.

**Authentication**: Required

**Query Parameters**:
- `page` (integer, optional, default: 1) - Page number
- `limit` (integer, optional, default: 20, max: 100) - Items per page

**Request Payload**: None

**Success Response** (200 OK):
```json
{
  "data": [
    {
      "id": 46,
      "user_id": "uuid-string",
      "model": "gpt-4o-mini",
      "generated_count": 8,
      "accepted_unedited_count": 5,
      "accepted_edited_count": 2,
      "source_text_hash": "sha256-hash",
      "source_text_length": 2345,
      "generation_duration": 4523,
      "created_at": "2025-12-29T10:20:00Z",
      "updated_at": "2025-12-29T10:22:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 15,
    "total_pages": 1
  }
}
```

**Error Responses**:
- `401 Unauthorized`: Missing or invalid authentication
- `400 Bad Request`: Invalid query parameters

**Use Case**: This endpoint is optional for the MVP but useful for future analytics dashboards showing generation history and acceptance rates.

---

## 3. Authentication and Authorization

### 3.1 Authentication Mechanism

The API uses **Supabase Authentication**, which provides:

- **JWT-based authentication** using access tokens
- **Email and password** authentication (as required by FR-01)
- **Session management** with refresh tokens
- **Secure credential storage** handled by Supabase

### 3.2 Implementation Details

**Client-Side Authentication Flow**:
1. User signs up or logs in using Supabase Auth SDK
2. Supabase returns an access token (JWT)
3. Client includes token in `Authorization` header for all API requests: `Authorization: Bearer <access_token>`

**Server-Side Authentication**:
- API endpoints use Supabase middleware to verify JWT tokens
- Middleware extracts `user_id` from the token and attaches it to the request context
- Invalid or missing tokens result in `401 Unauthorized` responses

**Authorization via Row-Level Security (RLS)**:
- Supabase RLS policies automatically enforce data isolation
- All queries filter by `user_id = auth.uid()`
- Users can only access their own flashcards, generations, and error logs
- No additional authorization logic needed in API layer

### 3.3 Token Refresh

- Access tokens expire after a configured period (default: 1 hour)
- Client must use refresh tokens to obtain new access tokens
- Handled automatically by Supabase Auth SDK

### 3.4 Logout

- Handled by Supabase Auth SDK on the client side
- Invalidates the current session

---

## 4. Validation and Business Logic

### 4.1 Validation Rules by Resource

#### Flashcards

| Field | Validation Rule | Error Message |
|-------|----------------|---------------|
| `front` | Required, string, max 200 characters | "Front content is required and must not exceed 200 characters" |
| `back` | Required, string, max 500 characters | "Back content is required and must not exceed 500 characters" |
| `source` | Required, enum: 'ai-full', 'ai-edited', 'manual' | "Source must be one of: ai-full, ai-edited, manual" |
| `generation_id` | Optional, must be a valid generation owned by user | "Invalid generation ID" |

#### Generations

| Field | Validation Rule | Error Message |
|-------|----------------|---------------|
| `source_text` | Required, string, min 1000 chars, max 5000 chars | "Source text must be between 1000 and 5000 characters" |
| `model` | Optional, string | "Invalid model identifier" |

#### Flashcard Creation Array (POST /api/flashcards)

| Field | Validation Rule | Error Message |
|-------|----------------|---------------|
| `generation_id` | Optional, required when source is 'ai-full' or 'ai-edited', must reference valid generation | "generation_id is required when source is 'ai-full' or 'ai-edited'" |
| `flashcards` | Required, array, min 1 item, max 50 items | "Must provide between 1 and 50 flashcards" |
| `flashcards[].source` | Required, enum: 'manual', 'ai-full', 'ai-edited' | "Source must be one of: manual, ai-full, ai-edited" |

### 4.2 Business Logic Implementation

#### BL-1: AI Generation with Logging (FR-02, FR-08)

**Endpoint**: `POST /api/generations`

**Logic**:
1. Validate `source_text` length (1000-5000 characters)
2. Generate SHA-256 hash of source text
3. Call AI service (OpenRouter) with 30-second timeout
4. Parse AI response into candidate flashcards
5. Create `generations` record with:
   - `user_id` from auth context
   - `model` from request
   - `generated_count` = number of candidates
   - `source_text_hash` and `source_text_length`
   - `generation_duration` in milliseconds
   - `accepted_unedited_count` and `accepted_edited_count` initially NULL
6. Return `generation_id` and candidates to client
7. If AI service fails, create `generation_error_logs` entry and return error

**Error Handling**:
- Timeout: Return `408 Request Timeout`
- AI Service Error: Log to `generation_error_logs`, return `500 Internal Server Error`
- Validation Error: Return `400 Bad Request`

---

#### BL-2: Flashcard Creation with Source Tracking (FR-03, FR-04, FR-08)

**Endpoint**: `POST /api/flashcards`

This unified endpoint handles both manual and AI-generated flashcard creation, supporting single or multiple cards.

**Logic**:

1. **Validate Request Structure**:
   - Validate `flashcards` array (min 1, max 50 items)
   - For each flashcard, validate `front` (max 200 chars), `back` (max 500 chars), and `source`
   - If any flashcard has `source` of 'ai-full' or 'ai-edited', `generation_id` must be provided

2. **AI-Generated Cards Path** (when `generation_id` is provided):
   - Validate `generation_id` exists and belongs to user
   - Count flashcards by source: `ai-full` vs `ai-edited`
   - Begin database transaction:
     a. Insert all flashcards with correct `user_id`, `generation_id`, and `source`
     b. Update `generations` record:
        - Set `accepted_unedited_count` = count of 'ai-full'
        - Set `accepted_edited_count` = count of 'ai-edited'
        - Update `updated_at` timestamp
   - Commit transaction
   - Return created flashcards with IDs

3. **Manual Cards Path** (when `generation_id` is omitted):
   - Verify all flashcards have `source` = 'manual'
   - Begin database transaction:
     a. Insert all flashcards with correct `user_id`, `source` = 'manual', and `generation_id` = NULL
   - Commit transaction
   - Return created flashcards with IDs

**Transaction Handling**:
- All operations in a single transaction
- If any step fails, rollback entire operation
- Ensures data consistency between `flashcards` and `generations` tables

**Source Tracking**: The `source` field distinguishes between AI-generated and manual cards, enabling analytics on AI adoption (SM-02).

---

#### BL-3: Paginated Search (FR-05)

**Endpoint**: `GET /api/flashcards`

**Logic**:
1. Build base query filtering by `user_id`
2. If `search` query param provided:
   - Use Supabase full-text search on GIN index
   - Filter where search term appears in `front` OR `back`
3. Calculate offset: `(page - 1) * limit`
4. Execute query with `LIMIT` and `OFFSET`
5. Count total matching items for pagination metadata
6. Return flashcards and pagination info

**Performance**:
- Uses `flashcards_full_text_idx` GIN index for efficient searching
- Limits max page size to 100 items
- Default page size: 20 items

---

#### BL-4: Flashcard Update (FR-04)

**Endpoint**: `PATCH /api/flashcards/:id`

**Logic**:
1. Verify flashcard exists and belongs to user (via RLS)
2. Validate updated fields if provided
3. Update only the provided fields
4. `updated_at` trigger automatically updates timestamp
5. Return updated flashcard

**Immutable Fields**: `user_id`, `generation_id`, `source`, and `created_at` cannot be changed.

---

#### BL-5: Flashcard Deletion (FR-04)

**Endpoint**: `DELETE /api/flashcards/:id`

**Logic**:
1. Verify flashcard exists and belongs to user (via RLS)
2. Delete flashcard permanently
3. Return `204 No Content`

**Note**: The PRD mentions "deletion requiring a confirmation step" - this confirmation happens in the UI, not at the API level.

---

### 4.3 Additional Business Rules

#### Character Counters (FR-04)
- Character validation enforced at API level
- UI displays real-time counters but API provides final validation
- Exceeding limits returns `400 Bad Request` with specific error messages

#### Empty State Handling (FR-07)
- No special API logic required
- UI detects zero flashcards and displays onboarding call-to-action

#### Analytics Tracking (FR-08, SM-01, SM-02)

**Metrics Calculation**:
- **SM-01 (75% acceptance rate)**: Calculate from `generations` table
  - Formula: `(accepted_unedited_count + accepted_edited_count) / generated_count`
- **SM-02 (75% AI-generated)**: Calculate from `flashcards` table
  - Formula: `COUNT(source IN ('ai-full', 'ai-edited')) / COUNT(*)`

These analytics can be exposed via future `GET /api/analytics` endpoints.

---

## 5. Future Considerations

### 5.1 Spaced Repetition Study Mode (FR-06)

The current database schema does not include SRS-related fields. When implementing study mode, the following will be needed:

**Additional Database Tables**:
- `study_sessions` - Track study sessions
- `card_reviews` - Track individual card reviews with performance data

**Additional Endpoints**:
- `POST /api/study-sessions` - Start a new study session
- `GET /api/study-sessions/current` - Get current active session
- `GET /api/flashcards/due` - Get flashcards due for review
- `POST /api/card-reviews` - Record a review with self-assessment

### 5.2 Rate Limiting

Consider implementing rate limiting to prevent abuse:
- AI generation: 10 requests per minute per user
- Other endpoints: 100 requests per minute per user

### 5.3 Error Monitoring

Log all API errors to a monitoring service for operational visibility into:
- AI generation failure rates
- Timeout frequency
- Validation error patterns

---

## 6. API Response Standards

### 6.1 Success Response Format

All successful responses follow this structure:

```json
{
  "data": { /* single object or array */ },
  "pagination": { /* optional, for list endpoints */ }
}
```

### 6.2 Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": { /* optional, additional context */ }
  }
}
```

### 6.3 HTTP Status Codes

| Status Code | Usage |
|-------------|-------|
| 200 OK | Successful GET, PATCH requests |
| 201 Created | Successful POST requests creating resources |
| 204 No Content | Successful DELETE requests |
| 400 Bad Request | Validation errors, invalid request format |
| 401 Unauthorized | Missing or invalid authentication |
| 404 Not Found | Resource does not exist |
| 408 Request Timeout | Generation timeout (30 seconds) |
| 429 Too Many Requests | Rate limit exceeded (future) |
| 500 Internal Server Error | Unexpected server errors, AI service failures |

---

## 7. Implementation Notes

### 7.1 Technology Alignment

**Astro 5 + Supabase**:
- API routes defined in `src/pages/api/` directory
- Each endpoint is a separate file (e.g., `src/pages/api/flashcards.ts`)
- Supabase client initialized in middleware and available on `Astro.locals.supabase`

**Type Safety**:
- All request/response types defined in `src/types.ts`
- Database types auto-generated in `src/db/database.types.ts`
- Use TypeScript interfaces for validation

**Error Handling Pattern**:
- Use try-catch blocks in all API routes
- Return consistent error format
- Log unexpected errors for monitoring

### 7.2 Testing Recommendations

- Unit tests for validation logic
- Integration tests for each endpoint
- End-to-end tests for key user flows (generation → review → save)
- Load testing for AI generation endpoint
- Test timeout behavior (mock slow AI responses)

---

## 8. Assumptions

1. **Source Text Length**: The database schema specifies 1000-10000 character range, but the PRD specifies "up to 5000 characters." This plan enforces 1000-5000 characters to align with the PRD while respecting the schema's minimum.

2. **Generation ID Requirement**: When saving AI-generated flashcards (source: 'ai-full' or 'ai-edited'), a valid `generation_id` is required to maintain the link between generations and flashcards for analytics purposes.

3. **Single Generation Save**: Each generation can only be saved once (the `accepted_unedited_count` and `accepted_edited_count` are set once). Subsequent attempts to save additional cards from the same generation would need to be handled via manual creation or regeneration. The API could enforce this by checking if acceptance counts are already set.

4. **Candidate Retention**: AI-generated candidates are not persisted. They exist only in the API response. If the user navigates away without saving, candidates are lost.

5. **Model Selection**: The API accepts a `model` parameter, but the default is "gpt-4o-mini" through OpenRouter. The AI service implementation will handle model routing.

6. **Authentication Only**: The API does not implement custom authorization beyond Supabase RLS. All users have the same capabilities (no admin vs. regular user distinction).

7. **Soft Delete**: Flashcard deletion is permanent (hard delete). No soft delete or archive functionality in MVP.

