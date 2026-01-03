import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FlashcardForm } from "@/components/shared/forms";
import type { FlashcardDto, UpdateFlashcardCommand } from "@/types";
import type { FlashcardFormData } from "@/lib/types/library.types";

interface EditFlashcardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  flashcard: FlashcardDto | null;
  onSave: (id: number, updates: UpdateFlashcardCommand) => Promise<void>;
}

/**
 * Modal dialog for editing an existing flashcard.
 * Uses the reusable FlashcardForm component.
 */
export function EditFlashcardDialog({ isOpen, onClose, flashcard, onSave }: EditFlashcardDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!flashcard) {
    return null;
  }

  /**
   * Handles form submission and determines which fields changed.
   */
  const handleSubmit = async (formData: FlashcardFormData) => {
    const updates: UpdateFlashcardCommand = {};

    // Only include changed fields
    if (formData.front !== flashcard.front) {
      updates.front = formData.front;
    }
    if (formData.back !== flashcard.back) {
      updates.back = formData.back;
    }

    // If no changes, just close the dialog
    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(flashcard.id, updates);
      // onSave will handle closing the dialog and showing success toast
    } catch {
      // Error handling is done in the hook
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
          <DialogDescription>Make changes to your flashcard below. Both fields are required.</DialogDescription>
        </DialogHeader>

        <FlashcardForm
          initialValues={{
            front: flashcard.front,
            back: flashcard.back,
          }}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel="Save"
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
