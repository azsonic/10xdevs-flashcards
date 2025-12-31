import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";

interface BulkSaveBarProps {
  cardCount: number;
  onSave: () => void;
  isSaving: boolean;
}

/**
 * A sticky footer bar that displays the save action and card count.
 * Fixed at the bottom of the screen during the review step.
 */
export function BulkSaveBar({ cardCount, onSave, isSaving }: BulkSaveBarProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex items-center justify-between gap-4 py-4">
        <div className="text-sm">
          <span className="font-semibold">{cardCount}</span>{" "}
          <span className="text-muted-foreground">{cardCount === 1 ? "flashcard" : "flashcards"} selected</span>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => (window.location.href = "/")} disabled={isSaving}>
            Cancel
          </Button>
          <Button size="lg" onClick={onSave} disabled={cardCount === 0 || isSaving} className="min-w-[140px]">
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save to Library
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
