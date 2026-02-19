import { test, expect } from '@playwright/test';

/**
 * E2E tests for Product browsing.
 * Based on actual Products.jsx, ProductDetail.jsx, Home.jsx
 */

test.describe('Products', () => {
    test('should load the home page', async ({ page }) => {
        await page.goto('/');
        await expect(page).toHaveTitle(/ShopSmart/i);
        await expect(page.locator('.navbar')).toBeVisible();
    });

    test('should navigate to the products listing page via nav', async ({ page }) => {
        await page.goto('/');
        // Scope to navbar to avoid footer's Products link (strict mode)
        await page.locator('nav.navbar').getByRole('link', { name: 'Products' }).click();
        await expect(page).toHaveURL('/products');
    });

    test('should display product cards on the products page', async ({ page }) => {
        await page.goto('/products');

        // Wait for product cards
        const productCards = page.locator('.product-card');
        await expect(productCards.first()).toBeVisible({ timeout: 15000 });

        const count = await productCards.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should navigate to product detail page when clicking a product', async ({ page }) => {
        await page.goto('/products');

        const firstCard = page.locator('.product-card').first();
        await firstCard.waitFor({ timeout: 15000 });

        await firstCard.click();

        await expect(page).toHaveURL(/\/products\/\d+/);
    });

    test('should show product name and price on detail page', async ({ page }) => {
        await page.goto('/products');

        const firstCard = page.locator('.product-card').first();
        await firstCard.waitFor({ timeout: 15000 });
        await firstCard.click();

        await expect(page).toHaveURL(/\/products\/\d+/);
        // Detail page shows h1 product name and a price
        await expect(page.locator('h1').first()).toBeVisible();
        await expect(page.locator('.product-price').first()).toBeVisible();
    });

    test('should filter products using the navbar search', async ({ page }) => {
        await page.goto('/products');
        await page.locator('.product-card').first().waitFor({ timeout: 15000 });

        const searchInput = page.getByPlaceholder('Search products...');
        await searchInput.fill('shirt');
        await searchInput.press('Enter');

        await expect(page).toHaveURL(/search=shirt/);
    });

    test('should show all products when navigating to /products', async ({ page }) => {
        await page.goto('/products');

        // Page heading should indicate products section
        await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
    });
});
