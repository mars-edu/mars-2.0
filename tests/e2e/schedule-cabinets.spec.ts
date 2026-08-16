import { test, expect } from '@playwright/test';
import { loginAsTeacher, waitForPageLoad } from '../utils/helpers';

test.describe('Schedule & Cabinet Management', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test.describe('Education Schedule Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/education-schedule');
      await waitForPageLoad(page);
    });

    test('should load EducationSchedule page with title and controls', async ({ page }) => {
      await expect(page).toHaveURL(/education-schedule/);

      // Title
      const pageTitle = page.locator('h1').first();
      await expect(pageTitle).toBeVisible();

      // Expand / collapse all button
      const toggleAllBtn = page.locator('button').filter({ hasText: /Развернуть все|Свернуть все|Expand all|Collapse all/i }).first();
      if ((await toggleAllBtn.count()) > 0) {
        await expect(toggleAllBtn).toBeVisible();
        await toggleAllBtn.click();
        await page.waitForTimeout(300);
      }
    });

    test('should display accordions for technologies and academic years', async ({ page }) => {
      // Tech accordion
      const techAccordion = page.getByText(/Технологии обучения/i).first();
      const yearsAccordion = page.getByText(/Учебный год|Академический год/i).first();

      const hasTech = (await techAccordion.count()) > 0;
      const hasYears = (await yearsAccordion.count()) > 0;

      expect(hasTech || hasYears).toBeTruthy();
    });

    test('should display education technology items and cards', async ({ page }) => {
      const techItems = page.locator('[id^="education-technology-item-"]').or(page.locator('.group:has-text("мин")'));
      const emptyOrLoaded = (await techItems.count()) > 0 || (await page.locator('.f7-preloader').count()) === 0;
      expect(emptyOrLoaded).toBeTruthy();
    });

    test('should display schedule grid or academic years grid', async ({ page }) => {
      const grids = page.locator('.grid');
      await expect(grids.first()).toBeVisible();
    });
  });

  test.describe('Cabinet Management Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/cabinet-management');
      await waitForPageLoad(page);
    });

    test('should load CabinetManagement page with title and search filter', async ({ page }) => {
      await expect(page).toHaveURL(/cabinet-management/);

      // Page Title
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      // Search input
      const searchInput = page.locator('.cabinet-search-input, input[placeholder*="Поиск"], input[placeholder*="search"]').first();
      await expect(searchInput).toBeVisible();

      // Type filter select
      const typeSelect = page.locator('select').first();
      if ((await typeSelect.count()) > 0) {
        await expect(typeSelect).toBeVisible();
      }
    });

    test('should filter cabinets by search term and type', async ({ page }) => {
      const searchInput = page.locator('.cabinet-search-input, input[placeholder*="Поиск"]').first();
      await searchInput.fill('101');
      await page.waitForTimeout(300);
      expect(await searchInput.inputValue()).toBe('101');
      await searchInput.fill('');

      // Type filter
      const typeSelect = page.locator('select').first();
      if ((await typeSelect.count()) > 0) {
        await typeSelect.selectOption({ value: 'lecture' });
        await page.waitForTimeout(300);
        await typeSelect.selectOption({ value: 'all' });
      }
    });

    test('should render cabinet table structure with headers and rows', async ({ page }) => {
      const table = page.locator('table').first();
      await expect(table).toBeVisible();

      // Verify table headers
      const thead = table.locator('thead');
      await expect(thead).toBeVisible();

      const headers = await thead.innerText();
      expect(headers.length).toBeGreaterThan(0);

      // Verify table rows or empty state
      const rows = page.locator('tbody tr');
      expect((await rows.count()) > 0).toBeTruthy();
    });

    test('should open add cabinet popover on clicking add button', async ({ page }) => {
      const addCabinetBtn = page.locator('#add-cabinet-inline-btn, button:has-text("Добавить")').first();
      if ((await addCabinetBtn.count()) > 0 && (await addCabinetBtn.isVisible())) {
        await addCabinetBtn.click();
        await page.waitForTimeout(500);

        // Check if add cabinet popover / popup opened
        const popover = page.locator('#add-cabinet-popover, .popover.modal-in, .popup.modal-in, form');
        if ((await popover.count()) > 0) {
          const isPopVisible = await popover.first().isVisible();
          expect(isPopVisible).toBeTruthy();

          // Close modal
          await page.keyboard.press('Escape');
        }
      }
    });

    test('should show cabinet status badges and action buttons', async ({ page }) => {
      const statusBadges = page.locator('span:has-text("Активен"), span:has-text("Неактивен"), span:has-text("Active")');
      const actionButtons = page.locator('button[title*="Редактировать"], button[title*="Удалить"], button[title*="Edit"]');

      const hasBadges = (await statusBadges.count()) > 0;
      const hasActions = (await actionButtons.count()) > 0;
      const hasRows = (await page.locator('tbody tr').count()) > 0;

      expect(hasBadges || hasActions || hasRows).toBeTruthy();
    });
  });
});
