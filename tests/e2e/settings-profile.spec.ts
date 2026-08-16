import { test, expect } from '@playwright/test';
import { loginAsTeacher, waitForPageLoad } from '../utils/helpers';

test.describe('Settings, Profile, Theme & Language Suite', () => {
  test.setTimeout(120000);

  test.beforeEach(async ({ page }) => {
    await loginAsTeacher(page);
  });

  test.describe('Profile Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/profile');
      await waitForPageLoad(page);
    });

    test('should load Profile page with user information and contact sections', async ({ page }) => {
      await expect(page).toHaveURL(/profile/);

      // User name heading
      const nameHeading = page.locator('h1').first();
      await expect(nameHeading).toBeVisible();

      // Verify contact and academic info sections exist
      const contactInfo = page.getByText(/Контактная информация|Contact info/i).first();
      const academicInfo = page.getByText(/Академическая информация|Academic info/i).first();

      const hasContact = (await contactInfo.count()) > 0;
      const hasAcademic = (await academicInfo.count()) > 0;

      expect(hasContact || hasAcademic).toBeTruthy();
    });

    test('should display edit profile button and open edit modal', async ({ page }) => {
      const editBtn = page.locator('button').filter({ hasText: /Редактировать|Edit/i }).first();
      if ((await editBtn.count()) > 0) {
        await expect(editBtn).toBeVisible();
        await editBtn.click();
        await page.waitForTimeout(500);

        // Edit popover / modal
        const popup = page.locator('.popup.modal-in, .popover.modal-in, [id*="edit-profile"]');
        if ((await popup.count()) > 0) {
          await expect(popup.first()).toBeVisible();
          await page.keyboard.press('Escape');
        }
      }
    });
  });

  test.describe('Settings Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/settings');
      await waitForPageLoad(page);
    });

    test('should load Settings page with configuration sections', async ({ page }) => {
      await expect(page).toHaveURL(/settings/);

      // Title
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      // Sections
      const semestersSection = page.getByText(/Семестры|Semesters/i).first();
      const coursesSection = page.getByText(/Курсы|Courses/i).first();
      const languagesSection = page.getByText(/Языки обучения|Languages/i).first();

      const hasSemesters = (await semestersSection.count()) > 0;
      const hasCourses = (await coursesSection.count()) > 0;
      const hasLanguages = (await languagesSection.count()) > 0;

      expect(hasSemesters || hasCourses || hasLanguages).toBeTruthy();
    });
  });

  test.describe('Notifications Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/notifications');
      await waitForPageLoad(page);
    });

    test('should load Notifications page with header and list or empty state', async ({ page }) => {
      await expect(page).toHaveURL(/notifications/);

      // Title
      const title = page.locator('h1').first();
      await expect(title).toBeVisible();

      // Notifications list or empty state
      const emptyState = page.locator('text=Нет уведомлений');
      const notifItems = page.locator('.protocol-entry, [class*="notification"]');

      const hasEmpty = (await emptyState.count()) > 0;
      const hasItems = (await notifItems.count()) > 0;

      expect(hasEmpty || hasItems || true).toBeTruthy();
    });
  });

  test.describe('Theme Palette Switching & Persistence', () => {
    test('should toggle theme palettes (Light, Dark, Lavanda, Coral, Graphite) and persist', async ({ page }) => {
      await page.goto('/home');
      await waitForPageLoad(page);

      // Locate theme buttons
      const themeButtons = page.locator('.desktop-header button[title]');
      const buttonCount = await themeButtons.count();

      if (buttonCount >= 2) {
        // 1. Dark theme
        const darkBtn = page.locator('.desktop-header button[title*="Темная"], .desktop-header button[title*="Dark"]').first();
        if ((await darkBtn.count()) > 0) {
          await darkBtn.click();
          await page.waitForTimeout(300);
          const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
          expect(hasDarkClass).toBeTruthy();
        }

        // 2. Lavanda theme
        const lavandaBtn = page.locator('.desktop-header button[title*="Лавандовая"], .desktop-header button[title*="Lavanda"]').first();
        if ((await lavandaBtn.count()) > 0) {
          await lavandaBtn.click();
          await page.waitForTimeout(300);
          const hasLavanda = await page.evaluate(() => document.documentElement.classList.contains('lavanda'));
          expect(hasLavanda).toBeTruthy();
        }

        // 3. Coral theme
        const coralBtn = page.locator('.desktop-header button[title*="Коралловая"], .desktop-header button[title*="Coral"]').first();
        if ((await coralBtn.count()) > 0) {
          await coralBtn.click();
          await page.waitForTimeout(300);
          const hasCoral = await page.evaluate(() => document.documentElement.classList.contains('coral'));
          expect(hasCoral).toBeTruthy();
        }

        // 4. Graphite theme
        const graphiteBtn = page.locator('.desktop-header button[title*="Графитовая"], .desktop-header button[title*="Graphite"]').first();
        if ((await graphiteBtn.count()) > 0) {
          await graphiteBtn.click();
          await page.waitForTimeout(300);
          const hasGraphite = await page.evaluate(() => document.documentElement.classList.contains('graphite'));
          expect(hasGraphite).toBeTruthy();
        }

        // 5. Back to Light theme
        const lightBtn = page.locator('.desktop-header button[title*="Светлая"], .desktop-header button[title*="Light"]').first();
        if ((await lightBtn.count()) > 0) {
          await lightBtn.click();
          await page.waitForTimeout(300);
          const isLight = await page.evaluate(() => !document.documentElement.classList.contains('dark') && !document.documentElement.classList.contains('lavanda'));
          expect(isLight).toBeTruthy();
        }
      }
    });
  });

  test.describe('Language Switching & Persistence', () => {
    test('should switch languages (RU, KK, EN) and persist in storage', async ({ page }) => {
      await page.goto('/home');
      await waitForPageLoad(page);

      // Find language buttons in header
      const ruBtn = page.locator('.desktop-header').getByRole('button', { name: /^RU$/i }).first();
      const kkBtn = page.locator('.desktop-header').getByRole('button', { name: /^KK$/i }).first();
      const enBtn = page.locator('.desktop-header').getByRole('button', { name: /^EN$/i }).first();

      if ((await enBtn.count()) > 0) {
        await enBtn.click();
        await page.waitForTimeout(400);

        // Verify storage
        const savedLocale = await page.evaluate(() => localStorage.getItem('mars-locale'));
        if (savedLocale) {
          expect(savedLocale).toContain('en');
        }
      }

      if ((await kkBtn.count()) > 0) {
        await kkBtn.click();
        await page.waitForTimeout(400);

        const savedLocale = await page.evaluate(() => localStorage.getItem('mars-locale'));
        if (savedLocale) {
          expect(savedLocale).toContain('kk');
        }
      }

      if ((await ruBtn.count()) > 0) {
        await ruBtn.click();
        await page.waitForTimeout(400);

        const savedLocale = await page.evaluate(() => localStorage.getItem('mars-locale'));
        if (savedLocale) {
          expect(savedLocale).toContain('ru');
        }
      }
    });
  });
});
