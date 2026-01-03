/**
 * Validation utilities for flashcard content
 */

export const FRONT_MAX_LENGTH = 200;
export const BACK_MAX_LENGTH = 500;

/**
 * Validation result for flashcard content
 */
export interface FlashcardValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validates flashcard front and back content
 *
 * @param front - The front text of the flashcard
 * @param back - The back text of the flashcard
 * @returns Validation result with validity status and error messages
 */
export function validateFlashcardContent(front: string, back: string): FlashcardValidationResult {
  const errors: string[] = [];

  const trimmedFront = front.trim();
  const trimmedBack = back.trim();

  if (trimmedFront.length === 0) {
    errors.push("Front cannot be empty");
  }

  if (trimmedFront.length > FRONT_MAX_LENGTH) {
    errors.push(`Front exceeds maximum length of ${FRONT_MAX_LENGTH} characters`);
  }

  if (trimmedBack.length === 0) {
    errors.push("Back cannot be empty");
  }

  if (trimmedBack.length > BACK_MAX_LENGTH) {
    errors.push(`Back exceeds maximum length of ${BACK_MAX_LENGTH} characters`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Gets the character counter color class based on length and max length
 *
 * @param currentLength - Current trimmed text length
 * @param maxLength - Maximum allowed length
 * @returns Tailwind color class
 */
export function getCharacterCounterColor(currentLength: number, maxLength: number): string {
  if (currentLength > maxLength) {
    return "text-destructive";
  }
  return "text-muted-foreground";
}

/**
 * Trims whitespace from flashcard content
 *
 * @param content - The content to trim
 * @returns Trimmed content
 */
export function trimFlashcardContent(content: { front: string; back: string }): {
  front: string;
  back: string;
} {
  return {
    front: content.front.trim(),
    back: content.back.trim(),
  };
}
