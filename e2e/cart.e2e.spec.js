import { test, expect } from '@playwright/test';

/**
 * E2E tests for the Shopping Cart.
 * Uses actual Cart.jsx selectors: .cart-page, empty state h2 "Your cart is empty",
 * items rendered by CartItem, .clear-cart-btn, .checkout-btn
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function registerAndLogin(page) {
    const email = `cart_e2e_${Date.now()}@test.com`;
    await page.goto('/register');
    await page.locator('#name').fill('Cart Tester');
    await page.locator('#email').fill(email);
    await page.locator('#password').fill('CartPass123');
    await page.locator('#confirmPassword').fill('CartPass123');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await page.waitForURL('/');
    return email;
}

async function addFirstAvailableProductToCart(page) {
    await page.goto('/products');
    const cards = page.locator('.product-card');
    await cards.first().waitFor({ timeout: 15000 });

    // Click the first enabled "Add to Cart" button
    const addBtn = page.locator('.product-card:not(:has(.add-to-cart-btn:disabled)) .add-to-cart-btn').first();
    await addBtn.waitFor({ timeout: 10000 });
    await addBtn.click();
    await page.waitForTimeout(800);
}

// ─── Tests ────────────────────────────────────────────────────────────────────

test.describe('Shopping Cart', () => {
    test.beforeEach(async ({ page }) => {
        await registerAndLogin(page);
    });

    test('should show cart icon in navbar when logged in', async ({ page }) => {
        await expect(page.locator('.cart-link')).toBeVisible();
    });

    test('should show empty cart message when cart is empty', async ({ page }) => {
        await page.goto('/cart');
        await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible();
    });

    test('should add a product and show cart badge', async ({ page }) => {
        await addFirstAvailableProductToCart(page);

        // Cart badge should appear with a number
        await expect(page.locator('.cart-badge')).toBeVisible({ timeout: 5000 });
        const badgeText = await page.locator('.cart-badge').textContent();
        expect(parseInt(badgeText, 10)).toBeGreaterThan(0);
    });

    test('should navigate to cart page and show added item', async ({ page }) => {
        await addFirstAvailableProductToCart(page);

        await page.locator('.cart-link').click();
        await expect(page).toHaveURL('/cart');

        // Cart has items — "Shopping Cart" heading is visible
        await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible({ timeout: 5000 });
    });

    test('should show Proceed to Checkout button in cart', async ({ page }) => {
        await addFirstAvailableProductToCart(page);

        await page.goto('/cart');
        await expect(page.getByRole('button', { name: 'Proceed to Checkout' })).toBeVisible({ timeout: 5000 });
    });

    test('should redirect to /checkout when Proceed to Checkout is clicked', async ({ page }) => {
        await addFirstAvailableProductToCart(page);

        await page.goto('/cart');
        await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
        await expect(page).toHaveURL('/checkout');
    });

    test('should redirect unauthenticated user to login when clicking Add to Cart', async ({ page }) => {
        // Logout first
        await page.getByRole('button', { name: 'Logout' }).click();
        await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();

        await page.goto('/products');
        await page.locator('.product-card').first().waitFor({ timeout: 15000 });

        // Click Add to Cart as guest
        const addBtn = page.locator('.add-to-cart-btn').first();
        await addBtn.click();

        await expect(page).toHaveURL('/login');
    });

    test('should clear cart when Clear Cart is clicked', async ({ page }) => {
        await addFirstAvailableProductToCart(page);

        await page.goto('/cart');
        await page.getByRole('button', { name: 'Shopping Cart' }).waitFor({ state: 'detached', timeout: 1000 }).catch(() => { });
        await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible({ timeout: 5000 });

        await page.getByRole('button', { name: 'Clear Cart' }).click();
        await page.waitForTimeout(500);

        await expect(page.getByRole('heading', { name: 'Your cart is empty' })).toBeVisible({ timeout: 5000 });
    });
});
