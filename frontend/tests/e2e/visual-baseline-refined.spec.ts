import { test, expect } from '@playwright/test';

/**
 * Visual Baseline Tests - Refined Purple Theme
 * 
 * Captures baseline screenshots after UI refinement and homepage auto-load fix.
 * 
 * CRITICAL: Only run after verifying:
 * 1. Homepage auto-loads destination cards (no empty state)
 * 2. Refined purple theme applied (indigo → violet → blue gradient)
 * 3. Search form elevated above hero (no overlap)
 * 4. All images and prices display correctly
 * 
 * First run: Creates baseline screenshots
 * Subsequent runs: Compares against baseline
 */

test.describe('Visual Baseline - Refined UI (Post-Fix)', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate and wait for auto-load to complete
    await page.goto('/');
    
    // Wait for API call (auto-load with YUL origin)
    await page.waitForResponse(
      response => response.url().includes('/api/search') && response.status() === 200,
      { timeout: 10000 }
    );
    
    // Wait for cards to render
    await page.waitForTimeout(2000);
    
    // Verify cards are visible (not empty state)
    const cards = page.locator('[class*="card"], article').filter({ hasText: /\$/ });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('BASELINE: Homepage - Refined Hero Section (Desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Scroll to hero section
    const hero = page.locator('section').first();
    await hero.scrollIntoViewIfNeeded();
    
    await expect(hero).toHaveScreenshot('refined-hero-desktop.png', {
      maxDiffPixels: 150,
    });
  });

  test('BASELINE: Homepage - Elevated Search Form (Desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Screenshot search form container (elevated white box)
    const searchContainer = page.locator('div').filter({ hasText: /From.*When.*To/i }).first();
    await searchContainer.scrollIntoViewIfNeeded();
    
    await expect(searchContainer).toHaveScreenshot('refined-search-form-desktop.png', {
      maxDiffPixels: 100,
    });
  });

  test('BASELINE: Homepage - Deal Highlights Bar (Desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Screenshot deal indicators bar
    const dealsBar = page.locator('text=/Mistake Fare|Hot Deal|Good Deal/i').first().locator('..');
    await dealsBar.scrollIntoViewIfNeeded();
    
    await expect(dealsBar).toHaveScreenshot('refined-deal-highlights-desktop.png', {
      maxDiffPixels: 50,
    });
  });

  test('BASELINE: Homepage - Auto-Loaded Destination Cards Grid (Desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Screenshot cards grid area
    const cardsContainer = page.locator('main, [id="results"]').first();
    await cardsContainer.scrollIntoViewIfNeeded();
    
    await expect(cardsContainer).toHaveScreenshot('refined-cards-grid-desktop.png', {
      maxDiffPixels: 400,
    });
  });

  test('BASELINE: Individual Destination Card (Desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    await firstCard.scrollIntoViewIfNeeded();
    
    // Verify card has required elements before capturing
    await expect(firstCard.locator('text=/\\$\\d+/i')).toBeVisible();
    
    await expect(firstCard).toHaveScreenshot('refined-destination-card-desktop.png', {
      maxDiffPixels: 80,
    });
  });

  test('BASELINE: Full Homepage - Refined Purple Theme (Desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Full page screenshot
    await expect(page).toHaveScreenshot('refined-homepage-full-desktop.png', {
      fullPage: true,
      maxDiffPixels: 600,
    });
  });

  test('BASELINE: Mobile - Refined Homepage (iPhone SE)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page).toHaveScreenshot('refined-homepage-mobile-iphone.png', {
      fullPage: true,
      maxDiffPixels: 500,
    });
  });

  test('BASELINE: Mobile - Destination Card (iPhone SE)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    await firstCard.scrollIntoViewIfNeeded();
    
    await expect(firstCard).toHaveScreenshot('refined-destination-card-mobile.png', {
      maxDiffPixels: 120,
    });
  });

  test('BASELINE: Tablet - Refined Homepage (iPad)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    
    await expect(page).toHaveScreenshot('refined-homepage-tablet-ipad.png', {
      fullPage: true,
      maxDiffPixels: 500,
    });
  });

  test('BASELINE: Footer Section (Desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    const footer = page.locator('footer');
    await expect(footer).toHaveScreenshot('refined-footer-desktop.png', {
      maxDiffPixels: 60,
    });
  });
});

test.describe('Visual Baseline - Interaction States (Refined)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000);
  });

  test('BASELINE: Destination Card - Hover State', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    await firstCard.scrollIntoViewIfNeeded();
    
    // Hover to trigger effects
    await firstCard.hover();
    await page.waitForTimeout(400);
    
    await expect(firstCard).toHaveScreenshot('refined-card-hover-state.png', {
      maxDiffPixels: 120,
    });
  });

  test('BASELINE: Region Filter - Active State', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    const filter = page.locator('button').filter({ hasText: /Americas|Europe|Asia/i }).first();
    
    if (await filter.isVisible()) {
      await filter.click();
      await page.waitForTimeout(500);
      
      const filters = page.locator('button').filter({ hasText: /All|Americas|Europe/i }).first().locator('..');
      await expect(filters).toHaveScreenshot('refined-filters-active-state.png', {
        maxDiffPixels: 80,
      });
    }
  });
});

test.describe('CRITICAL: Auto-Load Verification', () => {
  test('VERIFY: Homepage auto-loads destination cards (no empty state)', async ({ page }) => {
    await page.goto('/');
    
    // Wait for API response
    await page.waitForResponse(
      response => response.url().includes('/api/search?origin=YUL') && response.status() === 200,
      { timeout: 10000 }
    );
    
    // Wait for render
    await page.waitForTimeout(2500);
    
    // CRITICAL CHECK 1: Cards must be visible
    const cards = page.locator('[class*="card"], article').filter({ hasText: /\$/ });
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);
    
    // CRITICAL CHECK 2: No empty state message
    await expect(page.locator('text=/Choose your departure airport/i')).not.toBeVisible();
    
    // CRITICAL CHECK 3: Verify prices display
    const firstPrice = cards.first().locator('text=/\\$\\d+/i').first();
    await expect(firstPrice).toBeVisible();
    
    // CRITICAL CHECK 4: Verify images loaded
    const firstImage = cards.first().locator('img').first();
    await expect(firstImage).toBeVisible();
    const imgSrc = await firstImage.getAttribute('src');
    expect(imgSrc).toBeTruthy();
    
    console.log(`✅ Auto-load verified: ${count} cards displayed`);
  });

  test('VERIFY: Refined purple theme applied', async ({ page }) => {
    await page.goto('/');
    
    // Check hero section has refined gradient
    const hero = page.locator('section').first();
    const heroBg = await hero.evaluate((el) => window.getComputedStyle(el).backgroundImage);
    
    // Should contain gradient (not empty)
    expect(heroBg).toContain('gradient');
    
    // Check search form is elevated (white background, not transparent)
    const searchContainer = page.locator('div').filter({ hasText: /From.*When.*To/i }).first();
    const searchBg = await searchContainer.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    
    // Should be white or near-white (not purple)
    expect(searchBg).toMatch(/rgb\(255, 255, 255\)|rgb\(2\d{2}, 2\d{2}, 2\d{2}\)/);
    
    console.log('✅ Refined purple theme verified');
  });
});
