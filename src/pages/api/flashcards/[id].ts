import type { APIRoute } from "astro";
import { z } from "zod";
import {
  deleteFlashcardForUser,
  FlashcardDeletionError,
  FlashcardUpdateError,
  getFlashcardByIdForUser,
  updateFlashcardForUser,
} from "../../../lib/flashcard.service";
import type { ApiErrorResponse, UpdateFlashcardCommand } from "../../../types";

export const prerender = false;

const flashcardIdParamSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int("ID must be an integer").positive("ID must be a positive number")),
});

const UpdateFlashcardSchema = z
  .object({
    front: z.string().trim().min(1).max(200).optional(),
    back: z.string().trim().min(1).max(500).optional(),
  })
  .strict()
  .refine((value) => value.front !== undefined || value.back !== undefined, {
    message: "At least one of front or back must be provided.",
  });

function parseFlashcardId(rawId: string | undefined): number | null {
  if (!rawId) return null;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return Math.trunc(id);
}

export const GET: APIRoute = async ({ params, locals }) => {
  const { user, supabase } = locals;

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

  const id = parseFlashcardId(params.id);
  if (!id) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid flashcard id.",
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const flashcard = await getFlashcardByIdForUser({
      supabase,
      id,
      userId: user.id,
    });

    if (!flashcard) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Flashcard not found.",
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ data: flashcard }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    if (error instanceof FlashcardUpdateError) {
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

    // eslint-disable-next-line no-console
    console.error("[GET /api/flashcards/:id] Unexpected error:", error);
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

export const PATCH: APIRoute = async ({ request, params, locals }) => {
  if (request.method !== "PATCH") {
    return new Response(null, { status: 405, headers: { Allow: "PATCH" } });
  }

  const id = parseFlashcardId(params.id);
  if (!id) {
    return new Response(
      JSON.stringify({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid flashcard id.",
        },
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const { supabase, user } = locals;

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

  let payload: unknown;
  try {
    payload = await request.json();
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

  const validation = UpdateFlashcardSchema.safeParse(payload);
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
    const existing = await getFlashcardByIdForUser({ supabase, id, userId: user.id });
    if (!existing) {
      return new Response(
        JSON.stringify({
          error: {
            code: "NOT_FOUND",
            message: "Flashcard not found.",
          },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const updates: UpdateFlashcardCommand = validation.data;
    const updated = await updateFlashcardForUser({ supabase, id, userId: user.id, updates, existing });

    return new Response(JSON.stringify({ data: updated }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof FlashcardUpdateError) {
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

    // eslint-disable-next-line no-console
    console.error("[PATCH /api/flashcards/:id] Unexpected error:", error);
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

export const DELETE: APIRoute = async (context) => {
  // Step 1: Validate path parameter
  const parseResult = flashcardIdParamSchema.safeParse({
    id: context.params.id,
  });

  if (!parseResult.success) {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INVALID_ID",
        message: "Invalid flashcard ID format. ID must be a positive integer.",
        details: parseResult.error.issues,
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { id } = parseResult.data;

  // Step 2: Check authentication
  const supabase = context.locals.supabase;
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "UNAUTHORIZED",
        message: "Authentication required. Please log in to continue.",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Step 3: Delete flashcard via service
  try {
    await deleteFlashcardForUser({
      supabase,
      id,
      userId: user.id,
    });

    // Step 4: Return 204 No Content on success
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof FlashcardDeletionError) {
      if (error.code === "NOT_FOUND") {
        const errorResponse: ApiErrorResponse = {
          error: {
            code: "FLASHCARD_NOT_FOUND",
            message: error.message,
          },
        };
        return new Response(JSON.stringify(errorResponse), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }

      // DATABASE_ERROR
      const errorResponse: ApiErrorResponse = {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred while processing your request.",
        },
      };
      return new Response(JSON.stringify(errorResponse), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Unexpected error
    // eslint-disable-next-line no-console
    console.error("[DELETE /api/flashcards/:id] Unexpected error", { error });
    const errorResponse: ApiErrorResponse = {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred while processing your request.",
      },
    };
    return new Response(JSON.stringify(errorResponse), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
