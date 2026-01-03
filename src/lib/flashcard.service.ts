import type { SupabaseClient } from "../db/supabase.client";
import type {
  CreateFlashcardsResultDto,
  FlashcardDto,
  FlashcardToCreate,
  PaginatedFlashcardsDto,
  UpdateFlashcardCommand,
} from "../types";

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

/**
 * Custom error class for flashcard listing failures.
 */
export class FlashcardListError extends Error {
  constructor(
    public code: "DATABASE_ERROR",
    message: string
  ) {
    super(message);
    this.name = "FlashcardListError";
  }
}

/**
 * Custom error class for flashcard update failures.
 */
export class FlashcardUpdateError extends Error {
  constructor(
    public code: "DATABASE_ERROR",
    message: string
  ) {
    super(message);
    this.name = "FlashcardUpdateError";
  }
}

/**
 * Custom error class for flashcard deletion failures.
 */
export class FlashcardDeletionError extends Error {
  constructor(
    public code: "NOT_FOUND" | "DATABASE_ERROR",
    message: string
  ) {
    super(message);
    this.name = "FlashcardDeletionError";
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

/**
 * Lists flashcards for a specific user with pagination and optional search.
 *
 * @param supabase - The Supabase client instance
 * @param userId - The ID of the authenticated user
 * @param page - The page number (1-indexed)
 * @param limit - The number of items per page (1-100)
 * @param search - Optional search term to filter flashcards by front or back content
 * @returns Paginated flashcards with metadata
 * @throws {FlashcardListError} When database operations fail
 */
export async function listFlashcards({
  supabase,
  userId,
  page,
  limit,
  search,
}: {
  supabase: SupabaseClient;
  userId: string;
  page: number;
  limit: number;
  search?: string;
}): Promise<PaginatedFlashcardsDto> {
  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  // Build the base query for data retrieval
  let dataQuery = supabase
    .from("flashcards")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  // Build the count query with the same filters
  let countQuery = supabase.from("flashcards").select("*", { count: "exact", head: true }).eq("user_id", userId);

  // Add search filter if provided
  if (search && search.trim().length > 0) {
    const searchPattern = `%${search.trim()}%`;
    dataQuery = dataQuery.or(`front.ilike.${searchPattern},back.ilike.${searchPattern}`);
    countQuery = countQuery.or(`front.ilike.${searchPattern},back.ilike.${searchPattern}`);
  }

  // Apply pagination to data query
  dataQuery = dataQuery.range(offset, offset + limit - 1);

  // Execute both queries
  const [dataResult, countResult] = await Promise.all([dataQuery, countQuery]);

  // Handle data query errors
  if (dataResult.error) {
    // eslint-disable-next-line no-console
    console.error("[listFlashcards] Data query error", { error: dataResult.error });
    throw new FlashcardListError("DATABASE_ERROR", "Failed to retrieve flashcards.");
  }

  // Handle count query errors
  if (countResult.error) {
    // eslint-disable-next-line no-console
    console.error("[listFlashcards] Count query error", { error: countResult.error });
    throw new FlashcardListError("DATABASE_ERROR", "Failed to count flashcards.");
  }

  const totalItems = countResult.count ?? 0;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    data: dataResult.data as FlashcardDto[],
    pagination: {
      page,
      limit,
      total_items: totalItems,
      total_pages: totalPages,
    },
  };
}

/**
 * Retrieves a single flashcard for a user by ID.
 *
 * @param supabase - Supabase client
 * @param id - Flashcard ID
 * @param userId - Owner user ID
 * @returns The flashcard if found, otherwise null
 * @throws {FlashcardUpdateError} On database errors
 */
export async function getFlashcardByIdForUser({
  supabase,
  id,
  userId,
}: {
  supabase: SupabaseClient;
  id: number;
  userId: string;
}): Promise<FlashcardDto | null> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[getFlashcardByIdForUser] Query error", { error });
    throw new FlashcardUpdateError("DATABASE_ERROR", "Failed to retrieve flashcard.");
  }

  return data as FlashcardDto | null;
}

/**
 * Updates a flashcard for a user and derives the next source value.
 *
 */
export async function updateFlashcardForUser({
  supabase,
  id,
  userId,
  updates,
  existing,
}: {
  supabase: SupabaseClient;
  id: number;
  userId: string;
  updates: UpdateFlashcardCommand;
  existing?: FlashcardDto;
}): Promise<FlashcardDto> {
  const current = existing ?? (await getFlashcardByIdForUser({ supabase, id, userId }));

  if (!current) {
    throw new FlashcardUpdateError("DATABASE_ERROR", "Flashcard not found for update.");
  }

  const allowedSources = ["manual", "ai-full", "ai-edited"] as const;
  type FlashcardSource = (typeof allowedSources)[number];
  const currentSource: FlashcardSource = allowedSources.includes(current.source as FlashcardSource)
    ? (current.source as FlashcardSource)
    : "manual";

  const hasContentChanged =
    (updates.front !== undefined && updates.front !== current.front) ||
    (updates.back !== undefined && updates.back !== current.back);

  const nextSource: FlashcardSource = currentSource === "ai-full" && hasContentChanged ? "ai-edited" : currentSource;

  const payload: Partial<FlashcardDto> = {
    ...(updates.front !== undefined ? { front: updates.front } : {}),
    ...(updates.back !== undefined ? { back: updates.back } : {}),
    source: nextSource,
  };

  const { data, error } = await supabase
    .from("flashcards")
    .update(payload)
    .eq("id", id)
    .eq("user_id", userId)
    .select("*")
    .single();

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[updateFlashcardForUser] Update error", { error });
    throw new FlashcardUpdateError("DATABASE_ERROR", "Failed to update flashcard.");
  }

  if (!data) {
    throw new FlashcardUpdateError("DATABASE_ERROR", "Failed to update flashcard.");
  }

  return data as FlashcardDto;
}

/**
 * Deletes a flashcard for a user.
 *
 * @param supabase - Supabase client instance
 * @param id - Flashcard ID to delete
 * @param userId - Owner user ID
 * @throws {FlashcardDeletionError} When flashcard is not found or database error occurs
 */
export async function deleteFlashcardForUser({
  supabase,
  id,
  userId,
}: {
  supabase: SupabaseClient;
  id: number;
  userId: string;
}): Promise<void> {
  const { error, count } = await supabase
    .from("flashcards")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("[deleteFlashcardForUser] Delete error", {
      error,
      id,
      userId,
    });
    throw new FlashcardDeletionError("DATABASE_ERROR", "Failed to delete flashcard.");
  }

  // If no rows were affected, the flashcard doesn't exist or doesn't belong to the user
  if (count === 0) {
    throw new FlashcardDeletionError("NOT_FOUND", "Flashcard not found or you do not have permission to delete it.");
  }
}
