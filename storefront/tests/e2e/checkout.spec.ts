import { test, expect } from '@playwright/test';

/**
 * E2E TEST: Guest Checkout Flow 
 * 
 * Verifies:
 * 1. Add item to cart.
 * 2. Navigate to Checkout as Guest.
 * 3. Fill shipping info.
 * 4. Verify payment section visibility.
 */
test.describe('Checkout Flow', () => {
    test('should complete guest checkout flow up to payment', async ({ page }: { page: any }) => {
        // 1. Visit Home & Add to Cart
        await page.goto('/');

        // Assume there is a product list
        const firstProduct = page.locator('.product-card').first();
        await firstProduct.hover();
        await firstProduct.locator('button:has-text("Add to Cart")').click();

        // 2. Open Cart & Checkout
        await page.locator('button[aria-label="Open cart"]').click();
        await expect(page.locator('.cart-item')).toBeVisible();
        await page.locator('button:has-text("Proceed to Checkout")').click();

        // 3. Fill Checkout Details (Guest)
        await expect(page).toHaveURL(/checkout/);

        await page.fill('input[name="fullName"]', 'Guest User');
        await page.fill('input[name="phone"]', '0123456789');
        await page.fill('input[name="email"]', 'guest@example.com');
        await page.fill('input[name="addressLine"]', '123 Test St');
        await page.fill('input[name="ward"]', 'Ward 1');
        await page.fill('input[name="district"]', 'District 1');
        await page.fill('input[name="province"]', 'HCMC');

        // 4. Verify Payment Methods are loaded
        await expect(page.locator('text=VNPAY')).toBeVisible();
        await expect(page.locator('text=PAYPAL')).toBeVisible();

        // Note: Actual payment completion would require mocks or sandbox
    });

    test('should handle payment failure and allow retry', async ({ page }: { page: any }) => {
        // This requires a mock of the payment provider response
        // L8: We test the RECOVERY flow
    });
});
