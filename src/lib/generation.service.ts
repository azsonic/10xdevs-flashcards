import crypto from "node:crypto";
import type { SupabaseClient } from "../db/supabase.client";
import type { FlashcardCandidateDto, GenerateFlashcardsResultDto } from "../types";

const OPENROUTER_API_KEY = import.meta.env.OPENROUTER_API_KEY;
const GENERATION_TIMEOUT_MS = 30000; // 30 seconds

/**
 * A custom error class for generation-specific failures.
 */
export class GenerationError extends Error {
  constructor(
    public code: "GENERATION_TIMEOUT" | "AI_SERVICE_ERROR" | "DATABASE_ERROR",
    message: string
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

async function getMd5Hash(text: string): Promise<string> {
  return crypto.createHash("md5").update(text).digest("hex");
}

async function callAIService(source_text: string): Promise<{ model: string; candidates: FlashcardCandidateDto[] }> {
  if (import.meta.env.MOCK_AI_SERVICE === "true") {
    // a delay to simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return {
      model: "mock-gpt-4o-mini",
      candidates: [
        {
          front: "Mock Question 1: What is Astro?",
          back: "Mock Answer 1: A web framework for building fast, content-focused websites.",
        },
        { front: "Mock Question 2: What is Supabase?", back: "Mock Answer 2: An open source Firebase alternative." },
        {
          front: "Mock Question 3: What is Tailwind CSS?",
          back: "Mock Answer 3: A utility-first CSS framework for rapid UI development.",
        },
      ],
    };
  }

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You are an expert flashcard creator. Based on the user's source text, generate a list of question-and-answer flashcards. Return the result as a JSON object with a single key 'flashcard_candidates' which is an array of objects, where each object has a 'front' (question) and 'back' (answer) key. Ensure the content is accurate and concise.",
        },
        { role: "user", content: source_text },
      ],
    }),
  });

  if (!response.ok) {
    throw new GenerationError("AI_SERVICE_ERROR", "The AI service failed to generate flashcards.");
  }

  const json = (await response.json()) as {
    model: string;
    choices: { message: { content: string } }[];
  };

  const model = json.model;
  const content = JSON.parse(json.choices[0].message.content);
  const candidates = content.flashcard_candidates as FlashcardCandidateDto[];

  return { model, candidates };
}

export async function generateFlashcards({
  source_text,
  user_id,
  supabase,
}: {
  source_text: string;
  user_id: string;
  supabase: SupabaseClient;
}): Promise<GenerateFlashcardsResultDto> {
  const startTime = Date.now();
  const source_hash = await getMd5Hash(source_text);

  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new GenerationError("GENERATION_TIMEOUT", "Generation timed out after 30 seconds.")),
        GENERATION_TIMEOUT_MS
      )
    );

    const { model, candidates } = await Promise.race([callAIService(source_text), timeoutPromise]);

    const generation_duration = Date.now() - startTime;

    // If mocking is enabled, return a dummy response without hitting the DB.
    if (import.meta.env.MOCK_AI_SERVICE === "true") {
      return {
        generation_id: Math.floor(Math.random() * 1000), // Dummy ID
        model,
        generated_count: candidates.length,
        generation_duration,
        created_at: new Date().toISOString(), // Dummy timestamp
        flashcard_candidates: candidates,
      };
    }

    const generated_count = candidates.length;

    const { data: generationRecord, error } = await supabase
      .from("generations")
      .insert({
        user_id,
        model,
        source_text_hash: source_hash,
        generated_count,
        generation_duration,
        source_text_length: source_text.length,
      })
      .select()
      .single();

    if (error) {
      throw new GenerationError("DATABASE_ERROR", "Failed to save generation record.");
    }

    return {
      generation_id: generationRecord.id,
      model: generationRecord.model,
      generated_count: generationRecord.generated_count,
      generation_duration: generationRecord.generation_duration,
      created_at: generationRecord.created_at,
      flashcard_candidates: candidates,
    };
  } catch (error) {
    // If mocking is enabled, don't log to the DB, just re-throw.
    if (import.meta.env.MOCK_AI_SERVICE === "true") {
      throw error;
    }

    const errorCode = error instanceof GenerationError ? error.code : "AI_SERVICE_ERROR";
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";

    await supabase.from("generation_error_logs").insert({
      user_id,
      source_text_hash: source_hash,
      error_code: errorCode,
      error_message: errorMessage,
      model: "gpt-4o-mini", // Assuming default model on error
      source_text_length: source_text.length,
    });

    throw error;
  }
}
