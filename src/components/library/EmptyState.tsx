import { Button } from "@/components/ui/button";
import { Search, FileQuestion } from "lucide-react";

interface EmptyStateProps {
  hasSearchQuery: boolean;
  onClearSearch: () => void;
}

/**
 * Displays a friendly message when there are no flashcards to show.
 * Context-aware: different messages for empty library vs. no search results.
 */
export function EmptyState({ hasSearchQuery, onClearSearch }: EmptyStateProps) {
  if (hasSearchQuery) {
    // No search results
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <Search className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No flashcards found</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          We couldn&apos;t find any flashcards matching your search. Try different keywords or clear your search to see
          all flashcards.
        </p>
        <Button onClick={onClearSearch} variant="outline">
          Clear Search
        </Button>
      </div>
    );
  }

  // Empty library (no flashcards at all)
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <FileQuestion className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">No flashcards yet</h3>
      <p className="text-muted-foreground mb-6 max-w-md">
        Get started by creating your first flashcard manually, or generate flashcards from text using AI.
      </p>
      <Button asChild>
        <a href="/generate">Generate your first set with AI</a>
      </Button>
    </div>
  );
}
