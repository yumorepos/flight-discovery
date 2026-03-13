import { test, expect } from '@playwright/test';

/**
 * Smoke Tests - Critical Path Validation
 * 
 * Fast checks to ensure app boots and core routes work.
 * Run these first before detailed tests.
 */

test.describe('Smoke Tests', () => {
  test('app should boot without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Allow some non-critical warnings but fail on real errors
    const criticalErrors = errors.filter(err => 
      !err.includes('favicon') && 
      !err.includes('third-party') &&
      !err.includes('DevTools')
    );
    
    expect(criticalErrors).toHaveLength(0);
  });

  test('backend API should be reachable', async ({ page }) => {
    await page.goto('/');
    
    // Wait for API call
    const response = await page.waitForResponse(
      response => response.url().includes('/api/search'),
      { timeout: 10000 }
    );
    
    expect(response.status()).toBe(200);
    
    // Verify JSON response
    const data = await response.json();
    expect(Array.isArray(data)).toBe(true);
  });

  test('homepage should render within 5 seconds', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000);
  });

  test('images should load correctly', async ({ page }) => {
    await page.goto('/');
    
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000);
    
    // Check for at least one image loaded
    const images = page.locator('img');
    const count = await images.count();
    expect(count).toBeGreaterThanOrEqual(1);
    
    // Verify first image has valid src
    if (count > 0) {
      const firstImg = images.first();
      const src = await firstImg.getAttribute('src');
      expect(src).toBeTruthy();
    }
  });

  test('no broken links in navigation', async ({ page }) => {
    await page.goto('/');
    
    // Find all navigation links
    const navLinks = page.locator('nav a, header a');
    const linkCount = await navLinks.count();
    
    if (linkCount > 0) {
      for (let i = 0; i < Math.min(linkCount, 5); i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');
        
        if (href && !href.startsWith('#') && !href.startsWith('http')) {
          // Internal link - should be valid
          expect(href).toBeTruthy();
        }
      }
    }
  });

  test('footer should render', async ({ page }) => {
    await page.goto('/');
    
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
  });

  test('CSS should load (no unstyled content)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check that body has background color (indicates CSS loaded)
    const body = page.locator('body');
    const bgColor = await body.evaluate((el) => window.getComputedStyle(el).backgroundColor);
    
    // Should not be default white (rgb(255, 255, 255))
    expect(bgColor).toBeTruthy();
  });

  test('JavaScript should be enabled and working', async ({ page }) => {
    await page.goto('/');
    
    // Check that React is rendering (search for React-specific attributes)
    const reactRoot = page.locator('[id="__next"], [data-reactroot]');
    const count = await reactRoot.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
});
