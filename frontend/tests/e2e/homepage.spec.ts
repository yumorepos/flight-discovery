import { test, expect } from '@playwright/test';

/**
 * Homepage Critical Path Tests
 * 
 * Protects against regressions in:
 * - Page load
 * - Hero section rendering
 * - Search form visibility
 * - Auto-loaded destination cards
 * - Visual layout integrity
 */

test.describe('Homepage', () => {
  test('should load successfully', async ({ page }) => {
    await page.goto('/');
    
    // Verify page title
    await expect(page).toHaveTitle(/FlightFinder/i);
    
    // Verify no console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.waitForLoadState('networkidle');
    expect(errors).toHaveLength(0);
  });

  test('should display hero section with branding', async ({ page }) => {
    await page.goto('/');
    
    // Check for FlightFinder branding
    const heading = page.locator('text=FlightFinder').first();
    await expect(heading).toBeVisible();
    
    // Check for main headline
    const adventure = page.locator('text=/Find Your Next.*Adventure/i');
    await expect(adventure).toBeVisible();
  });

  test('should display search form', async ({ page }) => {
    await page.goto('/');
    
    // Origin input (autocomplete)
    const originInput = page.locator('input[placeholder*="origin" i], input[placeholder*="departure" i]').first();
    await expect(originInput).toBeVisible();
    
    // Month selector
    const monthSelect = page.locator('select').first();
    await expect(monthSelect).toBeVisible();
    
    // Search button
    const searchButton = page.locator('button:has-text("Search"), button:has-text("Find")').first();
    await expect(searchButton).toBeVisible();
  });

  test('should display deal indicator badges', async ({ page }) => {
    await page.goto('/');
    
    // Check for deal classification indicators
    await expect(page.locator('text=/Mistake Fare/i')).toBeVisible();
    await expect(page.locator('text=/Hot Deal/i')).toBeVisible();
    await expect(page.locator('text=/Good Deal/i')).toBeVisible();
  });

  test('CRITICAL: should auto-load destination cards on page load', async ({ page }) => {
    await page.goto('/');
    
    // Wait for API response
    await page.waitForResponse(
      response => response.url().includes('/api/search') && response.status() === 200,
      { timeout: 10000 }
    );
    
    // Wait for destination cards to render
    const cards = page.locator('[class*="DestinationCard"], article, .card').filter({ hasText: /\$/ });
    
    // Expect at least 3 destination cards visible
    await expect(cards.first()).toBeVisible({ timeout: 5000 });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);
    
    // Verify no empty state message
    await expect(page.locator('text=/Choose your departure airport/i')).not.toBeVisible();
  });

  test('should display destination card with required elements', async ({ page }) => {
    await page.goto('/');
    
    // Wait for cards to load
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000); // Allow render time
    
    const firstCard = page.locator('[class*="card"], article').filter({ hasText: /\$/ }).first();
    await expect(firstCard).toBeVisible();
    
    // Check for price display (must include $)
    await expect(firstCard.locator('text=/\\$\\d+/i')).toBeVisible();
    
    // Check for destination name/city
    const cityText = firstCard.locator('[class*="city"], [class*="destination"], h3, h2').first();
    await expect(cityText).toBeVisible();
    
    // Check for CTA button
    const ctaButton = firstCard.locator('button, a').filter({ hasText: /View|Book|Deal/i }).first();
    await expect(ctaButton).toBeVisible();
  });

  test('should have responsive layout on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
    await page.goto('/');
    
    // Hero should still be visible
    await expect(page.locator('text=/FlightFinder/i').first()).toBeVisible();
    
    // Search form should be visible (may stack vertically)
    await expect(page.locator('input').first()).toBeVisible();
    
    // Cards should render (may be single column)
    await page.waitForResponse(response => response.url().includes('/api/search'));
    await page.waitForTimeout(2000);
    
    const cards = page.locator('[class*="card"], article').filter({ hasText: /\$/ });
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('should display footer with branding', async ({ page }) => {
    await page.goto('/');
    
    // Scroll to footer
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    // Check for footer content
    const footer = page.locator('footer');
    await expect(footer).toBeVisible();
    await expect(footer.locator('text=/FlightFinder/i')).toBeVisible();
  });
});
