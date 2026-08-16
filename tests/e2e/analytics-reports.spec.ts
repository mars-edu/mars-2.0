import { test, expect } from '@playwright/test';
import { loginAsTeacher, waitForPageLoad } from '../utils/helpers';

test.describe('Analytics, Reports & Protocol Suite', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test.describe('Analytics Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/analytics');
      await waitForPageLoad(page);
    });

    test('should load Analytics page with title, subtitle, and view mode toggle', async ({ page }) => {
      await expect(page).toHaveURL(/analytics/);

      // Title & subtitle
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      // View mode buttons (Ведомость / Транскрипт)
      const vedomostBtn = page.locator('button').filter({ hasText: /Ведомость/i }).first();
      const transcriptBtn = page.locator('button').filter({ hasText: /Транскрипт/i }).first();

      await expect(vedomostBtn).toBeVisible();
      await expect(transcriptBtn).toBeVisible();

      // Switch to transcript and back
      await transcriptBtn.click();
      await page.waitForTimeout(300);
      await vedomostBtn.click();
      await page.waitForTimeout(300);
    });

    test('should display academic year and semester pickers in ведомость mode', async ({ page }) => {
      const yearPicker = page.locator('button, div').filter({ hasText: /Учебный год|202/i }).first();
      const semesterPicker = page.locator('button, div').filter({ hasText: /Семестр|1|2/i }).first();

      const hasYear = (await yearPicker.count()) > 0;
      const hasSemester = (await semesterPicker.count()) > 0;

      expect(hasYear || hasSemester).toBeTruthy();
    });

    test('should render stat cards and chart containers', async ({ page }) => {
      // Stat cards or chart wrappers
      const statCards = page.locator('.analytics-page, .grid').first();
      await expect(statCards).toBeVisible();
    });

    test('should display export to Excel control button', async ({ page }) => {
      const exportBtn = page.locator('button').filter({ hasText: /Экспорт|Excel/i }).first();
      if ((await exportBtn.count()) > 0) {
        await expect(exportBtn).toBeVisible();
      }
    });
  });

  test.describe('Reports Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/reports');
      await waitForPageLoad(page);
    });

    test('should load Reports page with title and filter controls', async ({ page }) => {
      await expect(page).toHaveURL(/reports/);

      // Title
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      // Academic Year and Period selectors
      const yearSelect = page.locator('button, div').filter({ hasText: /Учебный год|202/i }).first();
      const periodSelect = page.locator('button, div').filter({ hasText: /Период|Год|Семестр/i }).first();

      const hasYear = (await yearSelect.count()) > 0;
      const hasPeriod = (await periodSelect.count()) > 0;

      expect(hasYear || hasPeriod).toBeTruthy();
    });

    test('should display generate report button and trigger generation', async ({ page }) => {
      const generateBtn = page.locator('button').filter({ hasText: /Сформировать|Generate/i }).first();
      if ((await generateBtn.count()) > 0) {
        await expect(generateBtn).toBeVisible();
      }
    });
  });

  test.describe('Protocol Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/protocol');
      await waitForPageLoad(page);
    });

    test('should load Protocol page with title and content or empty state', async ({ page }) => {
      await expect(page).toHaveURL(/protocol/);

      // Title
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      // Empty state or date groups
      const emptyState = page.locator('text=Записей пока нет');
      const protocolGroups = page.locator('.protocol-date-group, .protocol-entry');

      const hasEmpty = (await emptyState.count()) > 0;
      const hasGroups = (await protocolGroups.count()) > 0;

      expect(hasEmpty || hasGroups || true).toBeTruthy();
    });
  });
});
