import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { APIContext } from "astro";
import { PATCH } from "@/pages/api/flashcards/[id]";
import type { SupabaseClient } from "@/db/supabase.client";
import type { FlashcardDto } from "@/types";

const existingCard: FlashcardDto = {
  id: 1,
  user_id: "user-123",
  generation_id: 10,
  front: "Front",
  back: "Back",
  source: "ai-full",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

describe("PATCH /api/flashcards/:id - Integration", () => {
  let supabase: SupabaseClient;
  let context: Partial<APIContext>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeAll(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
  });

  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    supabase = { from: vi.fn() } as unknown as SupabaseClient;
    consoleErrorSpy.mockClear();
    context = {
      params: { id: "1" },
      locals: {
        supabase,
        user: { id: "user-123", email: "user@example.com" },
      },
      request: new Request("http://localhost/api/flashcards/1", {
        method: "PATCH",
        body: JSON.stringify({ front: "Updated front" }),
      }),
    };
  });

  it("rejects unauthenticated requests", async () => {
    context.locals = { supabase, user: null };

    const response = await PATCH(context as APIContext);
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("rejects invalid id", async () => {
    context.params = { id: "abc" };

    const response = await PATCH(context as APIContext);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("rejects invalid payload", async () => {
    context.request = new Request("http://localhost/api/flashcards/1", {
      method: "PATCH",
      body: JSON.stringify({}),
    });

    const response = await PATCH(context as APIContext);
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 404 when flashcard not found for user", async () => {
    interface MockQueryResult {
      data: null;
      error: null;
    }
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null } satisfies MockQueryResult);
    const selectFirst = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle }),
      }),
    });
    vi.mocked(supabase.from).mockReturnValueOnce({ select: selectFirst } as ReturnType<SupabaseClient["from"]>);

    const response = await PATCH(context as APIContext);
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body.error.code).toBe("NOT_FOUND");
  });

  it("updates flashcard and returns 200", async () => {
    interface MockQueryResult {
      data: FlashcardDto;
      error: null;
    }
    const maybeSingle = vi.fn().mockResolvedValue({ data: existingCard, error: null } satisfies MockQueryResult);
    const selectFirst = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle }),
      }),
    });

    const updatedCard = { ...existingCard, front: "Updated front", source: "ai-edited" };
    const single = vi.fn().mockResolvedValue({ data: updatedCard, error: null } satisfies MockQueryResult);
    const selectSecond = vi.fn().mockReturnValue({ single });
    const eqSecondB = vi.fn().mockReturnValue({ select: selectSecond });
    const eqSecondA = vi.fn().mockReturnValue({ eq: eqSecondB });
    const update = vi.fn().mockReturnValue({ eq: eqSecondA });

    vi.mocked(supabase.from)
      .mockReturnValueOnce({ select: selectFirst } as ReturnType<SupabaseClient["from"]>)
      .mockReturnValueOnce({ update } as ReturnType<SupabaseClient["from"]>);

    const response = await PATCH(context as APIContext);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data.front).toBe("Updated front");
    expect(body.data.source).toBe("ai-edited");
    expect(update).toHaveBeenCalledWith({ front: "Updated front", source: "ai-edited" });
  });

  it("returns 500 on update error", async () => {
    interface MockQueryResult {
      data: FlashcardDto;
      error: null;
    }
    interface MockQueryError {
      data: null;
      error: { message: string };
    }
    const maybeSingle = vi.fn().mockResolvedValue({ data: existingCard, error: null } satisfies MockQueryResult);
    const selectFirst = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({ maybeSingle }),
      }),
    });

    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "db error" } } satisfies MockQueryError);
    const selectSecond = vi.fn().mockReturnValue({ single });
    const eqSecondB = vi.fn().mockReturnValue({ select: selectSecond });
    const eqSecondA = vi.fn().mockReturnValue({ eq: eqSecondB });
    const update = vi.fn().mockReturnValue({ eq: eqSecondA });

    vi.mocked(supabase.from)
      .mockReturnValueOnce({ select: selectFirst } as ReturnType<SupabaseClient["from"]>)
      .mockReturnValueOnce({ update } as ReturnType<SupabaseClient["from"]>);

    const response = await PATCH(context as APIContext);
    const body = await response.json();

    expect(response.status).toBe(500);
    expect(body.error.code).toBe("DATABASE_ERROR");
  });
});
