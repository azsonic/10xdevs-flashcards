/**
 * Example test file demonstrating new testing patterns
 * This file shows how to use builders, fixtures, and mocks
 *
 * Copy these patterns when writing new tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { FlashcardBuilder } from "@/test/builders";
import { VALID_FLASHCARD, AI_GENERATED_FLASHCARD, FLASHCARD_COLLECTION } from "@/test/fixtures";
import { createMockSupabase } from "@/test/mocks";
import { waitForAsync } from "@/test/utils";
import type { SupabaseClient } from "@/db/supabase.client";

// Example: Testing a hypothetical service function
function countFlashcards(flashcards: unknown[]): number {
  return flashcards.length;
}

describe("Example: Using New Testing Patterns", () => {
  describe("Using Fixtures", () => {
    it("should use predefined flashcard fixtures", () => {
      // Use fixtures for common test data
      expect(VALID_FLASHCARD.source).toBe("manual");
      expect(AI_GENERATED_FLASHCARD.source).toBe("ai-full");
      expect(FLASHCARD_COLLECTION).toHaveLength(3);
    });

    it("should count flashcards from collection", () => {
      // Fixtures make tests readable and maintainable
      const count = countFlashcards(FLASHCARD_COLLECTION);
      expect(count).toBe(3);
    });
  });

  describe("Using Builders", () => {
    it("should create custom flashcard with builder", () => {
      // Use builders for custom test data
      const flashcard = new FlashcardBuilder()
        .withFront("What is TypeScript?")
        .withBack("A typed superset of JavaScript")
        .build();

      expect(flashcard.front).toBe("What is TypeScript?");
      expect(flashcard.back).toBe("A typed superset of JavaScript");
      expect(flashcard.source).toBe("manual"); // Default value
    });

    it("should create AI-generated flashcard", () => {
      // Builders provide convenient methods
      const flashcard = new FlashcardBuilder().asAiGenerated().build();

      expect(flashcard.source).toBe("ai-full");
      expect(flashcard.generation_id).toBe(1);
    });

    it("should create multiple flashcards", () => {
      // Create multiple test items easily
      const flashcards = new FlashcardBuilder().buildMany(5);

      expect(flashcards).toHaveLength(5);
      expect(flashcards[0].front).toContain("1");
      expect(flashcards[4].front).toContain("5");
    });

    it("should create flashcard with max length content", () => {
      // Builders support edge cases
      const flashcard = new FlashcardBuilder().withMaxLengths().build();

      expect(flashcard.front.length).toBe(200);
      expect(flashcard.back.length).toBe(500);
    });
  });

  describe("Using Mock Supabase", () => {
    let mockSupabase: SupabaseClient;

    beforeEach(() => {
      // Create fresh mock for each test
      mockSupabase = createMockSupabase().build();
    });

    it("should use mock for successful authentication", async () => {
      // Configure mock with builder pattern
      mockSupabase = createMockSupabase().withSuccessfulSignIn().build();

      const result = await mockSupabase.auth.signInWithPassword({
        email: "test@example.com",
        password: "password",
      });

      expect(result.data.user).toBeDefined();
      expect(result.error).toBeNull();
    });

    it("should use mock for failed authentication", async () => {
      // Configure mock for error scenarios
      mockSupabase = createMockSupabase().withFailedSignIn("Invalid credentials").build();

      const result = await mockSupabase.auth.signInWithPassword({
        email: "test@example.com",
        password: "wrong",
      });

      expect(result.data.user).toBeNull();
      expect(result.error?.message).toBe("Invalid credentials");
    });

    it("should use mock for authenticated session", async () => {
      // Configure mock with active session
      mockSupabase = createMockSupabase().withAuthenticatedSession().build();

      const { data } = await mockSupabase.auth.getSession();

      expect(data.session).toBeDefined();
      expect(data.session?.user.id).toBe("test-123");
    });
  });

  describe("Using Wait Helpers", () => {
    it("should wait for async operations", async () => {
      let value = 0;

      // Simulate async operation
      setTimeout(() => {
        value = 42;
      }, 100);

      // Wait for the operation
      await waitForAsync(150);

      expect(value).toBe(42);
    });
  });

  describe("Complete Example: Testing Service Function", () => {
    it("should process flashcards with all patterns", async () => {
      // Arrange: Use builders for custom data
      const flashcards = new FlashcardBuilder().withUserId("user-123").buildMany(3);

      // Arrange: Use mock for database
      const mockSupabase = createMockSupabase().withAuthenticatedSession().build();

      // Mock the database query

      vi.spyOn(mockSupabase, "from").mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({
            data: flashcards,
            error: null,
          }),
        }),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } as any);

      // Act: Call the function being tested
      const result = await mockSupabase.from("flashcards").select("*").eq("user_id", "user-123");

      // Assert: Verify the results
      expect(result.data).toHaveLength(3);
      expect(result.error).toBeNull();
      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
    });
  });

  describe("AAA Pattern Example", () => {
    it("should follow Arrange-Act-Assert pattern", () => {
      // ========== ARRANGE ==========
      // Set up test data
      const flashcard = new FlashcardBuilder().withFront("Question 1").withBack("Answer 1").build();

      const expectedCount = 1;

      // ========== ACT ==========
      // Perform the action being tested
      const result = countFlashcards([flashcard]);

      // ========== ASSERT ==========
      // Verify the outcome
      expect(result).toBe(expectedCount);
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty array", () => {
      const result = countFlashcards([]);
      expect(result).toBe(0);
    });

    it("should handle max length content", () => {
      const flashcard = new FlashcardBuilder().withMaxLengths().build();

      // Verify edge case behavior
      expect(flashcard.front.length).toBe(200);
      expect(flashcard.back.length).toBe(500);
    });

    it("should handle special characters", () => {
      const flashcard = new FlashcardBuilder()
        .withFront("<script>alert('test')</script>")
        .withBack("Content with & special < > characters")
        .build();

      // Verify special characters are handled
      expect(flashcard.front).toContain("<script>");
      expect(flashcard.back).toContain("&");
    });
  });
});

/**
 * Key Takeaways:
 *
 * 1. Use FIXTURES for common, predefined test data
 *    - VALID_FLASHCARD, AI_FLASHCARD, etc.
 *
 * 2. Use BUILDERS for custom test data
 *    - FlashcardBuilder with fluent API
 *    - Easy to create variations
 *
 * 3. Use MOCKS for external dependencies
 *    - createMockSupabase() for database
 *    - Builder pattern for configuration
 *
 * 4. Follow AAA PATTERN
 *    - Arrange: Set up
 *    - Act: Execute
 *    - Assert: Verify
 *
 * 5. Test EDGE CASES
 *    - Empty inputs
 *    - Max lengths
 *    - Special characters
 *    - Error scenarios
 *
 * 6. Keep tests FOCUSED
 *    - One concept per test
 *    - Descriptive names
 *    - Clear assertions
 */
