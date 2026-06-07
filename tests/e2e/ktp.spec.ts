import { test, expect } from '@playwright/test';

test.describe('KTP Page (Тематические планы)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ktp');
    await page.waitForLoadState('networkidle');
    // Allow reactive watchers to settle
    await page.waitForTimeout(1500);
  });

  test('should display KTP page with correct title', async ({ page }) => {
    const url = page.url();

    if (url.includes('login')) {
      // Unauthenticated — expected in CI without auth state
      expect(url).toContain('login');
      return;
    }

    await expect(page.locator('h1')).toContainText('Тематические планы (КТП)');
  });

  test('should auto-select active academic year from schedule', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) return;

    // The academic year select trigger should show a value (not be empty/placeholder)
    const yearSelect = page.locator('[name="academic-year"]').locator('..');
    const yearTrigger = yearSelect.locator('button.select-trigger');

    // Wait for the reactive watcher to populate
    await page.waitForTimeout(2000);

    const triggerText = await yearTrigger.innerText();
    // Should not still be showing the placeholder text
    expect(triggerText).not.toContain('Учебный год');
    expect(triggerText.trim().length).toBeGreaterThan(0);
  });

  test('should auto-select current active semester', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) return;

    await page.waitForTimeout(2000);

    const semesterTrigger = page.locator('[name="semester"]').locator('..').locator('button.select-trigger');
    const triggerText = await semesterTrigger.innerText();

    // Should not still show placeholder
    expect(triggerText).not.toContain('Семестр');
    expect(triggerText.trim().length).toBeGreaterThan(0);
  });

  test('should display "Создать" button and it should be enabled after load', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) return;

    await page.waitForTimeout(2000);

    const createBtn = page.locator('button', { hasText: 'Создать' });
    await expect(createBtn).toBeVisible();
    await expect(createBtn).not.toBeDisabled();
    // Should have emerald styling (not muted/disabled)
    await expect(createBtn).not.toHaveClass(/bg-muted/);
  });

  test('should open Add KTP form on "Создать" click', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) return;

    await page.waitForTimeout(2000);

    const createBtn = page.locator('button', { hasText: 'Создать' });
    await createBtn.click();
    await page.waitForTimeout(500);

    // GuardedPopover with id="add-ktp-item-popover" should appear
    const popover = page.locator('#add-ktp-item-popover');
    await expect(popover).toBeVisible();

    // Check popover title
    await expect(popover.locator('text=Создание КТП')).toBeVisible();
  });

  test('should have disabled "Создать" (submit) button in form when nothing is selected', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) return;

    await page.waitForTimeout(2000);

    await page.locator('button', { hasText: 'Создать' }).click();
    await page.waitForTimeout(500);

    const popover = page.locator('#add-ktp-item-popover');
    await expect(popover).toBeVisible();

    // The save button inside the popover footer should be disabled (nothing selected yet)
    const saveBtn = popover.locator('button', { hasText: 'Создать' }).last();
    await expect(saveBtn).toBeDisabled();
  });

  test('should show info hint when no RUP entry is selected', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) return;

    await page.waitForTimeout(2000);

    await page.locator('button', { hasText: 'Создать' }).click();
    await page.waitForTimeout(500);

    const popover = page.locator('#add-ktp-item-popover');
    await expect(popover).toBeVisible();

    // Info hint should be visible when nothing selected
    await expect(popover.locator('text=Тематический план будет привязан')).toBeVisible();
  });

  test('should close Add form via cancel button without saving', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) return;

    await page.waitForTimeout(2000);

    await page.locator('button', { hasText: 'Создать' }).click();
    await page.waitForTimeout(500);

    const popover = page.locator('#add-ktp-item-popover');
    await expect(popover).toBeVisible();

    // Click the cancel/close button
    const cancelBtn = popover.locator('button', { hasText: /отмена|cancel/i });
    await cancelBtn.click();
    await page.waitForTimeout(500);

    await expect(popover).not.toBeVisible();
  });

  test('should display KTP cards or empty state', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) return;

    await page.waitForTimeout(2000);

    const cards = page.locator('.rounded-2xl.border.border-border');
    const emptyState = page.locator('text=Нет данных для отображения');
    const loading = page.locator('text=Загрузка данных...');

    // Wait until not loading
    await expect(loading).not.toBeVisible({ timeout: 10000 });

    const hasCards = (await cards.count()) > 0;
    const hasEmpty = (await emptyState.count()) > 0;

    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test('should filter KTP cards with search input', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) return;

    await page.waitForTimeout(2000);

    // Check if there are any cards first
    const cards = page.locator('[class*="rounded-2xl"][class*="border-border"]');
    const cardCount = await cards.count();

    if (cardCount === 0) {
      // Nothing to filter, skip
      return;
    }

    const searchInput = page.locator('input[placeholder*="Поиск"]');
    await expect(searchInput).toBeVisible();

    // Type something unlikely to match to get empty state
    await searchInput.fill('zzzzZZZZnonexistent12345');
    await page.waitForTimeout(500);

    await expect(page.locator('text=Нет данных для отображения')).toBeVisible();

    // Clear search — cards should come back
    await searchInput.clear();
    await page.waitForTimeout(500);
    expect(await cards.count()).toBeGreaterThan(0);
  });

  test('should not close popover when clicking Select dropdown inside form', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) return;

    await page.waitForTimeout(2000);

    await page.locator('button', { hasText: 'Создать' }).click();
    await page.waitForTimeout(500);

    const popover = page.locator('#add-ktp-item-popover');
    await expect(popover).toBeVisible();

    // Click the RUP entry select trigger to open the dropdown
    const selectTrigger = popover.locator('#ktp-item-rupEntry').locator('..');
    await selectTrigger.locator('button.select-trigger').click();
    await page.waitForTimeout(300);

    // Dropdown should be open (rendered via Teleport to body)
    const dropdown = page.locator('.dropdown-panel');
    await expect(dropdown).toBeVisible();

    // The popover itself must still be visible — the key bug fix check
    await expect(popover).toBeVisible();

    // Close dropdown by pressing Escape
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    // Popover should STILL be open after closing the dropdown
    await expect(popover).toBeVisible();
  });

  test("create popover shows RUP-flow selects and color swatches", async ({ page }) => {
    const url = page.url();
    if (url.includes("login")) return;

    await page.waitForTimeout(2000);

    await page.locator("button", { hasText: "Создать" }).first().click();
    await page.waitForTimeout(500);
    const popover = page.locator("#add-ktp-item-popover");
    await expect(popover).toBeVisible();

    // Cascade selects: study year, specialty, discipline
    await expect(popover.locator('[name="ktp-item-academic-year"]')).toBeAttached();
    await expect(popover.locator('[name="ktp-item-specialty"]')).toBeAttached();
    await expect(popover.locator('[name="ktp-item-rupEntry"]')).toBeAttached();

    // Color swatches present, language pills gone
    await expect(popover.getByTestId("ktp-color-FACC15")).toBeVisible();
    await expect(popover.locator('[data-testid^="ktp-lang-"]')).toHaveCount(0);
  });

  test('card action menu opens with edit and delete entries', async ({ page }) => {
    const url = page.url();
    if (url.includes('login')) return;

    await page.waitForTimeout(2000);

    const menuButtons = page.locator('[data-testid^="ktp-card-menu-"]');
    if ((await menuButtons.count()) === 0) return; // no cards in this environment

    await menuButtons.first().click();
    await page.waitForTimeout(300);

    await expect(page.getByRole('button', { name: 'Редактировать' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Удалить' })).toBeVisible();

    // Edit opens the edit popover
    await page.getByRole('button', { name: 'Редактировать' }).click();
    await page.waitForTimeout(500);

    await expect(page.locator('#ktp-edit-popover')).toBeVisible();
  });

  test("card click opens in-page detail view and back returns to list", async ({ page }) => {
    const url = page.url();
    if (url.includes("login")) return;

    await page.waitForTimeout(2000);

    const cards = page.getByTestId("ktp-card");
    if ((await cards.count()) === 0) return; // no data in this environment

    await cards.first().click();
    await expect(page.getByTestId("ktp-detail-back")).toBeVisible();
    await expect(page.getByText("Тема занятия")).toBeVisible();
    await expect(page.getByTestId("ktp-detail-add")).toBeVisible();

    await page.getByTestId("ktp-detail-back").click();
    await expect(page.getByRole("button", { name: "Создать" })).toBeVisible();
  });
});
