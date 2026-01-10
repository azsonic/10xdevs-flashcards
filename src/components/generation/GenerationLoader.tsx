import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface GenerationLoaderProps {
  title?: string;
  description?: string;
  showTimer?: boolean;
}

/**
 * Visual feedback during the AI generation process.
 * Shows a loading spinner and elapsed time.
 */
export function GenerationLoader({
  title = "Generating Flashcards...",
  description = "AI is analyzing your text and creating flashcards",
  showTimer = true,
}: GenerationLoaderProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!showTimer) return;

    const interval = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [showTimer]);

  const showTimeoutWarning = elapsed > 30;

  return (
    <div className="mx-auto flex w-full max-w-md flex-col items-center justify-center space-y-6 py-12">
      <div className="relative">
        <Loader2 className="h-16 w-16 animate-spin text-primary" aria-label="Loading" />
      </div>

      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
        {showTimer && (
          <div className="pt-2 text-sm text-muted-foreground">
            {elapsed < 60 ? (
              <>{elapsed}s</>
            ) : (
              <>
                {Math.floor(elapsed / 60)}m {elapsed % 60}s
              </>
            )}
          </div>
        )}
      </div>

      {showTimeoutWarning && (
        <div className="rounded-md border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-900 dark:bg-yellow-950 dark:text-yellow-200">
          <p className="font-medium">This is taking longer than expected...</p>
          <p className="mt-1 text-xs">Generation can take up to 60 seconds for longer texts. Please wait.</p>
        </div>
      )}
    </div>
  );
}
