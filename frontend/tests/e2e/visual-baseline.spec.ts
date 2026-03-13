import { test, expect } from '@playwright/test';

/**
 * Visual Regression Tests
 * 
 * Captures screenshots of critical UI states and compares against baseline.
 * Detects layout drift, styling regressions, and visual breakage.
 * 
 * First run: Creates baseline screenshots
 * Subsequent runs: Compares against baseline
 * 
 * Update baselines with: npx playwright test --update-snapshots
 */

test.describe('Visual Regression - Baseline Protection', () => {
  test('homepage hero section (desktop)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Scroll to hero section
    const hero = page.locator('section').first();
    await hero.scrollIntoViewIfNeeded();
    
    // Screenshot hero section only
    await expect(hero).toHaveScreenshot('homepage-hero-desktop.png', {
      maxDiffPixels: 100, // Allow minor rendering differences
    });
  });

  test('homepage with auto-loaded destination cards (desktop)', async ({ page }) => {
    await page.goto('/');
    
    // Wait for cards to load
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000);
    
    // Full page screenshot
    await expect(page).toHaveScreenshot('homepage-full-desktop.png', {
      fullPage: true,
      maxDiffPixels: 500, // Cards may have dynamic content
    });
  });

  test('destination cards grid layout (desktop)', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000);
    
    // Screenshot just the cards grid area
    const cardsContainer = page.locator('main, [id="results"]').first();
    await cardsContainer.scrollIntoViewIfNeeded();
    
    await expect(cardsContainer).toHaveScreenshot('destination-cards-grid-desktop.png', {
      maxDiffPixels: 300,
    });
  });

  test('individual destination card (desktop)', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000);
    
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    await firstCard.scrollIntoViewIfNeeded();
    
    await expect(firstCard).toHaveScreenshot('destination-card-single-desktop.png', {
      maxDiffPixels: 50,
    });
  });

  test('search form UI (desktop)', async ({ page }) => {
    await page.goto('/');
    
    const searchForm = page.locator('form').first();
    await searchForm.scrollIntoViewIfNeeded();
    
    await expect(searchForm).toHaveScreenshot('search-form-desktop.png', {
      maxDiffPixels: 30,
    });
  });

  test('region filter tabs (desktop)', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000);
    
    // Screenshot filter section
    const filters = page.locator('button').filter({ hasText: /All|Americas|Europe/i }).first().locator('..');
    
    if (await filters.count() > 0) {
      await filters.scrollIntoViewIfNeeded();
      await expect(filters).toHaveScreenshot('region-filters-desktop.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('mobile viewport - homepage (iPhone)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage-mobile-iphone.png', {
      fullPage: true,
      maxDiffPixels: 400,
    });
  });

  test('mobile viewport - destination card (iPhone)', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000);
    
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    await firstCard.scrollIntoViewIfNeeded();
    
    await expect(firstCard).toHaveScreenshot('destination-card-mobile-iphone.png', {
      maxDiffPixels: 100,
    });
  });

  test('tablet viewport - homepage (iPad)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');
    
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000);
    
    await expect(page).toHaveScreenshot('homepage-tablet-ipad.png', {
      fullPage: true,
      maxDiffPixels: 400,
    });
  });

  test('footer section (desktop)', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    
    const footer = page.locator('footer');
    await expect(footer).toHaveScreenshot('footer-desktop.png', {
      maxDiffPixels: 50,
    });
  });

  test('deal indicator badges (desktop)', async ({ page }) => {
    await page.goto('/');
    
    const badges = page.locator('text=/Mistake Fare|Hot Deal|Good Deal/i').first().locator('..');
    await badges.scrollIntoViewIfNeeded();
    
    await expect(badges).toHaveScreenshot('deal-badges-desktop.png', {
      maxDiffPixels: 30,
    });
  });
});

test.describe('Visual Regression - Interaction States', () => {
  test('destination card - hover state', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000);
    
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    await firstCard.scrollIntoViewIfNeeded();
    
    // Hover to trigger hover effects
    await firstCard.hover();
    await page.waitForTimeout(300); // Allow animation
    
    await expect(firstCard).toHaveScreenshot('destination-card-hover-state.png', {
      maxDiffPixels: 100,
    });
  });

  test('region filter - active state', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000);
    
    // Click Europe filter
    const europeFilter = page.locator('button:has-text("Europe")').first();
    if (await europeFilter.isVisible()) {
      await europeFilter.click();
      await page.waitForTimeout(500);
      
      // Screenshot active filter state
      const filters = page.locator('button').filter({ hasText: /All|Americas|Europe/i }).first().locator('..');
      await expect(filters).toHaveScreenshot('region-filters-active-state.png', {
        maxDiffPixels: 50,
      });
    }
  });
});
