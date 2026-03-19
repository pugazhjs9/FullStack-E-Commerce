import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Authentication flow.
 * Selectors are based on actual DOM: Register.jsx, Login.jsx
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

function uniqueEmail() {
  return `e2e_${Date.now()}@test.com`;
}

/**
 * Register a new user via the UI and return credentials.
 * After calling this the user is logged in and on the home page.
 */
async function registerUser(page, overrides = {}) {
  const user = {
    name: overrides.name ?? "E2E User",
    email: overrides.email ?? uniqueEmail(),
    password: overrides.password ?? "TestPass123",
  };

  await page.goto("/register");
  await page.locator("#name").fill(user.name);
  await page.locator("#email").fill(user.email);
  await page.locator("#password").fill(user.password);
  await page.locator("#confirmPassword").fill(user.password);
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL("/");

  return user;
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Authentication", () => {
  test("should display the registration form", async ({ page }) => {
    await page.goto("/register");

    await expect(
      page.getByRole("heading", { name: "Create Account" }),
    ).toBeVisible();
    await expect(page.locator("#name")).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#confirmPassword")).toBeVisible();
  });

  test("should successfully register a new user", async ({ page }) => {
    await registerUser(page);

    // Should be on home page and show logged-in state
    await expect(page).toHaveURL("/");
    await expect(page.getByText(/Hi,/)).toBeVisible();
  });

  test("should show error for duplicate email registration", async ({
    page,
  }) => {
    const email = uniqueEmail();
    await registerUser(page, { email });

    // Logout
    await page.getByRole("button", { name: "Logout" }).click();

    // Re-register with same email
    await page.goto("/register");
    await page.locator("#name").fill("Another User");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("AnotherPass123");
    await page.locator("#confirmPassword").fill("AnotherPass123");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.locator(".error-message")).toBeVisible();
  });

  test("should show error when passwords do not match", async ({ page }) => {
    await page.goto("/register");
    await page.locator("#name").fill("Test User");
    await page.locator("#email").fill(uniqueEmail());
    await page.locator("#password").fill("Password123");
    await page.locator("#confirmPassword").fill("Different123");
    await page.getByRole("button", { name: "Create Account" }).click();

    await expect(page.locator(".error-message")).toContainText(
      "Passwords do not match",
    );
  });

  test("should display the login form", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("heading", { name: "Welcome Back" }),
    ).toBeVisible();
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.getByRole("button", { name: "Sign In" })).toBeVisible();
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    const { email, password } = await registerUser(page);

    // Logout
    await page.getByRole("button", { name: "Logout" }).click();
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();

    // Login
    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill(password);
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByText(/Hi,/)).toBeVisible();
  });

  test("should show error for wrong password", async ({ page }) => {
    const { email } = await registerUser(page);
    await page.getByRole("button", { name: "Logout" }).click();

    await page.goto("/login");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("WrongPassword999");
    await page.getByRole("button", { name: "Sign In" }).click();

    await expect(page.locator(".error-message")).toBeVisible();
  });

  test("should logout and return to unauthenticated state", async ({
    page,
  }) => {
    await registerUser(page);

    // Verify logged in
    await expect(page.getByText(/Hi,/)).toBeVisible();

    // Logout
    await page.getByRole("button", { name: "Logout" }).click();

    // Verify logged out
    await expect(page.getByRole("link", { name: "Login" })).toBeVisible();
    await expect(page.getByText(/Hi,/)).not.toBeVisible();
  });
});
