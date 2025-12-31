import type { APIRoute } from "astro";
import { z } from "zod";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { createFlashcards, FlashcardCreationError } from "../../../lib/flashcard.service";
import type { CreateFlashcardsCommand } from "../../../types";

export const prerender = false;

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

export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase } = locals;

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
      user_id: DEFAULT_USER_ID,
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
