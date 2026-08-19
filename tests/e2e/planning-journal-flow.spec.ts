import { test, expect } from "@playwright/test";

function env(name: string, fallback: string) {
  return process.env[name] || fallback;
}

async function loginViaUi(page: any, username: string, password: string) {
  await page.goto("/login");
  const usernameInput = page.locator('input[placeholder="Введите ФИО"]:visible');
  const passwordInput = page.locator('input[placeholder="Введите пароль"]:visible');
  await expect(usernameInput.first()).toBeVisible({ timeout: 30_000 });
  await usernameInput.first().fill(username);
  await passwordInput.first().fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  await page.waitForURL(/\/home\/?/, { timeout: 120_000 });
}

async function logoutViaSidebar(page: any) {
  const sidebar = page.locator("aside");
  await expect(sidebar).toBeVisible({ timeout: 30_000 });
  const logoutItem = sidebar.getByText(/выход|logout/i);
  await logoutItem.click();
  await page.waitForURL(/\/login\/?/, { timeout: 30_000 });
}

async function fillField(page: any, selector: string, value: string) {
  const root = page.locator(selector);
  const editable = root.locator('input, textarea, [contenteditable="true"]');
  if ((await editable.count()) > 0) {
    await editable.first().fill(value);
    return;
  }
  await root.fill(value);
}

async function fillLocator(locator: any, value: string) {
  const editable = locator.locator('input, textarea, [contenteditable="true"]');
  if ((await editable.count()) > 0) {
    await editable.first().fill(value);
    return;
  }
  await locator.fill(value);
}

async function openIfCollapsed(page: any, sectionTitle: RegExp) {
  const title = page.getByText(sectionTitle).first();
  await title.scrollIntoViewIfNeeded();

  const accordionItemRoot = title.locator(
    'xpath=ancestor::div[contains(@class,"border-border")][1]'
  );
  const content = accordionItemRoot.locator("> div.bg-card");

  if ((await content.count()) > 0) return;
  await accordionItemRoot.locator("> div").first().click();
  await expect(content).toBeVisible({ timeout: 10_000 });
}

async function clickOptionInOpenPicker(page: any, optionText: string | RegExp) {
  const overlay = page.locator(
    [
      ".smart-select-page:visible",
      ".smart-select-popover:visible",
      ".popup:visible",
      ".sheet-modal:visible",
    ].join(", ")
  );
  await expect(overlay.first()).toBeVisible({ timeout: 15_000 });
  const option = overlay.getByText(optionText).first();
  await expect(option).toBeVisible({ timeout: 15_000 });
  await option.click();
  await expect(overlay).toHaveCount(0, { timeout: 15_000 });
}

async function pickF7CalendarDay(page: any, opts: { offsetDays?: number } = {}) {
  const offsetDays = opts.offsetDays ?? 0;
  const target = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const yyyy = target.getFullYear();
  const mm = String(target.getMonth() + 1).padStart(2, "0");
  const dd = String(target.getDate()).padStart(2, "0");
  const iso = `${yyyy}-${mm}-${dd}`;
  const isoNoPad = `${yyyy}-${target.getMonth() + 1}-${target.getDate()}`;

  // Framework7 calendar markup varies by platform/theme; try a few common selectors.
  const calendarRoot = page.locator(
    ".calendar, .calendar-modal, .calendar-popover, .sheet-modal .calendar"
  );
  await expect(calendarRoot.first()).toBeVisible({ timeout: 15_000 });

  const candidates = [
    page.locator(`.calendar-day[data-date="${iso}"]`),
    page.locator(`.calendar-day[data-date="${isoNoPad}"]`),
    page.locator(`[data-date="${iso}"]`),
    page.locator(`[data-date="${isoNoPad}"]`),
  ];

  for (const locator of candidates) {
    if ((await locator.count()) > 0) {
      await locator.first().click();
      return;
    }
  }

  // Fallback: if picking tomorrow, click the next enabled day after today.
  if (offsetDays > 0) {
    const clicked = await page.evaluate(() => {
      const today = document.querySelector<HTMLElement>(
        ".calendar-day-today:not(.calendar-day-disabled)"
      );
      if (!today) return false;
      const parent = today.parentElement;
      if (!parent) return false;
      const days = Array.from(
        parent.querySelectorAll<HTMLElement>(".calendar-day:not(.calendar-day-disabled)")
      );
      const idx = days.indexOf(today);
      const next = idx >= 0 ? days[idx + 1] : null;
      if (!next) return false;
      next.click();
      return true;
    });
    if (clicked) return;
  }

  // Last resort: pick today.
  await page
    .locator(".calendar-day-today:not(.calendar-day-disabled)")
    .first()
    .click();
}

test.describe("Planning → Journal E2E flow", () => {
  // Convex-backed flows can be slow on cold start.
  test.setTimeout(300_000);
  test.describe.configure({ mode: "serial" });

  test("create event in Planning, open Journal, persist settings, go back", async ({
    page,
  }) => {
    page.setDefaultTimeout(20_000);
    page.setDefaultNavigationTimeout(60_000);

    const tag = `E2E-${Date.now()}`;
    const specialtyCode = tag;
    const specialtyName = `${tag} Specialty`;
    const specialtyDetails = `${tag} Details`;
    const specialtyCodeName = tag;
    const moduleIndex = tag;
    const moduleName = `${tag} Module`;
    const learningOutcome = `${tag} Outcome`;
    const semesterShortName = `${tag} S1`;

    const adminUsername = env("E2E_ADMIN_USERNAME", "Админ Тестовый");
    const adminPassword = env("E2E_ADMIN_PASSWORD", "admintest");
    const teacherUsername = env("E2E_TEACHER_USERNAME", "Килаш Расул Жангелдыулы");
    const teacherPassword = env("E2E_TEACHER_PASSWORD", "teachertest");

    // -----------------------------
    // UI setup as Admin
    // -----------------------------
    await loginViaUi(page, adminUsername, adminPassword);

    // Ensure at least one academic year exists and at least one semester is defined for it.
    await page.goto("/education-schedule");
    await expect(page.getByText(/График образовательного процесса/i).first()).toBeVisible({
      timeout: 30_000,
    });

    let activeAcademicYearName = "";
    let activeAcademicYearStartYear = "";

    // If there are no academic years at all, create one and mark active.
    await openIfCollapsed(page, /^Учебный год:/);
    const hasAnyAcademicYear = (await page.locator('[id^="academic-year-item-"]').count()) > 0;
    if (!hasAnyAcademicYear) {
	      await page.locator("#add-academic-year-button").click();
	      await expect(page.locator("#add-academic-year-popover")).toBeVisible();
      const startYear = new Date().getFullYear();
      const endYear = startYear + 1;
      await fillField(page, "#academic-year-name", `${tag} ${startYear}-${endYear}`);
      await fillField(page, "#start-year", String(startYear));
      await fillField(page, "#end-year", String(endYear));
      await page.locator("#is-active").check();
	      await page.locator("#add-academic-year-popover").getByRole("button", { name: "Сохранить" }).click();
	      await expect(page.locator("#add-academic-year-popover")).toBeHidden();
	      await expect(page.locator('[id^="academic-year-item-"]').first()).toBeVisible({ timeout: 30_000 });
	    }

    // Ensure there is an active academic year (required by many "settings" flows).
    const hasActiveYearBadge =
      (await page.getByText("Активный").count()) > 0;
    if (!hasActiveYearBadge) {
      await page.locator('[id^="academic-year-item-"]').first().click();
      await expect(page.getByText("Активный").first()).toBeVisible({
        timeout: 30_000,
      });
    }

    const activeYearItem = page
      .locator('[id^="academic-year-item-"]')
      .filter({ hasText: "Активный" })
      .first();
    if ((await activeYearItem.count()) > 0) {
      activeAcademicYearName = (await activeYearItem.locator("span.font-medium").first().innerText()).trim();
      activeAcademicYearStartYear = activeAcademicYearName.match(/\b(20\d{2})\b/)?.[1] || "";
    }

    // If there are no academic-year semesters for the active year, create one (requires at least one semester definition).
    await openIfCollapsed(page, /^Семестры:/);
    const hasAnyAcademicYearSemester =
      (await page.locator('[id^="academic-year-semester-item-"]').count()) > 0;

    if (!hasAnyAcademicYearSemester) {
      // Ensure at least one global semester definition exists.
      await page.goto("/settings");
      await expect(
        page.locator('div.bg-card span:has-text("Настройки")').first()
      ).toBeVisible({ timeout: 30_000 });
      await openIfCollapsed(page, /^Семестры:$/);
      const alreadyHasThisSemester =
        (await page.getByText(semesterShortName).count()) > 0;
	      if (!alreadyHasThisSemester) {
	        await page.locator("#add-semester-button").click();
	        await expect(page.locator("#add-semester-popover")).toBeVisible();
	        await fillField(page, "#semester-number", "1");
	        await fillField(page, "#semester-short-name", semesterShortName);
	        await page
	          .locator("#add-semester-popover")
	          .getByRole("button", { name: "Сохранить" })
	          .click();
	        await expect(page.locator("#add-semester-popover")).toBeHidden();
	      }

      // Add academic-year semester instance (dates via Framework7 datepicker).
      await page.goto("/education-schedule");
      await openIfCollapsed(page, /^Семестры:/);
      await page.locator("#add-academic-year-semester-button").click();
      const aysPopover = page.locator("#add-academic-year-semester-popover");
      await expect(aysPopover).toBeVisible();

      // Pick semester definition (if we created one, it will be selectable by its short name).
      await aysPopover
        .locator('.smart-select-wrapper:has-text("Семестр") .item-content')
        .first()
        .click();
      await clickOptionInOpenPicker(page, semesterShortName);

      await page.locator("#start-date").click();
      await pickF7CalendarDay(page, { offsetDays: 0 });
      await page.locator("#end-date").click();
      await pickF7CalendarDay(page, { offsetDays: 7 });

      await aysPopover.getByRole("button", { name: "Сохранить" }).click();
      await expect(aysPopover).toBeHidden({ timeout: 30_000 });
      await expect(page.locator('[id^="academic-year-semester-item-"]').first()).toBeVisible({
        timeout: 30_000,
      });
    }

    // Ensure there is at least one schedule slot for the active year.
    await openIfCollapsed(page, /^Расписание звонков:/);
    const hasAnyScheduleSlot = (await page.locator('[id^="schedule-item-"]').count()) > 0;
	    if (!hasAnyScheduleSlot) {
	      await page.locator("#add-education-schedule-button").click();
	      const schedulePopover = page.locator("#add-education-schedule-popover");
	      await expect(schedulePopover).toBeVisible();
	      await fillField(page, "#schedule-lesson-number", "1");
	      await schedulePopover.getByRole("button", { name: "Сохранить" }).click();
	      await expect(schedulePopover).toBeHidden({ timeout: 30_000 });
	      await expect(page.locator('[id^="schedule-item-"]').first()).toBeVisible({
	        timeout: 30_000,
	      });
	    }

    // Create specialty.
    await page.goto("/specialty-catalog");
    await expect(
      page.getByRole("heading", { name: "Каталог специальностей" })
    ).toBeVisible({ timeout: 30_000 });
	    await page.locator("#add-specialty-button").click();
	    const addSpecialtyPopover = page.locator("#add-specialty-popover");
	    await expect(addSpecialtyPopover).toBeVisible();
	    await fillField(page, "#specialty-code", specialtyCode);
	    await fillField(page, "#specialty-name", specialtyName);
	    await fillField(page, "#specialty-details", specialtyDetails);
	    await fillField(page, "#specialty-code-name", specialtyCodeName);
	    await addSpecialtyPopover.getByRole("button", { name: "Сохранить" }).click();
	    await expect(addSpecialtyPopover).toBeHidden({ timeout: 30_000 });

    // Create a student for that specialty.
    await page.goto("/student-card");
    await expect(
      page.getByRole("heading", { name: "Картотека обучающихся" })
    ).toBeVisible({ timeout: 30_000 });
	    await page.locator("#add-student-button").click();
	    const addStudentPopover = page.locator("#add-student-popover");
	    await expect(addStudentPopover).toBeVisible();
	    await fillField(page, "#student-surname", tag);
	    await fillField(page, "#student-firstname", "Student");
	    await fillField(page, "#student-patronymic", "One");

	    await page.locator("#student-academic-year-add").click();
	    if (activeAcademicYearStartYear) {
	      await clickOptionInOpenPicker(page, activeAcademicYearStartYear);
	    } else {
	      await clickOptionInOpenPicker(page, /\b20\d{2}\b/);
	    }

	    await page.locator("#student-specialty-add").click();
	    await clickOptionInOpenPicker(page, `${specialtyName} - ${specialtyDetails}`);

    await page.locator("#student-language-add").click();
    await clickOptionInOpenPicker(page, "Русский");

	    await page.locator("#student-base-add").click();
	    await clickOptionInOpenPicker(page, "9");

	    await addStudentPopover
	      .locator("a, button")
	      .filter({ hasText: /^Мужской$/ })
	      .first()
	      .click();
	    await addStudentPopover.getByRole("button", { name: "Сохранить" }).click();
	    await expect(addStudentPopover).toBeHidden({ timeout: 30_000 });

    // Create a RUP/Class9 item with a semester distribution entry so planning UI has planned hours context.
    await page.goto("/rup");
    await expect(page.getByText("Рабочие учебные планы:")).toBeVisible({ timeout: 30_000 });

    // Select specialty by codeName (displayed as a pill in the specialties section).
    await page.getByText(specialtyCodeName).first().click();

    await page.locator("#add-working-plan-button").click();
    await page.getByText("На базе 9 класса").click();
	    const class9Popover = page.locator("#class9-popover");
	    await expect(class9Popover).toBeVisible({ timeout: 30_000 });

	    await fillField(page, "#module-index-0", moduleIndex);
	    await fillField(page, "#module-name-0", moduleName);
	    await fillField(page, "#learning-outcome-0", learningOutcome);
	    await fillField(page, "#total-credits-0", "1");
	    await fillField(page, "#total-hours-0", "8");
	    await fillField(page, "#theoretical-hours-0", "4");
	    await fillField(page, "#lab-practical-hours-0", "4");
	    await fillField(page, "#field3-value-0", "0");
	    await fillField(page, "#srsp-hours-0", "0");
	    await fillField(page, "#srs-hours-0", "0");
	    await fillField(page, "#training-practice-hours-0", "0");
	    await fillField(page, "#individual-hours-0", "0");

	    await class9Popover.locator(".add-distribution-btn").click();
	    const lastDistributionEntry = class9Popover
	      .locator("div.border.border-input.rounded-lg.p-3")
	      .last();
	    await lastDistributionEntry
	      .locator('.smart-select-wrapper:has-text("Учебный год") .item-content')
	      .first()
	      .click({ force: true });
	    await clickOptionInOpenPicker(page, /\b20\d{2}-20\d{2}\b/);
	    await lastDistributionEntry
	      .locator('.smart-select-wrapper:has-text("Семестр") .item-content')
	      .first()
	      .click({ force: true });
	    await clickOptionInOpenPicker(page, /^Семестр /);
	    await fillLocator(lastDistributionEntry.locator('input[placeholder="0"]').first(), "8");

    await class9Popover.getByRole("button", { name: "Сохранить" }).click();
    await expect(class9Popover).toBeHidden({ timeout: 30_000 });

    await logoutViaSidebar(page);

    // -----------------------------
    // Actual flow as Teacher
    // -----------------------------
    await loginViaUi(page, teacherUsername, teacherPassword);

    // Go to planning and open the add-event flow.
    await page.goto("/planning");
    await expect(page.locator("#add-button")).toBeVisible({ timeout: 30_000 });
    await page.getByText("Сегодня").click().catch(() => {});

    await page.locator("#add-button").click();
    const addEventPopover = page.locator("#add-event-popover");
    await expect(addEventPopover).toBeVisible();
    await expect(addEventPopover.getByText("Период:")).toBeVisible();

    // Select discipline/outcome (Class9 item).
    await addEventPopover.locator("#event-class9-generic").click();
    const selectPopup = page.locator(".select-search-popup");
    await expect(selectPopup).toBeVisible();

	    const class9OptionText = `${moduleIndex} ${moduleName} - ${learningOutcome}`;
	    await selectPopup.locator('input[placeholder="Поиск..."]:visible').first().fill(moduleIndex);
	    await selectPopup.getByText(class9OptionText).first().click();
	    await selectPopup.getByRole("button", { name: "Выбрать" }).click();
	    await expect(selectPopup).toBeHidden();

    // Ensure the created event is visible in the current calendar view by setting a custom period around today.
    await addEventPopover.locator('input#use-custom-period').check();
    const dateInputs = addEventPopover.locator('input[placeholder="Дата"]');
    await dateInputs.nth(0).click();
    await pickF7CalendarDay(page, { offsetDays: 0 });
    await dateInputs.nth(1).click();
    await pickF7CalendarDay(page, { offsetDays: 1 });

    // Select participants (students) so a journal is created from the event.
    await addEventPopover.locator("#event-form-participants").click();
    const studentPopup = page.locator("#student-selection-popup");
    await expect(studentPopup).toBeVisible();
    await studentPopup.getByText(`${tag} Student One`).click();
    await studentPopup.getByRole("button", { name: "Сохранить" }).click();
    await expect(studentPopup).toBeHidden();

    // Create event.
    await addEventPopover.getByRole("button", { name: "Добавить" }).click();
    await expect(addEventPopover).toBeHidden({ timeout: 15_000 });

    // Open journal preview from calendar event and navigate to journal details.
    const calendarEvent = page
      .locator(".calendar-event")
      .filter({ hasText: `${moduleIndex} ${learningOutcome}` })
      .first();
    await expect(calendarEvent).toBeVisible({ timeout: 30_000 });
    await calendarEvent.click();

    const previewPopover = page.locator("#journal-preview-popover");
    await expect(previewPopover).toBeVisible();
    await previewPopover.getByText(`${moduleIndex} ${learningOutcome}`).click();

    await page.waitForURL(/\/journals\/[^/]+\?from=schedule/, {
      timeout: 15_000,
    });
    await expect(page.locator("#journal-settings-button")).toBeVisible({
      timeout: 30_000,
    });

    // Change journal settings and verify they persist after refresh.
    await page.locator("#journal-settings-button").click();
    const settingsPopover = page.locator("#journal-settings-popover");
    await expect(settingsPopover).toBeVisible();

    await settingsPopover
      .locator('input[name="calculation-type"][value="manual"]')
      .check();
    await settingsPopover.getByRole("button", { name: "Сохранить" }).click();
    await expect(settingsPopover).toBeHidden();

    await page.reload();
    await expect(page.locator("#journal-settings-button")).toBeVisible({
      timeout: 30_000,
    });

    await page.locator("#journal-settings-button").click();
    await expect(settingsPopover).toBeVisible();
    await expect(
      settingsPopover.locator('input[name="calculation-type"][value="manual"]')
    ).toBeChecked();
    await settingsPopover.getByRole("button", { name: "Сохранить" }).click();
    await expect(settingsPopover).toBeHidden();

    // Back from journal (opened from schedule) returns to planning.
    await page.locator(".back-button").click();
    await page.waitForURL(/\/planning\/?/, { timeout: 15_000 });
  });
});
