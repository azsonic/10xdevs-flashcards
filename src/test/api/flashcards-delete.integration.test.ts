import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { DELETE } from "@/pages/api/flashcards/[id]";
import type { APIContext } from "astro";
import type { SupabaseClient } from "@/db/supabase.client";

/**
 * Integration tests for DELETE /api/flashcards/:id endpoint
 * Tests flashcard deletion including authentication, validation, authorization, and error handling.
 */

describe("DELETE /api/flashcards/:id - Integration Tests", () => {
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
    // Mock Supabase client with auth
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "user-123", email: "test@example.com" } },
          error: null,
        }),
      },
    } as unknown as SupabaseClient;
    consoleErrorSpy.mockClear();

    // Mock API context
    mockContext = {
      params: { id: "123" },
      locals: {
        supabase: mockSupabase,
      },
    };
  });

  describe("Validation", () => {
    it("should return 400 when id is not a number", async () => {
      mockContext.params = { id: "abc" };

      const response = await DELETE(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("INVALID_ID");
      expect(body.error.message).toBe("Invalid flashcard ID format. ID must be a positive integer.");
      expect(body.error.details).toBeDefined();
    });

    it("should return 400 when id is negative", async () => {
      mockContext.params = { id: "-1" };

      const response = await DELETE(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("INVALID_ID");
    });

    it("should return 400 when id is zero", async () => {
      mockContext.params = { id: "0" };

      const response = await DELETE(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("INVALID_ID");
    });

    it("should return 400 when id is missing", async () => {
      mockContext.params = { id: undefined };

      const response = await DELETE(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("INVALID_ID");
    });

    it("should accept decimal strings that parse to valid integers", async () => {
      mockContext.params = { id: "3.0" };

      // Mock successful deletion for this valid ID
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              error: null,
              count: 1,
            }),
          }),
        }),
      } as any);

      const response = await DELETE(mockContext as APIContext);

      // parseInt("3.0") becomes 3, which is valid
      expect(response.status).toBe(204);
    });
  });

  describe("Authentication", () => {
    it("should return 401 when user is not authenticated", async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: null,
      } as any);

      const response = await DELETE(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body).toEqual({
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required. Please log in to continue.",
        },
      });
    });

    it("should return 401 when auth error occurs", async () => {
      vi.mocked(mockSupabase.auth.getUser).mockResolvedValueOnce({
        data: { user: null },
        error: { message: "Auth error" },
      } as any);

      const response = await DELETE(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Successful Deletion", () => {
    it("should return 204 No Content when flashcard is deleted successfully", async () => {
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              error: null,
              count: 1,
            }),
          }),
        }),
      } as any);

      const response = await DELETE(mockContext as APIContext);

      expect(response.status).toBe(204);
      expect(response.body).toBeNull();
    });

    it("should use both id and user_id in delete query", async () => {
      const eqMock = vi.fn().mockResolvedValueOnce({
        error: null,
        count: 1,
      });

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: eqMock,
          }),
        }),
      } as any);

      await DELETE(mockContext as APIContext);

      // Verify user_id is used in the query (IDOR protection)
      expect(eqMock).toHaveBeenCalledWith("user_id", "user-123");
    });
  });

  describe("Authorization & Not Found", () => {
    it("should return 404 when flashcard does not exist", async () => {
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              error: null,
              count: 0, // No rows affected
            }),
          }),
        }),
      } as any);

      const response = await DELETE(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe("FLASHCARD_NOT_FOUND");
      expect(body.error.message).toBe("Flashcard not found or you do not have permission to delete it.");
    });

    it("should return 404 when flashcard belongs to different user", async () => {
      // This scenario is indistinguishable from not found (count = 0)
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              error: null,
              count: 0, // No rows affected due to user_id mismatch
            }),
          }),
        }),
      } as any);

      const response = await DELETE(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(404);
      expect(body.error.code).toBe("FLASHCARD_NOT_FOUND");
    });
  });

  describe("Error Handling", () => {
    it("should return 500 when database error occurs", async () => {
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              error: { message: "Database connection failed", code: "DB_ERROR" },
              count: null,
            }),
          }),
        }),
      } as any);

      const response = await DELETE(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_ERROR");
      expect(body.error.message).toBe("An unexpected error occurred while processing your request.");
    });

    it("should return 500 on unexpected error", async () => {
      vi.mocked(mockSupabase.from).mockImplementation(() => {
        throw new Error("Unexpected crash");
      });

      const response = await DELETE(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_ERROR");
    });

    it("should log error details for debugging", async () => {
      const dbError = { message: "Connection timeout", code: "TIMEOUT" };
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              error: dbError,
              count: null,
            }),
          }),
        }),
      } as any);

      await DELETE(mockContext as APIContext);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[deleteFlashcardForUser] Delete error",
        expect.objectContaining({
          error: dbError,
          id: 123,
          userId: "user-123",
        })
      );
    });
  });

  describe("Idempotency", () => {
    it("should return 404 on second delete attempt (idempotent behavior)", async () => {
      // First deletion succeeds
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              error: null,
              count: 1,
            }),
          }),
        }),
      } as any);

      const firstResponse = await DELETE(mockContext as APIContext);
      expect(firstResponse.status).toBe(204);

      // Second deletion returns not found
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        delete: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockResolvedValueOnce({
              error: null,
              count: 0,
            }),
          }),
        }),
      } as any);

      const secondResponse = await DELETE(mockContext as APIContext);
      const body = await secondResponse.json();

      expect(secondResponse.status).toBe(404);
      expect(body.error.code).toBe("FLASHCARD_NOT_FOUND");
    });
  });
});
