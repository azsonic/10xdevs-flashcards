import { useEffect } from "react";
import { useGenerationStore } from "@/lib/store/generation-store";
import { generateFlashcards, saveFlashcards, ApiError } from "@/lib/api";
import { GenerationInput } from "./GenerationInput";
import { GenerationLoader } from "./GenerationLoader";
import { ReviewView } from "./ReviewView";
import { SourceTextDisplay } from "./SourceTextDisplay";
import { toast } from "sonner";
import type { CreateFlashcardsCommand } from "@/types";

/**
 * Main state orchestrator for the flashcard generation flow.
 * Manages transitions between input, generating, and review steps.
 */
export function GenerationContainer() {
  const { step, sourceText, generationId, candidates, error, setStep, setGenerationResult, setError, reset } =
    useGenerationStore();

  // Reset store on mount
  useEffect(() => {
    reset();
  }, [reset]);

  // Display error toast when error state changes
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  /**
   * Handles the AI generation API call.
   */
  const handleGenerate = async () => {
    if (sourceText.length < 1000 || sourceText.length > 5000) {
      setError("Source text must be between 1000 and 5000 characters.");
      return;
    }

    setStep("generating");
    setError(null);

    try {
      const result = await generateFlashcards({ source_text: sourceText });

      setGenerationResult(result.generation_id, result.flashcard_candidates);

      toast.success(
        `Generated ${result.flashcard_candidates.length} flashcard${
          result.flashcard_candidates.length === 1 ? "" : "s"
        }!`
      );
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 408) {
          setError("Generation took too long. Please try again with shorter text or try again later.");
        } else if (err.status === 400) {
          setError(err.message);
        } else if (err.status === 401) {
          setError("You must be logged in to generate flashcards.");
        } else {
          setError("Failed to generate flashcards. Please try again.");
        }
      } else {
        setError("Network error. Please check your connection and try again.");
      }

      // Return to input step on error
      setStep("input");
    }
  };

  /**
   * Handles the bulk save API call.
   */
  const handleSave = async () => {
    if (!generationId) {
      setError("No generation ID found. Please regenerate flashcards.");
      return;
    }

    if (candidates.length === 0) {
      setError("No flashcards to save. Please add at least one flashcard.");
      return;
    }

    setStep("saving");
    setError(null);

    try {
      const command: CreateFlashcardsCommand = {
        generation_id: generationId,
        flashcards: candidates.map((c) => ({
          front: c.front,
          back: c.back,
          source: c.source,
        })),
      };

      const result = await saveFlashcards(command);

      toast.success(`Saved ${result.created_count} flashcard${result.created_count === 1 ? "" : "s"} to your library!`);

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          setError(err.message);
        } else if (err.status === 401) {
          setError("You must be logged in to save flashcards.");
        } else {
          setError("Failed to save flashcards. Please try again.");
        }
      } else {
        setError("Network error. Please check your connection and try again.");
      }

      // Return to review step on error
      setStep("review");
    }
  };

  return (
    <div className="container py-8">
      {step === "input" && <GenerationInput onGenerate={handleGenerate} />}
      {step === "generating" && (
        <div className="mx-auto w-full max-w-3xl space-y-6">
          <SourceTextDisplay sourceText={sourceText} />
          <GenerationLoader />
        </div>
      )}
      {step === "review" && (
        <ReviewView cardCount={candidates.length} onSave={handleSave} isSaving={false} sourceText={sourceText} />
      )}
      {step === "saving" && (
        <div className="flex items-center justify-center py-12">
          <GenerationLoader />
        </div>
      )}
    </div>
  );
}
