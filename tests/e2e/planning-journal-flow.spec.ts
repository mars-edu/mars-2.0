import { test, expect } from "@playwright/test";

function env(name: string, fallback: string) {
  return process.env[name] || fallback;
}

let sharedJournalTitle: string | null = null;
let sharedJournalId: string | null = null;
let sharedScenario:
  | {
      tag: string;
      specialtyCode: string;
      specialtyName: string;
      specialtyDetails: string;
      specialtyCodeName: string;
      moduleIndex: string;
      moduleName: string;
      learningOutcome: string;
      semesterShortName: string;
      journalTitle: string;
      studentOneName: string;
      studentTwoName: string;
      ktpTheme1: string;
      ktpTheme2: string;
      ktpHomework: string;
      ktpNotes: string;
    }
  | null = null;

async function loginViaUi(page: any, username: string, password: string) {
  await page.goto("/login");
  const usernameInput = page.locator('input[placeholder="Введите ФИО"]:visible');
  const passwordInput = page.locator('input[placeholder="Введите пароль"]:visible');
  await expect(usernameInput.first()).toBeVisible({ timeout: 30_000 });
  await usernameInput.first().fill(username);
  await passwordInput.first().fill(password);
  await page.getByRole("button", { name: "Войти" }).click();
  // Login can be slow on cold start; keep the timeout reasonable but retry once.
  try {
    await page.waitForURL(/\/home\/?/, { timeout: 120_000 });
  } catch {
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Войти" }).click().catch(() => {});
    await page.waitForURL(/\/home\/?/, { timeout: 120_000 });
  }
}

async function logoutViaSidebar(page: any) {
  const sidebar = page.locator("aside");
  await expect(sidebar).toBeVisible({ timeout: 30_000 });
  const logoutItem = sidebar
    .locator('[title*="Выйти"], [title*="Logout"]')
    .first();
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

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    surname: parts[0] || fullName,
    firstName: parts[1] || "Test",
    patronymic: parts.slice(2).join(" ") || "User",
  };
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

async function selectOptionByLabelWhenReady(selectLocator: any, label: string) {
  await expect(selectLocator).toHaveCount(1, { timeout: 15_000 });
  await expect
    .poll(async () => {
      const options = selectLocator.locator("option");
      const count = await options.count();
      for (let i = 0; i < count; i++) {
        const text = ((await options.nth(i).innerText()) || "").trim();
        if (text === label) return true;
      }
      return false;
    }, { timeout: 30_000 })
    .toBeTruthy();
  await selectLocator.selectOption({ label }, { force: true });
}

async function openSelectByLabel(
  page: any,
  container: any,
  labelText: string | RegExp
) {
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
  test.setTimeout(300_000);
  test.describe.configure({ mode: "serial" });

  test("admin setup prerequisites", async ({ page }) => {
    page.setDefaultTimeout(20_000);
    page.setDefaultNavigationTimeout(60_000);

    const tag = `E2E-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const specialtyCode = tag;
    const specialtyName = `${tag} Specialty`;
    const specialtyDetails = `${tag} Details`;
    const specialtyCodeName = tag;
    const moduleIndex = tag;
    const moduleName = `${tag} Module`;
    const learningOutcome = `${tag} Outcome`;
    const semesterShortName = `${tag} S1`;
    const journalTitle = `${moduleIndex} ${learningOutcome}`;
    const studentOneName = `${tag} Student One`;
    const studentTwoName = `${tag} Student Two`;
    const ktpTheme1 = `${tag} Theme 1`;
    const ktpTheme2 = `${tag} Theme 2`;
    const ktpHomework = `${tag} Homework`;
    const ktpNotes = `${tag} Notes`;

    sharedScenario = {
      tag,
      specialtyCode,
      specialtyName,
      specialtyDetails,
      specialtyCodeName,
      moduleIndex,
      moduleName,
      learningOutcome,
      semesterShortName,
      journalTitle,
      studentOneName,
      studentTwoName,
      ktpTheme1,
      ktpTheme2,
      ktpHomework,
      ktpNotes,
    };

    const adminUsername = env("E2E_ADMIN_USERNAME", "Админ Тестовый");
    const adminPassword = env("E2E_ADMIN_PASSWORD", "admintest");
    await loginViaUi(page, adminUsername, adminPassword);

    await page.goto("/education-schedule");
    await expect(page.getByText("График образовательного процесса:")).toBeVisible({
      timeout: 30_000,
    });

    // Academic year
    await openIfCollapsed(page, /^Учебный год:/);
    const hasAnyAcademicYear =
      (await page.locator('[id^="academic-year-item-"]').count()) > 0;
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
      await expect(page.locator('[id^="academic-year-item-"]').first()).toBeVisible({
        timeout: 30_000,
      });
    }

    // Ensure active year is selected
    const firstAcademicYearItem = page
      .locator('[id^="academic-year-item-"]')
      .first();
    await firstAcademicYearItem.click();
    await expect(firstAcademicYearItem.getByText("Активный")).toBeVisible({
      timeout: 30_000,
    });

    // Academic-year semester + semester definition
    await openIfCollapsed(page, /^Семестры:/);
    const hasAnyAcademicYearSemester =
      (await page.locator('[id^="academic-year-semester-item-"]').count()) > 0;

    if (!hasAnyAcademicYearSemester) {
      await navigateViaSidebar(page, "Настройки", "/settings", /\/settings\/?/);
      await expect(page.locator('div.bg-card span:has-text("Настройки")').first()).toBeVisible({
        timeout: 30_000,
      });
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

      await page.goto("/education-schedule");
      await openIfCollapsed(page, /^Семестры:/);
      await page.locator("#add-academic-year-semester-button").click();
      const aysPopover = page.locator("#add-academic-year-semester-popover");
      await expect(aysPopover).toBeVisible();

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

    // Education schedule slot
    await openIfCollapsed(page, /^Расписание звонков:/);
    const hasAnyScheduleSlot =
      (await page.locator('[id^="schedule-item-"]').count()) > 0;
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

    // Specialty
    await page.goto("/specialty-catalog");
    await expect(page.getByRole("heading", { name: "Каталог специальностей" })).toBeVisible({
      timeout: 30_000,
    });
    await page.locator("#add-specialty-button").click();
    const addSpecialtyPopover = page.locator("#add-specialty-popover");
    await expect(addSpecialtyPopover).toBeVisible();
    await fillField(page, "#specialty-code", specialtyCode);
    await fillField(page, "#specialty-name", specialtyName);
    await fillField(page, "#specialty-details", specialtyDetails);
    await fillField(page, "#specialty-code-name", specialtyCodeName);
    await addSpecialtyPopover.getByRole("button", { name: "Сохранить" }).click();
    await expect(addSpecialtyPopover).toBeHidden({ timeout: 30_000 });

    const specialtyOptionLabel = `${specialtyName} - ${specialtyDetails}`;

    // Students
    await page.goto("/student-card");
    await expect(page.getByRole("heading", { name: "Картотека обучающихся" })).toBeVisible({
      timeout: 30_000,
    });

    await page.locator("#add-student-button").click();
    const addStudentPopover = page.locator("#add-student-popover");
    await expect(addStudentPopover).toBeVisible();
    const s1 = splitFullName(studentOneName);
    await fillField(page, "#student-surname", s1.surname);
    await fillField(page, "#student-firstname", s1.firstName);
    await fillField(page, "#student-patronymic", s1.patronymic);
    await selectFirstRealOption(addStudentPopover.locator("#student-academic-year-add select"));
    await selectOptionByLabelWhenReady(
      addStudentPopover.locator("#student-specialty-add select"),
      specialtyOptionLabel
    );
    await selectFirstRealOption(addStudentPopover.locator("#student-language-add select"));
    await selectFirstRealOption(addStudentPopover.locator("#student-base-add select"));
    await addStudentPopover.locator('button:has-text("Мужской"), a:has-text("Мужской")').first().click();
    await addStudentPopover.getByRole("button", { name: "Сохранить" }).click();
    await expect(addStudentPopover).toBeHidden({ timeout: 30_000 });

    await page.locator("#add-student-button").click();
    const addStudentPopover2 = page.locator("#add-student-popover");
    await expect(addStudentPopover2).toBeVisible();
    const s2 = splitFullName(studentTwoName);
    await fillField(page, "#student-surname", s2.surname);
    await fillField(page, "#student-firstname", s2.firstName);
    await fillField(page, "#student-patronymic", s2.patronymic);
    await selectFirstRealOption(addStudentPopover2.locator("#student-academic-year-add select"));
    await selectOptionByLabelWhenReady(
      addStudentPopover2.locator("#student-specialty-add select"),
      specialtyOptionLabel
    );
    await selectFirstRealOption(addStudentPopover2.locator("#student-language-add select"));
    await selectFirstRealOption(addStudentPopover2.locator("#student-base-add select"));
    await addStudentPopover2.locator('button:has-text("Мужской"), a:has-text("Мужской")').first().click();
    await addStudentPopover2.getByRole("button", { name: "Сохранить" }).click();
    await expect(addStudentPopover2).toBeHidden({ timeout: 30_000 });

    // Class9 item (RUP → add working plan → base 9 → Class9Popup)
    await page.goto("/rup");
    await expect(page.getByText("Рабочие учебные планы:")).toBeVisible({
      timeout: 30_000,
    });

    // Select our specialty (uses codeName in UI, which we set to `tag`).
    await expect(page.getByText(tag).first()).toBeVisible({ timeout: 30_000 });
    await page.getByText(tag).first().click();

    await expect(page.locator("#add-working-plan-button")).toBeVisible({
      timeout: 30_000,
    });
    await page.locator("#add-working-plan-button").click();
    const workingPlanPopover = page.locator("#add-working-plan-popover");
    await expect(workingPlanPopover).toBeVisible({ timeout: 30_000 });
    await workingPlanPopover.getByText("На базе 9 класса").click();

    const class9Popover = page.locator("#class9-popover");
    await expect(class9Popover).toBeVisible({ timeout: 30_000 });

    await fillField(page, "#module-index-0", moduleIndex);
    await fillField(page, "#module-name-0", moduleName);
    await fillField(page, "#learning-outcome-0", learningOutcome);

    // Numeric fields must be valid numbers (Class9Popup validation uses String(value)).
    await fillField(page, "#total-credits-0", "0");
    await fillField(page, "#total-hours-0", "0");
    await fillField(page, "#theoretical-hours-0", "0");
    await fillField(page, "#lab-practical-hours-0", "0");
    await fillField(page, "#field3-value-0", "0");
    await fillField(page, "#srsp-hours-0", "0");
    await fillField(page, "#srs-hours-0", "0");
    await fillField(page, "#training-practice-hours-0", "0");
    await fillField(page, "#individual-hours-0", "0");

    await class9Popover.getByRole("button", { name: "Сохранить" }).click();
    await expect(class9Popover).toBeHidden({ timeout: 30_000 });

    await logoutViaSidebar(page);
  });

  test("teacher creates event + KTP themes (and deletes one)", async ({ page }) => {
    page.setDefaultTimeout(20_000);
    page.setDefaultNavigationTimeout(60_000);

    if (!sharedScenario) throw new Error("Missing shared scenario from admin setup");
    const {
      moduleIndex,
      moduleName,
      learningOutcome,
      journalTitle,
      studentOneName,
      ktpTheme1,
      ktpTheme2,
      ktpHomework,
      ktpNotes,
    } = sharedScenario;

    sharedJournalTitle = journalTitle;

    const teacherUsername = env("E2E_TEACHER_USERNAME", "Килаш Расул Жангелдыулы");
    const teacherPassword = env("E2E_TEACHER_PASSWORD", "teachertest");
    await loginViaUi(page, teacherUsername, teacherPassword);

    await page.goto("/planning");
    await expect(page.locator("#add-button")).toBeVisible({ timeout: 30_000 });
    await page.getByText("Сегодня").click().catch(() => {});

    await page.locator("#add-button").click();
    const addEventPopover = page.locator("#add-event-popover");
    await expect(addEventPopover).toBeVisible();

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

    await addEventPopover
      .locator("#use-custom-period, #use-custom-period-edit")
      .first()
      .click({ force: true });
    const dateInputs = addEventPopover.locator('input[placeholder="Дата"]:visible');
    await dateInputs.nth(0).click();
    await pickF7CalendarDay(page, { offsetDays: 0 });
    await dateInputs.nth(1).click();
    await pickF7CalendarDay(page, { offsetDays: 1 });

    await addEventPopover.locator("#event-form-participants").click();
    const studentPopup = page.locator("#student-selection-popup");
    await expect(studentPopup).toBeVisible();
    await studentPopup.getByText(studentOneName).click();
    await studentPopup.getByRole("button", { name: "Сохранить" }).click();
    await expect(studentPopup).toBeHidden();

    await addEventPopover.locator("#event-form-ktp").click();
    const ktpDetailPopover = page.locator("#ktp-detail-popover:visible");
    await expect(ktpDetailPopover).toBeVisible({ timeout: 30_000 });

    await ktpDetailPopover.locator("#add-ktp-detail-button").click();
    const ktpCreatePopover = page.locator(".popover.popover-center-page:visible");
    await expect(ktpCreatePopover.getByText("Создать")).toBeVisible({ timeout: 30_000 });

    await fillField(page, "#ktp-theme", ktpTheme1);
    await fillField(page, "#ktp-total-hours", "2");
    await fillField(page, "#ktp-homework", ktpHomework);
    await fillField(page, "#ktp-notes", ktpNotes);

    await ktpCreatePopover.getByRole("button", { name: "Сохранить" }).click();
    await expect(ktpCreatePopover).toBeHidden({ timeout: 30_000 });
    await expect(ktpDetailPopover.getByText(ktpTheme1)).toBeVisible({ timeout: 30_000 });

    await ktpDetailPopover.locator("#add-ktp-detail-button").click();
    const ktpCreatePopover2 = page.locator(".popover.popover-center-page:visible");
    await expect(ktpCreatePopover2.getByText("Создать")).toBeVisible({ timeout: 30_000 });

    await fillField(page, "#ktp-theme", ktpTheme2);
    await fillField(page, "#ktp-total-hours", "1");
    await fillField(page, "#ktp-homework", ktpHomework);
    await fillField(page, "#ktp-notes", ktpNotes);

    await ktpCreatePopover2.getByRole("button", { name: "Сохранить" }).click();
    await expect(ktpCreatePopover2).toBeHidden({ timeout: 30_000 });
    await expect(ktpDetailPopover.getByText(ktpTheme2)).toBeVisible({ timeout: 30_000 });

    await ktpDetailPopover.getByText(ktpTheme2).first().click();
    const ktpEditPopover = page.locator(".popover.popover-center-page:visible");
    await expect(ktpEditPopover.getByText("Редактировать")).toBeVisible({
      timeout: 30_000,
    });
    await ktpEditPopover.getByText("Удалить запись").click();

    const confirmDialog = page.locator(".dialog:visible").first();
    await expect(confirmDialog).toBeVisible({ timeout: 30_000 });
    await expect(confirmDialog).toContainText(/удаление темы/i);
    await confirmDialog.getByRole("button", { name: /хорошо/i }).click();

    await expect(ktpDetailPopover.getByText(ktpTheme2)).toBeHidden({ timeout: 30_000 });
    await expect(ktpDetailPopover.getByText(ktpTheme1)).toBeVisible({ timeout: 30_000 });

    await ktpDetailPopover.getByRole("button", { name: "Закрыть" }).click();
    await expect(ktpDetailPopover).toBeHidden({ timeout: 30_000 });

    await addEventPopover.getByRole("button", { name: "Добавить" }).click();
    await expect(addEventPopover).toBeHidden({ timeout: 15_000 });

    // Capture created journal id for later tests by opening the event preview from Planning.
    const createdEvent = page
      .locator(".calendar-event")
      .filter({ hasText: moduleIndex })
      .first();
    await expect(createdEvent).toBeVisible({ timeout: 60_000 });
    await createdEvent.click();

    const previewPopover = page.locator("#journal-preview-popover:visible");
    await expect(previewPopover).toBeVisible({ timeout: 30_000 });

    // Clicking the card navigates to `/journals/:id?...`.
    await previewPopover.locator("div.group.relative").first().click();
    await page.waitForURL(/\/journals\/[^/]+/, { timeout: 30_000 });

    const url = page.url();
    const match = url.match(/\/journals\/([^/?#]+)/);
    sharedJournalId = match?.[1] || null;
    if (!sharedJournalId) throw new Error(`Failed to extract journal id from URL: ${url}`);
  });

  test("journal details shows KTP via paperclip", async ({ page }) => {
    page.setDefaultTimeout(20_000);
    page.setDefaultNavigationTimeout(60_000);

    if (!sharedScenario || !sharedJournalId) {
      throw new Error("Missing shared journal title from previous test run");
    }

    const teacherUsername = env("E2E_TEACHER_USERNAME", "Килаш Расул Жангелдыулы");
    const teacherPassword = env("E2E_TEACHER_PASSWORD", "teachertest");
    await loginViaUi(page, teacherUsername, teacherPassword);

    await page.goto(`/journals/${sharedJournalId}?from=journals`);
    await page.waitForURL(/\/journals\/[^/]+/, { timeout: 30_000 });
    await expect(page.locator("#journal-settings-button")).toBeVisible({
      timeout: 30_000,
    });

    const paperclipIcons = page.locator('[id^="paperclip-"]');
    await expect
      .poll(async () => (await paperclipIcons.count()) > 0, { timeout: 60_000 })
      .toBeTruthy();
    await paperclipIcons.first().click();

    const ktpViewPopover = page.locator(".popover.popover-center-page:visible");
    await expect(ktpViewPopover.getByText("Просмотр темы занятия")).toBeVisible({
      timeout: 30_000,
    });
    await expect(ktpViewPopover.getByText(sharedScenario.ktpTheme1)).toBeVisible({
      timeout: 30_000,
    });
    await ktpViewPopover.getByRole("button", { name: "Закрыть" }).click();
    await expect(ktpViewPopover).toBeHidden({ timeout: 30_000 });
  });

  test("journal settings persist after reload", async ({ page }) => {
    page.setDefaultTimeout(20_000);
    page.setDefaultNavigationTimeout(60_000);

    if (!sharedJournalId) {
      throw new Error("Missing shared journal title from previous test run");
    }

    const teacherUsername = env("E2E_TEACHER_USERNAME", "Килаш Расул Жангелдыулы");
    const teacherPassword = env("E2E_TEACHER_PASSWORD", "teachertest");
    await loginViaUi(page, teacherUsername, teacherPassword);

    await page.goto(`/journals/${sharedJournalId}?from=journals`);
    await page.waitForURL(/\/journals\/[^/]+/, { timeout: 30_000 });
    await expect(page.locator("#journal-settings-button")).toBeVisible({
      timeout: 30_000,
    });

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
  });

  test("journal details loads after reload", async ({ page }) => {
    page.setDefaultTimeout(20_000);
    page.setDefaultNavigationTimeout(60_000);

    const teacherUsername = env("E2E_TEACHER_USERNAME", "Килаш Расул Жангелдыулы");
    const teacherPassword = env("E2E_TEACHER_PASSWORD", "teachertest");

    if (!sharedJournalId) {
      throw new Error("Missing shared journal title from previous test run");
    }

    await loginViaUi(page, teacherUsername, teacherPassword);

    await page.goto(`/journals/${sharedJournalId}?from=journals`);
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
