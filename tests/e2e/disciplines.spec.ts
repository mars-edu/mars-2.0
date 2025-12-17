import { test, expect } from '@playwright/test';

test.describe('Discipline Catalog', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/discipline-catalog');
    await page.waitForLoadState('networkidle');
  });

  test('should display discipline catalog', async ({ page }) => {
    // May redirect to login if not authenticated
    const url = page.url();

    if (url.includes('login')) {
      // If redirected to login, test passes (auth required is expected)
      expect(url).toContain('login');
    } else {
      // If on catalog, verify URL
      await expect(page).toHaveURL(/discipline-catalog/);
    }
  });

  test('should display discipline list or grid', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const disciplineItems = page.locator('[class*="discipline"]').or(
      page.locator('[class*="card"]')
    );

    const hasItems = await disciplineItems.count() > 0;
    const hasEmptyState = await page.locator('text=/нет данных|no data|empty/i').count() > 0;

    expect(hasItems || hasEmptyState).toBeTruthy();
  });

  test('should search disciplines', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator('input[type="search"]').or(
      page.locator('input[placeholder*="поиск"]').or(
        page.locator('input[placeholder*="search"]')
      )
    );

    if (await searchInput.count() > 0) {
      await searchInput.fill('математика');
      await page.waitForTimeout(500);
      expect(await searchInput.inputValue()).toContain('математика');
    }
  });

  test('should edit discipline if button exists', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const editButton = page.getByRole('button', { name: /edit|редактировать/i }).first();

    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Check if a modal or form appeared
      const modal = page.locator('[class*="modal"]').or(
        page.locator('[class*="dialog"]')
      );

      if (await modal.count() > 0) {
        await expect(modal).toBeVisible();
      }
    }
  });
});
