# View Implementation Plan: Flashcard Generation View

## 1. Overview

The Flashcard Generation View is a core feature that allows users to generate study materials using AI. Users input a block of text, which the system processes to generate flashcard candidates. Users can then review, edit, or reject these candidates before performing a bulk save to their library.

## 2. View Routing

- **Path**: `/generate`
- **Type**: Protected (requires authentication)
- **File**: `src/pages/generate.astro`

## 3. Component Structure

The view will use a React-based container to manage the generation state machine, embedded within an Astro layout.

```
src/pages/generate.astro (Astro Page)
└── GenerationContainer.tsx (React Root)
    ├── GenerationInput.tsx (Step 1)
    ├── GenerationLoader.tsx (Step 2)
    └── ReviewView.tsx (Step 3)
        ├── CandidateList.tsx
        │   └── CandidateCard.tsx
        └── BulkSaveBar.tsx
```

## 4. Component Details

### `GenerationContainer` (Root)

- **Description**: The main state orchestrator. It uses the `useGenerationStore` to switch between `input`, `generating`, and `review` steps. It handles the initial API calling logic and transition orchestration.
- **Main Elements**:
  - Conditional rendering based on `step` state.
  - Error toast/alert display.
- **Handled Events**:
  - `handleGenerate`: triggers the AI API call.
  - `handleSave`: triggers the bulk save API call.
- **Handled Validation**:
  - None directly (delegated to children or store checks).
- **Types**: `GenerationStep` ('input' | 'generating' | 'review').
- **Props**: None.

### `GenerationInput`

- **Description**: The entry point form for the user to paste source text.
- **Main Elements**:
  - `Textarea` (Shadcn/ui) for source text.
  - Character counter display (`current / 5000`).
  - "Generate Flashcards" `Button`.
- **Handled Interactions**:
  - Text input change (updates store).
  - Form submission.
- **Handled Validation**:
  - Min length: 1000 characters.
  - Max length: 5000 characters.
  - Disable button if validation fails.
- **Types**: None.
- **Props**: None (uses store).

### `GenerationLoader`

- **Description**: Visual feedback during the AI generation process.
- **Main Elements**:
  - Loading spinner or progress bar.
  - Timer/Countdown (optional, or just "Generating..." text).
  - Timeout message handling (if API takes > 30s).
- **Handled Interactions**: None.
- **Handled Validation**: None.
- **Types**: None.
- **Props**: None (uses store).

### `ReviewView`

- **Description**: Container for the review process. Displays the list of candidates and the sticky footer for saving.
- **Main Elements**:
  - `CandidateList` component.
  - `BulkSaveBar` component.
- **Handled Interactions**: None.
- **Handled Validation**: None.
- **Types**: None.
- **Props**: None.

### `CandidateList`

- **Description**: A scrollable list of generated flashcard candidates.
- **Main Elements**:
  - `div` container with `map` over candidates.
  - Empty state (if all rejected).
- **Handled Interactions**: None.
- **Handled Validation**: None.
- **Types**: None.
- **Props**: None (uses store).

### `CandidateCard`

- **Description**: Represents a single flashcard candidate. Supports "View" and "Edit" modes.
- **Main Elements**:
  - **View Mode**: Displays Front/Back text, "Edit" button (Icon), "Reject" button (Trash Icon).
  - **Edit Mode**: Inputs for Front/Back, Character counters, "Save" (Check), "Cancel" (X).
  - Status indicator (e.g., badge for "Edited").
- **Handled Interactions**:
  - Toggle Edit Mode.
  - Update Front/Back text (local state).
  - Save Edit (updates store candidate).
  - Reject (removes candidate from store).
- **Handled Validation**:
  - Front max length: 200 chars.
  - Back max length: 500 chars.
- **Types**: `FlashcardCandidateViewItem`
- **Props**:
  - `candidate`: `FlashcardCandidateViewItem`

### `BulkSaveBar`

- **Description**: A sticky footer or fixed bar at the bottom of the screen.
- **Main Elements**:
  - Summary text ("X cards selected").
  - "Save to Library" `Button`.
  - "Cancel/Discard" button (optional, to reset).
- **Handled Interactions**:
  - Click Save (calls parent handler).
- **Handled Validation**: None.
- **Types**: None.
- **Props**:
  - `onSave`: function.
  - `isSaving`: boolean.

## 5. Types

### `FlashcardCandidateViewItem`

Represents the frontend view model for a candidate card.

```typescript
interface FlashcardCandidateViewItem {
  id: string; // UUID v4 generated on frontend for keying
  front: string;
  back: string;
  originalFront: string; // To track changes
  originalBack: string; // To track changes
  source: "ai-full" | "ai-edited"; // Derived from comparison with original
}
```

### `GenerationStoreState`

Zustand store state definition.

```typescript
interface GenerationStoreState {
  step: "input" | "generating" | "review" | "saving";
  sourceText: string;
  generationId: number | null;
  candidates: FlashcardCandidateViewItem[];
  error: string | null;

  // Actions
  setStep: (step: GenerationStoreState["step"]) => void;
  setSourceText: (text: string) => void;
  setGenerationResult: (id: number, candidates: { front: string; back: string }[]) => void;
  updateCandidate: (id: string, updates: Partial<FlashcardCandidateViewItem>) => void;
  removeCandidate: (id: string) => void;
  reset: () => void;
}
```

## 6. State Management

State will be managed using a **Zustand** store (`useGenerationStore`).

- **Global Scope**: The generation flow state (step, source text, candidates) needs to be accessible by multiple components (Input, Review, SaveBar) without prop drilling.
- **Persistence**: Not strictly required for MVP, but the store handles the session lifecycle. Reset on mount or unmount of the page can be handled via a `useEffect`.

## 7. API Integration

### 1. Generate Candidates

- **Endpoint**: `POST /api/generations`
- **Request**: `GenerateFlashcardsCommand`
  ```json
  { "source_text": "string (1000-5000 chars)" }
  ```
- **Response**: `ApiSuccessResponse<GenerateFlashcardsResultDto>`
- **Integration**:
  - Call in `GenerationContainer`.
  - On success: Transform `flashcard_candidates` into `FlashcardCandidateViewItem[]` (generate IDs, set originals), store `generation_id`, transition to `review`.
  - On error (400, 401, 408, 500): Set error state / show toast.

### 2. Save Flashcards

- **Endpoint**: `POST /api/flashcards`
- **Request**: `CreateFlashcardsCommand`
  ```json
  {
    "generation_id": 123,
    "flashcards": [
      { "front": "...", "back": "...", "source": "ai-full" | "ai-edited" }
    ]
  }
  ```
- **Response**: `ApiSuccessResponse<CreateFlashcardsResultDto>`
- **Integration**:
  - Call in `GenerationContainer` (triggered by `BulkSaveBar`).
  - Construct payload from store candidates.
  - On success: Redirect to `/` (Dashboard/Library).

## 8. User Interactions

1.  **Input**: User types/pastes text. Character counter updates.
2.  **Generate**: User clicks "Generate". UI blocks, loader appears.
3.  **Review**:
    - **Reject**: User clicks "Reject" (Trash icon). Card disappears from list.
    - **Edit**: User clicks "Edit" (Pencil icon). Card inputs become editable. User modifies text. User clicks "Save" (Check icon). Card updates, source becomes `ai-edited`.
    - **Bulk Save**: User clicks "Save X Cards". UI shows loading state on button. On success, user is redirected.

## 9. Conditions and Validation

### Frontend Validation

- **Source Text**: `length >= 1000 && length <= 5000`. Verified in `GenerationInput`. Button disabled otherwise.
- **Card Front**: `length > 0 && length <= 200`. Verified in `CandidateCard` (Edit mode). Save disabled otherwise.
- **Card Back**: `length > 0 && length <= 500`. Verified in `CandidateCard` (Edit mode). Save disabled otherwise.

### State Conditions

- **Step Transitions**:
  - `input` -> `generating`: Only if text is valid.
  - `generating` -> `review`: Only on API success.
  - `review` -> `saving`: Only if `candidates.length > 0`.

## 10. Error Handling

- **Generation Timeout (408)**: Display specific "Generation took too long" message. Allow retry.
- **Validation Error (400)**: Should be prevented by frontend, but display API error message if it occurs.
- **Network Errors**: Use a Toast notification (e.g., via `sonner`) to inform the user of connectivity issues.
- **Empty List**: If user rejects all candidates, disable the "Save" button or show a warning that 0 cards will be saved.

## 11. Implementation Steps

1.  **Store Setup**: Create `src/lib/store/generation-store.ts` with Zustand and types.
2.  **API Services**: Add helper methods in `src/lib/api.ts` (or similar) for the two endpoints.
3.  **Components - Basic**: Implement `GenerationInput` and `GenerationLoader` with Shadcn UI components.
4.  **Components - Review**:
    - Implement `CandidateCard` with local edit state and validation logic.
    - Implement `CandidateList` to map over the store candidates.
    - Implement `BulkSaveBar`.
5.  **Main Container**: Create `GenerationContainer` to tie logic, store, and components together.
6.  **Page Integration**: Create `src/pages/generate.astro`, protect it with middleware checks (if applicable) or client-side auth check, and mount the container.
7.  **Styling & Polish**: Ensure responsive design (mobile-friendly list), correct spacing, and smooth transitions (loading states).
8.  **Testing**: Verify flow: Input -> Generate -> Edit/Reject -> Save -> Database persistence.
