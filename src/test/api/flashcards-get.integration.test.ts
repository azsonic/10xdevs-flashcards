import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/pages/api/flashcards/index";
import type { APIContext } from "astro";
import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardDto } from "@/types";

/**
 * Integration tests for GET /api/flashcards endpoint
 * Tests the full endpoint logic including authentication, validation, and service integration
 */

const mockFlashcards: FlashcardDto[] = [
  {
    id: 1,
    user_id: "user-123",
    generation_id: null,
    front: "What is React?",
    back: "A JavaScript library for building user interfaces",
    source: "manual",
    created_at: "2025-01-03T10:00:00Z",
    updated_at: "2025-01-03T10:00:00Z",
  },
  {
    id: 2,
    user_id: "user-123",
    generation_id: 1,
    front: "What is TypeScript?",
    back: "A typed superset of JavaScript",
    source: "ai-full",
    created_at: "2025-01-03T09:00:00Z",
    updated_at: "2025-01-03T09:00:00Z",
  },
];

describe("GET /api/flashcards - Integration Tests", () => {
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
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    } as unknown as SupabaseClient;
    consoleErrorSpy.mockClear();

    // Mock API context
    mockContext = {
      url: new URL("http://localhost:4321/api/flashcards"),
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

    it("should return 401 when user is undefined", async () => {
      const contextWithoutUser = {
        ...mockContext,
        locals: {
          supabase: mockSupabase,
          user: undefined,
        },
      };

      const response = await GET(contextWithoutUser as APIContext);
      const body = await response.json();

      expect(response.status).toBe(401);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("Query Parameter Validation", () => {
    it("should reject page less than 1", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards?page=0");

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
      expect(body.error.message).toBe("Invalid query parameters");
    });

    it("should reject limit less than 1", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards?limit=0");

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject limit greater than 100", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards?limit=101");

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject non-numeric page parameter", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards?page=abc");

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject non-numeric limit parameter", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards?limit=xyz");

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(400);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should accept valid page and limit parameters", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards?page=1&limit=20");

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce({
                data: mockFlashcards,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            count: 2,
            error: null,
          }),
        }),
      } as any);

      const response = await GET(mockContext as APIContext);

      expect(response.status).toBe(200);
    });
  });

  describe("Successful Responses", () => {
    it("should return paginated flashcards with default parameters", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards");

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce({
                data: mockFlashcards,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            count: 2,
            error: null,
          }),
        }),
      } as any);

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body).toEqual({
        data: mockFlashcards,
        pagination: {
          page: 1,
          limit: 20,
          total_items: 2,
          total_pages: 1,
        },
      });
    });

    it("should return empty array when no flashcards exist", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards");

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce({
                data: [],
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            count: 0,
            error: null,
          }),
        }),
      } as any);

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toEqual([]);
      expect(body.pagination.total_items).toBe(0);
      expect(body.pagination.total_pages).toBe(0);
    });

    it("should return filtered flashcards when search parameter is provided", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards?search=React");

      const searchResults = [mockFlashcards[0]];

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              or: vi.fn().mockReturnValueOnce({
                range: vi.fn().mockResolvedValueOnce({
                  data: searchResults,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            or: vi.fn().mockResolvedValueOnce({
              count: 1,
              error: null,
            }),
          }),
        }),
      } as any);

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.data).toHaveLength(1);
      expect(body.pagination.total_items).toBe(1);
    });

    it("should handle custom page and limit parameters", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards?page=2&limit=10");

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce({
                data: mockFlashcards,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            count: 25,
            error: null,
          }),
        }),
      } as any);

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(200);
      expect(body.pagination).toEqual({
        page: 2,
        limit: 10,
        total_items: 25,
        total_pages: 3,
      });
    });
  });

  describe("Error Handling", () => {
    it("should return 500 when database query fails", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards");

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: null,
                error: { message: "Database error", code: "DB_ERROR" },
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

    it("should return 500 when count query fails", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards");

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce({
                data: mockFlashcards,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            count: null,
            error: { message: "Count query failed", code: "DB_ERROR" },
          }),
        }),
      } as any);

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("DATABASE_ERROR");
    });

    it("should handle unexpected errors gracefully", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards");

      // Simulate an unexpected error
      vi.mocked(mockSupabase.from).mockImplementation(() => {
        throw new Error("Unexpected error");
      });

      const response = await GET(mockContext as APIContext);
      const body = await response.json();

      expect(response.status).toBe(500);
      expect(body.error.code).toBe("INTERNAL_ERROR");
      expect(body.error.message).toBe("An unexpected error occurred");
    });
  });

  describe("Response Headers", () => {
    it("should set correct Content-Type header", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards");

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce({
                data: mockFlashcards,
                error: null,
              }),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            count: 2,
            error: null,
          }),
        }),
      } as any);

      const response = await GET(mockContext as APIContext);

      expect(response.headers.get("Content-Type")).toBe("application/json");
    });
  });

  describe("Data Isolation", () => {
    it("should filter flashcards by authenticated user_id", async () => {
      mockContext.url = new URL("http://localhost:4321/api/flashcards");

      const eqMock = vi.fn().mockReturnValueOnce({
        order: vi.fn().mockReturnValueOnce({
          range: vi.fn().mockResolvedValueOnce({
            data: mockFlashcards,
            error: null,
          }),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: eqMock,
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            count: 2,
            error: null,
          }),
        }),
      } as any);

      await GET(mockContext as APIContext);

      // Verify that eq was called with the correct user_id
      expect(eqMock).toHaveBeenCalledWith("user_id", "user-123");
    });
  });
});

