# Manual Testing Guide: GET /api/flashcards

This guide provides manual testing instructions for the GET /api/flashcards endpoint.

## Prerequisites

1. Development server running: `npm run dev`
2. Valid authentication session (logged in user)
3. Some flashcards in the database for the authenticated user

## Testing with cURL

### 1. Basic Request (Default Parameters)

```bash
curl -X GET "http://localhost:3000/api/flashcards" \
  -H "Cookie: YOUR_SESSION_COOKIE" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "data": [
    {
      "id": 1,
      "user_id": "uuid",
      "generation_id": null,
      "front": "What is React?",
      "back": "A JavaScript library",
      "source": "manual",
      "created_at": "2025-01-03T10:00:00Z",
      "updated_at": "2025-01-03T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total_items": 1,
    "total_pages": 1
  }
}
```

### 2. Pagination Tests

#### Page 2 with limit 10
```bash
curl -X GET "http://localhost:3000/api/flashcards?page=2&limit=10" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

#### Custom limit
```bash
curl -X GET "http://localhost:3000/api/flashcards?limit=50" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

### 3. Search Tests

#### Search by term
```bash
curl -X GET "http://localhost:3000/api/flashcards?search=javascript" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

#### Combined search and pagination
```bash
curl -X GET "http://localhost:3000/api/flashcards?search=algorithm&page=1&limit=10" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

### 4. Error Cases

#### Without authentication (401)
```bash
curl -X GET "http://localhost:3000/api/flashcards"
```

**Expected Response:**
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

#### Invalid page parameter (400)
```bash
curl -X GET "http://localhost:3000/api/flashcards?page=0" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

**Expected Response:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": { ... }
  }
}
```

#### Invalid limit parameter (400)
```bash
curl -X GET "http://localhost:3000/api/flashcards?limit=101" \
  -H "Cookie: YOUR_SESSION_COOKIE"
```

## Testing with Browser/Postman

### Setup

1. **Login First**: Navigate to `/login` and authenticate
2. **Get Session Cookie**: Open DevTools → Application → Cookies → Copy the session cookie value

### Postman Collection

Create a new Postman collection with the following requests:

#### 1. List Flashcards (Default)
- **Method**: GET
- **URL**: `http://localhost:3000/api/flashcards`
- **Headers**: (cookies auto-managed if logged in via Postman)

#### 2. List with Pagination
- **Method**: GET
- **URL**: `http://localhost:3000/api/flashcards?page=2&limit=10`

#### 3. Search Flashcards
- **Method**: GET
- **URL**: `http://localhost:3000/api/flashcards?search=react`

#### 4. Test Validation
- **Method**: GET
- **URL**: `http://localhost:3000/api/flashcards?page=-1`
- **Expected**: 400 error

## Browser DevTools Testing

### JavaScript Console

```javascript
// Fetch flashcards (assuming you're logged in)
fetch('/api/flashcards')
  .then(r => r.json())
  .then(console.log);

// With pagination
fetch('/api/flashcards?page=2&limit=10')
  .then(r => r.json())
  .then(console.log);

// With search
fetch('/api/flashcards?search=javascript')
  .then(r => r.json())
  .then(console.log);

// Test error handling
fetch('/api/flashcards?page=0')
  .then(r => r.json())
  .then(console.log);
```

## Verification Checklist

### Functionality
- [ ] Returns paginated flashcards for authenticated user
- [ ] Default pagination works (page=1, limit=20)
- [ ] Custom pagination parameters work
- [ ] Search functionality filters by front content
- [ ] Search functionality filters by back content
- [ ] Empty results return empty array with valid pagination
- [ ] Pagination metadata is accurate (total_items, total_pages)

### Authentication
- [ ] Returns 401 without authentication
- [ ] Only returns flashcards for authenticated user
- [ ] Does not expose other users' flashcards

### Validation
- [ ] Rejects page < 1 (400 error)
- [ ] Rejects limit < 1 (400 error)
- [ ] Rejects limit > 100 (400 error)
- [ ] Rejects non-numeric page parameter
- [ ] Rejects non-numeric limit parameter
- [ ] Trims search parameter whitespace

### Edge Cases
- [ ] Works with empty database (0 flashcards)
- [ ] Works with 1 flashcard
- [ ] Works with many flashcards (>100)
- [ ] Handles special characters in search
- [ ] Handles very long search terms
- [ ] Returns correct total_pages calculation

### Performance
- [ ] Response time is reasonable (<500ms for typical queries)
- [ ] Search doesn't cause significant slowdown
- [ ] Large datasets are handled efficiently

## Common Issues & Solutions

### Issue: 401 Unauthorized
- **Cause**: Not logged in or session expired
- **Solution**: Login again at `/login`

### Issue: Empty results when flashcards exist
- **Cause**: Flashcards belong to different user
- **Solution**: Verify you're testing with the correct user account

### Issue: Validation errors on valid parameters
- **Cause**: Parameter type coercion failing
- **Solution**: Ensure parameters are properly formatted

### Issue: Search returns no results
- **Cause**: Case sensitivity or search term doesn't match
- **Solution**: Try broader search terms (search is case-insensitive with ILIKE)

## Notes

- The endpoint uses Supabase Row Level Security (RLS) for defense-in-depth
- Search is case-insensitive using PostgreSQL ILIKE
- Flashcards are ordered by `created_at DESC` (newest first)
- Maximum limit is capped at 100 items per page
- Page numbers start at 1 (not 0)

