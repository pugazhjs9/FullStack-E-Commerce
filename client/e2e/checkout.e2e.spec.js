import { test, expect } from "@playwright/test";

/**
 * E2E tests for the Checkout flow.
 * Based on actual Checkout.jsx selectors.
 * Submit button text: "Place Order - $XX.XX"
 * Form fields: #name, #email, #address, #city, #state, #zip
 * After order: navigate to /orders/:id?success=true
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function setupLoggedInUserWithCart(page) {
  const email = `checkout_e2e_${Date.now()}@test.com`;

  await page.goto("/register");
  await page.locator("#name").fill("Checkout Tester");
  await page.locator("#email").fill(email);
  await page.locator("#password").fill("CheckoutPass123");
  await page.locator("#confirmPassword").fill("CheckoutPass123");
  await page.getByRole("button", { name: "Create Account" }).click();
  await page.waitForURL("/");

  // Add product to cart
  await page.goto("/products");
  await page.locator(".product-card").first().waitFor({ timeout: 15000 });

  const addBtn = page
    .locator(
      ".product-card:not(:has(.add-to-cart-btn:disabled)) .add-to-cart-btn",
    )
    .first();
  await addBtn.waitFor({ timeout: 10000 });
  await addBtn.click();
  await page.waitForTimeout(800);

  return email;
}

async function fillCheckoutForm(page) {
  // Clear and fill name/email in case they weren't pre-populated from React context
  await page.locator("#name").fill("Test Checkout User");
  await page.locator("#email").fill("checkout@test.com");
  await page.locator("#address").fill("123 E2E Street");
  await page.locator("#city").fill("Test City");
  await page.locator("#state").fill("CA");
  await page.locator("#zip").fill("94105");
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe("Checkout", () => {
  test("should redirect to login when not logged in", async ({
    page,
  }) => {
    await page.goto("/checkout");
    await expect(
      page.getByRole("heading", { name: "Welcome Back" })
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show "Your cart is empty" when logged in but cart is empty', async ({
    page,
  }) => {
    const email = `checkout_empty_${Date.now()}@test.com`;
    await page.goto("/register");
    await page.locator("#name").fill("Empty Cart User");
    await page.locator("#email").fill(email);
    await page.locator("#password").fill("pass1234");
    await page.locator("#confirmPassword").fill("pass1234");
    await page.getByRole("button", { name: "Create Account" }).click();
    await page.waitForURL("/");

    await page.goto("/checkout");
    await expect(
      page.getByRole("heading", { name: "Your cart is empty" }),
    ).toBeVisible();
  });

  test("should show the checkout form with shipping fields", async ({
    page,
  }) => {
    await setupLoggedInUserWithCart(page);
    await page.goto("/checkout");

    // h1 "Checkout" and h2 "Shipping Information"
    await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible({
      timeout: 5000,
    });
    await expect(
      page.getByRole("heading", { name: "Shipping Information" }),
    ).toBeVisible();
    await expect(page.locator("#address")).toBeVisible();
    await expect(page.locator("#city")).toBeVisible();
    await expect(page.locator("#zip")).toBeVisible();
  });

  test("should complete checkout and navigate to order confirmation", async ({
    page,
  }) => {
    await setupLoggedInUserWithCart(page);
    await page.goto("/checkout");

    await expect(page.locator("#address")).toBeVisible({ timeout: 5000 });
    await fillCheckoutForm(page);

    // Button text is dynamic: "Place Order - $XX.XX"
    const placeOrderBtn = page.locator("button.place-order-btn");
    await expect(placeOrderBtn).toBeVisible();
    await placeOrderBtn.click();

    // Should navigate to /orders/:id?success=true
    await expect(page).toHaveURL(/\/orders\/\d+\?success=true/, {
      timeout: 10000,
    });
  });

  test("should clear cart after successful checkout", async ({ page }) => {
    await setupLoggedInUserWithCart(page);
    await page.goto("/checkout");

    await expect(page.locator("#address")).toBeVisible({ timeout: 5000 });
    await fillCheckoutForm(page);

    await page.locator("button.place-order-btn").click();
    await expect(page).toHaveURL(/\/orders\/\d+\?success=true/, {
      timeout: 10000,
    });

    // Cart badge should be gone
    await expect(page.locator(".cart-badge")).not.toBeVisible();
  });

  test("should show order summary on the orders page", async ({ page }) => {
    await setupLoggedInUserWithCart(page);
    await page.goto("/checkout");

    await expect(page.locator("#address")).toBeVisible({ timeout: 5000 });
    await fillCheckoutForm(page);
    await page.locator("button.place-order-btn").click();
    await expect(page).toHaveURL(/\/orders\/\d+/, { timeout: 10000 });

    // Navigate to orders list
    await page.goto("/orders");
    await expect(page).toHaveURL("/orders");
    // Orders page should have content
    await expect(
      page.locator(".orders-page, .order-card, h1, h2").first(),
    ).toBeVisible();
  });
});
