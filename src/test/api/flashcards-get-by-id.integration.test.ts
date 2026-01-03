import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/pages/api/flashcards/[id]";
import type { APIContext } from "astro";
import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardDto } from "@/types";

/**
 * Integration tests for GET /api/flashcards/:id endpoint
 * Tests the retrieval of a single flashcard including authentication, validation, and authorization.
 */

const mockFlashcard: FlashcardDto = {
  id: 123,
  user_id: "user-123",
  generation_id: null,
  front: "What is React?",
  back: "A JavaScript library for building user interfaces",
  source: "manual",
  created_at: "2025-01-03T10:00:00Z",
  updated_at: "2025-01-03T10:00:00Z",
};

describe("GET /api/flashcards/:id - Integration Tests", () => {
  let mockSupabase: SupabaseClient;
  let mockContext: Partial<APIContext>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    // Mock Supabase client
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
    } as unknown as SupabaseClient;
    consoleErrorSpy.mockClear();

    // Mock API context
    mockContext = {
      params: { id: "123" },
      locals: {
        supabase: mockSupabase,
        user: {
          id: "user-123",
          email: "test@example.com",
        },
      },
    };
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      const contextWithoutUser = {
        ...mockContext,
        locals: {
          supabase: mockSupabase,
          user: null,
        },
      };

      const response = await GET(contextWithoutUser as APIContext);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required",
        },
      });
    });
  });

  describe("Validation", () => {
    it("should return 400 when id is not a number", async () => {
      mockContext.params = { id: "abc" };

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe("Invalid flashcard id.");
    });

    it("should return 400 when id is negative", async () => {
      mockContext.params = { id: "-1" };

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should return 400 when id is missing", async () => {
      mockContext.params = { id: undefined };

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("Authorization & Retrieval", () => {
    it("should return 404 when flashcard does not exist", async () => {
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              maybeSingle: vi.fn().mockResolvedValueOnce({
                data: null,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe("NOT_FOUND");
    });

    it("should return 200 and flashcard data when found", async () => {
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              maybeSingle: vi.fn().mockResolvedValueOnce({
                data: mockFlashcard,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        data: mockFlashcard,
      });
    });

    it("should ensure user_id is used in query", async () => {
      const eqMock = vi.fn().mockReturnValueOnce({
        maybeSingle: vi.fn().mockResolvedValueOnce({
          data: mockFlashcard,
          error: null,
        }),
      });

      // Chain: select -> eq(id) -> eq(user_id) -> maybeSingle
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: eqMock,
          }),
        }),
      } as any);

      await GET(mockContext as APIContext);

      expect(eqMock).toHaveBeenCalledWith("user_id", "user-123");
    });
  });

  describe("Error Handling", () => {
    it("should return 500 when database error occurs", async () => {
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              maybeSingle: vi.fn().mockResolvedValueOnce({
                data: null,
                error: { message: "DB Error", code: "PG_ERROR" },
              }),
            }),
          }),
        }),
      } as any);

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("DATABASE_ERROR");
    });

    it("should return 500 on unexpected error", async () => {
      vi.mocked(mockSupabase.from).mockImplementation(() => {
        throw new Error("Unexpected crash");
      });

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });
  });
});
