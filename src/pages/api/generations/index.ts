import type { APIRoute } from "astro";
import { z } from "zod";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { generateFlashcards, GenerationError } from "../../../lib/generation.service";
import type { GenerateFlashcardsCommand } from "../../../types";

export const prerender = false;

const GenerateFlashcardsSchema = z.object({
  source_text: z.string().min(1000).max(5000),
});

export const POST: APIRoute = async ({ request, locals }) => {
  const { supabase } = locals;

  let command: GenerateFlashcardsCommand;
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

  const validation = GenerateFlashcardsSchema.safeParse(command);
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
    const result = await generateFlashcards({
      source_text: validation.data.source_text,
      user_id: DEFAULT_USER_ID,
      supabase,
    });

    return new Response(JSON.stringify({ data: result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    if (error instanceof GenerationError) {
      const status = error.code === "GENERATION_TIMEOUT" ? 408 : 500;
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
