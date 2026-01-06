import { test } from "@playwright/test";
import { LoginPage, RegisterPage, NavbarComponent, GeneratePage } from "./page-objects";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../src/db/database.types";

// Test user credentials - initialized in beforeAll
let authTestUser: { email: string; password: string };

/**
 * Helper to delete auth test user via Supabase admin API
 */
async function deleteAuthTestUser(email: string): Promise<boolean> {
  /* eslint-disable no-console */
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.log("⚠️  SUPABASE_SERVICE_ROLE_KEY not set - skipping auth user cleanup");
    return false;
  }

  try {
    const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const {
      data: { users },
      error: listError,
    } = await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("❌ Failed to list users:", listError.message);
      return false;
    }

    const authUser = users?.find((u) => u.email === email);
    if (!authUser) {
      return false; // User doesn't exist
    }

    // Delete user's data first
    await supabase.from("flashcards").delete().eq("user_id", authUser.id);
    await supabase.from("generations").delete().eq("user_id", authUser.id);

    // Delete the auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);
    if (deleteError) {
      console.error("❌ Failed to delete auth user:", deleteError.message);
      return false;
    }

    console.log(`✅ Deleted auth test user: ${email}`);
    return true;
  } catch (error) {
    console.error("❌ Unexpected error during auth cleanup:", error);
    return false;
  }
  /* eslint-enable no-console */
}

/**
 * Authentication E2E Tests
 * Tests the complete user authentication flow using Page Object Model
 *
 * Uses a fixed test user (E2E_AUTH_USERNAME/E2E_AUTH_PASSWORD) that is:
 * - Cleaned up before tests run (if exists from previous run)
 * - Created during the first test (registration)
 * - Cleaned up after all tests complete
 */
test.describe("Authentication E2E Tests", () => {
  test.describe("Navigation", () => {
    test("Should navigate from login to register page", async ({ page }) => {
      const loginPage = new LoginPage(page);
      const registerPage = new RegisterPage(page);

      await loginPage.navigate();
      await loginPage.clickRegisterLink();
      await registerPage.verifyPageLoaded();
    });

    test("Should navigate from register to login page", async ({ page }) => {
      const registerPage = new RegisterPage(page);
      const loginPage = new LoginPage(page);

      await registerPage.navigate();
      await registerPage.clickLoginLink();
      await loginPage.verifyPageLoaded();
    });
  });

  test.describe("Authentication Flow", () => {
    let registerPage: RegisterPage;
    let loginPage: LoginPage;
    let generatePage: GeneratePage;
    let navbar: NavbarComponent;

    // Pre-test setup: ensure clean state
    test.beforeAll(async () => {
      authTestUser = {
        email: process.env.E2E_AUTH_USERNAME || "",
        password: process.env.E2E_AUTH_PASSWORD || "",
      };

      if (!authTestUser.email || !authTestUser.password) {
        throw new Error("E2E_AUTH_USERNAME and E2E_AUTH_PASSWORD must be set in .env.test");
      }

      // Clean up existing user from previous runs
      /* eslint-disable-next-line no-console */
      console.log("\n🧹 Pre-test cleanup: checking for existing auth test user...");
      await deleteAuthTestUser(authTestUser.email);
    });

    test.beforeEach(async ({ page }) => {
      registerPage = new RegisterPage(page);
      loginPage = new LoginPage(page);
      generatePage = new GeneratePage(page);
      navbar = new NavbarComponent(page);
    });

    test("Complete authentication cycle: register → generate → logout → login → generate → logout", async ({
      page,
    }) => {
      // Register with fixed test user
      await page.goto("/login", { waitUntil: "networkidle" });
      await navbar.clickRegister();
      await registerPage.register(authTestUser.email, authTestUser.password);

      await generatePage.waitForGenerate();
      await navbar.verifyUserLoggedIn(authTestUser.email);

      // Logout
      await navbar.clickLogout();
      await loginPage.verifyPageLoaded();

      // Login with same user
      await loginPage.login(authTestUser.email, authTestUser.password);
      await generatePage.waitForGenerate();
      await navbar.verifyUserLoggedIn(authTestUser.email);

      // Logout again
      await navbar.clickLogout();
      await loginPage.verifyPageLoaded();
    });

    // Post-test cleanup
    test.afterAll(async () => {
      /* eslint-disable-next-line no-console */
      console.log("\n🧹 Post-test cleanup: removing auth test user...");
      await deleteAuthTestUser(authTestUser.email);
    });
  });
});
