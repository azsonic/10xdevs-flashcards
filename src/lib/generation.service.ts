import crypto from "node:crypto";
import { OpenRouterError, OpenRouterService } from "./openrouter.service";
import type { SupabaseClient } from "../db/supabase.client";
import type { FlashcardCandidateDto, GenerateFlashcardsResultDto } from "../types";

// Fallback to build-time env var for local development
const BUILD_TIME_OPENROUTER_KEY = import.meta.env.OPENROUTER_API_KEY;
const DEFAULT_MODEL = "mistralai/devstral-2512:free";
const GENERATION_TIMEOUT_MS = 30000; // 30 seconds

// Runtime API key (set when called from API route with Cloudflare runtime)
let runtimeApiKey: string | undefined;

interface FlashcardResponse {
  flashcard_candidates: FlashcardCandidateDto[];
}

const FLASHCARD_RESPONSE_SCHEMA = {
  type: "object",
  required: ["flashcard_candidates"],
  properties: {
    flashcard_candidates: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        required: ["front", "back"],
        properties: {
          front: { type: "string", minLength: 1 },
          back: { type: "string", minLength: 1 },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
} as const;

let openRouterService: OpenRouterService | null = null;
let flashcardResponseFormat: ReturnType<OpenRouterService["buildResponseFormat"]> | null = null;

// Set the runtime API key from Cloudflare runtime environment
export function setRuntimeApiKey(key: string | undefined) {
  runtimeApiKey = key;
}

function ensureApiKey() {
  const apiKey = runtimeApiKey || BUILD_TIME_OPENROUTER_KEY;
  if (!apiKey?.trim()) {
    throw new GenerationError("AI_SERVICE_ERROR", "Missing OpenRouter API key.");
  }
  return apiKey.trim();
}

function getOpenRouterService() {
  if (openRouterService) {
    return openRouterService;
  }
  openRouterService = new OpenRouterService({
    apiKey: ensureApiKey(),
    defaultModel: DEFAULT_MODEL,
  });
  return openRouterService;
}

function getFlashcardResponseFormat(service: OpenRouterService) {
  if (flashcardResponseFormat) {
    return flashcardResponseFormat;
  }
  flashcardResponseFormat = service.buildResponseFormat("flashcard_candidates_payload", FLASHCARD_RESPONSE_SCHEMA);
  return flashcardResponseFormat;
}

function mapToGenerationError(error: unknown): GenerationError {
  if (error instanceof GenerationError) {
    return error;
  }
  if (error instanceof OpenRouterError) {
    if (error.type === "timeout" || error.type === "aborted") {
      return new GenerationError("GENERATION_TIMEOUT", "Generation timed out after 30 seconds.");
    }
    return new GenerationError("AI_SERVICE_ERROR", error.message);
  }
  if (error instanceof DOMException && error.name === "AbortError") {
    return new GenerationError("GENERATION_TIMEOUT", "Generation timed out after 30 seconds.");
  }
  const message = error instanceof Error ? error.message : "An unknown error occurred.";
  return new GenerationError("AI_SERVICE_ERROR", message);
}

function ensureNotAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new GenerationError("GENERATION_TIMEOUT", "Generation timed out after 30 seconds.");
  }
}

async function delay(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    const timeoutId = setTimeout(() => resolve(), ms);
    if (!signal) {
      return;
    }
    const onAbort = () => {
      clearTimeout(timeoutId);
      reject(new GenerationError("GENERATION_TIMEOUT", "Generation timed out after 30 seconds."));
    };
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
  });
}

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

async function callAIService(
  source_text: string,
  signal?: AbortSignal
): Promise<{ model: string; candidates: FlashcardCandidateDto[] }> {
  ensureNotAborted(signal);

  if (import.meta.env.MOCK_AI_SERVICE === "true") {
    // simulate latency; respect cancellation to keep timeout behaviour consistent
    await delay(1000, signal);
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

  const service = getOpenRouterService();
  const response_format = getFlashcardResponseFormat(service);

  try {
    const result = await service.chat<FlashcardResponse>({
      messages: [
        {
          role: "system",
          content:
            "You are an expert flashcard creator. Based on the user's source text, generate a list of question-and-answer flashcards. Return the result as a JSON object with a single key 'flashcard_candidates' which is an array of objects, where each object has a 'front' (question) and 'back' (answer) key. Ensure the content is accurate and concise.",
        },
        { role: "user", content: source_text },
      ],
      response_format,
      signal,
    });

    const candidates = result.content.flashcard_candidates;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      throw new GenerationError("AI_SERVICE_ERROR", "The AI service returned no flashcard candidates.");
    }

    return { model: result.model || DEFAULT_MODEL, candidates };
  } catch (error) {
    throw mapToGenerationError(error);
  }
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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GENERATION_TIMEOUT_MS);

  try {
    const { model, candidates } = await callAIService(source_text, controller.signal);

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
    const mapped = mapToGenerationError(error);
    clearTimeout(timeoutId);

    // If mocking is enabled, don't log to the DB, just re-throw.
    if (import.meta.env.MOCK_AI_SERVICE === "true") {
      throw mapped;
    }

    const errorCode = mapped.code;
    const errorMessage = mapped.message;

    await supabase.from("generation_error_logs").insert({
      user_id,
      source_text_hash: source_hash,
      error_code: errorCode,
      error_message: errorMessage,
      model: "gpt-4o-mini", // Assuming default model on error
      source_text_length: source_text.length,
    });

    throw mapped;
  } finally {
    clearTimeout(timeoutId);
  }
}
