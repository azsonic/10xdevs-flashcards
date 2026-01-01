import { describe, it, expect } from "vitest";
import {
  validateFlashcardContent,
  getCharacterCounterColor,
  trimFlashcardContent,
  FRONT_MAX_LENGTH,
  BACK_MAX_LENGTH,
} from "@/lib/validation";

describe("Flashcard Validation", () => {
  describe("validateFlashcardContent", () => {
    describe("Valid cases", () => {
      it("should validate correct front and back content", () => {
        const result = validateFlashcardContent("Question", "Answer");

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should validate content with whitespace that trims to valid length", () => {
        const result = validateFlashcardContent("  Question  ", "  Answer  ");

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should validate front at exactly max length (200 chars)", () => {
        const front = "a".repeat(200);
        const result = validateFlashcardContent(front, "Answer");

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should validate back at exactly max length (500 chars)", () => {
        const back = "a".repeat(500);
        const result = validateFlashcardContent("Question", back);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should validate content with internal whitespace", () => {
        const result = validateFlashcardContent("What is  React?", "A JavaScript  library");

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      it("should validate multiline content", () => {
        const front = "Question\nwith multiple\nlines";
        const back = "Answer\nwith multiple\nlines";
        const result = validateFlashcardContent(front, back);

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe("Invalid cases - Empty content", () => {
      it("should reject empty front", () => {
        const result = validateFlashcardContent("", "Answer");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Front cannot be empty");
        expect(result.errors).toHaveLength(1);
      });

      it("should reject empty back", () => {
        const result = validateFlashcardContent("Question", "");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Back cannot be empty");
        expect(result.errors).toHaveLength(1);
      });

      it("should reject both empty", () => {
        const result = validateFlashcardContent("", "");

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain("Front cannot be empty");
        expect(result.errors).toContain("Back cannot be empty");
      });

      it("should reject whitespace-only front", () => {
        const result = validateFlashcardContent("   ", "Answer");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Front cannot be empty");
      });

      it("should reject whitespace-only back", () => {
        const result = validateFlashcardContent("Question", "   ");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Back cannot be empty");
      });

      it("should reject tabs and newlines only", () => {
        const result = validateFlashcardContent("\t\n\t", "\n\t\n");

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
      });
    });

    describe("Invalid cases - Exceeds max length", () => {
      it("should reject front exceeding 200 characters", () => {
        const front = "a".repeat(201);
        const result = validateFlashcardContent(front, "Answer");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Front exceeds maximum length of 200 characters");
        expect(result.errors).toHaveLength(1);
      });

      it("should reject back exceeding 500 characters", () => {
        const back = "a".repeat(501);
        const result = validateFlashcardContent("Question", back);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Back exceeds maximum length of 500 characters");
        expect(result.errors).toHaveLength(1);
      });

      it("should reject both exceeding max length", () => {
        const front = "a".repeat(201);
        const back = "b".repeat(501);
        const result = validateFlashcardContent(front, back);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain("Front exceeds maximum length of 200 characters");
        expect(result.errors).toContain("Back exceeds maximum length of 500 characters");
      });

      it("should reject front at exactly 201 characters (boundary)", () => {
        const front = "a".repeat(201);
        const result = validateFlashcardContent(front, "Answer");

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Front exceeds maximum length of 200 characters");
      });

      it("should reject back at exactly 501 characters (boundary)", () => {
        const back = "a".repeat(501);
        const result = validateFlashcardContent("Question", back);

        expect(result.isValid).toBe(false);
        expect(result.errors).toContain("Back exceeds maximum length of 500 characters");
      });

      it("should trim before checking length", () => {
        // 198 chars + 2 spaces = 200 chars, but trims to 198
        const front = " " + "a".repeat(198) + " ";
        const result = validateFlashcardContent(front, "Answer");

        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe("Invalid cases - Multiple errors", () => {
      it("should return all errors when front is empty and back exceeds max", () => {
        const back = "a".repeat(501);
        const result = validateFlashcardContent("", back);

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain("Front cannot be empty");
        expect(result.errors).toContain("Back exceeds maximum length of 500 characters");
      });

      it("should return all errors when back is empty and front exceeds max", () => {
        const front = "a".repeat(201);
        const result = validateFlashcardContent(front, "");

        expect(result.isValid).toBe(false);
        expect(result.errors).toHaveLength(2);
        expect(result.errors).toContain("Front exceeds maximum length of 200 characters");
        expect(result.errors).toContain("Back cannot be empty");
      });
    });

    describe("Edge cases", () => {
      it("should handle special characters", () => {
        const result = validateFlashcardContent("What is <React>?", "A library & framework");

        expect(result.isValid).toBe(true);
      });

      it("should handle unicode characters", () => {
        const result = validateFlashcardContent("¿Qué es React? 🤔", "Una biblioteca de JavaScript 🚀");

        expect(result.isValid).toBe(true);
      });

      it("should handle emojis in length calculation", () => {
        // Emojis can be 1-2 characters in JavaScript string length
        // "🚀" is 2 characters in JS, so 100 emojis = 200 chars
        const front = "🚀".repeat(100); // 100 emojis = 200 chars
        const result = validateFlashcardContent(front, "Answer");

        expect(result.isValid).toBe(true);
        expect(front.length).toBe(200);
      });

      it("should handle zero-width characters", () => {
        const result = validateFlashcardContent("Question\u200B", "Answer\u200B");

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe("getCharacterCounterColor", () => {
    it("should return destructive color when exceeding max length", () => {
      const color = getCharacterCounterColor(201, FRONT_MAX_LENGTH);

      expect(color).toBe("text-destructive");
    });

    it("should return muted color when within max length", () => {
      const color = getCharacterCounterColor(100, FRONT_MAX_LENGTH);

      expect(color).toBe("text-muted-foreground");
    });

    it("should return muted color when at exactly max length", () => {
      const color = getCharacterCounterColor(200, FRONT_MAX_LENGTH);

      expect(color).toBe("text-muted-foreground");
    });

    it("should return destructive color when at exactly max + 1", () => {
      const color = getCharacterCounterColor(201, FRONT_MAX_LENGTH);

      expect(color).toBe("text-destructive");
    });

    it("should return muted color for empty content", () => {
      const color = getCharacterCounterColor(0, FRONT_MAX_LENGTH);

      expect(color).toBe("text-muted-foreground");
    });

    it("should work with back max length", () => {
      const color = getCharacterCounterColor(501, BACK_MAX_LENGTH);

      expect(color).toBe("text-destructive");
    });
  });

  describe("trimFlashcardContent", () => {
    it("should trim leading whitespace from both sides", () => {
      const result = trimFlashcardContent({
        front: "  Question",
        back: "  Answer",
      });

      expect(result).toEqual({
        front: "Question",
        back: "Answer",
      });
    });

    it("should trim trailing whitespace from both sides", () => {
      const result = trimFlashcardContent({
        front: "Question  ",
        back: "Answer  ",
      });

      expect(result).toEqual({
        front: "Question",
        back: "Answer",
      });
    });

    it("should trim both leading and trailing whitespace", () => {
      const result = trimFlashcardContent({
        front: "  Question  ",
        back: "  Answer  ",
      });

      expect(result).toEqual({
        front: "Question",
        back: "Answer",
      });
    });

    it("should preserve internal whitespace", () => {
      const result = trimFlashcardContent({
        front: "  What is  React?  ",
        back: "  A JavaScript  library  ",
      });

      expect(result).toEqual({
        front: "What is  React?",
        back: "A JavaScript  library",
      });
    });

    it("should trim tabs and newlines", () => {
      const result = trimFlashcardContent({
        front: "\t\nQuestion\n\t",
        back: "\n\tAnswer\t\n",
      });

      expect(result).toEqual({
        front: "Question",
        back: "Answer",
      });
    });

    it("should handle already trimmed content", () => {
      const result = trimFlashcardContent({
        front: "Question",
        back: "Answer",
      });

      expect(result).toEqual({
        front: "Question",
        back: "Answer",
      });
    });

    it("should handle empty strings", () => {
      const result = trimFlashcardContent({
        front: "",
        back: "",
      });

      expect(result).toEqual({
        front: "",
        back: "",
      });
    });

    it("should trim whitespace-only strings to empty", () => {
      const result = trimFlashcardContent({
        front: "   ",
        back: "   ",
      });

      expect(result).toEqual({
        front: "",
        back: "",
      });
    });

    it("should preserve multiline content after trimming edges", () => {
      const result = trimFlashcardContent({
        front: "  Line 1\nLine 2  ",
        back: "  Line A\nLine B  ",
      });

      expect(result).toEqual({
        front: "Line 1\nLine 2",
        back: "Line A\nLine B",
      });
    });
  });

  describe("Constants", () => {
    it("should have FRONT_MAX_LENGTH set to 200", () => {
      expect(FRONT_MAX_LENGTH).toBe(200);
    });

    it("should have BACK_MAX_LENGTH set to 500", () => {
      expect(BACK_MAX_LENGTH).toBe(500);
    });
  });
});

