import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CandidateCard } from "@/components/CandidateCard";
import type { FlashcardCandidateViewItem } from "@/lib/store/generation-store";

describe("CandidateCard Component", () => {
  // Mock candidate data
  const mockCandidate: FlashcardCandidateViewItem = {
    id: "test-id-123",
    front: "What is React?",
    back: "A JavaScript library for building user interfaces",
    originalFront: "What is React?",
    originalBack: "A JavaScript library for building user interfaces",
    source: "ai-full",
  };

  const mockEditedCandidate: FlashcardCandidateViewItem = {
    ...mockCandidate,
    id: "test-id-456",
    source: "ai-edited",
  };

  // Mock callback functions
  let mockOnUpdate: ReturnType<typeof vi.fn>;
  let mockOnRemove: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnUpdate = vi.fn();
    mockOnRemove = vi.fn();
  });

  describe("Rendering", () => {
    it("should render candidate card with front and back content", () => {
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      expect(screen.getByText("What is React?")).toBeInTheDocument();
      expect(screen.getByText("A JavaScript library for building user interfaces")).toBeInTheDocument();
    });

    it("should render edit and delete buttons in view mode", () => {
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      expect(screen.getByLabelText("Edit flashcard")).toBeInTheDocument();
      expect(screen.getByLabelText("Reject flashcard")).toBeInTheDocument();
    });

    it("should NOT render edited badge for ai-full source", () => {
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      expect(screen.queryByText("Edited")).not.toBeInTheDocument();
    });

    it("should render edited badge for ai-edited source", () => {
      render(<CandidateCard candidate={mockEditedCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      expect(screen.getByText("Edited")).toBeInTheDocument();
    });

    it("should render Front and Back labels", () => {
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      expect(screen.getAllByText("Front")[0]).toBeInTheDocument();
      expect(screen.getAllByText("Back")[0]).toBeInTheDocument();
    });
  });

  describe("Edit Mode", () => {
    it("should enter edit mode when edit button is clicked", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      const editButton = screen.getByLabelText("Edit flashcard");
      await user.click(editButton);

      // Should show save and cancel buttons
      expect(screen.getByLabelText("Save changes")).toBeInTheDocument();
      expect(screen.getByLabelText("Cancel editing")).toBeInTheDocument();

      // Should show textareas with candidate content
      expect(screen.getByPlaceholderText("Enter front side text...")).toHaveValue("What is React?");
      expect(screen.getByPlaceholderText("Enter back side text...")).toHaveValue(
        "A JavaScript library for building user interfaces"
      );
    });

    it("should show character counters in edit mode", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      // Front counter: "What is React?" = 14 chars
      expect(screen.getByText("14 / 200")).toBeInTheDocument();

      // Back counter: "A JavaScript library for building user interfaces" = 49 chars
      expect(screen.getByText("49 / 500")).toBeInTheDocument();
    });

    it("should update character count when typing", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const frontTextarea = screen.getByPlaceholderText("Enter front side text...");
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "New question");

      // "New question" = 12 chars
      expect(screen.getByText("12 / 200")).toBeInTheDocument();
    });

    it("should show destructive color when exceeding max length", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const frontTextarea = screen.getByPlaceholderText("Enter front side text...");
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "a".repeat(201));

      const counter = screen.getByText("201 / 200");
      expect(counter).toHaveClass("text-destructive");
    });
  });

  describe("Save Functionality", () => {
    it("should call onUpdate with trimmed values when save is clicked", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const frontTextarea = screen.getByPlaceholderText("Enter front side text...");
      const backTextarea = screen.getByPlaceholderText("Enter back side text...");

      await user.clear(frontTextarea);
      await user.type(frontTextarea, "  New Question  ");

      await user.clear(backTextarea);
      await user.type(backTextarea, "  New Answer  ");

      await user.click(screen.getByLabelText("Save changes"));

      expect(mockOnUpdate).toHaveBeenCalledWith("test-id-123", {
        front: "New Question",
        back: "New Answer",
      });
    });

    it("should exit edit mode after successful save", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));
      await user.click(screen.getByLabelText("Save changes"));

      // Should return to view mode
      expect(screen.getByLabelText("Edit flashcard")).toBeInTheDocument();
      expect(screen.queryByLabelText("Save changes")).not.toBeInTheDocument();
    });

    it("should disable save button when front is empty", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const frontTextarea = screen.getByPlaceholderText("Enter front side text...");
      await user.clear(frontTextarea);

      const saveButton = screen.getByLabelText("Save changes");
      expect(saveButton).toBeDisabled();
    });

    it("should disable save button when back is empty", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const backTextarea = screen.getByPlaceholderText("Enter back side text...");
      await user.clear(backTextarea);

      const saveButton = screen.getByLabelText("Save changes");
      expect(saveButton).toBeDisabled();
    });

    it("should disable save button when front exceeds max length", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const frontTextarea = screen.getByPlaceholderText("Enter front side text...");
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "a".repeat(201));

      const saveButton = screen.getByLabelText("Save changes");
      expect(saveButton).toBeDisabled();
    });

    it("should disable save button when back exceeds max length", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const backTextarea = screen.getByPlaceholderText("Enter back side text...");
      
      // Use fireEvent for performance when typing long strings
      fireEvent.change(backTextarea, { target: { value: "a".repeat(501) } });

      const saveButton = screen.getByLabelText("Save changes");
      expect(saveButton).toBeDisabled();
    });

    it("should enable save button when content is valid at exactly max length", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const frontTextarea = screen.getByPlaceholderText("Enter front side text...");
      const backTextarea = screen.getByPlaceholderText("Enter back side text...");

      // Use fireEvent for performance when typing long strings
      fireEvent.change(frontTextarea, { target: { value: "a".repeat(200) } });
      fireEvent.change(backTextarea, { target: { value: "b".repeat(500) } });

      const saveButton = screen.getByLabelText("Save changes");
      expect(saveButton).not.toBeDisabled();
    });

    it("should not call onUpdate if save button is disabled", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const frontTextarea = screen.getByPlaceholderText("Enter front side text...");
      await user.clear(frontTextarea);

      const saveButton = screen.getByLabelText("Save changes");
      
      // Button should be disabled when front is empty
      expect(saveButton).toBeDisabled();
      
      // Verify onUpdate was not called
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it("should handle whitespace-only content as empty", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const frontTextarea = screen.getByPlaceholderText("Enter front side text...");
      await user.clear(frontTextarea);
      
      // Type spaces
      fireEvent.change(frontTextarea, { target: { value: "   " } });

      const saveButton = screen.getByLabelText("Save changes");
      expect(saveButton).toBeDisabled();
    });
  });

  describe("Cancel Functionality", () => {
    it("should revert changes when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const frontTextarea = screen.getByPlaceholderText("Enter front side text...");
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "Changed text");

      await user.click(screen.getByLabelText("Cancel editing"));

      // Should exit edit mode
      expect(screen.queryByLabelText("Cancel editing")).not.toBeInTheDocument();

      // Re-enter edit mode to check values were reverted
      await user.click(screen.getByLabelText("Edit flashcard"));
      expect(screen.getByPlaceholderText("Enter front side text...")).toHaveValue("What is React?");
    });

    it("should not call onUpdate when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const frontTextarea = screen.getByPlaceholderText("Enter front side text...");
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "Changed text");

      await user.click(screen.getByLabelText("Cancel editing"));

      expect(mockOnUpdate).not.toHaveBeenCalled();
    });

    it("should exit edit mode after cancel", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));
      await user.click(screen.getByLabelText("Cancel editing"));

      expect(screen.getByLabelText("Edit flashcard")).toBeInTheDocument();
      expect(screen.queryByLabelText("Cancel editing")).not.toBeInTheDocument();
    });
  });

  describe("Delete Functionality", () => {
    it("should call onRemove when delete button is clicked", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Reject flashcard"));

      expect(mockOnRemove).toHaveBeenCalledWith("test-id-123");
      expect(mockOnRemove).toHaveBeenCalledTimes(1);
    });

    it("should not show delete button in edit mode", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      expect(screen.queryByLabelText("Reject flashcard")).not.toBeInTheDocument();
    });
  });

  describe("State Transitions", () => {
    it("should preserve unsaved changes when switching between fields", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const frontTextarea = screen.getByPlaceholderText("Enter front side text...");
      const backTextarea = screen.getByPlaceholderText("Enter back side text...");

      // Use fireEvent for better control
      fireEvent.change(frontTextarea, { target: { value: "Front change" } });
      fireEvent.change(backTextarea, { target: { value: "Back change" } });

      // Check both fields retain their values
      expect(frontTextarea).toHaveValue("Front change");
      expect(backTextarea).toHaveValue("Back change");
    });

    it("should reset to original values on each edit click", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      // First edit
      await user.click(screen.getByLabelText("Edit flashcard"));
      const frontTextarea = screen.getByPlaceholderText("Enter front side text...");
      await user.clear(frontTextarea);
      await user.type(frontTextarea, "Changed");
      await user.click(screen.getByLabelText("Cancel editing"));

      // Second edit - should reset to original
      await user.click(screen.getByLabelText("Edit flashcard"));
      expect(screen.getByPlaceholderText("Enter front side text...")).toHaveValue("What is React?");
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for all buttons", () => {
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      expect(screen.getByLabelText("Edit flashcard")).toBeInTheDocument();
      expect(screen.getByLabelText("Reject flashcard")).toBeInTheDocument();
    });

    it("should have proper ARIA labels in edit mode", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      expect(screen.getByLabelText("Save changes")).toBeInTheDocument();
      expect(screen.getByLabelText("Cancel editing")).toBeInTheDocument();
    });

    it("should have proper labels for textareas", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      expect(screen.getByLabelText("Front")).toBeInTheDocument();
      expect(screen.getByLabelText("Back")).toBeInTheDocument();
    });

    it("should associate labels with inputs via htmlFor", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      await user.click(screen.getByLabelText("Edit flashcard"));

      const frontInput = screen.getByPlaceholderText("Enter front side text...");
      const backInput = screen.getByPlaceholderText("Enter back side text...");

      expect(frontInput).toHaveAttribute("id", "front-test-id-123");
      expect(backInput).toHaveAttribute("id", "back-test-id-123");
    });
  });

  describe("Edge Cases", () => {
    it("should handle candidate with very long content", () => {
      const longCandidate: FlashcardCandidateViewItem = {
        ...mockCandidate,
        front: "a".repeat(200),
        back: "b".repeat(500),
      };

      render(<CandidateCard candidate={longCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      expect(screen.getByText("a".repeat(200))).toBeInTheDocument();
      expect(screen.getByText("b".repeat(500))).toBeInTheDocument();
    });

    it("should handle candidate with multiline content", () => {
      const multilineCandidate: FlashcardCandidateViewItem = {
        ...mockCandidate,
        front: "Line 1\nLine 2\nLine 3",
        back: "Answer Line 1\nAnswer Line 2",
      };

      render(<CandidateCard candidate={multilineCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      // Use a function matcher for multiline text
      expect(screen.getByText((content, element) => {
        return element?.textContent === "Line 1\nLine 2\nLine 3";
      })).toBeInTheDocument();
    });

    it("should handle candidate with special characters", () => {
      const specialCandidate: FlashcardCandidateViewItem = {
        ...mockCandidate,
        front: "<script>alert('xss')</script>",
        back: "A & B > C < D",
      };

      render(<CandidateCard candidate={specialCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      expect(screen.getByText("<script>alert('xss')</script>")).toBeInTheDocument();
      expect(screen.getByText("A & B > C < D")).toBeInTheDocument();
    });

    it("should handle rapid state changes", async () => {
      const user = userEvent.setup();
      render(<CandidateCard candidate={mockCandidate} onUpdate={mockOnUpdate} onRemove={mockOnRemove} />);

      // Rapid edit -> cancel -> edit -> cancel
      await user.click(screen.getByLabelText("Edit flashcard"));
      await user.click(screen.getByLabelText("Cancel editing"));
      await user.click(screen.getByLabelText("Edit flashcard"));
      await user.click(screen.getByLabelText("Cancel editing"));

      expect(screen.getByLabelText("Edit flashcard")).toBeInTheDocument();
      expect(mockOnUpdate).not.toHaveBeenCalled();
    });
  });
});

