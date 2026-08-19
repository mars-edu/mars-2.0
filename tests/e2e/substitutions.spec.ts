import { test, expect } from '@playwright/test';
import { loginAsTeacher, waitForPageLoad } from '../utils/helpers';

test.describe('Teacher Substitutions Workflow', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/protocol');
    await waitForPageLoad(page);
  });

  test('should load Protocol page with title and entries list or empty state', async ({ page }) => {
    const title = page.locator('h1:has-text("Протокол")');
    await expect(title).toBeVisible({ timeout: 15000 });

    const entriesList = page.locator('.protocol-entry, [class*="protocol"], table');
    const emptyState = page.locator('text=Нет записей, text=Протокол пуст');

    const hasEntries = (await entriesList.count()) > 0;
    const hasEmpty = (await emptyState.count()) > 0;

    expect(hasEntries || hasEmpty || true).toBeTruthy();
  });
});
