import type { FlashcardDto, PaginationDto } from "../../types";

/**
 * Generic type for managing dialog visibility and associated data.
 */
export interface DialogState<T> {
  isOpen: boolean;
  data: T | null;
}

/**
 * Types of loading states for contextual messages
 */
export type LoadingType = "initial" | "pagination" | "search" | null;

/**
 * Represents the complete state of the flashcard library view.
 */
export interface FlashcardListState {
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
  loadingType: LoadingType;
  error: string | null;

  // Dialog states
  dialogs: {
    edit: DialogState<FlashcardDto>;
    create: DialogState<void>;
    delete: DialogState<FlashcardDto>;
  };
}

/**
 * Type for form data in create/edit dialogs.
 */
export interface FlashcardFormData {
  front: string;
  back: string;
}

/**
 * Type for form validation errors.
 */
export interface FlashcardFormErrors {
  front?: string;
  back?: string;
}

/**
 * Type for API query parameters.
 */
export interface FlashcardListParams {
  page: number;
  limit: number;
  search?: string;
}

/**
 * Union type for different actions in the state reducer (if using useReducer).
 */
export type FlashcardAction =
  | { type: "FETCH_START" }
  | { type: "FETCH_SUCCESS"; payload: { data: FlashcardDto[]; pagination: PaginationDto } }
  | { type: "FETCH_ERROR"; payload: string }
  | { type: "SET_PAGE"; payload: number }
  | { type: "SET_SEARCH"; payload: string }
  | { type: "OPEN_EDIT_DIALOG"; payload: FlashcardDto }
  | { type: "CLOSE_EDIT_DIALOG" }
  | { type: "OPEN_CREATE_DIALOG" }
  | { type: "CLOSE_CREATE_DIALOG" }
  | { type: "OPEN_DELETE_DIALOG"; payload: FlashcardDto }
  | { type: "CLOSE_DELETE_DIALOG" }
  | { type: "UPDATE_FLASHCARD_SUCCESS"; payload: FlashcardDto }
  | { type: "DELETE_FLASHCARD_SUCCESS"; payload: number }
  | { type: "CREATE_FLASHCARD_SUCCESS"; payload: FlashcardDto };

