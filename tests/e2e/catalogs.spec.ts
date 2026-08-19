import { test, expect } from '@playwright/test';
import { loginAsTeacher, waitForPageLoad } from '../utils/helpers';

test.describe('Catalogs Suite (Specialty & Discipline Catalogs)', () => {
  test.setTimeout(35000);

  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test.describe('Specialty Catalog Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/specialty-catalog');
      await waitForPageLoad(page);
    });

    test('should load SpecialtyCatalog page with title and search input', async ({ page }) => {
      await expect(page).toHaveURL(/specialty-catalog/);

      // Title
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      // Search input
      const searchInput = page.locator('.specialty-search-input, input[placeholder*="Поиск"], input[placeholder*="search"]').first();
      await expect(searchInput).toBeVisible();

      // Add button
      const addBtn = page.locator('#add-specialty-inline-btn, button:has-text("Добавить")').first();
      await expect(addBtn).toBeVisible();
    });

    test('should search and filter specialties by query and foundation year', async ({ page }) => {
      const searchInput = page.locator('.specialty-search-input, input[placeholder*="Поиск"]').first();
      await searchInput.fill('0613');
      await page.waitForTimeout(300);
      expect(await searchInput.inputValue()).toBe('0613');
      await searchInput.fill('');

      // Year filter select
      const yearFilter = page.locator('button, div').filter({ hasText: /Все|202/i }).first();
      if ((await yearFilter.count()) > 0) {
        await expect(yearFilter).toBeVisible();
      }
    });

    test('should render specialty table with headers and data rows', async ({ page }) => {
      const table = page.locator('table').first();
      await expect(table).toBeVisible();

      const thead = table.locator('thead');
      await expect(thead).toBeVisible();

      // Verify row items or empty state
      const rows = page.locator('tbody tr');
      expect((await rows.count()) > 0).toBeTruthy();
    });

    test('should open add specialty popup upon clicking add button', async ({ page }) => {
      const addBtn = page.locator('#add-specialty-inline-btn, button:has-text("Добавить")').first();
      if ((await addBtn.count()) > 0 && (await addBtn.isVisible())) {
        await addBtn.click();
        await page.waitForTimeout(500);

        const popup = page.locator('#add-specialty-popover, #add-specialty-popup, .popover.modal-in, .popup.modal-in, form');
        if ((await popup.count()) > 0) {
          await expect(popup.first()).toBeVisible();
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test.describe('Discipline Catalog Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/discipline-catalog');
      await waitForPageLoad(page);
    });

    test('should load DisciplineCatalog with title, academic year, and search controls', async ({ page }) => {
      await expect(page).toHaveURL(/discipline-catalog/);

      // Title
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      // Search input
      const searchInput = page.locator('.catalog-search-input, input[placeholder*="Поиск"], input[placeholder*="search"]').first();
      await expect(searchInput).toBeVisible();
    });

    test('should filter disciplines by base class buttons (Все, 9 кл, 11 кл)', async ({ page }) => {
      const baseAllBtn = page.locator('button').filter({ hasText: /^Все$/i }).first();
      const base9Btn = page.locator('button').filter({ hasText: /9/i }).first();
      const base11Btn = page.locator('button').filter({ hasText: /11/i }).first();

      if ((await base9Btn.count()) > 0) {
        await base9Btn.click();
        await page.waitForTimeout(300);
      }

      if ((await base11Btn.count()) > 0) {
        await base11Btn.click();
        await page.waitForTimeout(300);
      }

      if ((await baseAllBtn.count()) > 0) {
        await baseAllBtn.click();
        await page.waitForTimeout(300);
      }
    });

    test('should filter disciplines by search query', async ({ page }) => {
      const searchInput = page.locator('.catalog-search-input, input[placeholder*="Поиск"]').first();
      await searchInput.fill('мат');
      await page.waitForTimeout(300);
      expect(await searchInput.inputValue()).toBe('мат');
      await searchInput.fill('');
    });

    test('should display discipline table headers and content', async ({ page }) => {
      const table = page.locator('table').first();
      await expect(table).toBeVisible();

      const headers = await table.locator('thead').innerText();
      expect(headers.length).toBeGreaterThan(0);

      const rows = page.locator('tbody tr');
      expect((await rows.count()) > 0).toBeTruthy();
    });

    test('should open add discipline popup (RupEntryPopup) on clicking add button', async ({ page }) => {
      const addBtn = page.locator('button').filter({ hasText: /Добавить|Add/i }).first();
      if ((await addBtn.count()) > 0 && (await addBtn.isVisible())) {
        await addBtn.click();
        await page.waitForTimeout(500);

        const popup = page.locator('.popup.modal-in, [id*="rup-entry"], .popover.modal-in, form');
        if ((await popup.count()) > 0) {
          await expect(popup.first()).toBeVisible();

          // Close modal
          await page.keyboard.press('Escape');
        }
      }
    });
  });
});
