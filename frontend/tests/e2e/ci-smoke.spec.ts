import { expect, test } from '@playwright/test';

test.describe('CI smoke e2e', () => {
  test('homepage renders with brand and search form', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('FlightFinder').first()).toBeVisible();
    await expect(page.locator('form').first()).toBeVisible();
  });

  test('search API responds and cards render after skeleton', async ({ page }) => {
    await page.goto('/');

    const response = await page.waitForResponse(
      (res) => res.url().includes('/api/search') && res.status() === 200,
      { timeout: 15000 },
    );
    expect(response.ok()).toBeTruthy();

    await page.locator('section.animate-pulse').first().waitFor({ state: 'hidden', timeout: 20000 }).catch(() => {});
    await expect(page.locator('a:has-text("See deal")').first()).toBeVisible({ timeout: 15000 });
  });

  test('curated discovery section appears with route tiles', async ({ page }) => {
    await page.goto('/');
    await page.waitForResponse((res) => res.url().includes('/api/search') && res.status() === 200, { timeout: 15000 });

    await expect(page.getByText('Curated discovery')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#results article').filter({ hasText: /Best value this month|Weekend escapes|Warm-weather picks|Under/i }).first()).toBeVisible();
  });
});
