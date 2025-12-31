import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";

/**
 * Represents the frontend view model for a candidate card.
 */
export interface FlashcardCandidateViewItem {
  id: string; // UUID v4 generated on frontend for keying
  front: string;
  back: string;
  originalFront: string; // To track changes
  originalBack: string; // To track changes
  source: "ai-full" | "ai-edited"; // Derived from comparison with original
}

/**
 * Zustand store state definition for the generation flow.
 */
export interface GenerationStoreState {
  step: "input" | "generating" | "review" | "saving";
  sourceText: string;
  generationId: number | null;
  candidates: FlashcardCandidateViewItem[];
  error: string | null;

  // Actions
  setStep: (step: GenerationStoreState["step"]) => void;
  setSourceText: (text: string) => void;
  setGenerationResult: (id: number, candidates: { front: string; back: string }[]) => void;
  updateCandidate: (id: string, updates: Partial<Pick<FlashcardCandidateViewItem, "front" | "back">>) => void;
  removeCandidate: (id: string) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  step: "input" as const,
  sourceText: "",
  generationId: null,
  candidates: [],
  error: null,
};

/**
 * Global state store for the flashcard generation flow.
 */
export const useGenerationStore = create<GenerationStoreState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  setSourceText: (text) => set({ sourceText: text }),

  setGenerationResult: (id, candidates) => {
    const viewItems: FlashcardCandidateViewItem[] = candidates.map((c) => ({
      id: uuidv4(),
      front: c.front,
      back: c.back,
      originalFront: c.front,
      originalBack: c.back,
      source: "ai-full" as const,
    }));

    set({
      generationId: id,
      candidates: viewItems,
      step: "review",
      error: null,
    });
  },

  updateCandidate: (id, updates) =>
    set((state) => ({
      candidates: state.candidates.map((c) => {
        if (c.id !== id) return c;

        const updated = { ...c, ...updates };
        // Determine if the candidate has been edited
        const isEdited = updated.front !== c.originalFront || updated.back !== c.originalBack;

        return {
          ...updated,
          source: isEdited ? "ai-edited" : "ai-full",
        };
      }),
    })),

  removeCandidate: (id) =>
    set((state) => ({
      candidates: state.candidates.filter((c) => c.id !== id),
    })),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
