import { test, expect } from "@playwright/test";

function env(name: string, fallback: string) {
  return process.env[name] || fallback;
}

async function loginViaUi(page: any, username: string, password: string) {
  await page.goto("/login");
  await page.getByPlaceholder("Введите ФИО").fill(username);
  await page.getByPlaceholder("Введите пароль").fill(password);
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

async function openIfCollapsed(page: any, sectionTitle: RegExp) {
  const title = page.getByText(sectionTitle).first();
  await title.scrollIntoViewIfNeeded();
  await title.click();
}

async function clickOptionInOpenPicker(page: any, optionText: string | RegExp) {
  const overlay = page.locator(
    ".smart-select-page, .smart-select-popover, .popover, .popup, .sheet-modal"
  );
  await expect(overlay.first()).toBeVisible({ timeout: 15_000 });
  await overlay.getByText(optionText).first().click();
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
    await expect(page.getByText("График образовательного процесса:")).toBeVisible({
      timeout: 30_000,
    });

    // If there are no academic years at all, create one and mark active.
    await openIfCollapsed(page, /^Учебный год:/);
    const hasAnyAcademicYear = (await page.locator('[id^="academic-year-item-"]').count()) > 0;
    if (!hasAnyAcademicYear) {
      await page.locator("#add-academic-year-button").click();
      await expect(page.locator("#add-academic-year-popover")).toBeVisible();
      const startYear = Math.floor(Date.now() / 1000);
      const endYear = startYear + 1;
      await page.locator("#academic-year-name").fill(`${tag} ${startYear}-${endYear}`);
      await page.locator("#start-year").fill(String(startYear));
      await page.locator("#end-year").fill(String(endYear));
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

    // If there are no academic-year semesters for the active year, create one (requires at least one semester definition).
    await openIfCollapsed(page, /^Семестры:/);
    const hasAnyAcademicYearSemester =
      (await page.locator('[id^="academic-year-semester-item-"]').count()) > 0;

    if (!hasAnyAcademicYearSemester) {
      // Ensure at least one global semester definition exists.
      await page.goto("/settings");
      await expect(page.getByText("Настройки")).toBeVisible({ timeout: 30_000 });
      await openIfCollapsed(page, /^Семестры:$/);
      const alreadyHasThisSemester =
        (await page.getByText(semesterShortName).count()) > 0;
      if (!alreadyHasThisSemester) {
        await page.locator("#add-semester-button").click();
        await expect(page.locator("#add-semester-popover")).toBeVisible();
        await page.locator("#semester-number").fill("1");
        await page.locator("#semester-short-name").fill(semesterShortName);
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
      await aysPopover.getByText("Выберите семестр").click();
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
      await page.locator("#schedule-lesson-number").fill("1");
      await schedulePopover.getByRole("button", { name: "Сохранить" }).click();
      await expect(schedulePopover).toBeHidden({ timeout: 30_000 });
      await expect(page.locator('[id^="schedule-item-"]').first()).toBeVisible({
        timeout: 30_000,
      });
    }

    // Create specialty.
    await page.goto("/specialty-catalog");
    await expect(page.getByText("Каталог специальностей")).toBeVisible({ timeout: 30_000 });
    await page.locator("#add-specialty-button").click();
    const addSpecialtyPopover = page.locator("#add-specialty-popover");
    await expect(addSpecialtyPopover).toBeVisible();
    await page.locator("#specialty-code").fill(specialtyCode);
    await page.locator("#specialty-name").fill(specialtyName);
    await page.locator("#specialty-details").fill(specialtyDetails);
    await page.locator("#specialty-code-name").fill(specialtyCodeName);
    await addSpecialtyPopover.getByRole("button", { name: "Сохранить" }).click();
    await expect(addSpecialtyPopover).toBeHidden({ timeout: 30_000 });

    // Create a student for that specialty.
    await page.goto("/student-card");
    await expect(page.getByText("Картотека обучающихся")).toBeVisible({ timeout: 30_000 });
    await page.locator("#add-student-button").click();
    const addStudentPopover = page.locator("#add-student-popover");
    await expect(addStudentPopover).toBeVisible();
    await page.locator("#student-surname").fill(tag);
    await page.locator("#student-firstname").fill("Student");
    await page.locator("#student-patronymic").fill("One");

    await page.locator("#student-specialty-add").click();
    await clickOptionInOpenPicker(page, `${specialtyName} - ${specialtyDetails}`);

    await page.locator("#student-language-add").click();
    await clickOptionInOpenPicker(page, "Русский");

    await page.locator("#student-base-add").click();
    await clickOptionInOpenPicker(page, "9");

    await addStudentPopover.getByRole("button", { name: "Мужской" }).click();
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

    await page.locator("#module-index-0").fill(moduleIndex);
    await page.locator("#module-name-0").fill(moduleName);
    await page.locator("#learning-outcome-0").fill(learningOutcome);
    await page.locator("#total-credits-0").fill("1");
    await page.locator("#total-hours-0").fill("8");
    await page.locator("#theoretical-hours-0").fill("4");
    await page.locator("#lab-practical-hours-0").fill("4");
    await page.locator("#field3-value-0").fill("0");
    await page.locator("#srsp-hours-0").fill("0");
    await page.locator("#srs-hours-0").fill("0");
    await page.locator("#training-practice-hours-0").fill("0");
    await page.locator("#individual-hours-0").fill("0");

    await class9Popover.locator(".add-distribution-btn").click();
    await class9Popover.getByText("Выберите семестр").first().click();
    await clickOptionInOpenPicker(page, /^Семестр /);
    await class9Popover.getByLabel("Объем часов").first().fill("8");

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
    await selectPopup.getByPlaceholder("Поиск...").fill(moduleIndex);
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
