import type { FlashcardDto } from "@/types";

/**
 * Shared flashcard test fixtures
 * Use these for consistent test data across tests
 */

/**
 * Standard manual flashcard
 */
export const VALID_FLASHCARD: FlashcardDto = {
  id: 1,
  user_id: "user-123",
  generation_id: null,
  front: "What is React?",
  back: "A JavaScript library for building user interfaces",
  source: "manual",
  created_at: "2025-01-03T10:00:00Z",
  updated_at: "2025-01-03T10:00:00Z",
};

/**
 * AI-generated flashcard
 */
export const AI_GENERATED_FLASHCARD: FlashcardDto = {
  id: 2,
  user_id: "user-123",
  generation_id: 1,
  front: "What is TypeScript?",
  back: "A typed superset of JavaScript that compiles to plain JavaScript",
  source: "ai-full",
  created_at: "2025-01-03T09:00:00Z",
  updated_at: "2025-01-03T09:00:00Z",
};

/**
 * Edited AI flashcard
 */
export const EDITED_FLASHCARD: FlashcardDto = {
  id: 3,
  user_id: "user-123",
  generation_id: 1,
  front: "What is Astro?",
  back: "A modern web framework for building fast, content-focused websites",
  source: "ai-edited",
  created_at: "2025-01-03T08:00:00Z",
  updated_at: "2025-01-03T08:00:00Z",
};

/**
 * Flashcard with content at maximum lengths
 */
export const FLASHCARD_WITH_MAX_LENGTH: FlashcardDto = {
  id: 4,
  user_id: "user-123",
  generation_id: null,
  front: "a".repeat(200), // Max front length: 200 chars
  back: "b".repeat(500), // Max back length: 500 chars
  source: "manual",
  created_at: "2025-01-03T07:00:00Z",
  updated_at: "2025-01-03T07:00:00Z",
};

/**
 * Flashcard with multiline content
 */
export const MULTILINE_FLASHCARD: FlashcardDto = {
  id: 5,
  user_id: "user-123",
  generation_id: null,
  front: "What are the main React hooks?\n\nList the most common ones.",
  back: "useState - for state management\nuseEffect - for side effects\nuseContext - for context\nuseMemo - for memoization\nuseCallback - for callback memoization",
  source: "manual",
  created_at: "2025-01-03T06:00:00Z",
  updated_at: "2025-01-03T06:00:00Z",
};

/**
 * Flashcard with special characters
 */
export const FLASHCARD_WITH_SPECIAL_CHARS: FlashcardDto = {
  id: 6,
  user_id: "user-123",
  generation_id: null,
  front: "What is <React>?",
  back: "A library & framework for building UIs",
  source: "manual",
  created_at: "2025-01-03T05:00:00Z",
  updated_at: "2025-01-03T05:00:00Z",
};

/**
 * Flashcard with emojis
 */
export const FLASHCARD_WITH_EMOJIS: FlashcardDto = {
  id: 7,
  user_id: "user-123",
  generation_id: null,
  front: "What is React? 🤔",
  back: "A JavaScript library 🚀 for building user interfaces 💻",
  source: "manual",
  created_at: "2025-01-03T04:00:00Z",
  updated_at: "2025-01-03T04:00:00Z",
};

/**
 * Collection of various flashcards for list tests
 */
export const FLASHCARD_COLLECTION: FlashcardDto[] = [VALID_FLASHCARD, AI_GENERATED_FLASHCARD, EDITED_FLASHCARD];

/**
 * Large collection for pagination tests
 */
export const LARGE_FLASHCARD_COLLECTION: FlashcardDto[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  user_id: "user-123",
  generation_id: i % 3 === 0 ? 1 : null,
  front: `Question ${i + 1}`,
  back: `Answer ${i + 1}`,
  source: i % 3 === 0 ? "ai-full" : i % 3 === 1 ? "ai-edited" : "manual",
  created_at: new Date(2025, 0, 3, 10 - i, 0, 0).toISOString(),
  updated_at: new Date(2025, 0, 3, 10 - i, 0, 0).toISOString(),
}));
