import type { APIRoute } from "astro";
import { z } from "zod";
import {
  createFlashcards,
  FlashcardCreationError,
  listFlashcards,
  FlashcardListError,
} from "../../../lib/flashcard.service";
import type { CreateFlashcardsCommand } from "../../../types";

export const prerender = false;

// ================================================================
// VALIDATION SCHEMAS
// ================================================================

/**
 * Validation schema for listing flashcards query parameters
 */
const ListFlashcardsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
});

const FlashcardSchema = z.object({
  front: z.string().min(1).max(200),
  back: z.string().min(1).max(500),
  source: z.enum(["manual", "ai-full", "ai-edited"]),
});

const CreateFlashcardsSchema = z
  .object({
    generation_id: z.number().int().positive().optional(),
    flashcards: z.array(FlashcardSchema).min(1).max(50),
  })
  .superRefine((value, ctx) => {
    const hasAiCards = value.flashcards.some((card) => card.source !== "manual");
    if (hasAiCards && value.generation_id === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "generation_id is required when any flashcard source is ai-full or ai-edited.",
        path: ["generation_id"],
      });
    }
  });

// ================================================================
// GET HANDLER - List Flashcards
// ================================================================

/**
 * GET /api/flashcards
 * Retrieves a paginated list of flashcards for the authenticated user.
 * Supports optional search filtering by front or back content.
 */
export const GET: APIRoute = async ({ url, locals }) => {
  const { supabase, user } = locals;

  // Authentication check - early return pattern
  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  // Extract and validate query parameters
  const queryParams = {
    page: url.searchParams.get("page") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
    search: url.searchParams.get("search") ?? undefined,
  };

  const validation = ListFlashcardsQuerySchema.safeParse(queryParams);

  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid query parameters",
          details: validation.error.flatten(),
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Call service layer to retrieve flashcards
  try {
    const result = await listFlashcards({
      supabase,
      userId: user.id,
      page: validation.data.page,
      limit: validation.data.limit,
      search: validation.data.search,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof FlashcardListError) {
      return new Response(
        JSON.stringify({
          error: {
            code: error.code,
            message: error.message,
          },
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Unexpected errors
    // eslint-disable-next-line no-console
    console.error("[GET /api/flashcards] Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// ================================================================
// POST HANDLER - Create Flashcards
// ================================================================

export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase, user } = locals;

  if (!user) {
    return new Response(
      JSON.stringify({
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to save flashcards.",
        },
      }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  let command: CreateFlashcardsCommand;
  try {
    command = await request.json();
  } catch {
    return new Response(
      JSON.stringify({
        error: {
          code: "BAD_REQUEST",
          message: "Invalid JSON in request body.",
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const validation = CreateFlashcardsSchema.safeParse(command);
  if (!validation.success) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid input provided.",
          details: validation.error.flatten(),
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const result = await createFlashcards({
      generation_id: validation.data.generation_id,
      flashcards: validation.data.flashcards,
      user_id: user.id,
      supabase,
    });

    return new Response(JSON.stringify({ data: result }), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof FlashcardCreationError) {
      const status = error.code === "GENERATION_NOT_FOUND" ? 404 : 500;
      return new Response(
        JSON.stringify({
          error: {
            code: error.code,
            message: error.message,
          },
        }),
        { status, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred.",
        },
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
