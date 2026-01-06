import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { FlashcardDto } from "@/types";

interface FlashcardItemProps {
  flashcard: FlashcardDto;
  onEdit: (flashcard: FlashcardDto) => void;
  onDelete: (flashcard: FlashcardDto) => void;
}

/**
 * Displays a single flashcard with front/back content and action buttons.
 * Includes a visual indicator for the flashcard source (manual, ai-full, ai-edited).
 */
export function FlashcardItem({ flashcard, onEdit, onDelete }: FlashcardItemProps) {
  // Determine badge style based on source
  const sourceConfig = {
    manual: { label: "Manual", className: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
    "ai-full": { label: "AI", className: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
    "ai-edited": {
      label: "AI Edited",
      className: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
    },
  };

  const sourceKey = flashcard.source as keyof typeof sourceConfig;
  const source = sourceConfig[sourceKey] ?? sourceConfig.manual;

  return (
    <div className="group relative flex flex-col rounded-lg border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* Source Badge */}
      <div className="absolute right-3 top-3">
        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${source.className}`}>
          {source.label}
        </span>
      </div>

      {/* Card Content */}
      <div className="flex-1 p-4 pt-10">
        <div className="space-y-3">
          {/* Front */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Front</p>
            <p className="text-sm break-words">{flashcard.front}</p>
          </div>

          {/* Back */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Back</p>
            <p className="text-sm break-words">{flashcard.back}</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 border-t p-3 bg-muted/30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(flashcard)}
          className="flex-1"
          aria-label={`Edit flashcard: ${flashcard.front}`}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(flashcard)}
          className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
          aria-label={`Delete flashcard: ${flashcard.front}`}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  );
}
