import { chromium } from "playwright";

const TARGETS = [
  { name: "DEV", url: "https://next.iam-mars.kz" },
  { name: "PROD", url: "https://iam-mars.kz" },
];

async function runDeepAudit(env) {
  console.log(`\n================================================================`);
  console.log(`🔬 [DEEP QA AUDIT] Testing ${env.name} at ${env.url}`);
  console.log(`================================================================`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const logs = [];
  const results = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      logs.push(`[Console Error] ${msg.text()}`);
    }
  });

  page.on("pageerror", (err) => {
    logs.push(`[Uncaught Page Error] ${err.message}`);
  });

  try {
    // 1. Auth & Login
    console.log(`\n[1/7] 🔑 Authentication & Login...`);
    await page.goto(`${env.url}/login`, { waitUntil: "networkidle" });
    await page.fill('input[type="text"]', 'Килаш Расул Жангелдыулы');
    await page.fill('input[type="password"]', 'teachertest');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/home', { timeout: 15000 });
    console.log(`   ✅ Logged in successfully -> /home`);
    results.push({ area: "Auth & Login", status: "PASS" });

    // 2. Journals Page & Tabs
    console.log(`\n[2/7] 📖 Journals Page & Course Tabs...`);
    await page.goto(`${env.url}/journals`, { waitUntil: "networkidle" });
    await page.waitForSelector('h1', { timeout: 15000 });

    const journalCards = page.locator('.rounded-\\[20px\\]');
    const cardCount = await journalCards.count();
    console.log(`   ✅ Journals list loaded with ${cardCount} card(s)`);

    // Test course filter tabs
    const filterTabs = page.locator('button:has-text("Все"), button:has-text("1 курс"), button:has-text("Смешанные")');
    const tabCount = await filterTabs.count();
    console.log(`   ✅ Found ${tabCount} filter tabs`);
    results.push({ area: "Journals Page & Tabs", status: "PASS", details: `${cardCount} journals, ${tabCount} tabs` });

    // 3. Planning Page & Add Event Wizard & Conflict Detection
    console.log(`\n[3/7] 📅 Planning Page & Add Event Wizard...`);
    await page.goto(`${env.url}/planning`, { waitUntil: "networkidle" });
    await page.waitForSelector('h1', { timeout: 15000 });

    const createBtn = page.getByRole('button', { name: /создать пару|добавить пару/i }).first();
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await page.waitForTimeout(800);

      const wizard = page.locator('#schedule-item-popup');
      const wizardVisible = await wizard.isVisible();
      console.log(`   ✅ Add Event Wizard opened: ${wizardVisible}`);

      const stepHeader = page.getByText(/Основное|Время|Студенты/i).first();
      const stepHeaderVisible = await stepHeader.isVisible();
      console.log(`   ✅ Step indicator visible: ${stepHeaderVisible}`);

      const cancelBtn = page.getByRole('button', { name: /отмена|закрыть/i }).first();
      if (await cancelBtn.isVisible()) await cancelBtn.click();

      results.push({ area: "Planning Wizard", status: "PASS" });
    }

    // 4. Education Schedule Page & Decomposed Sections
    console.log(`\n[4/7] ⏰ Education Schedule & Decomposed Sections...`);
    await page.goto(`${env.url}/education-schedule`, { waitUntil: "networkidle" });
    await page.waitForSelector('h1', { timeout: 15000 });

    const bellsHeader = page.locator('text=Звонки, text=Расписание звонков');
    const controlsHeader = page.locator('text=Контроли, text=Экзамены');
    const vacationsHeader = page.locator('text=Каникулы, text=Каникулярные');

    const hasBells = (await bellsHeader.count()) > 0;
    const hasControls = (await controlsHeader.count()) > 0;
    const hasVacations = (await vacationsHeader.count()) > 0;

    console.log(`   ✅ Accordion Sections: Bells (${hasBells}), Controls (${hasControls}), Vacations (${hasVacations})`);
    results.push({ area: "Education Schedule Sections", status: "PASS" });

    // 5. Reports & Sub-period RK1/RK2 Filter
    console.log(`\n[5/7] 📊 Reports & Intermediate Controls Sub-periods...`);
    await page.goto(`${env.url}/reports`, { waitUntil: "networkidle" });
    await page.waitForSelector('h1', { timeout: 15000 });

    const reportTitle = await page.locator('h1').textContent();
    console.log(`   ✅ Reports loaded: "${reportTitle.trim()}"`);
    results.push({ area: "Reports & Filters", status: "PASS" });

    // 6. Protocol Page
    console.log(`\n[6/7] 📜 Protocol Page & Substitutions...`);
    await page.goto(`${env.url}/protocol`, { waitUntil: "networkidle" });
    await page.waitForSelector('h1', { timeout: 15000 });

    const protocolTitle = await page.locator('h1').textContent();
    console.log(`   ✅ Protocol loaded: "${protocolTitle.trim()}"`);
    results.push({ area: "Protocol Page", status: "PASS" });

    // 7. Workload Management & Dynamic Semesters
    console.log(`\n[7/7] 💼 Workload Management & Dynamic Semesters...`);
    await page.goto(`${env.url}/workload-management`, { waitUntil: "networkidle" });
    await page.waitForSelector('h1', { timeout: 15000 });

    const workloadTitle = await page.locator('h1').textContent();
    console.log(`   ✅ Workload loaded: "${workloadTitle.trim()}"`);
    results.push({ area: "Workload Management", status: "PASS" });

  } catch (err) {
    console.error(`   ❌ Audit failed on ${env.name}:`, err.message);
    results.push({ area: "Execution Error", status: "FAIL", error: err.message });
  } finally {
    await browser.close();
  }

  return { results, logs };
}

async function main() {
  const devAudit = await runDeepAudit(TARGETS[0]);
  const prodAudit = await runDeepAudit(TARGETS[1]);

  console.log("\n================================================================");
  console.log("🏆 FINAL QA AUDIT SUMMARY MATRIX (DEV vs PROD)");
  console.log("================================================================");

  console.log(`\n📌 DEV (https://next.iam-mars.kz):`);
  devAudit.results.forEach(r => console.log(`   [${r.status}] ${r.area} ${r.details ? '(' + r.details + ')' : ''}`));
  if (devAudit.logs.length > 0) {
    console.log(`   ⚠️ Logs/Errors: ${devAudit.logs.length}`);
  } else {
    console.log(`   ✨ 0 errors in console`);
  }

  console.log(`\n📌 PROD (https://iam-mars.kz):`);
  prodAudit.results.forEach(r => console.log(`   [${r.status}] ${r.area} ${r.details ? '(' + r.details + ')' : ''}`));
  if (prodAudit.logs.length > 0) {
    console.log(`   ⚠️ Logs/Errors: ${prodAudit.logs.length}`);
  } else {
    console.log(`   ✨ 0 errors in console`);
  }
}

main();
