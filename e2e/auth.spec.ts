import { test } from "@playwright/test";
import { LoginPage, RegisterPage, DashboardPage, NavbarComponent } from "./page-objects";
import { testUtils } from "./utils/test-helpers";

/**
 * Authentication E2E Tests
 * Tests the complete user authentication flow using Page Object Model
 */
test.describe.serial("Authentication E2E Tests", () => {
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
    let dashboardPage: DashboardPage;
    let navbar: NavbarComponent;

    const testUser = {
      email: testUtils.generateRandomEmail(),
      password: "TestPassword123!",
    };

    test.beforeEach(async ({ page }) => {
      registerPage = new RegisterPage(page);
      loginPage = new LoginPage(page);
      dashboardPage = new DashboardPage(page);
      navbar = new NavbarComponent(page);
    });

    test.skip("US-001: Should register a new user successfully", async ({ page }) => {
      await page.goto("/login");
      await navbar.clickRegister();
      await registerPage.verifyPageLoaded();

      await registerPage.fillEmail(testUser.email);
      await registerPage.fillPassword(testUser.password);
      await registerPage.fillConfirmPassword(testUser.password);
      await registerPage.submit();

      await dashboardPage.waitForDashboard();
      await navbar.verifyUserLoggedIn(testUser.email);
    });

    test("Complete authentication cycle: register → dashboard → logout → login → logout", async ({ page }) => {
      const uniqueUser = {
        email: testUtils.generateRandomEmail(),
        password: "TestPassword123!",
      };

      await page.goto("/login");
      await navbar.clickRegister();
      await registerPage.register(uniqueUser.email, uniqueUser.password);

      await dashboardPage.waitForDashboard();
      await navbar.verifyUserLoggedIn(uniqueUser.email);

      await navbar.clickLogout();
      await loginPage.verifyPageLoaded();

      await loginPage.login(uniqueUser.email, uniqueUser.password);
      await dashboardPage.waitForDashboard();
      await navbar.verifyUserLoggedIn(uniqueUser.email);

      await navbar.clickLogout();
      await loginPage.verifyPageLoaded();
    });
  });
});
