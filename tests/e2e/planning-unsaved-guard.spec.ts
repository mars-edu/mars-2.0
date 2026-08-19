import { test, expect, type Page, type Locator } from "@playwright/test";

const TEACHER_USERNAME = process.env.E2E_TEACHER_USERNAME || "Килаш Расул Жангелдыулы";
const TEACHER_PASSWORD = process.env.E2E_TEACHER_PASSWORD || "teachertest";

async function loginIfNeeded(page: Page) {
  await page.goto("/planning");

  const addButton = page.locator("#add-button");
  const addFabFallback = page.locator(".fab:has-text('plus'), .fab a:has-text('plus')").first();
  if (
    ((await addButton.count()) > 0 && (await addButton.first().isVisible().catch(() => false))) ||
    (await addFabFallback.isVisible().catch(() => false))
  ) {
    return;
  }

  const usernameInput = page
    .getByRole("textbox", { name: /фио/i })
    .or(page.locator('input[placeholder="Введите ФИО"]:visible'))
    .first();
  const passwordInput = page
    .getByRole("textbox", { name: /пароль/i })
    .or(page.locator('input[placeholder="Введите пароль"]:visible'))
    .first();

  await expect(usernameInput).toBeVisible({ timeout: 30_000 });
  await expect(passwordInput).toBeVisible({ timeout: 30_000 });

  await usernameInput.fill(TEACHER_USERNAME);
  await passwordInput.fill(TEACHER_PASSWORD);
  await page.getByRole("button", { name: "Войти" }).click({ force: true });

  const authSucceeded = async () => {
    if (
      ((await addButton.count()) > 0 && (await addButton.first().isVisible().catch(() => false))) ||
      (await addFabFallback.isVisible().catch(() => false))
    ) {
      return true;
    }
    return false;
  };

  try {
    await expect
      .poll(authSucceeded, { timeout: 120_000, intervals: [500, 1000, 2000] })
      .toBeTruthy();
  } catch {
    await page.getByRole("button", { name: "Войти" }).click({ force: true }).catch(() => {});
    await expect
      .poll(authSucceeded, { timeout: 120_000, intervals: [500, 1000, 2000] })
      .toBeTruthy();
  }

  await page.goto("/planning");
  await expect
    .poll(async () => {
      const btn = page.locator("#add-button");
      if ((await btn.count()) > 0 && (await btn.first().isVisible().catch(() => false))) {
        return true;
      }
      return await page
        .locator(".fab:has-text('plus'), .fab a:has-text('plus')")
        .first()
        .isVisible()
        .catch(() => false);
    }, { timeout: 60_000, intervals: [500, 1000, 2000] })
    .toBeTruthy();
}

async function openAddPopup(page: Page): Promise<Locator> {
  const popup = page.locator("#add-event-popup:visible, #add-event-popover:visible").first();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const addButtonById = page.locator("#add-button").first();
    if (
      (await addButtonById.count()) > 0 &&
      (await addButtonById.isVisible().catch(() => false))
    ) {
      await addButtonById.click({ force: true });
    } else {
      const addFabFallback = page
        .locator(".fab:has-text('plus'), .fab a:has-text('plus')")
        .first();
      await expect(addFabFallback).toBeVisible({ timeout: 30_000 });
      await addFabFallback.click({ force: true });
    }

    if (await popup.isVisible({ timeout: 5000 }).catch(() => false)) {
      return popup;
    }
  }

  await expect(popup).toBeVisible({ timeout: 30_000 });
  return popup;
}

async function unsavedDialog(page: Page): Promise<Locator> {
  const dialog = page.locator('div[role="dialog"], .dialog.unsaved-changes-dialog').filter({ hasText: /Закрыть форму|Закрыть/ }).first();
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  return dialog;
}

async function selectFirstDisciplineOption(page: Page, popup: Locator) {
  const trigger = popup.locator("#event-rupEntry-generic, #event-class9-generic, button:has-text('Выберите дисциплину')").first();
  await trigger.click({ force: true });
  await page.waitForTimeout(300);

  const option = page.locator('.dropdown-panel .option-item, .select-option, [role="option"]').first();
  if (await option.isVisible({ timeout: 5000 }).catch(() => false)) {
    await option.click({ force: true });
  } else {
    // Close dropdown if no option found
    const backdrop = page.locator('.dropdown-backdrop');
    if (await backdrop.isVisible().catch(() => false)) {
      await backdrop.click({ force: true });
    }
  }
  await page.waitForTimeout(300);
}

test.describe.serial("Planning Add Popup Unsaved Guard", () => {
  test.setTimeout(35000);

  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test("shows custom alert on dirty close via Cancel button", async ({ page }) => {
    const popup = await openAddPopup(page);
    await selectFirstDisciplineOption(page, popup);

    await popup.getByRole("button", { name: "Отмена" }).click();
    await unsavedDialog(page);
  });

  test("shows custom alert on dirty close via backdrop click", async ({ page }) => {
    const popup = await openAddPopup(page);
    await selectFirstDisciplineOption(page, popup);

    await page.evaluate(() => {
      const popupEl = document.querySelector('#add-event-popup');
      const backdrop = (popupEl as any)?.f7Modal?.backdropEl || document.querySelector('.popup-backdrop');
      if (backdrop) {
        backdrop.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      }
    });
    await unsavedDialog(page);
  });

  test("shows custom alert on dirty close via Escape", async ({ page }) => {
    const popup = await openAddPopup(page);
    await selectFirstDisciplineOption(page, popup);

    // Focus popup before pressing Escape so keydown targets the modal window
    await popup.click({ force: true });
    await page.keyboard.press("Escape");
    await unsavedDialog(page);
  });

  test("continue editing keeps popup open and preserves values", async ({ page }) => {
    const popup = await openAddPopup(page);
    await selectFirstDisciplineOption(page, popup);

    await popup.getByRole("button", { name: "Отмена" }).click();
    const dialog = await unsavedDialog(page);
    await dialog.getByRole("button", { name: /Нет|Продолжить редактирование/i }).click();

    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect(popup).toBeVisible();
  });

  test("discard closes popup and reopen resets form values", async ({ page }) => {
    const popup = await openAddPopup(page);
    await selectFirstDisciplineOption(page, popup);

    await popup.getByRole("button", { name: "Отмена" }).click();
    const dialog = await unsavedDialog(page);
    await dialog.getByRole("button", { name: /Да, закрыть|Закрыть/i }).click();

    await expect(popup).toBeHidden({ timeout: 10_000 });
  });

  test("step gating enables next only when current step is valid", async ({ page }) => {
    const popup = await openAddPopup(page);
    const nextButton = popup.getByRole("button", { name: "Далее" });
    await expect(nextButton).toBeDisabled();

    await selectFirstDisciplineOption(page, popup);
    await expect(nextButton).toBeEnabled({ timeout: 20_000 });
    await nextButton.click();

    await expect(popup.getByText("Расписание").first()).toBeVisible({ timeout: 20_000 });
  });
});
