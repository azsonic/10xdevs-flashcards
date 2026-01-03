import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { FlashcardUpdateError, getFlashcardByIdForUser, updateFlashcardForUser } from "@/lib/flashcard.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardDto } from "@/types";

const baseFlashcard: FlashcardDto = {
  id: 1,
  user_id: "user-123",
  generation_id: 10,
  front: "Front text",
  back: "Back text",
  source: "ai-full",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("flashcard update service", () => {
  let supabase: SupabaseClient;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    supabase = {
      from: vi.fn(),
    } as unknown as SupabaseClient;
    consoleErrorSpy.mockClear();
  });

  describe("getFlashcardByIdForUser", () => {
    it("returns flashcard when found", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({ data: baseFlashcard, error: null });
      const select = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) });
      vi.mocked(supabase.from).mockReturnValueOnce({ select } as any);

      const result = await getFlashcardByIdForUser({ supabase, id: 1, userId: "user-123" });

      expect(result).toEqual(baseFlashcard);
      expect(supabase.from).toHaveBeenCalledWith("flashcards");
      expect(select).toHaveBeenCalledWith("*");
    });

    it("throws on database error", async () => {
      const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: "db error" } });
      const select = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ maybeSingle }) }) });
      vi.mocked(supabase.from).mockReturnValueOnce({ select } as any);

      await expect(getFlashcardByIdForUser({ supabase, id: 1, userId: "user-123" })).rejects.toThrow(
        FlashcardUpdateError
      );
    });
  });

  describe("updateFlashcardForUser", () => {
    it("promotes ai-full to ai-edited when content changes", async () => {
      const updatedCard = { ...baseFlashcard, front: "Updated front", source: "ai-edited" };

      const single = vi.fn().mockResolvedValue({ data: updatedCard, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const eqSecond = vi.fn().mockReturnValue({ select });
      const eqFirst = vi.fn().mockReturnValue({ eq: eqSecond });
      const update = vi.fn().mockReturnValue({ eq: eqFirst });
      vi.mocked(supabase.from).mockReturnValueOnce({ update } as any);

      const result = await updateFlashcardForUser({
        supabase,
        id: 1,
        userId: "user-123",
        updates: { front: "Updated front" },
        existing: baseFlashcard,
      });

      expect(result.source).toBe("ai-edited");
      expect(update).toHaveBeenCalledWith({ front: "Updated front", source: "ai-edited" });
    });

    it("keeps ai-full when content unchanged", async () => {
      const updatedCard = { ...baseFlashcard, source: "ai-full" };
      const single = vi.fn().mockResolvedValue({ data: updatedCard, error: null });
      const select = vi.fn().mockReturnValue({ single });
      const eqSecond = vi.fn().mockReturnValue({ select });
      const eqFirst = vi.fn().mockReturnValue({ eq: eqSecond });
      const update = vi.fn().mockReturnValue({ eq: eqFirst });
      vi.mocked(supabase.from).mockReturnValueOnce({ update } as any);

      const result = await updateFlashcardForUser({
        supabase,
        id: 1,
        userId: "user-123",
        updates: { front: baseFlashcard.front },
        existing: baseFlashcard,
      });

      expect(result.source).toBe("ai-full");
      expect(update).toHaveBeenCalledWith({ front: baseFlashcard.front, source: "ai-full" });
    });

    it("throws FlashcardUpdateError on update failure", async () => {
      const single = vi.fn().mockResolvedValue({ data: null, error: { message: "fail" } });
      const select = vi.fn().mockReturnValue({ single });
      const eqSecond = vi.fn().mockReturnValue({ select });
      const eqFirst = vi.fn().mockReturnValue({ eq: eqSecond });
      const update = vi.fn().mockReturnValue({ eq: eqFirst });
      vi.mocked(supabase.from).mockReturnValueOnce({ update } as any);

      await expect(
        updateFlashcardForUser({
          supabase,
          id: 1,
          userId: "user-123",
          updates: { front: "New" },
          existing: baseFlashcard,
        })
      ).rejects.toThrow(FlashcardUpdateError);
    });
  });
});

