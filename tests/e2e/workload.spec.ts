import { test, expect } from '@playwright/test';
import { loginAsTeacher, waitForPageLoad } from '../utils/helpers';

test.describe('Workload Management', () => {
  test.setTimeout(35000);

  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto('/workload-management');
    await waitForPageLoad(page);
    await page.locator('h1:has-text("Управление нагрузкой")').waitFor({ state: 'visible', timeout: 20000 });
  });

  test('should load WorkloadManagement page with header and sidebar', async ({ page }) => {
    // Check URL
    await expect(page).toHaveURL(/workload-management/);

    // Verify main headings
    const title = page.locator('h1:has-text("Управление нагрузкой")');
    await expect(title).toBeVisible();

    const subtitle = page.locator('text=Планирование и учет учебных часов');
    await expect(subtitle).toBeVisible();

    // Verify presence of sidebar
    const sidebar = page.locator('aside, complementary, nav').first();
    await expect(sidebar).toBeVisible();
  });

  test('should display teacher selector and academic year selector', async ({ page }) => {
    // Check teacher selection dropdown container
    const teacherSelect = page.locator('button, div').filter({ hasText: /Выберите преподавателя/i }).first();
    const academicYearSelect = page.locator('button, div').filter({ hasText: /Учебный год|202/i }).first();

    await expect(teacherSelect.or(academicYearSelect)).toBeVisible({ timeout: 15000 });
  });

  test('should show empty teacher state or summary table when teacher is selected', async ({ page }) => {
    const emptyPrompt = page.locator('text=Выберите преподавателя');
    const tableElement = page.locator('table');

    await expect(emptyPrompt.or(tableElement).first()).toBeVisible({ timeout: 15000 });
  });

  test('should display saved workloads section with search input and download all button', async ({ page }) => {
    // Saved workloads heading
    const savedHeading = page.locator('h2:has-text("Сохраненная нагрузка")');
    await expect(savedHeading).toBeVisible({ timeout: 15000 });

    // Search input for saved workloads
    const searchInput = page.locator('input[placeholder*="Поиск по ФИО или дисциплине"]').first();
    await expect(searchInput).toBeVisible();

    // Download all button
    const downloadAllBtn = page.locator('button').filter({ hasText: /Скачать все/i }).first();
    if ((await downloadAllBtn.count()) > 0) {
      await expect(downloadAllBtn).toBeVisible();
    }

    // Check search functionality
    await searchInput.fill('Тест');
    await page.waitForTimeout(300);
    expect(await searchInput.inputValue()).toBe('Тест');
    await searchInput.fill('');
  });

  test('should display saved workload cards or empty state in saved workloads section', async ({ page }) => {
    const workloadCards = page.locator('.bg-card').filter({ hasText: /Всего часов/i });
    const emptyState = page.locator('text=Нагрузка не найдена');

    await expect(workloadCards.or(emptyState).first()).toBeVisible({ timeout: 15000 });
  });

  test('should interact with add subject popup when adding subject', async ({ page }) => {
    const addSubjectBtn = page.locator('button:has-text("Добавить предмет")').first();

    if ((await addSubjectBtn.count()) > 0 && (await addSubjectBtn.isVisible())) {
      await addSubjectBtn.click();
      await page.waitForTimeout(500);

      const popup = page.locator('#workload-add-subject-popup, .popup.modal-in, [id*="add-subject"]');
      if ((await popup.count()) > 0) {
        await expect(popup.first()).toBeVisible();

        const closeBtn = popup.locator('button').filter({ hasText: /закрыть|отмена/i }).or(popup.locator('.icon-close, [aria-label*="close"]')).first();
        if ((await closeBtn.count()) > 0) {
          await closeBtn.click();
        }
      }
    }
  });

  test('should open workload actions dropdown menu on saved cards if present', async ({ page }) => {
    const actionBtns = page.locator('button[title="Действия"]');
    if ((await actionBtns.count()) > 0) {
      const firstActionBtn = actionBtns.first();
      await firstActionBtn.click();
      await page.waitForTimeout(300);

      // Check dropdown options
      const viewOption = page.locator('button:has-text("Просмотр нагрузки")');
      const editOption = page.locator('button:has-text("Редактировать нагрузку")');

      const hasView = (await viewOption.count()) > 0;
      const hasEdit = (await editOption.count()) > 0;

      expect(hasView || hasEdit).toBeTruthy();

      await page.keyboard.press('Escape');
    }
  });
});
