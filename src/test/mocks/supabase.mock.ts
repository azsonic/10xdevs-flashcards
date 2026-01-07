import { vi } from "vitest";
import type { SupabaseClient } from "@/db/supabase.client";

/**
 * Builder for creating mock Supabase clients
 * Provides fluent API for configuring mock behavior
 *
 * @example
 * // Successful authentication
 * const supabase = createMockSupabase()
 *   .withSuccessfulSignIn()
 *   .build();
 *
 * @example
 * // Failed authentication
 * const supabase = createMockSupabase()
 *   .withFailedSignIn('Invalid credentials')
 *   .build();
 */
export class MockSupabaseBuilder {
  private client: Partial<SupabaseClient>;

  constructor() {
    this.client = this.createBasicMock();
  }

  /**
   * Creates the basic mock structure
   */
  private createBasicMock() {
    return {
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
        or: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockReturnThis(),
        single: vi.fn(),
      })),
    };
  }

  /**
   * Configure successful sign-in
   */
  withSuccessfulSignIn(user = { id: "test-123", email: "test@example.com" }) {
    if (this.client.auth) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.client.auth.signInWithPassword as any).mockResolvedValue({
        data: {
          user,
          session: {
            access_token: "mock-token",
            refresh_token: "mock-refresh-token",
          },
        },
        error: null,
      });
    }
    return this;
  }

  /**
   * Configure failed sign-in
   */
  withFailedSignIn(message = "Invalid login credentials") {
    if (this.client.auth) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.client.auth.signInWithPassword as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message, status: 400 },
      });
    }
    return this;
  }

  /**
   * Configure successful sign-up
   */
  withSuccessfulSignUp(user = { id: "test-123", email: "test@example.com" }) {
    if (this.client.auth) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.client.auth.signUp as any).mockResolvedValue({
        data: { user, session: null },
        error: null,
      });
    }
    return this;
  }

  /**
   * Configure failed sign-up
   */
  withFailedSignUp(message = "User already exists") {
    if (this.client.auth) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.client.auth.signUp as any).mockResolvedValue({
        data: { user: null, session: null },
        error: { message, status: 400 },
      });
    }
    return this;
  }

  /**
   * Configure successful sign-out
   */
  withSuccessfulSignOut() {
    if (this.client.auth) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.client.auth.signOut as any).mockResolvedValue({
        error: null,
      });
    }
    return this;
  }

  /**
   * Configure authenticated session
   */
  withAuthenticatedSession(user = { id: "test-123", email: "test@example.com" }) {
    if (this.client.auth) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.client.auth.getSession as any).mockResolvedValue({
        data: {
          session: {
            user,
            access_token: "mock-token",
            refresh_token: "mock-refresh-token",
          },
        },
        error: null,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.client.auth.getUser as any).mockResolvedValue({
        data: { user },
        error: null,
      });
    }

    return this;
  }

  /**
   * Configure no authenticated session
   */
  withNoSession() {
    if (this.client.auth) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.client.auth.getSession as any).mockResolvedValue({
        data: { session: null },
        error: null,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.client.auth.getUser as any).mockResolvedValue({
        data: { user: null },
        error: null,
      });
    }

    return this;
  }

  /**
   * Build and return the mocked Supabase client
   */
  build(): SupabaseClient {
    return this.client as SupabaseClient;
  }
}

/**
 * Factory function for creating a mock Supabase client builder
 */
export function createMockSupabase() {
  return new MockSupabaseBuilder();
}

/**
 * Create a basic mock Supabase client with no configuration
 * Use the builder pattern for more control
 */
export function createBasicMockSupabase(): SupabaseClient {
  return new MockSupabaseBuilder().build();
}
