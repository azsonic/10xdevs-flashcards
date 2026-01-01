import { vi } from "vitest";

/**
 * Common mock factories for unit tests
 */

/**
 * Mock Supabase client
 */
export const createMockSupabaseClient = () => ({
  auth: {
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    getSession: vi.fn(),
    getUser: vi.fn(),
    onAuthStateChange: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
  })),
});

/**
 * Mock fetch response
 */
export const createMockFetchResponse = (
  data: unknown,
  ok = true
): {
  ok: boolean;
  json: () => Promise<unknown>;
  text: () => Promise<string>;
  status: number;
  statusText: string;
} => ({
  ok,
  json: async () => data,
  text: async () => JSON.stringify(data),
  status: ok ? 200 : 400,
  statusText: ok ? "OK" : "Bad Request",
});

/**
 * Mock API response
 */
export const createMockApiResponse = <T>(data: T, success = true) => ({
  data: success ? data : null,
  error: success ? null : { message: "Error occurred" },
});
