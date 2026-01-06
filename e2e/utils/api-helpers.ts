/**
 * API Test Helpers
 * Direct API access for faster test setup and verification
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

/**
 * Test API Client for direct database operations
 * Use for test setup and verification to speed up tests
 */
export class TestApiClient {
  private supabase: SupabaseClient<Database>;
  private userId: string | null = null;

  constructor() {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("SUPABASE_URL and SUPABASE_KEY must be set in .env.test");
    }

    this.supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Sign in as a test user
   */
  async signIn(email: string, password: string): Promise<void> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(`Failed to sign in: ${error.message}`);
    }

    this.userId = data.user?.id || null;

    if (!this.userId) {
      throw new Error("User ID not found after sign in");
    }
  }

  /**
   * Create a flashcard via API
   */
  async createFlashcard(front: string, back: string): Promise<Database["public"]["Tables"]["flashcards"]["Row"]> {
    if (!this.userId) {
      throw new Error("Must sign in before creating flashcards");
    }

    const { data, error } = await this.supabase
      .from("flashcards")
      .insert({
        front,
        back,
        source: "manual",
        user_id: this.userId,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create flashcard: ${error.message}`);
    }

    return data;
  }

  /**
   * Create multiple flashcards via API
   */
  async createFlashcards(
    flashcards: { front: string; back: string }[]
  ): Promise<Database["public"]["Tables"]["flashcards"]["Row"][]> {
    if (!this.userId) {
      throw new Error("Must sign in before creating flashcards");
    }

    const { data, error } = await this.supabase
      .from("flashcards")
      .insert(
        flashcards.map((fc) => ({
          front: fc.front,
          back: fc.back,
          source: "manual",
          user_id: this.userId as string,
        }))
      )
      .select();

    if (error) {
      throw new Error(`Failed to create flashcards: ${error.message}`);
    }

    return data;
  }

  /**
   * Get all flashcards for current user
   */
  async getFlashcards(): Promise<Database["public"]["Tables"]["flashcards"]["Row"][]> {
    if (!this.userId) {
      throw new Error("Must sign in before getting flashcards");
    }

    const { data, error } = await this.supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", this.userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch flashcards: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a specific flashcard by ID
   */
  async getFlashcard(id: string): Promise<Database["public"]["Tables"]["flashcards"]["Row"] | null> {
    const { data, error } = await this.supabase.from("flashcards").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to fetch flashcard: ${error.message}`);
    }

    return data;
  }

  /**
   * Delete a specific flashcard
   */
  async deleteFlashcard(id: string): Promise<void> {
    const { error } = await this.supabase.from("flashcards").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete flashcard: ${error.message}`);
    }
  }

  /**
   * Delete all flashcards for current user
   */
  async deleteAllFlashcards(): Promise<void> {
    if (!this.userId) {
      throw new Error("Must sign in before deleting flashcards");
    }

    const { error } = await this.supabase.from("flashcards").delete().eq("user_id", this.userId);

    if (error) {
      throw new Error(`Failed to delete flashcards: ${error.message}`);
    }
  }

  /**
   * Count flashcards for current user
   */
  async countFlashcards(): Promise<number> {
    if (!this.userId) {
      throw new Error("Must sign in before counting flashcards");
    }

    const { count, error } = await this.supabase
      .from("flashcards")
      .select("*", { count: "exact", head: true })
      .eq("user_id", this.userId);

    if (error) {
      throw new Error(`Failed to count flashcards: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Get current user
   */
  async getUser() {
    const {
      data: { user },
      error,
    } = await this.supabase.auth.getUser();

    if (error) {
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return user;
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
    this.userId = null;
  }
}
