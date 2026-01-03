import { useState, type FormEvent } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { FlashcardFormData, FlashcardFormErrors } from "@/lib/types/library.types";

interface FlashcardFormProps {
  initialValues?: { front: string; back: string };
  onSubmit: (data: FlashcardFormData) => void | Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  cancelLabel?: string;
  isSubmitting: boolean;
}

const MAX_FRONT_LENGTH = 200;
const MAX_BACK_LENGTH = 500;

/**
 * Reusable form component for creating and editing flashcards.
 * Includes validation, character counters, and error display.
 */
export function FlashcardForm({
  initialValues = { front: "", back: "" },
  onSubmit,
  onCancel,
  submitLabel,
  cancelLabel = "Cancel",
  isSubmitting,
}: FlashcardFormProps) {
  const [formData, setFormData] = useState<FlashcardFormData>(initialValues);
  const [errors, setErrors] = useState<FlashcardFormErrors>({});

  /**
   * Validates the form data.
   * Returns true if valid, false otherwise.
   */
  const validate = (): boolean => {
    const newErrors: FlashcardFormErrors = {};

    // Validate front field
    if (!formData.front.trim()) {
      newErrors.front = "Front content is required";
    } else if (formData.front.length > MAX_FRONT_LENGTH) {
      newErrors.front = `Front content must not exceed ${MAX_FRONT_LENGTH} characters`;
    }

    // Validate back field
    if (!formData.back.trim()) {
      newErrors.back = "Back content is required";
    } else if (formData.back.length > MAX_BACK_LENGTH) {
      newErrors.back = `Back content must not exceed ${MAX_BACK_LENGTH} characters`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handles form submission.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch {
      // Error handling is done in the parent component
    }
  };

  /**
   * Updates front field value and clears error.
   */
  const handleFrontChange = (value: string) => {
    setFormData((prev) => ({ ...prev, front: value }));
    if (errors.front) {
      setErrors((prev) => ({ ...prev, front: undefined }));
    }
  };

  /**
   * Updates back field value and clears error.
   */
  const handleBackChange = (value: string) => {
    setFormData((prev) => ({ ...prev, back: value }));
    if (errors.back) {
      setErrors((prev) => ({ ...prev, back: undefined }));
    }
  };

  const frontCharCount = formData.front.length;
  const backCharCount = formData.back.length;
  const frontOverLimit = frontCharCount > MAX_FRONT_LENGTH;
  const backOverLimit = backCharCount > MAX_BACK_LENGTH;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Front Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="front">Front</Label>
          <span className={`text-sm ${frontOverLimit ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
            {frontCharCount}/{MAX_FRONT_LENGTH}
          </span>
        </div>
        <Textarea
          id="front"
          value={formData.front}
          onChange={(e) => handleFrontChange(e.target.value)}
          disabled={isSubmitting}
          className={errors.front ? "border-red-500" : ""}
          rows={3}
          placeholder="Enter the question or prompt..."
        />
        {errors.front && <p className="text-sm text-red-600">{errors.front}</p>}
      </div>

      {/* Back Field */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="back">Back</Label>
          <span className={`text-sm ${backOverLimit ? "text-red-600 font-medium" : "text-muted-foreground"}`}>
            {backCharCount}/{MAX_BACK_LENGTH}
          </span>
        </div>
        <Textarea
          id="back"
          value={formData.back}
          onChange={(e) => handleBackChange(e.target.value)}
          disabled={isSubmitting}
          className={errors.back ? "border-red-500" : ""}
          rows={5}
          placeholder="Enter the answer or explanation..."
        />
        {errors.back && <p className="text-sm text-red-600">{errors.back}</p>}
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {cancelLabel}
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
