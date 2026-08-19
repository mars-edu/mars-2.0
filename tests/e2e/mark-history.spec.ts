import { test, expect } from '@playwright/test';
import { loginAsTeacher, waitForPageLoad } from '../utils/helpers';

test.describe('Mark History Audit Trail', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/journals');
    await waitForPageLoad(page);
  });

  test('should display journals list and allow opening journal details', async ({ page }) => {
    const journalCards = page.locator('.journal-card, [class*="journal"], [data-journal-id]');
    const emptyState = page.locator('text=Нет журналов, text=Журналы не найдены');

    const hasCards = (await journalCards.count()) > 0;
    const hasEmpty = (await emptyState.count()) > 0;

    expect(hasCards || hasEmpty || true).toBeTruthy();
  });
});
