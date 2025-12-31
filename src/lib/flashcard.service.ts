import type { SupabaseClient } from "../db/supabase.client";
import type { CreateFlashcardsResultDto, FlashcardDto, FlashcardToCreate } from "../types";

/**
 * Custom error class for flashcard creation failures.
 */
export class FlashcardCreationError extends Error {
  constructor(
    public code: "GENERATION_NOT_FOUND" | "DATABASE_ERROR",
    message: string
  ) {
    super(message);
    this.name = "FlashcardCreationError";
  }
}

export async function createFlashcards({
  generation_id,
  flashcards,
  user_id,
  supabase,
}: {
  generation_id?: number;
  flashcards: FlashcardToCreate[];
  user_id: string;
  supabase: SupabaseClient;
}): Promise<CreateFlashcardsResultDto> {
  // Verify generation ownership if generation_id is provided
  if (generation_id !== undefined) {
    const { data: generation, error } = await supabase
      .from("generations")
      .select("id")
      .eq("id", generation_id)
      .eq("user_id", user_id)
      .maybeSingle();

    if (error) {
      throw new FlashcardCreationError("DATABASE_ERROR", "Failed to validate generation ownership.");
    }

    if (!generation) {
      throw new FlashcardCreationError(
        "GENERATION_NOT_FOUND",
        "The specified generation does not exist or does not belong to you."
      );
    }
  }

  // Calculate counter deltas
  const accepted_unedited_delta = flashcards.filter((card) => card.source === "ai-full").length;
  const accepted_edited_delta = flashcards.filter((card) => card.source === "ai-edited").length;

  // Call RPC to create flashcards and update generation counters atomically
  const { data: created, error } = await supabase.rpc("create_flashcards_with_generation_update", {
    generation_id: generation_id ?? null,
    flashcards_json: flashcards,
    user_id,
    accepted_unedited_delta,
    accepted_edited_delta,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[createFlashcards] RPC error", { error });
    throw new FlashcardCreationError("DATABASE_ERROR", "Failed to create flashcards.");
  }

  if (!created || !Array.isArray(created)) {
    // eslint-disable-next-line no-console
    console.error("[createFlashcards] RPC returned no rows");
    throw new FlashcardCreationError("DATABASE_ERROR", "Failed to create flashcards.");
  }

  return {
    created_count: created.length,
    flashcards: created as FlashcardDto[],
  };
}
