import type {
  GenerateFlashcardsCommand,
  GenerateFlashcardsResultDto,
  CreateFlashcardsCommand,
  CreateFlashcardsResultDto,
  ApiSuccessResponse,
  ApiErrorResponse,
} from "@/types";

/**
 * Custom error class for API errors.
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Helper function to handle API responses.
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData: ApiErrorResponse = await response.json().catch(() => ({
      error: {
        code: "UNKNOWN_ERROR",
        message: "An unexpected error occurred",
      },
    }));

    throw new ApiError(response.status, errorData.error.code, errorData.error.message, errorData.error.details);
  }

  const successData: ApiSuccessResponse<T> = await response.json();
  return successData.data;
}

/**
 * Initiates an AI flashcard generation.
 * @param command The generation command with source text.
 * @returns The generation result with candidate flashcards.
 */
export async function generateFlashcards(command: GenerateFlashcardsCommand): Promise<GenerateFlashcardsResultDto> {
  const response = await fetch("/api/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  return handleResponse<GenerateFlashcardsResultDto>(response);
}

/**
 * Saves flashcards to the user's library.
 * @param command The create command with flashcards to save.
 * @returns The result with created flashcard DTOs.
 */
export async function saveFlashcards(command: CreateFlashcardsCommand): Promise<CreateFlashcardsResultDto> {
  const response = await fetch("/api/flashcards", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  return handleResponse<CreateFlashcardsResultDto>(response);
}
