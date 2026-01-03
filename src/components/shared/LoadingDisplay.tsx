import { Loader2 } from "lucide-react";
import type { LoadingType } from "@/lib/types/library.types";

interface LoadingDisplayProps {
  loadingType: LoadingType;
}

/**
 * Displays contextual loading messages based on the action being performed.
 */
export function LoadingDisplay({ loadingType }: LoadingDisplayProps) {
  const messages: Record<Exclude<LoadingType, null>, { text: string; subtext?: string }> = {
    initial: {
      text: "Loading your flashcards...",
      subtext: "This may take a moment",
    },
    pagination: {
      text: "Loading page...",
    },
    search: {
      text: "Searching flashcards...",
      subtext: "Finding matches",
    },
  };

  const currentMessage = loadingType ? messages[loadingType] : messages.initial;

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <div className="text-center">
        <p className="text-base font-medium">{currentMessage.text}</p>
        {currentMessage.subtext && <p className="text-sm text-muted-foreground mt-1">{currentMessage.subtext}</p>}
      </div>
    </div>
  );
}
