# View Implementation Plan: Flashcard Library

## 1. Overview

The Flashcard Library view is the main workspace where authenticated users can browse, search, and manage their saved flashcards. This view displays a paginated list of all flashcards owned by the user, provides search functionality to filter cards, and offers inline actions for editing and deleting individual flashcards. Users can also create new flashcards manually from this view. The interface emphasizes ease of use with responsive design, clear visual feedback, and confirmation dialogs for destructive actions.

## 2. View Routing

**Path**: `/library` (Protected route)

**Protection**: Requires authentication. Users must be logged in to access this view. If not authenticated, redirect to the login page.

## 3. Component Structure

```
LibraryPage (Astro Page Component)
├── LibraryToolbar (React)
│   ├── SearchInput (React)
│   └── AddManualButton (React)
├── FlashcardList (React)
│   └── FlashcardItem[] (React)
│       ├── FlashcardContent (React)
│       ├── EditButton (React)
│       └── DeleteButton (React)
├── PaginationControls (React)
├── EditFlashcardDialog (React)
│   ├── Dialog (shadcn/ui)
│   └── FlashcardForm (React)
├── CreateManualDialog (React)
│   ├── Dialog (shadcn/ui)
│   └── FlashcardForm (React)
├── DeleteAlertDialog (React)
│   └── AlertDialog (shadcn/ui)
└── EmptyState (React)
```

## 4. Component Details

### 4.1 LibraryPage (Astro Component)

**Component Description**: The main page component that serves as the entry point for the `/library` route. It handles server-side authentication checks and renders the React-based library interface. This component is responsible for providing the Supabase client and user context to child components through Astro's locals.

**Main Elements**:
- HTML `<main>` wrapper with appropriate padding and layout classes
- Authentication check at the server level
- `LibraryView` React component mount point

**Handled Events**: None (server-side component)

**Validation Conditions**: 
- Verifies user authentication via `context.locals.user`
- Redirects to `/login` if user is not authenticated

**Types**:
- `APIContext` from Astro (for accessing locals)

**Props**: None (root page component)

---

### 4.2 LibraryView (React Component)

**Component Description**: The main client-side React component that orchestrates the entire flashcard library interface. It manages the state for pagination, search, dialogs, and fetching flashcards from the API. This component serves as the state container and coordinator for all child components.

**Main Elements**:
- Container `<div>` with max-width and centering
- `LibraryToolbar` component
- Conditional rendering: `FlashcardList` or `EmptyState`
- `PaginationControls` component (when items exist)
- `EditFlashcardDialog` component
- `CreateManualDialog` component
- `DeleteAlertDialog` component
- Loading spinner (during data fetch)
- Error message display area

**Handled Events**:
- Initial data fetch on mount
- Pagination changes
- Search query submission
- Dialog open/close actions
- Flashcard CRUD operations (create, update, delete)

**Validation Conditions**: None directly (delegates to child components)

**Types**:
- `PaginatedFlashcardsDto` (API response)
- `FlashcardDto` (individual flashcard)
- `FlashcardListState` (custom view model, see section 5)
- `DialogState` (custom view model, see section 5)

**Props**: None (root React component)

---

### 4.3 LibraryToolbar (React Component)

**Component Description**: A horizontal toolbar positioned at the top of the library view that contains the search input and the button to create manual flashcards. This component provides the primary actions users can take on the library.

**Main Elements**:
- `<div>` container with flexbox layout (space-between)
- `SearchInput` component (left side)
- `AddManualButton` component (right side)

**Handled Events**:
- Forwards search submission event to parent
- Forwards manual creation button click to parent

**Validation Conditions**: None (delegates to SearchInput)

**Types**:
- `ToolbarProps` interface:
  ```typescript
  interface ToolbarProps {
    onSearch: (query: string) => void;
    onCreateManual: () => void;
    searchQuery: string;
    isLoading: boolean;
  }
  ```

**Props**:
- `onSearch`: Callback function invoked when user submits a search query
- `onCreateManual`: Callback function invoked when user clicks "Add Manual" button
- `searchQuery`: Current search query value (for controlled input)
- `isLoading`: Boolean indicating if data is being fetched (disables interactions)

---

### 4.4 SearchInput (React Component)

**Component Description**: A controlled text input field that allows users to search their flashcard collection by entering a query that matches either the front or back content. The input includes a search icon and a clear button when text is present.

**Main Elements**:
- `<form>` element wrapping the input (for Enter key submission)
- `<input>` element with type="search"
- Search icon (left position)
- Clear button (right position, visible when query is not empty)

**Handled Events**:
- `onChange`: Updates the controlled input value
- `onSubmit`: Triggers search when user presses Enter or clicks search icon
- Clear button `onClick`: Clears the search query and triggers new search

**Validation Conditions**:
- Trims whitespace from search query before submission
- Allows empty string (to clear search and show all flashcards)
- No minimum or maximum length validation required

**Types**:
- `SearchInputProps` interface:
  ```typescript
  interface SearchInputProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: (query: string) => void;
    disabled: boolean;
  }
  ```

**Props**:
- `value`: Current search query string
- `onChange`: Callback when input value changes
- `onSubmit`: Callback when search is submitted (Enter key or search button)
- `disabled`: Boolean to disable input during loading states

---

### 4.5 AddManualButton (React Component)

**Component Description**: A call-to-action button that opens the dialog for creating a new flashcard manually. Styled as a primary button to encourage this action.

**Main Elements**:
- `<Button>` component from shadcn/ui
- Plus icon
- Text label "Add Manual"

**Handled Events**:
- `onClick`: Opens the CreateManualDialog

**Validation Conditions**: None

**Types**:
- `AddManualButtonProps` interface:
  ```typescript
  interface AddManualButtonProps {
    onClick: () => void;
    disabled: boolean;
  }
  ```

**Props**:
- `onClick`: Callback function to trigger dialog opening
- `disabled`: Boolean to disable button during loading states

---

### 4.6 FlashcardList (React Component)

**Component Description**: Renders a responsive grid or list of flashcard items. This component iterates over the flashcard data array and renders individual `FlashcardItem` components. The layout adapts to different screen sizes using Tailwind responsive utilities.

**Main Elements**:
- Container `<div>` with grid layout (responsive columns)
- Array of `FlashcardItem` components
- Each item receives flashcard data and action callbacks

**Handled Events**:
- Forwards edit and delete events from child FlashcardItem components to parent

**Validation Conditions**: None

**Types**:
- `FlashcardListProps` interface:
  ```typescript
  interface FlashcardListProps {
    flashcards: FlashcardDto[];
    onEdit: (flashcard: FlashcardDto) => void;
    onDelete: (flashcard: FlashcardDto) => void;
  }
  ```

**Props**:
- `flashcards`: Array of flashcard objects to display
- `onEdit`: Callback invoked when user clicks edit on a flashcard
- `onDelete`: Callback invoked when user clicks delete on a flashcard

---

### 4.7 FlashcardItem (React Component)

**Component Description**: Displays a single flashcard with its front and back content in a card layout. Includes action buttons for editing and deleting. The card has a hover state to indicate interactivity. A visual indicator (badge) shows the flashcard source (manual, ai-full, or ai-edited).

**Main Elements**:
- `<div>` card container with border, shadow, and hover effects
- `<div>` for front content (labeled)
- `<div>` for back content (labeled)
- Source badge (indicating manual/AI origin)
- Action buttons container (flexbox, positioned at bottom or corner)
  - Edit icon button (pencil icon)
  - Delete icon button (trash icon)

**Handled Events**:
- Edit button `onClick`: Invokes `onEdit` callback with flashcard data
- Delete button `onClick`: Invokes `onDelete` callback with flashcard data

**Validation Conditions**: None (display only)

**Types**:
- `FlashcardItemProps` interface:
  ```typescript
  interface FlashcardItemProps {
    flashcard: FlashcardDto;
    onEdit: (flashcard: FlashcardDto) => void;
    onDelete: (flashcard: FlashcardDto) => void;
  }
  ```

**Props**:
- `flashcard`: The flashcard object to display
- `onEdit`: Callback function when edit button is clicked
- `onDelete`: Callback function when delete button is clicked

---

### 4.8 PaginationControls (React Component)

**Component Description**: Provides navigation controls for paginated flashcard results. Displays current page number, total pages, and buttons to navigate between pages (Previous, Next, and optionally numbered page buttons).

**Main Elements**:
- Container `<div>` with flexbox layout (centered)
- Previous button (disabled on first page)
- Page number display or numbered buttons
- Next button (disabled on last page)
- Optional: "Items X-Y of Z" text display

**Handled Events**:
- Previous button `onClick`: Navigates to previous page
- Next button `onClick`: Navigates to next page
- Page number button `onClick`: Navigates to specific page

**Validation Conditions**:
- Disables "Previous" button when on first page (`currentPage === 1`)
- Disables "Next" button when on last page (`currentPage === totalPages`)

**Types**:
- `PaginationControlsProps` interface:
  ```typescript
  interface PaginationControlsProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    disabled: boolean;
  }
  ```

**Props**:
- `currentPage`: Current active page number (1-indexed)
- `totalPages`: Total number of pages available
- `totalItems`: Total count of flashcards matching current filters
- `itemsPerPage`: Number of items displayed per page
- `onPageChange`: Callback invoked with new page number
- `disabled`: Boolean to disable all pagination during loading

---

### 4.9 EditFlashcardDialog (React Component)

**Component Description**: A modal dialog that allows users to edit the front and back content of an existing flashcard. Uses shadcn/ui Dialog component for the modal functionality. Contains a form with validation and character counters.

**Main Elements**:
- `Dialog` component from shadcn/ui
- `DialogContent` wrapper
- `DialogHeader` with title "Edit Flashcard"
- `DialogDescription` (optional instructional text)
- `FlashcardForm` component (reusable form)
- `DialogFooter` with Cancel and Save buttons

**Handled Events**:
- Dialog `onOpenChange`: Handles dialog open/close
- Cancel button `onClick`: Closes dialog without saving
- Save button `onClick`: Validates and submits form, then closes dialog on success
- Form `onSubmit`: Calls API to update flashcard

**Validation Conditions**:
- Front field:
  - Required: Must not be empty after trimming
  - Maximum length: 200 characters
  - Display character counter
- Back field:
  - Required: Must not be empty after trimming
  - Maximum length: 500 characters
  - Display character counter
- At least one field must be changed from original value to enable save

**Types**:
- `EditFlashcardDialogProps` interface:
  ```typescript
  interface EditFlashcardDialogProps {
    isOpen: boolean;
    onClose: () => void;
    flashcard: FlashcardDto | null;
    onSave: (id: number, updates: UpdateFlashcardCommand) => Promise<void>;
  }
  ```
- `UpdateFlashcardCommand` from types.ts

**Props**:
- `isOpen`: Boolean controlling dialog visibility
- `onClose`: Callback to close dialog
- `flashcard`: The flashcard being edited (null when dialog is closed)
- `onSave`: Async callback that submits the update to the API

---

### 4.10 CreateManualDialog (React Component)

**Component Description**: A modal dialog that allows users to create a new flashcard from scratch. Similar structure to EditFlashcardDialog but starts with blank fields. Uses shadcn/ui Dialog component.

**Main Elements**:
- `Dialog` component from shadcn/ui
- `DialogContent` wrapper
- `DialogHeader` with title "Create Flashcard"
- `DialogDescription` with instructions
- `FlashcardForm` component (reusable form)
- `DialogFooter` with Cancel and Create buttons

**Handled Events**:
- Dialog `onOpenChange`: Handles dialog open/close
- Cancel button `onClick`: Closes dialog without creating
- Create button `onClick`: Validates and submits form
- Form `onSubmit`: Calls API to create flashcard with source="manual"

**Validation Conditions**:
- Front field:
  - Required: Must not be empty after trimming
  - Maximum length: 200 characters
  - Display character counter showing remaining characters
- Back field:
  - Required: Must not be empty after trimming
  - Maximum length: 500 characters
  - Display character counter showing remaining characters
- Both fields must be valid to enable Create button

**Types**:
- `CreateManualDialogProps` interface:
  ```typescript
  interface CreateManualDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onCreate: (flashcard: FlashcardToCreate) => Promise<void>;
  }
  ```
- `FlashcardToCreate` from types.ts

**Props**:
- `isOpen`: Boolean controlling dialog visibility
- `onClose`: Callback to close dialog and reset form
- `onCreate`: Async callback that submits new flashcard to API

---

### 4.11 DeleteAlertDialog (React Component)

**Component Description**: A confirmation dialog that appears before permanently deleting a flashcard. Uses shadcn/ui AlertDialog component to emphasize the destructive nature of this action. Displays the flashcard content to confirm the user is deleting the correct item.

**Main Elements**:
- `AlertDialog` component from shadcn/ui
- `AlertDialogContent` wrapper
- `AlertDialogHeader` with title "Delete Flashcard"
- `AlertDialogDescription` with warning text and flashcard preview
- `AlertDialogFooter` with Cancel and Delete buttons
- Delete button styled as destructive (red)

**Handled Events**:
- Cancel button `onClick`: Closes dialog without deleting
- Delete button `onClick`: Calls delete API and closes dialog
- Dialog `onOpenChange`: Handles dialog state changes

**Validation Conditions**: None (confirmation only)

**Types**:
- `DeleteAlertDialogProps` interface:
  ```typescript
  interface DeleteAlertDialogProps {
    isOpen: boolean;
    onClose: () => void;
    flashcard: FlashcardDto | null;
    onConfirm: (id: number) => Promise<void>;
    isDeleting: boolean;
  }
  ```

**Props**:
- `isOpen`: Boolean controlling dialog visibility
- `onClose`: Callback to close dialog
- `flashcard`: The flashcard to be deleted (for displaying preview)
- `onConfirm`: Async callback that executes the deletion
- `isDeleting`: Boolean indicating deletion is in progress (shows loading state)

---

### 4.12 FlashcardForm (React Component)

**Component Description**: A reusable form component used by both EditFlashcardDialog and CreateManualDialog. Contains two textarea inputs with labels, validation, and character counters. This component is controlled by its parent and emits form data on submission.

**Main Elements**:
- `<form>` element
- Front field:
  - `<label>` for "Front"
  - `<Textarea>` component from shadcn/ui
  - Character counter display (e.g., "150/200")
  - Error message display (if invalid)
- Back field:
  - `<label>` for "Back"
  - `<Textarea>` component from shadcn/ui
  - Character counter display (e.g., "350/500")
  - Error message display (if invalid)

**Handled Events**:
- Front textarea `onChange`: Updates front field value
- Back textarea `onChange`: Updates back field value
- Form `onSubmit`: Validates and emits form data

**Validation Conditions**:
- Front field validation:
  - Required: Must not be empty or only whitespace
  - Error message: "Front content is required"
  - Maximum length: 200 characters
  - Error message: "Front content must not exceed 200 characters"
- Back field validation:
  - Required: Must not be empty or only whitespace
  - Error message: "Back content is required"
  - Maximum length: 500 characters
  - Error message: "Back content must not exceed 500 characters"
- Display real-time character count as user types
- Show error messages below fields when validation fails

**Types**:
- `FlashcardFormProps` interface:
  ```typescript
  interface FlashcardFormProps {
    initialValues?: { front: string; back: string };
    onSubmit: (data: { front: string; back: string }) => void;
    onCancel: () => void;
    submitLabel: string;
    cancelLabel?: string;
    isSubmitting: boolean;
  }
  ```
- `FlashcardFormData` interface:
  ```typescript
  interface FlashcardFormData {
    front: string;
    back: string;
  }
  ```

**Props**:
- `initialValues`: Optional initial values for form fields (for edit mode)
- `onSubmit`: Callback invoked with form data when submitted and valid
- `onCancel`: Callback invoked when cancel button is clicked
- `submitLabel`: Text for submit button (e.g., "Save" or "Create")
- `cancelLabel`: Optional text for cancel button (default: "Cancel")
- `isSubmitting`: Boolean indicating submission in progress (disables form)

---

### 4.13 EmptyState (React Component)

**Component Description**: Displays a friendly message when the user has no flashcards or when a search returns no results. Includes a call-to-action button to create a manual flashcard or adjust the search query.

**Main Elements**:
- Container `<div>` with centered content
- Icon (e.g., empty box or search icon)
- Heading text (varies based on context)
- Description text
- Call-to-action button (if no search active: "Create Your First Flashcard")

**Handled Events**:
- CTA button `onClick`: Opens CreateManualDialog (if no search) or clears search

**Validation Conditions**: None

**Types**:
- `EmptyStateProps` interface:
  ```typescript
  interface EmptyStateProps {
    hasSearchQuery: boolean;
    onCreateManual: () => void;
    onClearSearch: () => void;
  }
  ```

**Props**:
- `hasSearchQuery`: Boolean indicating if empty state is due to search filter
- `onCreateManual`: Callback to open manual creation dialog
- `onClearSearch`: Callback to clear search and show all flashcards

---

## 5. Types

### 5.1 Existing Types (from src/types.ts)

The following types are already defined and should be imported:

- `FlashcardDto`: Represents a complete flashcard entity from the database
  ```typescript
  type FlashcardDto = {
    id: number;
    user_id: string;
    generation_id: number | null;
    front: string;
    back: string;
    source: "manual" | "ai-full" | "ai-edited";
    created_at: string;
    updated_at: string;
  }
  ```

- `PaginatedFlashcardsDto`: Response structure for paginated flashcard list
  ```typescript
  interface PaginatedFlashcardsDto {
    data: FlashcardDto[];
    pagination: PaginationDto;
  }
  ```

- `PaginationDto`: Metadata for pagination
  ```typescript
  interface PaginationDto {
    page: number;
    limit: number;
    total_items: number;
    total_pages: number;
  }
  ```

- `FlashcardToCreate`: Fields required to create a new flashcard
  ```typescript
  type FlashcardToCreate = {
    front: string;
    back: string;
    source: "manual" | "ai-full" | "ai-edited";
  }
  ```

- `UpdateFlashcardCommand`: Fields that can be updated on a flashcard
  ```typescript
  type UpdateFlashcardCommand = {
    front?: string;
    back?: string;
  }
  ```

- `ApiErrorResponse`: Standard error response structure
  ```typescript
  interface ApiErrorResponse {
    error: {
      code: string;
      message: string;
      details?: unknown;
    };
  }
  ```

### 5.2 New View-Specific Types

Create a new file `src/lib/types/library.types.ts` with the following definitions:

#### FlashcardListState
Represents the complete state of the flashcard library view.

```typescript
interface FlashcardListState {
  // Data
  flashcards: FlashcardDto[];
  
  // Pagination state
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  
  // Search state
  searchQuery: string;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Dialog states
  dialogs: {
    edit: DialogState<FlashcardDto>;
    create: DialogState<void>;
    delete: DialogState<FlashcardDto>;
  };
}
```

#### DialogState<T>
Generic type for managing dialog visibility and associated data.

```typescript
interface DialogState<T> {
  isOpen: boolean;
  data: T | null;
}
```

#### FlashcardFormData
Type for form data in create/edit dialogs.

```typescript
interface FlashcardFormData {
  front: string;
  back: string;
}
```

#### FlashcardFormErrors
Type for form validation errors.

```typescript
interface FlashcardFormErrors {
  front?: string;
  back?: string;
}
```

#### FlashcardListParams
Type for API query parameters.

```typescript
interface FlashcardListParams {
  page: number;
  limit: number;
  search?: string;
}
```

#### FlashcardAction
Union type for different actions in the state reducer (if using useReducer).

```typescript
type FlashcardAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: PaginatedFlashcardsDto }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'SET_SEARCH'; payload: string }
  | { type: 'OPEN_EDIT_DIALOG'; payload: FlashcardDto }
  | { type: 'CLOSE_EDIT_DIALOG' }
  | { type: 'OPEN_CREATE_DIALOG' }
  | { type: 'CLOSE_CREATE_DIALOG' }
  | { type: 'OPEN_DELETE_DIALOG'; payload: FlashcardDto }
  | { type: 'CLOSE_DELETE_DIALOG' }
  | { type: 'UPDATE_FLASHCARD_SUCCESS'; payload: FlashcardDto }
  | { type: 'DELETE_FLASHCARD_SUCCESS'; payload: number }
  | { type: 'CREATE_FLASHCARD_SUCCESS'; payload: FlashcardDto };
```

---

## 6. State Management

### 6.1 State Organization

The state for the Flashcard Library view should be managed using a custom hook: `useFlashcardLibrary`. This hook encapsulates all state logic, API calls, and side effects, providing a clean interface for the main LibraryView component.

### 6.2 Custom Hook: useFlashcardLibrary

**Location**: `src/lib/hooks/useFlashcardLibrary.ts`

**Purpose**: Manages the complete state of the flashcard library, including data fetching, pagination, search, and dialog states. Provides action functions for CRUD operations.

**State Variables**:

1. **flashcards** (FlashcardDto[]): Current page of flashcard data
2. **pagination** (PaginationDto): Pagination metadata (page, limit, total_items, total_pages)
3. **searchQuery** (string): Current search query string
4. **isLoading** (boolean): Loading state during API calls
5. **error** (string | null): Error message if API call fails
6. **editDialog** (DialogState<FlashcardDto>): State for edit dialog
7. **createDialog** (DialogState<void>): State for create dialog
8. **deleteDialog** (DialogState<FlashcardDto>): State for delete dialog

**Actions/Functions Exposed**:

1. **fetchFlashcards(params?: FlashcardListParams)**: Fetches flashcards from API
   - Uses current page, limit, and search query if params not provided
   - Sets isLoading to true during fetch
   - Updates flashcards and pagination on success
   - Sets error message on failure

2. **handlePageChange(page: number)**: Changes current page and refetches data
   - Updates pagination state
   - Calls fetchFlashcards with new page

3. **handleSearch(query: string)**: Submits search query
   - Updates searchQuery state
   - Resets to page 1
   - Calls fetchFlashcards with new query

4. **openEditDialog(flashcard: FlashcardDto)**: Opens edit dialog with flashcard data
   - Sets editDialog.isOpen to true
   - Sets editDialog.data to flashcard

5. **closeEditDialog()**: Closes edit dialog
   - Sets editDialog.isOpen to false
   - Clears editDialog.data

6. **handleEditSubmit(id: number, updates: UpdateFlashcardCommand)**: Submits flashcard update
   - Calls PATCH /api/flashcards/:id
   - Updates local flashcard in state on success
   - Closes dialog
   - Displays success toast notification
   - Handles errors with error toast

7. **openCreateDialog()**: Opens create dialog
   - Sets createDialog.isOpen to true

8. **closeCreateDialog()**: Closes create dialog
   - Sets createDialog.isOpen to false

9. **handleCreateSubmit(flashcard: FlashcardToCreate)**: Creates new flashcard
   - Calls POST /api/flashcards with flashcard data
   - Sets source field to "manual"
   - Refreshes flashcard list on success
   - Closes dialog
   - Displays success toast notification
   - Handles errors with error toast

10. **openDeleteDialog(flashcard: FlashcardDto)**: Opens delete confirmation dialog
    - Sets deleteDialog.isOpen to true
    - Sets deleteDialog.data to flashcard

11. **closeDeleteDialog()**: Closes delete dialog
    - Sets deleteDialog.isOpen to false
    - Clears deleteDialog.data

12. **handleDeleteConfirm(id: number)**: Deletes flashcard
    - Calls DELETE /api/flashcards/:id
    - Removes flashcard from local state on success
    - Adjusts pagination if needed (if last item on page, go to previous page)
    - Closes dialog
    - Displays success toast notification
    - Handles errors with error toast

**Side Effects**:

- **Initial Load**: useEffect that calls fetchFlashcards on component mount
- **Search/Pagination Changes**: useEffect that calls fetchFlashcards when searchQuery or currentPage changes
- **URL Sync** (optional): useEffect that syncs pagination and search state with URL query parameters

**Implementation Pattern**:

Use a combination of useState for individual state pieces and useCallback for memoized action functions. Consider useReducer if state updates become complex.

```typescript
export function useFlashcardLibrary() {
  const [flashcards, setFlashcards] = useState<FlashcardDto[]>([]);
  const [pagination, setPagination] = useState<PaginationDto>({
    page: 1,
    limit: 20,
    total_items: 0,
    total_pages: 0,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // ... dialog states
  
  const fetchFlashcards = useCallback(async (params?: FlashcardListParams) => {
    // Implementation
  }, [/* dependencies */]);
  
  // ... other action functions
  
  // Initial fetch on mount
  useEffect(() => {
    fetchFlashcards();
  }, []);
  
  // Refetch on search/page changes
  useEffect(() => {
    fetchFlashcards({ 
      page: pagination.page, 
      limit: pagination.limit, 
      search: searchQuery 
    });
  }, [pagination.page, searchQuery]);
  
  return {
    // State
    flashcards,
    pagination,
    searchQuery,
    isLoading,
    error,
    editDialog,
    createDialog,
    deleteDialog,
    
    // Actions
    handlePageChange,
    handleSearch,
    openEditDialog,
    closeEditDialog,
    handleEditSubmit,
    openCreateDialog,
    closeCreateDialog,
    handleCreateSubmit,
    openDeleteDialog,
    closeDeleteDialog,
    handleDeleteConfirm,
  };
}
```

---

## 7. API Integration

### 7.1 API Client Setup

Create a centralized API client for flashcard operations:

**Location**: `src/lib/api/flashcard.api.ts`

**Functions**:

1. **fetchFlashcards(params: FlashcardListParams): Promise<PaginatedFlashcardsDto>**
   - **Endpoint**: GET /api/flashcards
   - **Query Parameters**: 
     - `page` (number)
     - `limit` (number)
     - `search` (string, optional)
   - **Request Type**: None (query parameters only)
   - **Response Type**: `PaginatedFlashcardsDto`
   - **Error Handling**: Throws error with message from ApiErrorResponse

2. **getFlashcardById(id: number): Promise<FlashcardDto>**
   - **Endpoint**: GET /api/flashcards/:id
   - **Request Type**: None (path parameter)
   - **Response Type**: `{ data: FlashcardDto }`
   - **Error Handling**: Throws on 404 (not found) or 401 (unauthorized)

3. **updateFlashcard(id: number, updates: UpdateFlashcardCommand): Promise<FlashcardDto>**
   - **Endpoint**: PATCH /api/flashcards/:id
   - **Request Type**: `UpdateFlashcardCommand`
     ```typescript
     {
       front?: string;  // Optional, max 200 chars
       back?: string;   // Optional, max 500 chars
     }
     ```
   - **Response Type**: `{ data: FlashcardDto }`
   - **Error Handling**: 
     - 400: Validation errors (display details to user)
     - 404: Flashcard not found
     - 401: Unauthorized

4. **deleteFlashcard(id: number): Promise<void>**
   - **Endpoint**: DELETE /api/flashcards/:id
   - **Request Type**: None (path parameter)
   - **Response Type**: None (204 No Content)
   - **Error Handling**:
     - 404: Flashcard not found (display "Flashcard not found or already deleted")
     - 401: Unauthorized
     - 500: Internal server error

5. **createFlashcard(flashcard: FlashcardToCreate): Promise<FlashcardDto>**
   - **Endpoint**: POST /api/flashcards
   - **Request Type**: `CreateFlashcardsCommand`
     ```typescript
     {
       flashcards: [{
         front: string;  // Required, max 200 chars
         back: string;   // Required, max 500 chars
         source: "manual";  // Always "manual" for this view
       }];
     }
     ```
   - **Response Type**: `{ data: CreateFlashcardsResultDto }`
   - **Note**: The API accepts an array, but for manual creation we only send one flashcard
   - **Error Handling**:
     - 400: Validation errors
     - 401: Unauthorized

### 7.2 Error Handling Strategy

All API functions should:
1. Use try-catch to handle fetch errors
2. Parse ApiErrorResponse structure from failed requests
3. Throw custom error with user-friendly message
4. Include error code for specific handling in UI layer

Example error handling pattern:

```typescript
try {
  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json();
    throw new Error(errorData.error.message);
  }
  
  return await response.json();
} catch (error) {
  if (error instanceof Error) {
    throw error;
  }
  throw new Error("An unexpected error occurred");
}
```

### 7.3 Authentication

All API calls must include authentication credentials. Use Supabase client's built-in session management:

- API endpoints automatically receive session from Astro middleware via `context.locals`
- Frontend fetch calls must include credentials: `credentials: 'include'`
- Handle 401 Unauthorized by redirecting to login page

---

## 8. User Interactions

### 8.1 Initial Page Load

**Trigger**: User navigates to `/library`

**Flow**:
1. Astro middleware checks authentication
2. If not authenticated, redirect to `/login`
3. If authenticated, render LibraryView component
4. LibraryView mounts and useFlashcardLibrary hook initializes
5. useEffect calls fetchFlashcards with default params (page 1, limit 20)
6. Display loading spinner while fetching
7. On success: Display flashcards or empty state
8. On error: Display error message with retry button

**Expected Outcome**: User sees their flashcards or an empty state message

---

### 8.2 Search Flashcards

**Trigger**: User types in search input and presses Enter or clicks search button

**Flow**:
1. SearchInput captures input value
2. On submit, value is trimmed and passed to handleSearch
3. handleSearch updates searchQuery state and resets to page 1
4. useEffect detects searchQuery change and calls fetchFlashcards
5. Display loading indicator
6. API returns filtered results
7. Update flashcard list and pagination
8. If no results, display EmptyState with "No flashcards match your search"

**Expected Outcome**: Flashcard list is filtered to show only matching results

---

### 8.3 Clear Search

**Trigger**: User clicks clear button in search input or clicks "Clear search" in empty state

**Flow**:
1. Clear button onClick sets searchQuery to empty string
2. handleSearch("") is called
3. useEffect detects change and fetches all flashcards (page 1)
4. Display loading indicator
5. Update list with all flashcards

**Expected Outcome**: All flashcards are displayed again

---

### 8.4 Change Page

**Trigger**: User clicks Next, Previous, or specific page number button

**Flow**:
1. PaginationControls onClick calls handlePageChange with new page number
2. handlePageChange updates pagination.page state
3. useEffect detects page change and calls fetchFlashcards with new page
4. Display loading indicator (or optimistic UI)
5. Update flashcard list with new page data
6. Scroll to top of list

**Expected Outcome**: User sees flashcards for the selected page

---

### 8.5 Open Create Manual Dialog

**Trigger**: User clicks "Add Manual" button in toolbar or CTA in empty state

**Flow**:
1. Button onClick calls openCreateDialog
2. createDialog.isOpen is set to true
3. CreateManualDialog component renders with empty form
4. Form fields are empty, character counters show "0/200" and "0/500"

**Expected Outcome**: Modal dialog appears with blank flashcard form

---

### 8.6 Create Manual Flashcard

**Trigger**: User fills form in CreateManualDialog and clicks "Create"

**Flow**:
1. User types in front and back fields
2. Character counters update in real-time
3. Validation runs on each keystroke (client-side)
4. User clicks "Create" button
5. FlashcardForm validates all fields
6. If validation fails, display error messages below fields and prevent submission
7. If valid, handleCreateSubmit is called with form data
8. Set isSubmitting to true (disables form and shows loading on button)
9. Call createFlashcard API with source="manual"
10. On success:
    - Close dialog
    - Refresh flashcard list (refetch current page)
    - Display success toast: "Flashcard created successfully"
11. On error:
    - Display error toast with message
    - Keep dialog open with form data intact

**Expected Outcome**: New flashcard is added to the library and visible in the list

---

### 8.7 Open Edit Dialog

**Trigger**: User clicks edit icon button on a FlashcardItem

**Flow**:
1. Edit button onClick calls openEditDialog with flashcard data
2. editDialog.isOpen is set to true and editDialog.data is set to flashcard
3. EditFlashcardDialog renders with form pre-filled with flashcard.front and flashcard.back
4. Character counters show current character count

**Expected Outcome**: Modal dialog appears with pre-filled flashcard data

---

### 8.8 Edit Flashcard

**Trigger**: User modifies fields in EditFlashcardDialog and clicks "Save"

**Flow**:
1. User edits front and/or back fields
2. Character counters update in real-time
3. Validation runs on each keystroke
4. User clicks "Save" button
5. FlashcardForm validates fields
6. If validation fails, show error messages and prevent submission
7. If valid, determine which fields changed (optimization: only send changed fields)
8. handleEditSubmit is called with flashcard.id and UpdateFlashcardCommand
9. Set isSubmitting to true
10. Call updateFlashcard API
11. On success:
    - Update flashcard in local state (optimistic update or refetch)
    - Close dialog
    - Display success toast: "Flashcard updated successfully"
12. On error:
    - Display error toast with message
    - Keep dialog open with edited data

**Expected Outcome**: Flashcard is updated in the list with new content

---

### 8.9 Cancel Edit/Create

**Trigger**: User clicks "Cancel" button in edit or create dialog, or clicks outside dialog

**Flow**:
1. Cancel button onClick or dialog onOpenChange calls closeEditDialog or closeCreateDialog
2. Dialog state is set to closed
3. Dialog data is cleared
4. Form is reset (if dialog reopens, it should be blank or with original data)

**Expected Outcome**: Dialog closes without saving changes

---

### 8.10 Open Delete Confirmation

**Trigger**: User clicks delete icon button on a FlashcardItem

**Flow**:
1. Delete button onClick calls openDeleteDialog with flashcard data
2. deleteDialog.isOpen is set to true and deleteDialog.data is set to flashcard
3. DeleteAlertDialog renders showing:
   - Warning message about permanent deletion
   - Preview of flashcard content (front and back)
   - Cancel and Delete buttons

**Expected Outcome**: Confirmation dialog appears with flashcard preview

---

### 8.11 Confirm Delete Flashcard

**Trigger**: User clicks "Delete" button in DeleteAlertDialog

**Flow**:
1. Delete button onClick calls handleDeleteConfirm with flashcard.id
2. Set isDeleting to true (shows loading spinner on button)
3. Call deleteFlashcard API
4. On success:
    - Remove flashcard from local state
    - Check if this was the last item on the current page
    - If yes and not on page 1, navigate to previous page
    - Close dialog
    - Display success toast: "Flashcard deleted successfully"
5. On error:
    - Display error toast with message
    - Close dialog (or keep open with error message)

**Expected Outcome**: Flashcard is removed from the list permanently

---

### 8.12 Cancel Delete

**Trigger**: User clicks "Cancel" button in delete dialog or clicks outside

**Flow**:
1. Cancel button onClick or dialog onOpenChange calls closeDeleteDialog
2. Dialog state is set to closed
3. No API call is made

**Expected Outcome**: Dialog closes and flashcard remains in the list

---

## 9. Conditions and Validation

### 9.1 Authentication Condition

**Components Affected**: LibraryPage (Astro)

**Condition**: User must be authenticated to access the library view

**Verification**:
- Server-side: Check `context.locals.user` in Astro page component
- If null/undefined, return redirect to `/login`

**UI Impact**: Prevents unauthorized access; redirects to login page

---

### 9.2 Form Validation - Front Field

**Components Affected**: FlashcardForm (in EditFlashcardDialog and CreateManualDialog)

**Conditions**:
1. **Required**: Field must not be empty after trimming whitespace
   - Validation: `value.trim().length > 0`
   - Error Message: "Front content is required"
   - Timing: On submit and optionally on blur

2. **Maximum Length**: Field must not exceed 200 characters
   - Validation: `value.length <= 200`
   - Error Message: "Front content must not exceed 200 characters"
   - Timing: Real-time (on every keystroke)

**UI Impact**:
- Display error message below field when invalid
- Disable submit button when validation fails
- Show character counter: "X/200" (red text when over limit)

---

### 9.3 Form Validation - Back Field

**Components Affected**: FlashcardForm (in EditFlashcardDialog and CreateManualDialog)

**Conditions**:
1. **Required**: Field must not be empty after trimming whitespace
   - Validation: `value.trim().length > 0`
   - Error Message: "Back content is required"
   - Timing: On submit and optionally on blur

2. **Maximum Length**: Field must not exceed 500 characters
   - Validation: `value.length <= 500`
   - Error Message: "Back content must not exceed 500 characters"
   - Timing: Real-time (on every keystroke)

**UI Impact**:
- Display error message below field when invalid
- Disable submit button when validation fails
- Show character counter: "X/500" (red text when over limit)

---

### 9.4 Edit Form Additional Condition

**Components Affected**: EditFlashcardDialog

**Condition**: At least one field must be changed from the original value

**Verification**: 
```typescript
const hasChanges = 
  (formData.front !== flashcard.front) || 
  (formData.back !== flashcard.back);
```

**UI Impact**: 
- Disable "Save" button if no changes detected (optimization)
- Optionally show hint: "Make changes to enable save"

---

### 9.5 Pagination Conditions

**Components Affected**: PaginationControls

**Conditions**:
1. **Previous Button Disabled**: When on first page
   - Condition: `currentPage === 1`
   - UI: Button is disabled/grayed out

2. **Next Button Disabled**: When on last page
   - Condition: `currentPage === totalPages`
   - UI: Button is disabled/grayed out

3. **No Pagination Shown**: When total items fit on one page
   - Condition: `totalPages <= 1`
   - UI: PaginationControls component is not rendered

---

### 9.6 Search Query Validation

**Components Affected**: SearchInput

**Conditions**:
- **Trimming**: Query is trimmed before submission to remove leading/trailing whitespace
- **Empty Search**: Empty string is allowed (clears search filter)
- **No Minimum Length**: Search accepts queries of any length (even 1 character)
- **No Maximum Length**: No client-side maximum (API may have limit on URL length)

**UI Impact**: 
- Clear button is visible only when query length > 0
- No error messages for search input

---

### 9.7 Empty State Condition

**Components Affected**: EmptyState

**Conditions**:
1. **No Flashcards in Database**: User has never created any flashcards
   - Condition: `totalItems === 0 && !searchQuery`
   - UI: Show onboarding message with CTA to create first flashcard

2. **No Search Results**: Search query returned no matches
   - Condition: `flashcards.length === 0 && searchQuery !== ""`
   - UI: Show "No flashcards match your search" with button to clear search

---

### 9.8 Loading State Conditions

**Components Affected**: LibraryView, FlashcardList, PaginationControls, LibraryToolbar

**Condition**: Data is being fetched from API

**Verification**: `isLoading === true`

**UI Impact**:
- Display loading spinner over FlashcardList area
- Disable all interactive elements (search, pagination, buttons)
- Optionally show skeleton loaders for flashcards

---

### 9.9 Error State Condition

**Components Affected**: LibraryView

**Condition**: API call failed

**Verification**: `error !== null`

**UI Impact**:
- Display error message in alert/banner
- Show "Retry" button to refetch data
- Keep previous data visible (if any) or show empty state

---

## 10. Error Handling

### 10.1 API Error Categories

**Authentication Errors (401)**:
- **Cause**: Session expired or user not logged in
- **Handling**: Redirect to `/login` page
- **User Message**: "Your session has expired. Please log in again."

**Validation Errors (400)**:
- **Cause**: Invalid input data (exceeds character limits, missing required fields)
- **Handling**: Display specific validation error messages below form fields
- **User Message**: Show field-specific errors from API response details

**Not Found Errors (404)**:
- **Cause**: Flashcard doesn't exist or user doesn't have permission
- **Handling**: 
  - For GET by ID: Show "Flashcard not found" error
  - For DELETE: Show "Flashcard not found or already deleted"
  - For PATCH: Show "Flashcard not found"
- **User Message**: "The flashcard you're trying to access doesn't exist or has been deleted."

**Server Errors (500)**:
- **Cause**: Database error or unexpected server issue
- **Handling**: Show generic error message with retry option
- **User Message**: "Something went wrong. Please try again."

**Network Errors**:
- **Cause**: No internet connection or server unreachable
- **Handling**: Detect fetch failure, show network error message
- **User Message**: "Unable to connect. Please check your internet connection."

---

### 10.2 Error Handling by Operation

#### 10.2.1 Fetch Flashcards (GET /api/flashcards)

**Error Scenarios**:
1. Network failure: Show error banner with "Retry" button
2. 401 Unauthorized: Redirect to login
3. 500 Server error: Show "Failed to load flashcards. Please refresh the page."

**Recovery Actions**:
- Retry button refetches data
- If previous data exists, keep it visible with error banner
- Allow user to continue with other actions (create manual)

---

#### 10.2.2 Create Flashcard (POST /api/flashcards)

**Error Scenarios**:
1. 400 Validation error: Display field-specific errors in form
2. 401 Unauthorized: Redirect to login
3. 500 Server error: Show toast "Failed to create flashcard. Please try again."

**Recovery Actions**:
- Keep dialog open with user's input preserved
- Allow user to fix validation errors or retry
- On network error, allow retry without losing form data

---

#### 10.2.3 Update Flashcard (PATCH /api/flashcards/:id)

**Error Scenarios**:
1. 400 Validation error: Display field-specific errors in form
2. 404 Not found: Show toast "This flashcard no longer exists." Close dialog and refresh list
3. 401 Unauthorized: Redirect to login
4. 500 Server error: Show toast "Failed to update flashcard. Please try again."

**Recovery Actions**:
- Keep dialog open with edited data on validation or server errors
- On 404, close dialog and refresh to sync local state
- Optimistic update: revert changes if update fails

---

#### 10.2.4 Delete Flashcard (DELETE /api/flashcards/:id)

**Error Scenarios**:
1. 404 Not found: Show toast "Flashcard not found or already deleted." Remove from local state anyway
2. 401 Unauthorized: Redirect to login
3. 500 Server error: Show toast "Failed to delete flashcard. Please try again."

**Recovery Actions**:
- Close dialog after showing error toast
- On 404, treat as success (idempotent operation)
- On server error, don't modify local state, allow retry
- Optimistic delete: remove from UI immediately, revert if error (except 404)

---

### 10.3 Error Display Patterns

**Toast Notifications** (use for transient feedback):
- Success operations: "Flashcard created", "Flashcard updated", "Flashcard deleted"
- Failed operations: "Failed to create flashcard", "Failed to update flashcard"
- Duration: 3-5 seconds, dismissible

**Error Banners** (use for critical errors affecting page):
- Failed to load flashcards
- Network errors
- Include retry/refresh button
- Persistent until dismissed or resolved

**Inline Form Errors** (use for validation):
- Display below the specific field
- Red text and/or red border on input
- Clear on user edit
- Show specific message from validation

**Dialog Error Messages** (use for operation-specific errors):
- Show within the dialog context
- Allow user to retry or cancel
- Don't auto-close dialog on error

---

### 10.4 Edge Cases

**1. Deleting Last Item on Page**:
- After deleting the only flashcard on page 3, automatically navigate to page 2
- Implementation: Check if `flashcards.length === 1` before delete, then call `handlePageChange(currentPage - 1)` after success

**2. Search Returns Zero Results**:
- Show EmptyState component with clear search button
- Keep search query visible in input
- Don't treat as error

**3. Concurrent Edits** (Two tabs open):
- Tab A edits flashcard, Tab B tries to edit same flashcard
- API returns latest version in response
- No special handling needed; last write wins

**4. Session Expiry During Operation**:
- Catch 401 error in all API calls
- Store pending operation in sessionStorage (optional)
- Redirect to login with return URL
- After login, optionally prompt to retry operation

**5. Very Long Content**:
- Front/back fields enforce max length in UI (200/500 chars)
- Textarea allows typing but submit is disabled when over limit
- Character counter turns red when over limit
- Server validates and returns 400 if exceeded

**6. Rapid Pagination Clicks**:
- Debounce pagination clicks (prevent spam)
- Cancel in-flight requests when new page is requested
- Use AbortController for fetch requests

**7. Empty Flashcard Database on First Load**:
- Show onboarding EmptyState
- Provide clear CTA to create first flashcard
- Optionally show hint about AI generation feature

---

## 11. Implementation Steps

### Step 1: Set Up Types and API Client

1.1. Create `src/lib/types/library.types.ts` with all view-specific types defined in Section 5.2

1.2. Create `src/lib/api/flashcard.api.ts` with API client functions:
- `fetchFlashcards(params: FlashcardListParams)`
- `getFlashcardById(id: number)`
- `updateFlashcard(id: number, updates: UpdateFlashcardCommand)`
- `deleteFlashcard(id: number)`
- `createFlashcard(flashcard: FlashcardToCreate)`

1.3. Implement proper error handling in each API function (parse ApiErrorResponse, throw user-friendly errors)

---

### Step 2: Create Custom Hook

2.1. Create `src/lib/hooks/useFlashcardLibrary.ts`

2.2. Initialize state variables (useState):
- flashcards, pagination, searchQuery, isLoading, error
- editDialog, createDialog, deleteDialog

2.3. Implement `fetchFlashcards` function with API call and state updates

2.4. Implement pagination functions:
- `handlePageChange(page: number)`

2.5. Implement search function:
- `handleSearch(query: string)`

2.6. Implement dialog control functions:
- `openEditDialog`, `closeEditDialog`
- `openCreateDialog`, `closeCreateDialog`
- `openDeleteDialog`, `closeDeleteDialog`

2.7. Implement CRUD operation functions:
- `handleEditSubmit(id, updates)`
- `handleCreateSubmit(flashcard)`
- `handleDeleteConfirm(id)`

2.8. Add useEffect hooks:
- Initial fetch on mount
- Refetch on search/page changes

2.9. Return all state and functions from the hook

---

### Step 3: Build Reusable Form Component

3.1. Create `src/components/FlashcardForm.tsx`

3.2. Implement controlled inputs with local state for front and back fields

3.3. Add character counters with real-time updates

3.4. Implement validation logic:
- Check required fields
- Check max lengths
- Display error messages

3.5. Handle form submission:
- Validate all fields
- Call onSubmit callback with data
- Prevent submission if invalid

3.6. Style form with Tailwind and shadcn/ui components (Textarea, Label, Button)

---

### Step 4: Build Dialog Components

4.1. Create `src/components/EditFlashcardDialog.tsx`:
- Use shadcn/ui Dialog component
- Render FlashcardForm with initial values from flashcard prop
- Handle save and cancel actions
- Show loading state during submission

4.2. Create `src/components/CreateManualDialog.tsx`:
- Similar structure to EditFlashcardDialog
- FlashcardForm starts with empty values
- On submit, add source="manual" to flashcard data

4.3. Create `src/components/DeleteAlertDialog.tsx`:
- Use shadcn/ui AlertDialog component
- Display flashcard preview (front and back)
- Show warning message about permanent deletion
- Handle confirm and cancel actions
- Show loading state on confirm button during deletion

---

### Step 5: Build List Components

5.1. Create `src/components/FlashcardItem.tsx`:
- Card layout with border and shadow
- Display front and back content with labels
- Show source badge (different colors for manual/AI)
- Add edit and delete icon buttons
- Add hover effects

5.2. Create `src/components/FlashcardList.tsx`:
- Grid layout with responsive columns (1 col on mobile, 2-3 on tablet/desktop)
- Map over flashcards array and render FlashcardItem for each
- Pass onEdit and onDelete callbacks to each item

5.3. Create `src/components/EmptyState.tsx`:
- Conditional content based on hasSearchQuery prop
- Centered layout with icon, heading, and description
- CTA button (context-dependent)

---

### Step 6: Build Toolbar Components

6.1. Create `src/components/SearchInput.tsx`:
- Controlled input with form wrapper
- Search icon on left
- Clear button on right (conditional rendering)
- Handle onChange, onSubmit, and clear actions

6.2. Create `src/components/AddManualButton.tsx`:
- Button with plus icon and text
- Styled as primary CTA

6.3. Create `src/components/LibraryToolbar.tsx`:
- Flexbox layout with space-between
- Render SearchInput and AddManualButton
- Pass through props and callbacks

---

### Step 7: Build Pagination Component

7.1. Create `src/components/PaginationControls.tsx`:

7.2. Implement buttons:
- Previous button (disabled on page 1)
- Next button (disabled on last page)
- Optional: numbered page buttons (show first, last, current, and nearby pages)

7.3. Add item count display: "Showing X-Y of Z"

7.4. Handle page change callbacks

7.5. Style with Tailwind and shadcn/ui Button component

---

### Step 8: Build Main View Component

8.1. Create `src/components/LibraryView.tsx`:

8.2. Use `useFlashcardLibrary` hook to get all state and functions

8.3. Implement conditional rendering:
- Loading state: show spinner
- Error state: show error banner with retry button
- Empty state: show EmptyState component
- Data state: show LibraryToolbar, FlashcardList, and PaginationControls

8.4. Render all dialog components with state from hook:
- EditFlashcardDialog
- CreateManualDialog
- DeleteAlertDialog

8.5. Wire up all event handlers to hook functions

---

### Step 9: Create Astro Page

9.1. Create `src/pages/library.astro`:

9.2. Add server-side authentication check:
```typescript
const { user } = Astro.locals;
if (!user) {
  return Astro.redirect('/login');
}
```

9.3. Import and render LibraryView component with `client:load` directive

9.4. Add page metadata (title, description)

9.5. Style page container

---

### Step 10: Add Toast Notifications

10.1. Install or configure toast library (sonner)

10.2. Add ToastProvider to LibraryView or root layout

10.3. Update custom hook functions to show toasts:
- Success messages after create/update/delete
- Error messages on operation failures

---

### Step 11: Style and Polish

11.1. Review all components for consistent styling with design system

11.2. Add loading skeletons for better perceived performance

11.3. Implement responsive design:
- Mobile: Single column layout, condensed toolbar
- Tablet: Two column grid
- Desktop: Three column grid

11.4. Add hover states, focus states, and transitions

11.5. Ensure accessibility:
- Proper ARIA labels
- Keyboard navigation support
- Focus management in dialogs

---

### Step 12: Testing and Validation

12.1. Test all user flows:
- Create manual flashcard
- Edit existing flashcard
- Delete flashcard
- Search and clear search
- Pagination navigation

12.2. Test error scenarios:
- Network errors
- Validation errors
- 404 responses
- 401 authentication failures

12.3. Test edge cases:
- Empty library
- Single flashcard
- Maximum character limits
- Deleting last item on page

12.4. Test responsive behavior on different screen sizes

12.5. Test keyboard navigation and screen reader compatibility

---

### Step 13: Optimization

13.1. Add request cancellation for pagination (AbortController)

13.2. Implement debouncing for search input (optional)

13.3. Add optimistic updates for edit/delete operations

13.4. Lazy load dialog components if bundle size is a concern

13.5. Memoize expensive computations with useMemo

13.6. Memoize callbacks with useCallback to prevent unnecessary re-renders

---

### Step 14: Integration and Documentation

14.1. Ensure navigation links to `/library` are added in app header/menu

14.2. Test integration with authentication flow

14.3. Add JSDoc comments to all components and functions

14.4. Document component props with TypeScript interfaces

14.5. Add README or inline comments for complex logic

---

### Step 15: Final Review and Deploy

15.1. Run linter and fix any issues

15.2. Run type checker (tsc) and resolve type errors

15.3. Perform final manual testing of all features

15.4. Review accessibility compliance

---

## Implementation Checklist

- [ ] Types and API client set up
- [ ] Custom hook implemented
- [ ] FlashcardForm component created
- [ ] Dialog components created (Edit, Create, Delete)
- [ ] List components created (FlashcardItem, FlashcardList, EmptyState)
- [ ] Toolbar components created (SearchInput, AddManualButton, LibraryToolbar)
- [ ] Pagination component created
- [ ] LibraryView main component created
- [ ] Astro page created with authentication
- [ ] Toast notifications integrated
- [ ] Styling and responsive design completed
- [ ] All user flows tested
- [ ] Error handling tested
- [ ] Edge cases tested
- [ ] Accessibility verified
- [ ] Performance optimizations applied
- [ ] Documentation completed
- [ ] Code review passed

---

## Notes

- Use shadcn/ui components for consistent design (Dialog, AlertDialog, Button, Input, Textarea, Label)
- Follow Tailwind CSS conventions for styling
- Ensure all text is user-friendly and matches the casual learner persona
- Keep forms simple and provide clear feedback
- Prioritize mobile-first responsive design
- Test with realistic data volumes (1 flashcard, 20 flashcards, 100+ flashcards)
- Consider adding loading skeletons for better UX during data fetches
- Use proper semantic HTML for accessibility
- Follow React best practices (hooks, memoization, controlled components)
- Keep components small and focused (Single Responsibility Principle)
- Extract reusable logic into custom hooks
- Use TypeScript strictly (no `any` types)

