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
  const popup = page.locator("#add-event-popup:visible, #add-event-popover:visible");
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
  const dialog = page.locator(".dialog.unsaved-changes-dialog:visible").first();
  await expect(dialog).toBeVisible({ timeout: 10_000 });
  await expect(dialog).toContainText("Закрыть форму?");
  await expect(dialog).toContainText(
    "Все несохраненные данные будут потеряны. Вы действительно хотите закрыть окно?"
  );
  return dialog;
}

async function selectFirstDisciplineOption(page: Page, popup: Locator) {
  await popup.locator("#event-class9-generic").click({ force: true });
  const selectPopup = page.locator(".select-search-popup:visible").first();
  await expect(selectPopup).toBeVisible({ timeout: 20_000 });

  const firstRow = selectPopup.locator("tbody tr").first();
  await expect(firstRow).toBeVisible({ timeout: 20_000 });
  await firstRow.click();

  await selectPopup.getByRole("button", { name: "Выбрать" }).click();
  await expect(selectPopup).toBeHidden({ timeout: 20_000 });
}

test.describe.serial("Planning Add Popup Unsaved Guard", () => {
  test.setTimeout(180_000);

  test.beforeEach(async ({ page }) => {
    await loginIfNeeded(page);
  });

  test("shows custom alert on dirty close via Cancel button", async ({ page }) => {
    const popup = await openAddPopup(page);

    await popup.getByRole("button", { name: "Отмена" }).click();
    await unsavedDialog(page);
  });

  test("shows custom alert on dirty close via backdrop click", async ({ page }) => {
    const popup = await openAddPopup(page);

    await page.locator(".popup-backdrop:visible").first().click({ force: true });
    await unsavedDialog(page);
  });

  test("shows custom alert on dirty close via Escape", async ({ page }) => {
    const popup = await openAddPopup(page);

    await page.keyboard.press("Escape");
    await unsavedDialog(page);
  });

  test("continue editing keeps popup open and preserves values", async ({ page }) => {
    const popup = await openAddPopup(page);
    await selectFirstDisciplineOption(page, popup);
    const selectedClass9Value = popup
      .locator('input[type="hidden"][name="event-class9-generic"]')
      .first();
    await expect(selectedClass9Value).not.toHaveValue("");

    await popup.getByRole("button", { name: "Отмена" }).click();
    const dialog = await unsavedDialog(page);
    await dialog.getByRole("button", { name: "Продолжить редактирование" }).click();

    await expect(dialog).toBeHidden({ timeout: 10_000 });
    await expect(popup).toBeVisible();
    await expect(selectedClass9Value).not.toHaveValue("");
  });

  test("discard closes popup and reopen resets form values", async ({ page }) => {
    const popup = await openAddPopup(page);
    await selectFirstDisciplineOption(page, popup);
    await expect(
      popup.locator('input[type="hidden"][name="event-class9-generic"]').first()
    ).not.toHaveValue("");

    await popup.getByRole("button", { name: "Отмена" }).click();
    const dialog = await unsavedDialog(page);
    await dialog.getByRole("button", { name: "Закрыть" }).click();

    await expect(popup).toBeHidden({ timeout: 10_000 });
    await page.goto("/planning");

    const reopenedPopup = await openAddPopup(page);
    await expect(
      reopenedPopup.locator('input[type="hidden"][name="event-class9-generic"]').first()
    ).toHaveValue("");
  });

  test("step gating enables next only when current step is valid", async ({ page }) => {
    const popup = await openAddPopup(page);
    const nextButton = popup.getByRole("button", { name: "Далее" });
    await expect(nextButton).toBeDisabled();

    await selectFirstDisciplineOption(page, popup);
    await expect(nextButton).toBeEnabled({ timeout: 20_000 });
    await nextButton.click();

    await expect(popup.getByText("Расписание")).toBeVisible({ timeout: 20_000 });
  });
});
