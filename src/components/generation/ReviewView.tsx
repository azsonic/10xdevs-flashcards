import { CandidateList } from "./CandidateList";
import { BulkSaveBar } from "./BulkSaveBar";
import { SourceTextDisplay } from "./SourceTextDisplay";

interface ReviewViewProps {
  cardCount: number;
  onSave: () => void;
  isSaving: boolean;
  sourceText: string;
}

/**
 * Container for the review process.
 * Displays the list of candidates and the sticky footer for saving.
 */
export function ReviewView({ cardCount, onSave, isSaving, sourceText }: ReviewViewProps) {
  return (
    <div className="pb-24">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Review Flashcards</h1>
          <p className="text-muted-foreground">
            Review, edit, or reject the generated flashcards before saving to your library.
          </p>
        </div>

        <SourceTextDisplay sourceText={sourceText} />

        <CandidateList />
      </div>

      <BulkSaveBar cardCount={cardCount} onSave={onSave} isSaving={isSaving} />
    </div>
  );
}
