import { useGenerationStore } from "@/lib/store/generation-store";
import { CandidateCard } from "./CandidateCard";
import { AlertCircle } from "lucide-react";

/**
 * A responsive grid of generated flashcard candidates.
 * Displays an empty state if all candidates have been rejected.
 */
export function CandidateList() {
  const { candidates, updateCandidate, removeCandidate } = useGenerationStore();

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12">
        <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="mb-2 text-lg font-semibold">No Flashcards</h3>
        <p className="text-center text-sm text-muted-foreground">
          All flashcards have been rejected.
          <br />
          You need at least one flashcard to save.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {candidates.map((candidate) => (
        <CandidateCard
          key={candidate.id}
          candidate={candidate}
          onUpdate={(id, updates) => updateCandidate(id, updates)}
          onRemove={(id) => removeCandidate(id)}
        />
      ))}
    </div>
  );
}
