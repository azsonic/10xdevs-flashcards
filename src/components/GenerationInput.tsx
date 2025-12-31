import { useState, useEffect } from "react";
import { useGenerationStore } from "@/lib/store/generation-store";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const MIN_LENGTH = 1000;
const MAX_LENGTH = 5000;

interface GenerationInputProps {
  onGenerate: () => void;
}

/**
 * The entry point form for the user to paste source text.
 * Validates text length and manages the input state.
 */
export function GenerationInput({ onGenerate }: GenerationInputProps) {
  const { sourceText, setSourceText } = useGenerationStore();
  const [localText, setLocalText] = useState(sourceText);

  // Sync local state with store on mount
  useEffect(() => {
    setLocalText(sourceText);
  }, [sourceText]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    if (text.length <= MAX_LENGTH) {
      setLocalText(text);
      setSourceText(text);
    }
  };

  const isValid = localText.length >= MIN_LENGTH && localText.length <= MAX_LENGTH;
  const isMinLengthReached = localText.length >= MIN_LENGTH;

  const getCharacterCountColor = () => {
    if (localText.length < MIN_LENGTH) return "text-muted-foreground";
    if (localText.length > MAX_LENGTH) return "text-destructive";
    return "text-primary";
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Generate Flashcards</h1>
        <p className="text-muted-foreground">Paste your study material below and let AI generate flashcards for you.</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="source-text" className="text-sm font-medium">
            Source Text
          </label>
          <Textarea
            id="source-text"
            placeholder={`Paste your text here (minimum ${MIN_LENGTH} characters)...`}
            value={localText}
            onChange={handleTextChange}
            className="min-h-[300px] resize-y"
            aria-describedby="char-count"
          />
          <div id="char-count" className={`text-right text-sm ${getCharacterCountColor()}`}>
            {localText.length} / {MAX_LENGTH}
            {!isMinLengthReached && (
              <span className="ml-2 text-muted-foreground">(minimum {MIN_LENGTH} characters)</span>
            )}
          </div>
        </div>

        {!isValid && localText.length > 0 && (
          <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
            {localText.length < MIN_LENGTH ? (
              <>Please enter at least {MIN_LENGTH - localText.length} more characters.</>
            ) : (
              <>Text exceeds maximum length of {MAX_LENGTH} characters.</>
            )}
          </div>
        )}

        <Button
          type="button"
          size="lg"
          disabled={!isValid}
          onClick={onGenerate}
          className="w-full"
          aria-label="Generate flashcards from source text"
        >
          Generate Flashcards
        </Button>
      </div>
    </div>
  );
}
