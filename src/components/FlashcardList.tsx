import { FlashcardItem } from "./FlashcardItem";
import type { FlashcardDto } from "../types";

interface FlashcardListProps {
  flashcards: FlashcardDto[];
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
}

/**
 * Renders a responsive grid of flashcard items.
 * Layout adapts to screen size: 1 column on mobile, 2 on tablet, 3 on desktop.
 */
export function FlashcardList({ flashcards, onEdit, onDelete }: FlashcardListProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {flashcards.map((flashcard) => (
        <FlashcardItem key={flashcard.id} flashcard={flashcard} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}

