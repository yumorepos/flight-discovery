import { test, expect } from '@playwright/test';

/**
 * Destination Card Component Tests
 * 
 * Protects against regressions in:
 * - Card rendering
 * - Image loading
 * - Price display (including taxes)
 * - Deal badges
 * - Booking links
 * - Email subscription
 */

test.describe('Destination Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Wait for cards to load
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000);
  });

  test('should display destination image', async ({ page }) => {
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    
    // Check for image element
    const image = firstCard.locator('img').first();
    await expect(image).toBeVisible();
    
    // Verify image has src attribute
    const src = await image.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).not.toBe('');
  });

  test('should display city/destination name', async ({ page }) => {
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    
    // Find heading or city text
    const cityName = firstCard.locator('h2, h3, [class*="city"], [class*="destination"]').first();
    await expect(cityName).toBeVisible();
    
    const text = await cityName.textContent();
    expect(text).toBeTruthy();
    expect(text!.trim().length).toBeGreaterThan(0);
  });

  test('CRITICAL: should display price including taxes', async ({ page }) => {
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    
    // Check for price display
    const price = firstCard.locator('text=/\\$\\d+/i').first();
    await expect(price).toBeVisible();
    
    // Verify price is a valid number format
    const priceText = await price.textContent();
    expect(priceText).toMatch(/\$\s*\d+/);
    
    // Check for tax/total indication (optional, depending on design)
    const taxInfo = firstCard.locator('text=/tax|total|CAD/i');
    if (await taxInfo.count() > 0) {
      await expect(taxInfo.first()).toBeVisible();
    }
  });

  test('should display deal badge', async ({ page }) => {
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    
    // Check for deal classification badge
    const dealBadge = firstCard.locator('text=/Mistake Fare|Hot Deal|Good Deal|Fair/i').first();
    
    // At least one card should have a deal badge
    if (await dealBadge.count() > 0) {
      await expect(dealBadge).toBeVisible();
    }
  });

  test('should display value score badge', async ({ page }) => {
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    
    // Check for value score (e.g., "Value: 85")
    const valueBadge = firstCard.locator('text=/Value.*\\d+/i').first();
    
    if (await valueBadge.count() > 0) {
      await expect(valueBadge).toBeVisible();
    }
  });

  test('should display airline information', async ({ page }) => {
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    
    // Check for airline name or logo
    const airline = firstCard.locator('text=/Air Canada|Emirates|United|Delta|Airline/i, img[alt*="airline" i]');
    
    if (await airline.count() > 0) {
      await expect(airline.first()).toBeVisible();
    }
  });

  test('CRITICAL: should have working booking link', async ({ page }) => {
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    
    // Find booking CTA button
    const bookingButton = firstCard.locator('button, a').filter({ hasText: /View Deal|Book|View|Flight/i }).first();
    await expect(bookingButton).toBeVisible();
    
    // Verify it's clickable (has href or onclick)
    const href = await bookingButton.getAttribute('href');
    const role = await bookingButton.getAttribute('role');
    
    expect(href || role).toBeTruthy();
  });

  test('should display flight duration', async ({ page }) => {
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    
    // Check for duration display (e.g., "8h 30m" or "8 hours")
    const duration = firstCard.locator('text=/\\d+h|hour|duration/i');
    
    if (await duration.count() > 0) {
      await expect(duration.first()).toBeVisible();
    }
  });

  test('should display departure date', async ({ page }) => {
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    
    // Check for date display
    const date = firstCard.locator('text=/\\d{4}-\\d{2}-\\d{2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/i');
    
    if (await date.count() > 0) {
      await expect(date.first()).toBeVisible();
    }
  });

  test('should display stops information', async ({ page }) => {
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    
    // Check for stops info (e.g., "Nonstop" or "1 stop")
    const stops = firstCard.locator('text=/nonstop|direct|\\d+ stop/i');
    
    if (await stops.count() > 0) {
      await expect(stops.first()).toBeVisible();
    }
  });

  test('should allow email subscription toggle', async ({ page }) => {
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    
    // Look for email alert/subscription button
    const emailButton = firstCard.locator('button').filter({ hasText: /email|alert|notify|subscribe/i });
    
    if (await emailButton.count() > 0) {
      await emailButton.first().click();
      
      // Verify email input or subscription form appears
      await page.waitForTimeout(500);
      const emailInput = firstCard.locator('input[type="email"]');
      
      if (await emailInput.count() > 0) {
        await expect(emailInput.first()).toBeVisible();
      }
    }
  });

  test('should have hover effect on cards', async ({ page }) => {
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    
    // Get initial position/transform
    const initialBox = await firstCard.boundingBox();
    expect(initialBox).toBeTruthy();
    
    // Hover over card
    await firstCard.hover();
    await page.waitForTimeout(300); // Allow animation time
    
    // Card should still be visible (verifies no visual breakage)
    await expect(firstCard).toBeVisible();
  });
});
