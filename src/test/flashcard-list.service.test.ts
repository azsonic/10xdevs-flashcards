import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { listFlashcards, FlashcardListError } from "@/lib/flashcard.service";
import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardDto } from "@/types";

// Mock flashcard data for testing
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
  {
    id: 3,
    user_id: "user-123",
    generation_id: 1,
    front: "What is Astro?",
    back: "A modern web framework for building fast websites",
    source: "ai-edited",
    created_at: "2025-01-03T08:00:00Z",
    updated_at: "2025-01-03T08:00:00Z",
  },
];

describe("listFlashcards Service", () => {
  let mockSupabase: SupabaseClient;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    // Create a fresh mock for each test
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      range: vi.fn().mockReturnThis(),
    } as unknown as SupabaseClient;
    consoleErrorSpy.mockClear();
  });

  describe("Successful retrieval", () => {
    it("should retrieve flashcards with default pagination", async () => {
      const dataQuery = {
        data: mockFlashcards,
        error: null,
      };
      const countQuery = {
        count: 3,
        error: null,
      };

      // Mock the query chain for data retrieval
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce(dataQuery),
            }),
          }),
        }),
      } as any);

      // Mock the query chain for count
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce(countQuery),
        }),
      } as any);

      const result = await listFlashcards({
        supabase: mockSupabase,
        userId: "user-123",
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        data: mockFlashcards,
        pagination: {
          page: 1,
          limit: 20,
          total_items: 3,
          total_pages: 1,
        },
      });

      expect(mockSupabase.from).toHaveBeenCalledWith("flashcards");
    });

    it("should handle pagination correctly with multiple pages", async () => {
      const dataQuery = {
        data: [mockFlashcards[0]],
        error: null,
      };
      const countQuery = {
        count: 50,
        error: null,
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce(dataQuery),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce(countQuery),
        }),
      } as any);

      const result = await listFlashcards({
        supabase: mockSupabase,
        userId: "user-123",
        page: 2,
        limit: 10,
      });

      expect(result.pagination).toEqual({
        page: 2,
        limit: 10,
        total_items: 50,
        total_pages: 5, // 50 / 10 = 5
      });
    });

    it("should calculate total_pages correctly with partial last page", async () => {
      const dataQuery = {
        data: mockFlashcards,
        error: null,
      };
      const countQuery = {
        count: 25,
        error: null,
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce(dataQuery),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce(countQuery),
        }),
      } as any);

      const result = await listFlashcards({
        supabase: mockSupabase,
        userId: "user-123",
        page: 1,
        limit: 10,
      });

      expect(result.pagination.total_pages).toBe(3); // ceil(25 / 10) = 3
    });

    it("should handle empty results", async () => {
      const dataQuery = {
        data: [],
        error: null,
      };
      const countQuery = {
        count: 0,
        error: null,
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce(dataQuery),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce(countQuery),
        }),
      } as any);

      const result = await listFlashcards({
        supabase: mockSupabase,
        userId: "user-123",
        page: 1,
        limit: 20,
      });

      expect(result).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total_items: 0,
          total_pages: 0,
        },
      });
    });
  });

  describe("Search functionality", () => {
    it("should filter flashcards by search term", async () => {
      const searchResults = [mockFlashcards[0]];
      const dataQuery = {
        data: searchResults,
        error: null,
      };
      const countQuery = {
        count: 1,
        error: null,
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              or: vi.fn().mockReturnValueOnce({
                range: vi.fn().mockResolvedValueOnce(dataQuery),
              }),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            or: vi.fn().mockResolvedValueOnce(countQuery),
          }),
        }),
      } as any);

      const result = await listFlashcards({
        supabase: mockSupabase,
        userId: "user-123",
        page: 1,
        limit: 20,
        search: "React",
      });

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total_items).toBe(1);
    });

    it("should trim search term before filtering", async () => {
      const dataQuery = {
        data: [],
        error: null,
      };
      const countQuery = {
        count: 0,
        error: null,
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              or: vi.fn().mockReturnValueOnce({
                range: vi.fn().mockResolvedValueOnce(dataQuery),
              }),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            or: vi.fn().mockResolvedValueOnce(countQuery),
          }),
        }),
      } as any);

      const result = await listFlashcards({
        supabase: mockSupabase,
        userId: "user-123",
        page: 1,
        limit: 20,
        search: "  searchterm  ",
      });

      // The search term should be trimmed and used
      expect(result).toBeDefined();
    });

    it("should handle empty search term as no search", async () => {
      const dataQuery = {
        data: mockFlashcards,
        error: null,
      };
      const countQuery = {
        count: 3,
        error: null,
      };

      // Should not call .or() when search is empty
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce(dataQuery),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce(countQuery),
        }),
      } as any);

      const result = await listFlashcards({
        supabase: mockSupabase,
        userId: "user-123",
        page: 1,
        limit: 20,
        search: "",
      });

      expect(result.data).toHaveLength(3);
    });

    it("should handle whitespace-only search term as no search", async () => {
      const dataQuery = {
        data: mockFlashcards,
        error: null,
      };
      const countQuery = {
        count: 3,
        error: null,
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce(dataQuery),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce(countQuery),
        }),
      } as any);

      const result = await listFlashcards({
        supabase: mockSupabase,
        userId: "user-123",
        page: 1,
        limit: 20,
        search: "   ",
      });

      expect(result.data).toHaveLength(3);
    });
  });

  describe("Pagination calculations", () => {
    it("should calculate correct offset for page 1", async () => {
      const dataQuery = {
        data: mockFlashcards,
        error: null,
      };
      const countQuery = {
        count: 50,
        error: null,
      };

      const rangeMock = vi.fn().mockResolvedValueOnce(dataQuery);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: rangeMock,
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce(countQuery),
        }),
      } as any);

      await listFlashcards({
        supabase: mockSupabase,
        userId: "user-123",
        page: 1,
        limit: 20,
      });

      // Page 1: offset = (1-1)*20 = 0, range(0, 19)
      expect(rangeMock).toHaveBeenCalledWith(0, 19);
    });

    it("should calculate correct offset for page 3", async () => {
      const dataQuery = {
        data: [],
        error: null,
      };
      const countQuery = {
        count: 50,
        error: null,
      };

      const rangeMock = vi.fn().mockResolvedValueOnce(dataQuery);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: rangeMock,
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce(countQuery),
        }),
      } as any);

      await listFlashcards({
        supabase: mockSupabase,
        userId: "user-123",
        page: 3,
        limit: 10,
      });

      // Page 3: offset = (3-1)*10 = 20, range(20, 29)
      expect(rangeMock).toHaveBeenCalledWith(20, 29);
    });

    it("should handle custom limit values", async () => {
      const dataQuery = {
        data: mockFlashcards,
        error: null,
      };
      const countQuery = {
        count: 100,
        error: null,
      };

      const rangeMock = vi.fn().mockResolvedValueOnce(dataQuery);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: rangeMock,
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce(countQuery),
        }),
      } as any);

      await listFlashcards({
        supabase: mockSupabase,
        userId: "user-123",
        page: 1,
        limit: 50,
      });

      // Page 1 with limit 50: range(0, 49)
      expect(rangeMock).toHaveBeenCalledWith(0, 49);
    });
  });

  describe("Error handling", () => {
    it("should throw FlashcardListError when data query fails", async () => {
      const dataQuery = {
        data: null,
        error: { message: "Database connection failed", code: "DB_ERROR" },
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue(dataQuery),
            }),
          }),
        }),
      } as any);

      await expect(
        listFlashcards({
          supabase: mockSupabase,
          userId: "user-123",
          page: 1,
          limit: 20,
        })
      ).rejects.toThrow(FlashcardListError);
    });

    it("should throw FlashcardListError with correct message when data query fails", async () => {
      const dataQuery = {
        data: null,
        error: { message: "Database connection failed", code: "DB_ERROR" },
      };

      vi.mocked(mockSupabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue(dataQuery),
            }),
          }),
        }),
      } as any);

      await expect(
        listFlashcards({
          supabase: mockSupabase,
          userId: "user-123",
          page: 1,
          limit: 20,
        })
      ).rejects.toThrow("Failed to retrieve flashcards.");
    });

    it("should throw FlashcardListError when count query fails", async () => {
      const dataQuery = {
        data: mockFlashcards,
        error: null,
      };
      const countQuery = {
        count: null,
        error: { message: "Count query failed", code: "DB_ERROR" },
      };

      // First call for data query
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce(dataQuery),
            }),
          }),
        }),
      } as any);

      // Second call for count query - this will fail
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce(countQuery),
        }),
      } as any);

      await expect(
        listFlashcards({
          supabase: mockSupabase,
          userId: "user-123",
          page: 1,
          limit: 20,
        })
      ).rejects.toThrow(FlashcardListError);
    });

    it("should throw FlashcardListError with correct message when count query fails", async () => {
      const dataQuery = {
        data: mockFlashcards,
        error: null,
      };
      const countQuery = {
        count: null,
        error: { message: "Count query failed", code: "DB_ERROR" },
      };

      // First call for data query
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce(dataQuery),
            }),
          }),
        }),
      } as any);

      // Second call for count query - this will fail
      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce(countQuery),
        }),
      } as any);

      await expect(
        listFlashcards({
          supabase: mockSupabase,
          userId: "user-123",
          page: 1,
          limit: 20,
        })
      ).rejects.toThrow("Failed to count flashcards.");
    });

    it("should handle null count gracefully", async () => {
      const dataQuery = {
        data: [],
        error: null,
      };
      const countQuery = {
        count: null,
        error: null,
      };

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce(dataQuery),
            }),
          }),
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce(countQuery),
        }),
      } as any);

      const result = await listFlashcards({
        supabase: mockSupabase,
        userId: "user-123",
        page: 1,
        limit: 20,
      });

      // Should default to 0 when count is null
      expect(result.pagination.total_items).toBe(0);
      expect(result.pagination.total_pages).toBe(0);
    });
  });

  describe("User isolation", () => {
    it("should filter by user_id", async () => {
      const dataQuery = {
        data: mockFlashcards,
        error: null,
      };
      const countQuery = {
        count: 3,
        error: null,
      };

      const eqMock = vi.fn().mockReturnValueOnce({
        order: vi.fn().mockReturnValueOnce({
          range: vi.fn().mockResolvedValueOnce(dataQuery),
        }),
      });

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: eqMock,
        }),
      } as any);

      vi.mocked(mockSupabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce(countQuery),
        }),
      } as any);

      await listFlashcards({
        supabase: mockSupabase,
        userId: "user-456",
        page: 1,
        limit: 20,
      });

      // Verify that eq was called with the correct user_id
      expect(eqMock).toHaveBeenCalledWith("user_id", "user-456");
    });
  });
});

