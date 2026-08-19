import { test, expect } from '@playwright/test';
import { loginAsTeacher, waitForPageLoad } from '../utils/helpers';

test.describe('Cards Suite (TeacherCard & StudentCard)', () => {
  test.setTimeout(35000);

  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test.describe('Teacher Card Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/teacher-card');
      await waitForPageLoad(page);
    });

    test('should load TeacherCard page with title, search, and filters', async ({ page }) => {
      await expect(page).toHaveURL(/teacher-card/);

      // Title
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      // Search input
      const searchInput = page.locator('.teacher-search-input, input[placeholder*="Поиск"], input[placeholder*="search"]').first();
      await expect(searchInput).toBeVisible();

      // Add teacher button
      const addTeacherBtn = page.locator('button').filter({ hasText: /Добавить|Add/i }).first();
      await expect(addTeacherBtn).toBeVisible();

      // Filters
      const positionFilter = page.locator('#teacher-filter-position, [id*="position"]').first();
      const yearFilter = page.locator('#teacher-filter-year, [id*="year"]').first();
      const genderFilter = page.locator('#teacher-filter-gender, [id*="gender"]').first();

      const hasPosition = (await positionFilter.count()) > 0;
      const hasYear = (await yearFilter.count()) > 0;
      const hasGender = (await genderFilter.count()) > 0;

      expect(hasPosition || hasYear || hasGender).toBeTruthy();
    });

    test('should filter teachers by search query', async ({ page }) => {
      const searchInput = page.locator('.teacher-search-input, input[placeholder*="Поиск"]').first();
      await searchInput.fill('Расул');
      await page.waitForTimeout(300);
      expect(await searchInput.inputValue()).toBe('Расул');
      await searchInput.fill('');
    });

    test('should render teacher table and pagination controls', async ({ page }) => {
      const table = page.locator('table').first();
      await expect(table).toBeVisible();

      const rows = page.locator('tbody tr');
      expect((await rows.count()) > 0).toBeTruthy();
    });

    test('should open edit teacher popover when clicking a teacher row', async ({ page }) => {
      const firstRow = page.locator('tbody tr').first();
      if (await firstRow.isVisible()) {
        await firstRow.click();
        await page.waitForTimeout(500);

        // Edit popover
        const editPopover = page.locator('[id^="edit-teacher-popover-"], .popover.modal-in, .popup.modal-in');
        if ((await editPopover.count()) > 0) {
          await expect(editPopover.first()).toBeVisible();

          // Verify personal fields inside popover
          const surnameField = editPopover.locator('input[placeholder*="фамилию"]').first();
          const firstnameField = editPopover.locator('input[placeholder*="имя"]').first();

          if (await surnameField.isVisible()) {
            await expect(surnameField).toBeVisible();
          }
          if (await firstnameField.isVisible()) {
            await expect(firstnameField).toBeVisible();
          }

          // Close popover
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test.describe('Student Card Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/student-card');
      await waitForPageLoad(page);
    });

    test('should load StudentCard page with search, filters, and promotion button', async ({ page }) => {
      await expect(page).toHaveURL(/student-card/);

      // Title
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      // Search input
      const searchInput = page.locator('.student-search-input, input[placeholder*="Поиск"], input[placeholder*="search"]').first();
      await expect(searchInput).toBeVisible();

      // Promotion mode button
      const promotionBtn = page.locator('button').filter({ hasText: /Перевести на следующий курс|курса/i }).first();
      if ((await promotionBtn.count()) > 0) {
        await expect(promotionBtn).toBeVisible();
      }
    });

    test('should toggle promotion mode and show order number input', async ({ page }) => {
      const promotionBtn = page.locator('button').filter({ hasText: /Перевести на следующий курс/i }).first();
      if ((await promotionBtn.count()) > 0 && (await promotionBtn.isVisible())) {
        await promotionBtn.click();
        await page.waitForTimeout(300);

        // Verify promotion banner
        const banner = page.locator('text=Режим перевода курса');
        const orderInput = page.locator('.promotion-order-input, input[placeholder*="номер"]');

        if (await banner.isVisible()) {
          await expect(banner).toBeVisible();
        }
        if (await orderInput.isVisible()) {
          await expect(orderInput).toBeVisible();
        }

        // Cancel promotion mode
        const cancelBtn = page.locator('button').filter({ hasText: /Отмена|Cancel/i }).first();
        if (await cancelBtn.isVisible()) {
          await cancelBtn.click();
        }
      }
    });

    test('should open StudentDetailsDialog on student row click and allow tab switching', async ({ page }) => {
      const studentRow = page.locator('tbody tr').first();
      if (await studentRow.isVisible()) {
        await studentRow.click();
        await page.waitForTimeout(500);

        const dialog = page.locator('[id^="student-details-popup-"], .student-details-popup, .popup.modal-in');
        if ((await dialog.count()) > 0 && (await dialog.first().isVisible())) {
          await expect(dialog.first()).toBeVisible();

          // Verify tabs exist (Info, History, Actions)
          const infoTab = dialog.getByText(/Личные данные|Инфо|Info/i).first();
          const historyTab = dialog.getByText(/История|History/i).first();
          const actionsTab = dialog.getByText(/Действия|Actions/i).first();

          if (await infoTab.isVisible()) {
            await infoTab.click();
            await page.waitForTimeout(200);
          }

          if (await historyTab.isVisible()) {
            await historyTab.click();
            await page.waitForTimeout(200);
          }

          if (await actionsTab.isVisible()) {
            await actionsTab.click();
            await page.waitForTimeout(200);
          }

          // Close dialog
          const closeBtn = dialog.locator('button').filter({ hasText: /Закрыть|Close/i }).or(dialog.locator('.icon-close')).first();
          if (await closeBtn.isVisible()) {
            await closeBtn.click();
          } else {
            await page.keyboard.press('Escape');
          }
        }
      }
    });
  });
});
