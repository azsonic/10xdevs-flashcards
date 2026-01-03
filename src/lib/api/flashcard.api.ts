import type {
  PaginatedFlashcardsDto,
  FlashcardDto,
  UpdateFlashcardCommand,
  FlashcardToCreate,
  ApiErrorResponse,
  CreateFlashcardsResultDto,
} from "../../types";
import type { FlashcardListParams } from "../types/library.types";

/**
 * Fetches a paginated list of flashcards with optional search filtering.
 *
 * @param params - Query parameters for pagination and search
 * @returns Paginated flashcards response
 * @throws Error with user-friendly message on failure
 */
export async function fetchFlashcards(params: FlashcardListParams): Promise<PaginatedFlashcardsDto> {
  const queryParams = new URLSearchParams({
    page: params.page.toString(),
    limit: params.limit.toString(),
  });

  if (params.search) {
    queryParams.append("search", params.search);
  }

  try {
    const response = await fetch(`/api/flashcards?${queryParams.toString()}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json();
      throw new Error(errorData.error.message);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while fetching flashcards");
  }
}

/**
 * Retrieves a single flashcard by ID.
 *
 * @param id - Flashcard ID
 * @returns The flashcard data
 * @throws Error on 404 (not found) or 401 (unauthorized)
 */
export async function getFlashcardById(id: number): Promise<FlashcardDto> {
  try {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "GET",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json();
      throw new Error(errorData.error.message);
    }

    const result: { data: FlashcardDto } = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while fetching the flashcard");
  }
}

/**
 * Updates an existing flashcard.
 *
 * @param id - Flashcard ID
 * @param updates - Fields to update
 * @returns Updated flashcard data
 * @throws Error on validation errors, 404, 401, or server errors
 */
export async function updateFlashcard(id: number, updates: UpdateFlashcardCommand): Promise<FlashcardDto> {
  try {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json();
      throw new Error(errorData.error.message);
    }

    const result: { data: FlashcardDto } = await response.json();
    return result.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while updating the flashcard");
  }
}

/**
 * Deletes a flashcard permanently.
 *
 * @param id - Flashcard ID
 * @throws Error on 404, 401, or server errors
 */
export async function deleteFlashcard(id: number): Promise<void> {
  try {
    const response = await fetch(`/api/flashcards/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json();
      throw new Error(errorData.error.message);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while deleting the flashcard");
  }
}

/**
 * Creates a new flashcard manually.
 *
 * @param flashcard - Flashcard data to create
 * @returns Created flashcard data
 * @throws Error on validation errors, 401, or server errors
 */
export async function createFlashcard(flashcard: FlashcardToCreate): Promise<FlashcardDto> {
  try {
    const response = await fetch("/api/flashcards", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        flashcards: [flashcard],
      }),
    });

    if (!response.ok) {
      const errorData: ApiErrorResponse = await response.json();
      throw new Error(errorData.error.message);
    }

    const result: { data: CreateFlashcardsResultDto } = await response.json();

    // Return the first (and only) created flashcard
    if (result.data.flashcards.length === 0) {
      throw new Error("No flashcard was created");
    }

    return result.data.flashcards[0];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("An unexpected error occurred while creating the flashcard");
  }
}
