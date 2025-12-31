import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SourceTextDisplayProps {
  sourceText: string;
}

/**
 * Displays the source text in a collapsible read-only view.
 * Shown during generation and review steps.
 */
export function SourceTextDisplay({ sourceText }: SourceTextDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);

  const truncatedText = sourceText.slice(0, 200) + (sourceText.length > 200 ? "..." : "");

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
      <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
        <div className="flex-1">
          <h3 className="text-sm font-medium">Source Text</h3>
          {!isOpen && <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{truncatedText}</p>}
        </div>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="ml-2">
            {isOpen ? (
              <>
                <ChevronUp className="h-4 w-4" />
                <span className="ml-1 text-xs">Hide</span>
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                <span className="ml-1 text-xs">Show</span>
              </>
            )}
          </Button>
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className="space-y-2">
        <div className="rounded-lg border bg-background p-4">
          <div className="max-h-[300px] overflow-y-auto whitespace-pre-wrap text-sm">{sourceText}</div>
          <div className="mt-2 text-right text-xs text-muted-foreground">{sourceText.length} characters</div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
