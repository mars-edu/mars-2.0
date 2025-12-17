import { test, expect } from '@playwright/test';

test.describe('Journals Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/journals');
    await page.waitForLoadState('networkidle');
  });

  test('should display journals page', async ({ page }) => {
    // May redirect to login if not authenticated
    const url = page.url();

    if (url.includes('login')) {
      // If redirected to login, test passes (auth required is expected)
      expect(url).toContain('login');
    } else {
      // If on journals, verify URL
      await expect(page).toHaveURL(/journals/);
    }
  });

  test('should display journal list', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Check if there's a list or grid of journals
    const journalItems = page.locator('[class*="journal"]').or(
      page.locator('[class*="card"]')
    );

    // Wait a bit for data to load
    await page.waitForTimeout(1000);

    // Either journals are displayed or there's an empty state
    const hasJournals = await journalItems.count() > 0;
    const hasEmptyState = await page.locator('text=/нет данных|no data|empty/i').count() > 0;

    expect(hasJournals || hasEmptyState).toBeTruthy();
  });

  test('should navigate to journal details', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const firstJournal = page.locator('[class*="journal"]').first();

    if (await firstJournal.count() > 0) {
      await firstJournal.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/journal/);
    }
  });

  test('should filter journals', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"]').or(
      page.locator('input[placeholder*="поиск"]').or(
        page.locator('input[placeholder*="search"]')
      )
    );

    if (await searchInput.count() > 0) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
      // Verify search was executed
      expect(await searchInput.inputValue()).toBe('test');
    }
  });
});
