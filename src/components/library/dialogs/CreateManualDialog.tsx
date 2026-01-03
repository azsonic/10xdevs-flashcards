import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FlashcardForm } from "@/components/shared/forms";
import type { FlashcardToCreate } from "@/types";
import type { FlashcardFormData } from "@/lib/types/library.types";

interface CreateManualDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (flashcard: FlashcardToCreate) => Promise<void>;
}

/**
 * Modal dialog for creating a new flashcard manually.
 * Uses the reusable FlashcardForm component with empty initial values.
 */
export function CreateManualDialog({ isOpen, onClose, onCreate }: CreateManualDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handles form submission and adds source="manual" to the flashcard data.
   */
  const handleSubmit = async (formData: FlashcardFormData) => {
    setIsSubmitting(true);
    try {
      await onCreate({
        front: formData.front,
        back: formData.back,
        source: "manual",
      });
      // onCreate will handle closing the dialog and showing success toast
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
          <DialogTitle>Create Flashcard</DialogTitle>
          <DialogDescription>
            Create a new flashcard by entering the question on the front and the answer on the back.
          </DialogDescription>
        </DialogHeader>

        <FlashcardForm
          initialValues={{ front: "", back: "" }}
          onSubmit={handleSubmit}
          onCancel={onClose}
          submitLabel="Create"
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}
