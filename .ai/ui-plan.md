# UI Architecture for 10xdevs-flashcards

## 1. UI Structure Overview

The 10xdevs-flashcards application will be built as a **Single Page Application (SPA)** architecture tailored for "casual learners." It leverages **Astro** as the container and routing shell, with **React** handling the interactive, state-heavy views. The UI design prioritizes simplicity, accessibility (WCAG AA), and mobile-first responsiveness using **Tailwind CSS**.

### Core Technologies

- **Framework**: Astro 5 (Layouts/Routing) + React 19 (Interactive Islands).
- **Component Library**: Shadcn/ui (Radix UI primitives) for consistent, accessible design.
- **Styling**: Tailwind CSS 4.
- **State Management**:
  - **Zustand**: For client-only state (Authentication session, Generation candidates flow, Study session progress).
  - **TanStack Query**: For server state synchronization (Flashcard library, caching, background updates).
- **Authentication**: Supabase Auth (Client-side JWT handling).

---

## 2. View List

### 2.1 Authentication Views

- **Paths**: `/login`, `/register`
- **Main Purpose**: Entry point for users to authenticate.
- **Key Components**:
  - `AuthForm` (Tabs for Sign In / Sign Up).
  - Error alert for auth failures.
- **UX Considerations**: Clear validation feedback, password visibility toggle. Redirects authenticated users to `/dashboard`.

### 2.2 Dashboard

- **Path**: `/dashboard` (Protected)
- **Main Purpose**: Central hub and onboarding landing page.
- **Key Information**:
  - Total flashcard count (derived from metadata).
  - Quick action shortcuts.
- **Key Components**:
  - `StatsOverview`: Displays total cards.
  - `OnboardingEmptyState`: Prominent Call-to-Action (CTA) if card count is 0.
  - `QuickActions`: Buttons for "Generate with AI," "Create Manually," and "Quick Study."
- **Constraints**: Relies on existing `GET /api/flashcards` (limit=1) for stats to avoid new endpoints.

### 2.3 Flashcard Generation View

- **Path**: `/generate` (Protected)
- **Main Purpose**: Core feature flow—input text, generate, and curate results.
- **Key Information**:
  - Text input (with char counter).
  - Loading progress.
  - Candidate list (pending/accepted/rejected).
- **Key Components**:
  - `GenerationInput`: Textarea (1000-5000 chars) + "Generate" button.
  - `GenerationLoader`: Visual feedback with timeout countdown (30s).
  - `CandidateList`: Scrollable list of `CandidateCard` items.
  - `CandidateCard`: Inline edit fields, "Accept" checkbox, "Reject" button.
  - `BulkSaveBar`: Sticky footer showing "Save X Cards" button.
- **State Management**: Zustand store to hold temporary candidates before they are persisted to DB.

### 2.4 Flashcard Library

- **Path**: `/library` (Protected)
- **Main Purpose**: Browse, search, and manage saved flashcards.
- **Key Information**:
  - Paginated list of cards.
  - Search state.
- **Key Components**:
  - `LibraryToolbar`: Search input + "Add Manual" button.
  - `FlashcardGrid` or `FlashcardList`: Responsive layout of cards.
  - `FlashcardItem`: Display front/back preview, Edit icon, Delete icon.
  - `PaginationControls`: Next/Prev/Page numbers.
  - `EditFlashcardDialog`: Modal for editing existing cards.
  - `CreateManualDialog`: Modal for creating a new card manually (US-010).
  - `DeleteAlertDialog`: Confirmation before destructive actions.

### 2.5 Study Session

- **Path**: `/study` (Protected)
- **Main Purpose**: Perform a study session.
- **Key Information**:
  - Current card front/back.
  - Session progress.
- **Key Components**:
  - `StudyCard`: Flip animation component.
  - `StudyControls`: "Show Answer" button, followed by "Easy/Good/Hard" buttons.
  - `SessionSummary`: Shown when the batch is finished.
- **Note**: Since the API does not yet support saving review progress, this view acts as a "Quick Study" mode, shuffling a client-side batch of cards for transient practice.

---

## 3. User Journey Map

### Primary Flow: The "Casual Learner" Loop

1.  **Onboarding**:
    - User logs in → Redirected to `/dashboard`.
    - Sees "0 Flashcards" and clicks "Start Generating".
2.  **Generation**:
    - Navigates to `/generate`.
    - Pastes study notes into text area.
    - Clicks "Generate" → Sees loading spinner.
3.  **Curation**:
    - AI returns 10 candidates.
    - User reviews list:
      - _Card 1_: Looks good → Clicks "Accept" (Visual highlight).
      - _Card 2_: Inaccurate → Clicks "Reject" (Item fades out/removed).
      - _Card 3_: Typo → Clicks "Edit" → Fixes text inline → Auto-marked as "Edited/Accepted".
    - User clicks "Save 9 Flashcards".
4.  **Completion**:
    - System posts to `/api/flashcards`.
    - On success, redirects to `/library`.
    - User sees their new cards populated.

### Secondary Flow: Manual Management

1.  **Creation**: From Dashboard/Library, user clicks "Create Manual" → Fills modal → Saves.
2.  **Study**: User clicks "Study" → Apps fetches a batch of cards → User tests memory → Session ends.

---

## 4. Layout and Navigation Structure

### Main Layout (`AppLayout`)

Wraps all protected routes.

- **Header (Navbar)**:
  - **Logo**: Links to Dashboard.
  - **Desktop Nav**: Links for `Generate`, `Library`, `Study`.
  - **User Menu**: Dropdown with User Email and `Logout`.
- **Mobile Nav**: Hamburger menu expanding a drawer with the same links.
- **Main Content Area**: Centered container with responsive max-width.
- **Toaster**: Global notification area (bottom-right).

### Route Guard

A client-side wrapper that checks `Supabase.auth.getSession()`.

- If no session: Redirect to `/login`.
- If session exists: Render children.

---

## 5. Key Components & UI Elements

### 5.1 Flashcard Component (`FlashcardBase`)

Used in Library and Study views.

- **Visuals**: Bordered card, shadow-sm, rounded-lg.
- **Content**: clearly separated Front and Back sections.
- **Accessibility**: ARIA labels for content regions.

### 5.2 Candidate Card (`CandidateCard`)

Specific to the Generation view.

- **States**:
  - _Idle_: Editable inputs, "Accept" action available.
  - _Accepted_: Green border/background tint, inputs disabled (or "Edit" button to re-enable).
  - _Rejected_: Visual strikethrough or removal animation.
- **Inputs**: Textarea with auto-resize and character count indicators (200/500 limits).

### 5.3 Feedback Elements

- **Character Counter**: Small text `120/200` turning red when near limit. Used in all input forms.
- **Loading State**: Skeleton screens for the Library list; Progress spinner for AI generation.
- **Optimistic UI**: When deleting a card in Library, remove it from the UI immediately while the API request processes.

### 5.4 Error Handling Display

- **Form Errors**: Inline red text below the specific input field (mapped from API `400` details).
- **System Errors**: Toast notifications for network failures, timeouts (408), or server errors (500).
