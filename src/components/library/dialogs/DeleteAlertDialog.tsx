import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import type { FlashcardDto } from "@/types";

interface DeleteAlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  flashcard: FlashcardDto | null;
  onConfirm: (id: number) => Promise<void>;
  isDeleting: boolean;
}

/**
 * Confirmation dialog for permanently deleting a flashcard.
 * Shows a preview of the flashcard content to confirm the correct item.
 */
export function DeleteAlertDialog({ isOpen, onClose, flashcard, onConfirm, isDeleting }: DeleteAlertDialogProps) {
  if (!flashcard) {
    return null;
  }

  const handleConfirm = async () => {
    await onConfirm(flashcard.id);
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Flashcard</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the following flashcard:
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 my-4 p-4 bg-muted rounded-md">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Front:</p>
            <p className="text-sm">{flashcard.front}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-1">Back:</p>
            <p className="text-sm">{flashcard.back}</p>
          </div>
        </div>

        <AlertDialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
