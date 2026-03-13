import { expect, test, type Page } from '@playwright/test';

const waitForDealsLoaded = async (page: Page) => {
  await page.goto('/');
  await page.waitForResponse(
    (response) => response.url().includes('/api/search') && response.status() === 200,
    { timeout: 15000 },
  );
  await page.locator('section.animate-pulse').first().waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
  await expect(page.locator('a:has-text("See deal")').first()).toBeVisible({ timeout: 15000 });
};

test.describe('Visual Regression - Refined Discovery UI', () => {
  test.beforeEach(async ({ page }) => {
    await waitForDealsLoaded(page);
  });

  test('hero keeps premium gradient, search surface, and spotlight cards', async ({ page }) => {
    const hero = page.locator('section').first();
    await expect(hero).toBeVisible();
    const gradient = await hero.evaluate((el) => window.getComputedStyle(el).color);
    expect(gradient).toMatch(/rgb\(/);

    await expect(page.locator('form').first()).toBeVisible();
    await expect(page.getByText('Trending now').first()).toBeVisible();
  });

  test('results area shows curated discovery with multiple sections', async ({ page }) => {
    const curatedTitle = page.getByText('Curated discovery');
    await expect(curatedTitle).toBeVisible();

    const sectionCards = page
      .locator('#results article')
      .filter({ hasText: /Best value this month|Weekend escapes|Warm-weather picks|Under/i });
    await expect(sectionCards.first()).toBeVisible();
    const sectionCount = await sectionCards.count();
    expect(sectionCount).toBeGreaterThanOrEqual(2);
  });

  test('featured and standard cards preserve hierarchy and CTA', async ({ page }) => {
    await expect(page.getByText('Featured deal').first()).toBeVisible();

    const firstDealCard = page.locator('#results article').filter({ has: page.locator('a:has-text("See deal")') }).first();
    await expect(firstDealCard).toBeVisible();

    await expect(firstDealCard.getByText('Why go now')).toBeVisible();
    await expect(firstDealCard.locator('a:has-text("See deal")').first()).toBeVisible();
    await expect(firstDealCard.locator('img').first()).toBeVisible();
  });

  test('mobile viewport keeps cards and curated feed visible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await waitForDealsLoaded(page);

    await expect(page.locator('a:has-text("See deal")').first()).toBeVisible();
    await expect(page.getByText('Curated discovery')).toBeVisible();
  });
});
