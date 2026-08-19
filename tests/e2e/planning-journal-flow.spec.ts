import { test, expect } from "@playwright/test";
import { loginAsTeacher, waitForPageLoad } from "../utils/helpers";

test.describe("Planning → Journal Flow", () => {
  test.setTimeout(35000);

  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
    await page.goto("/planning");
    await waitForPageLoad(page);
  });

  test("should load planning page with header, calendar controls and create button", async ({ page }) => {
    await expect(page).toHaveURL(/planning/);

    const title = page.locator('h1').filter({ hasText: /Планирование|Календарь/i }).first();
    await expect(title).toBeVisible({ timeout: 15000 });

    const createBtn = page.locator('#add-button, button:has-text("Создать"), .fab').first();
    await expect(createBtn).toBeVisible({ timeout: 15000 });
  });

  test("should open and interact with add event wizard from planning page", async ({ page }) => {
    const createBtn = page.locator('#add-button, button:has-text("Создать")').first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(500);

      const wizard = page.locator('#add-event-popup, .add-event-popup, .popup.modal-in').first();
      await expect(wizard).toBeVisible({ timeout: 15000 });

      // Step 1: Discipline selection
      const disciplineSelect = wizard.locator('#event-rupEntry-generic, button:has-text("Выберите дисциплину")').first();
      await expect(disciplineSelect).toBeVisible({ timeout: 15000 });

      // Close wizard
      await page.keyboard.press("Escape");
    }
  });

  test("should navigate to journals from planning and verify journal grid", async ({ page }) => {
    await page.goto("/journals");
    await waitForPageLoad(page);

    await expect(page).toHaveURL(/journals/);
    const content = page.locator('.page-content, .journal-grid, table, [class*="journal"]').first();
    await expect(content).toBeVisible({ timeout: 15000 });
  });
});
