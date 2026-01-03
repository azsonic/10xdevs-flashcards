import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface AddManualButtonProps {
  onClick: () => void;
  disabled: boolean;
}

/**
 * Primary CTA button for creating new flashcards manually.
 */
export function AddManualButton({ onClick, disabled }: AddManualButtonProps) {
  return (
    <Button onClick={onClick} disabled={disabled} className="whitespace-nowrap">
      <Plus className="h-4 w-4 mr-2" />
      Add Manual
    </Button>
  );
}
