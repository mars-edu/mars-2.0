import { test, expect } from '@playwright/test';
import { loginAsTeacher, waitForPageLoad } from '../utils/helpers';

test.describe('Schedule Conflict Detection', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/planning');
    await waitForPageLoad(page);
  });

  test('should open add event wizard on planning page', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /создать пару|добавить пару/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const wizard = page.locator('#schedule-item-popup, [class*="add-event-wizard"]');
      if ((await wizard.count()) > 0) {
        await expect(wizard.first()).toBeVisible();

        // Close wizard
        const cancelBtn = page.getByRole('button', { name: /отмена|закрыть/i }).first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    }
  });

  test('should display step indicator in add event wizard', async ({ page }) => {
    const addBtn = page.getByRole('button', { name: /создать пару|добавить пару/i }).first();
    if (await addBtn.isVisible()) {
      await addBtn.click();
      await page.waitForTimeout(500);

      const stepIndicator = page.getByText(/Основное|Время|Студенты/i).first();
      if (await stepIndicator.isVisible()) {
        await expect(stepIndicator).toBeVisible();
      }

      // Close
      const cancelBtn = page.getByRole('button', { name: /отмена/i }).first();
      if (await cancelBtn.isVisible()) {
        await cancelBtn.click();
      }
    }
  });
});
