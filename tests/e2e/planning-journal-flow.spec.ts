import { test, expect } from "@playwright/test";

function env(name: string, fallback: string) {
  return process.env[name] || fallback;
}

let sharedJournalTitle: string | null = null;

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
  const logoutItem = sidebar.locator('[title*="Выйти"], [title*="Logout"]').first();
  if ((await logoutItem.count()) > 0) {
    await logoutItem.click();
  } else {
    await sidebar.getByText(/выйти|выход|logout/i).first().click();
  }
  await page.waitForURL(/\/login\/?/, { timeout: 30_000 });
}

async function navigateViaSidebar(
  page: any,
  title: string | RegExp,
  path: string,
  url: RegExp
) {
  const sidebar = page.locator("aside");
  if ((await sidebar.count()) === 0) {
    await page.goto(path);
    await page.waitForURL(url, { timeout: 30_000 });
    return;
  }
  await sidebar.getByTitle(title as any).first().click({ force: true });
  await page.waitForURL(url, { timeout: 30_000 });
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

async function clickSaveAndWaitForClose(popover: any) {
  const saveBtn = popover.getByRole("button", { name: "Сохранить" }).first();
  await expect(saveBtn).toBeVisible({ timeout: 30_000 });
  await saveBtn.click({ force: true });

  // Avoid matching the red "*" required markers in labels; only watch the popover error box.
  const errorText = popover.locator("div.px-4.pt-2.text-destructive").first();
  await Promise.race([
    popover.waitFor({ state: "hidden", timeout: 60_000 }),
    errorText
      .waitFor({ state: "visible", timeout: 60_000 })
      .then(async () => {
        const msg = (await errorText.innerText()).trim();
        throw new Error(`Popover save failed: ${msg || "(unknown error)"}`);
      }),
  ]);
}

async function selectFirstRealOption(selectLocator: any) {
  await expect(selectLocator).toHaveCount(1, { timeout: 15_000 });
  await expect
    .poll(async () => await selectLocator.locator("option").count(), {
      timeout: 15_000,
    })
    .toBeGreaterThan(1);
  await selectLocator.selectOption({ index: 1 }, { force: true });
}

async function openSelectByLabel(page: any, container: any, labelText: string | RegExp) {
  const label = container.locator("label", { hasText: labelText }).first();
  await expect(label).toBeVisible({ timeout: 15_000 });
  const forId = await label.getAttribute("for");
  if (!forId) throw new Error(`Select label "${labelText}" has no 'for' attribute`);
  const trigger = page.locator(`#${forId}`);
  await expect(trigger).toHaveCount(1, { timeout: 30_000 });
  await trigger.click({ force: true });
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
  const overlays = page.locator(
    [
      ".smart-select-page:visible",
      ".smart-select-popover:visible",
      ".popover.smart-select-popover:visible",
      ".popup:visible",
      ".sheet-modal:visible",
    ].join(", ")
  );

  await expect(overlays.first()).toBeVisible({ timeout: 15_000 });
  const overlay = overlays.filter({ hasText: optionText }).first();
  await expect(overlay).toBeVisible({ timeout: 15_000 });

  const option = overlay.getByText(optionText).first();
  await expect(option).toBeVisible({ timeout: 15_000 });
  await option.click({ force: true });
  await expect(overlay).toBeHidden({ timeout: 15_000 });
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
    const journalTitle = `${moduleIndex} ${learningOutcome}`;
    sharedJournalTitle = journalTitle;

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

    let activeAcademicYearName = "";
    let activeAcademicYearStartYear = "";
    let activeAcademicYearRange = "";

    // If there are no academic years at all, create one and mark active.
    await openIfCollapsed(page, /^Учебный год:/);
    const hasAnyAcademicYear = (await page.locator('[id^="academic-year-item-"]').count()) > 0;
    if (!hasAnyAcademicYear) {
      await page.locator("#add-academic-year-button").click();
      await expect(page.locator("#add-academic-year-popover")).toBeVisible();
      const ayPopover = page.locator("#add-academic-year-popover");
      const startYear = new Date().getFullYear();
      const endYear = startYear + 1;
      await fillField(page, "#academic-year-name", `${tag} ${startYear}-${endYear}`);
      await fillField(page, "#start-year", String(startYear));
      await fillField(page, "#end-year", String(endYear));
      await page.locator("#is-active").check();
      await clickSaveAndWaitForClose(ayPopover);
      await expect(page.locator('[id^="academic-year-item-"]').first()).toBeVisible({ timeout: 30_000 });
    }

    // Ensure there is an active academic year (required by many "settings" flows).
    const firstAcademicYearItem = page.locator('[id^="academic-year-item-"]').first();
    await firstAcademicYearItem.click();
    await expect(firstAcademicYearItem.getByText("Активный")).toBeVisible({
      timeout: 30_000,
    });

    const activeYearItem = page
      .locator('[id^="academic-year-item-"]')
      .filter({ hasText: "Активный" })
      .first();
    if ((await activeYearItem.count()) > 0) {
      activeAcademicYearName = (await activeYearItem.locator("span.font-medium").first().innerText()).trim();
      activeAcademicYearStartYear = activeAcademicYearName.match(/\b(20\d{2})\b/)?.[1] || "";
      activeAcademicYearRange = activeAcademicYearName.match(/\b(20\d{2}-20\d{2})\b/)?.[1] || "";
    }

    // If there are no academic-year semesters for the active year, create one (requires at least one semester definition).
    await openIfCollapsed(page, /^Семестры:/);
    const hasAnyAcademicYearSemester =
      (await page.locator('[id^="academic-year-semester-item-"]').count()) > 0;

    if (!hasAnyAcademicYearSemester) {
      // Ensure at least one global semester definition exists.
      await navigateViaSidebar(page, "Настройки", "/settings", /\/settings\/?/);
      await expect(
        page.locator('div.bg-card span:has-text("Настройки")').first()
      ).toBeVisible({ timeout: 30_000 });
      await openIfCollapsed(page, /^Семестры:$/);
      const alreadyHasThisSemester =
        (await page.getByText(semesterShortName).count()) > 0;
	      if (!alreadyHasThisSemester) {
	        await page.locator("#add-semester-button").click();
	        const semesterPopover = page.locator("#add-semester-popover");
	        await expect(semesterPopover).toBeVisible();
	        await fillField(page, "#semester-number", "1");
	        await fillField(page, "#semester-short-name", semesterShortName);
	        await clickSaveAndWaitForClose(semesterPopover);
	      }

      // Add academic-year semester instance (dates via Framework7 datepicker).
      await page.goto("/education-schedule");
      await openIfCollapsed(page, /^Семестры:/);
      await page.locator("#add-academic-year-semester-button").click();
	      const aysPopover = page.locator("#add-academic-year-semester-popover");
	      await expect(aysPopover).toBeVisible();

	      // Pick semester definition (if we created one, it will be selectable by its short name).
	      await aysPopover
	        .locator("select")
	        .first()
	        .selectOption({ label: semesterShortName }, { force: true });

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

	    const academicYearLabel = activeAcademicYearStartYear || new Date().getFullYear().toString();
	    await addStudentPopover
	      .locator("#student-academic-year-add select")
	      .first()
	      .selectOption({ label: academicYearLabel }, { force: true });
	    await addStudentPopover
	      .locator("#student-specialty-add select")
	      .first()
	      .selectOption({ label: `${specialtyName} - ${specialtyDetails}` }, { force: true });
	    await addStudentPopover
	      .locator("#student-language-add select")
	      .first()
	      .selectOption({ label: "Русский" }, { force: true });
	    await addStudentPopover
	      .locator("#student-base-add select")
	      .first()
	      .selectOption({ label: "9" }, { force: true });

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

        // Distribution entries are optional (schema allows 0), and the Smart Select UI here is flaky in E2E.
        // Keep this flow focused on planning + journal, so skip distribution setup.

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

    // Select discipline/outcome (Class9 item).
    await addEventPopover.locator("#event-class9-generic").click();
	    const selectPopup = page
	      .locator(".select-search-popup:visible")
	      .filter({ hasText: "Результат обучения/дисциплина" })
	      .first();
	    await expect(selectPopup).toBeVisible({ timeout: 30_000 });

	    const class9OptionText = `${moduleIndex} ${moduleName} - ${learningOutcome}`;
	    await expect
	      .poll(async () => (await selectPopup.getByText(class9OptionText).count()) > 0, {
	        timeout: 60_000,
	      })
	      .toBeTruthy();
	    await selectPopup.locator('input[placeholder="Поиск..."]:visible').first().fill(moduleIndex);
	    await selectPopup.getByText(class9OptionText).first().click();
	    await selectPopup.getByRole("button", { name: "Выбрать" }).click();
    await expect(selectPopup).toBeHidden();

    // Ensure the created event is visible in the current calendar view by setting a custom period around today.
    await addEventPopover
      .locator("#use-custom-period, #use-custom-period-edit")
      .first()
      .click({ force: true });
    const dateInputs = addEventPopover.locator('input[placeholder="Дата"]:visible');
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

    // Open the created journal from Journals list (more reliable than relying on month-grid rendering).
    await page.goto("/journals");
    const journalsPage = page.locator('[data-page-name="journals"]');
    await expect(journalsPage.getByRole("heading", { name: "Журналы" })).toBeVisible({
      timeout: 30_000,
    });

    const journalCard = journalsPage
      .locator("div.group.relative")
      .filter({ hasText: journalTitle })
      .first();
    await expect
      .poll(async () => (await journalCard.count()) > 0, { timeout: 60_000 })
      .toBeTruthy();
    await journalCard.click();

    await page.waitForURL(/\/journals\/[^/]+\?from=journals/, { timeout: 30_000 });
    await expect(page.locator("#journal-settings-button")).toBeVisible({
      timeout: 30_000,
    });

    // Change journal settings and verify they persist after refresh.
    await page.locator("#journal-settings-button").click();
    const settingsPopover = page.locator("#journal-settings-popover:visible").first();
    await expect(settingsPopover).toBeVisible({ timeout: 30_000 });

    await settingsPopover.getByText("Выставляемая").click();
    await settingsPopover.getByRole("button", { name: "Сохранить" }).click();
    await expect(settingsPopover).toBeHidden();
    await expect(page.getByText("Настройки сохранены")).toBeVisible({ timeout: 30_000 });

    await page.reload();
    await expect(page.locator("#journal-settings-button")).toBeVisible({
      timeout: 30_000,
    });

	    await page.locator("#journal-settings-button").click();
	    const settingsPopoverAfterReload = page
	      .locator("#journal-settings-popover:visible")
	      .first();
	    await expect(settingsPopoverAfterReload).toBeVisible({ timeout: 30_000 });

	    const manualRadio = settingsPopoverAfterReload.locator(
	      'input[name="calculation-type"][value="manual"]'
	    );
	    await expect
	      .poll(async () => await manualRadio.isChecked(), { timeout: 30_000 })
	      .toBeTruthy();

	    await settingsPopoverAfterReload.getByRole("button", { name: "Сохранить" }).click();
	    await expect(settingsPopoverAfterReload).toBeHidden();

    // Back to planning.
    await page.goto("/planning");
    await expect(page.locator("#add-button")).toBeVisible({ timeout: 30_000 });
  });

  test("journal details loads after reload", async ({ page }) => {
    page.setDefaultTimeout(20_000);
    page.setDefaultNavigationTimeout(60_000);

    const teacherUsername = env("E2E_TEACHER_USERNAME", "Килаш Расул Жангелдыулы");
    const teacherPassword = env("E2E_TEACHER_PASSWORD", "teachertest");

    if (!sharedJournalTitle) {
      throw new Error("Missing shared journal title from previous test run");
    }

    await loginViaUi(page, teacherUsername, teacherPassword);

    await page.goto("/journals");
    const journalsPage = page.locator('[data-page-name="journals"]');
    await expect(journalsPage.getByRole("heading", { name: "Журналы" })).toBeVisible({
      timeout: 30_000,
    });

    const journalCard = journalsPage
      .locator("div.group.relative")
      .filter({ hasText: sharedJournalTitle })
      .first();
    await expect(journalCard).toBeVisible({ timeout: 60_000 });
    await journalCard.click();

    await page.waitForURL(/\/journals\/[^/]+/, { timeout: 30_000 });
    await expect(page.locator("#tab-journal")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("#journal-settings-button")).toBeVisible({
      timeout: 30_000,
    });

    await page.reload();
    await expect(page.locator("#tab-journal")).toBeVisible({ timeout: 30_000 });
    await expect(page.locator("#journal-settings-button")).toBeVisible({
      timeout: 30_000,
    });
  });
});
