/* eslint-disable no-console */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";

/**
 * Global teardown for E2E tests
 * Cleans up test data from Supabase after all tests complete
 *
 * Uses regular authentication (not Service Role Key) to avoid RLS issues.
 * Signs in as the E2E test user to clean up their data.
 *
 * Test Strategy:
 * - Authentication tests: Create random users (no cleanup needed)
 * - Other tests (library, etc.): Use fixed E2E user (cleaned up here)
 */
async function globalTeardown() {
  console.log("\n🧹 Starting E2E test cleanup...");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;
  const e2eUsername = process.env.E2E_USERNAME;
  const e2ePassword = process.env.E2E_PASSWORD;

  if (!supabaseUrl || !supabaseKey) {
    console.error("❌ Missing required environment variables:");
    console.error("   - SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
    console.error("   - SUPABASE_KEY:", supabaseKey ? "✓" : "✗");
    console.error("⚠️  Skipping cleanup - environment not configured");
    return;
  }

  if (!e2eUsername || !e2ePassword) {
    console.log("⚠️  E2E_USERNAME or E2E_PASSWORD not set - skipping cleanup");
    console.log("   Library and other non-auth tests will accumulate data without cleanup");
    console.log("   Set E2E_USERNAME and E2E_PASSWORD in .env.test to enable cleanup");
    return;
  }

  try {
    // Create regular Supabase client
    const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Sign in as the E2E test user
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: e2eUsername,
      password: e2ePassword,
    });

    if (signInError) {
      console.error("❌ Failed to sign in as E2E user:", signInError.message);
      console.error("   User:", e2eUsername);
      console.error("");
      console.error("   The E2E test user must exist before running tests.");
      console.error("   Create this user in Supabase Auth:");
      console.error("   1. Go to Supabase Dashboard → Authentication → Users");
      console.error("   2. Create user with credentials from .env.test");
      console.error("   3. Or update .env.test with existing user credentials");
      return;
    }

    console.log(`✓ Signed in as: ${e2eUsername}`);

    // Delete flashcards created by this user
    const { data: flashcards, error: fetchFlashcardsError } = await supabase.from("flashcards").select("id");

    if (fetchFlashcardsError) {
      console.error("❌ Failed to fetch flashcards:", fetchFlashcardsError.message);
    } else if (flashcards && flashcards.length > 0) {
      const { error: deleteFlashcardsError } = await supabase.from("flashcards").delete().neq("id", 0); // Delete all rows (workaround for delete all)

      if (deleteFlashcardsError) {
        console.error("❌ Failed to delete flashcards:", deleteFlashcardsError.message);
      } else {
        console.log(`   ✓ Deleted ${flashcards.length} flashcard(s)`);
      }
    }

    // Delete generations created by this user
    const { data: generations, error: fetchGenerationsError } = await supabase.from("generations").select("id");

    if (fetchGenerationsError) {
      console.error("❌ Failed to fetch generations:", fetchGenerationsError.message);
    } else if (generations && generations.length > 0) {
      const { error: deleteGenerationsError } = await supabase.from("generations").delete().neq("id", 0); // Delete all rows

      if (deleteGenerationsError) {
        console.error("❌ Failed to delete generations:", deleteGenerationsError.message);
      } else {
        console.log(`   ✓ Deleted ${generations.length} generation(s)`);
      }
    }

    // Delete error logs created by this user
    const { data: errorLogs, error: fetchErrorLogsError } = await supabase.from("generation_error_logs").select("id");

    if (fetchErrorLogsError) {
      console.error("❌ Failed to fetch error logs:", fetchErrorLogsError.message);
    } else if (errorLogs && errorLogs.length > 0) {
      const { error: deleteErrorLogsError } = await supabase.from("generation_error_logs").delete().neq("id", 0); // Delete all rows

      if (deleteErrorLogsError) {
        console.error("❌ Failed to delete error logs:", deleteErrorLogsError.message);
      } else {
        console.log(`   ✓ Deleted ${errorLogs.length} error log(s)`);
      }
    }

    console.log("\n✨ Cleanup completed successfully");

    // Sign out
    await supabase.auth.signOut();
  } catch (error) {
    console.error("❌ Unexpected error during cleanup:", error);
  }
}

export default globalTeardown;
