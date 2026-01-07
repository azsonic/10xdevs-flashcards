import type { FlashcardDto } from "@/types";

/**
 * Builder pattern for creating test flashcards
 * Reduces boilerplate and makes tests more readable
 *
 * @example
 * // Simple flashcard
 * const flashcard = new FlashcardBuilder()
 *   .withFront('Question')
 *   .withBack('Answer')
 *   .build();
 *
 * @example
 * // AI-generated flashcard
 * const aiFlashcard = new FlashcardBuilder()
 *   .asAiGenerated()
 *   .build();
 *
 * @example
 * // Multiple flashcards
 * const flashcards = new FlashcardBuilder().buildMany(5);
 */
export class FlashcardBuilder {
  private flashcard: Partial<FlashcardDto> = {
    id: 1,
    user_id: "test-user-123",
    generation_id: null,
    front: "Default Question",
    back: "Default Answer",
    source: "manual",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  /**
   * Set the flashcard ID
   */
  withId(id: number): this {
    this.flashcard.id = id;
    return this;
  }

  /**
   * Set the user ID
   */
  withUserId(userId: string): this {
    this.flashcard.user_id = userId;
    return this;
  }

  /**
   * Set the generation ID
   */
  withGenerationId(generationId: number | null): this {
    this.flashcard.generation_id = generationId;
    return this;
  }

  /**
   * Set the front content
   */
  withFront(front: string): this {
    this.flashcard.front = front;
    return this;
  }

  /**
   * Set the back content
   */
  withBack(back: string): this {
    this.flashcard.back = back;
    return this;
  }

  /**
   * Set the source
   */
  withSource(source: "manual" | "ai-full" | "ai-edited"): this {
    this.flashcard.source = source;
    return this;
  }

  /**
   * Set created_at timestamp
   */
  withCreatedAt(timestamp: string): this {
    this.flashcard.created_at = timestamp;
    return this;
  }

  /**
   * Set updated_at timestamp
   */
  withUpdatedAt(timestamp: string): this {
    this.flashcard.updated_at = timestamp;
    return this;
  }

  /**
   * Configure as AI-generated flashcard
   */
  asAiGenerated(): this {
    this.flashcard.source = "ai-full";
    this.flashcard.generation_id = 1;
    return this;
  }

  /**
   * Configure as edited AI flashcard
   */
  asEdited(): this {
    this.flashcard.source = "ai-edited";
    this.flashcard.generation_id = 1;
    return this;
  }

  /**
   * Configure as manual flashcard
   */
  asManual(): this {
    this.flashcard.source = "manual";
    this.flashcard.generation_id = null;
    return this;
  }

  /**
   * Set front content to maximum length (200 chars)
   */
  withMaxLengthFront(): this {
    this.flashcard.front = "a".repeat(200);
    return this;
  }

  /**
   * Set back content to maximum length (500 chars)
   */
  withMaxLengthBack(): this {
    this.flashcard.back = "b".repeat(500);
    return this;
  }

  /**
   * Set both front and back to maximum lengths
   */
  withMaxLengths(): this {
    return this.withMaxLengthFront().withMaxLengthBack();
  }

  /**
   * Build a single flashcard
   */
  build(): FlashcardDto {
    return this.flashcard as FlashcardDto;
  }

  /**
   * Build multiple flashcards with incremented IDs
   * @param count Number of flashcards to create
   * @returns Array of flashcards
   */
  buildMany(count: number): FlashcardDto[] {
    return Array.from({ length: count }, (_, i) =>
      new FlashcardBuilder()
        .withId((this.flashcard.id || 1) + i)
        .withUserId(this.flashcard.user_id || "test-user-123")
        .withFront(`${this.flashcard.front} ${i + 1}`)
        .withBack(`${this.flashcard.back} ${i + 1}`)
        .withSource(this.flashcard.source || "manual")
        .withGenerationId(this.flashcard.generation_id || null)
        .build()
    );
  }
}
