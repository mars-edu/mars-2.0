import { Page, expect, TestInfo } from '@playwright/test';
import { testUsers } from '../fixtures/test-data';

/**
 * Perform login using modern MARS selectors with fallback support.
 */
export async function login(
  page: Page,
  username: string = testUsers.teacher.username,
  password: string = testUsers.teacher.password,
  redirectTo: string = '/home'
): Promise<void> {
  const currentUrl = page.url();
  if (!currentUrl.includes('/login')) {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
  }

  // Resilient selector for username/ФИО input
  const usernameInput = page
    .locator(
      'input[placeholder*="ФИО"], input[placeholder*="login"], input[name="username"], input[type="text"]:visible, input[type="email"]:visible'
    )
    .first();

  // Resilient selector for password input
  const passwordInput = page
    .locator(
      'input[placeholder*="пароль"], input[placeholder*="password"], input[type="password"]:visible'
    )
    .first();

  await expect(usernameInput).toBeVisible({ timeout: 30000 });
  await usernameInput.fill(username);

  await expect(passwordInput).toBeVisible({ timeout: 30000 });
  await passwordInput.fill(password);

  // Click login button
  const loginButton = page
    .getByRole('button', { name: /войти|login/i })
    .or(page.locator('button[type="submit"]:visible'))
    .first();

  await expect(loginButton).toBeVisible({ timeout: 10000 });
  await loginButton.click();

  // Wait for redirect to complete
  const redirectPattern = new RegExp(redirectTo.replace('/', '\\/'));
  await page.waitForURL(redirectPattern, { timeout: 60000 }).catch(() => {
    // If navigation doesn't trigger automatically within timeout
  });

  await page.waitForLoadState('networkidle');
}

/**
 * Convenience helper to log in as default teacher.
 */
export async function loginAsTeacher(page: Page): Promise<void> {
  await login(page, testUsers.teacher.username, testUsers.teacher.password);
}

/**
 * Resilient logout via sidebar or profile dropdown.
 */
export async function logout(page: Page): Promise<void> {
  const sidebar = page.locator('aside');
  if (await sidebar.isVisible()) {
    const logoutItem = sidebar.getByText(/выход|logout/i).first();
    if (await logoutItem.isVisible()) {
      await logoutItem.click();
      await page.waitForURL(/\/login\/?/, { timeout: 30000 }).catch(() => {});
      return;
    }
  }

  // Fallback via profile page or header avatar
  const profileMenuBtn = page.locator('#profile-menu-button');
  if (await profileMenuBtn.isVisible()) {
    await profileMenuBtn.click();
    const logoutBtn = page.locator('#profile-popover').getByText(/выход|logout/i).first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL(/\/login\/?/, { timeout: 30000 }).catch(() => {});
      return;
    }
  }

  // Direct profile fallback
  await page.goto('/profile');
  const logoutButton = page.getByRole('button', { name: /logout|выход/i }).first();
  if ((await logoutButton.count()) > 0 && (await logoutButton.isVisible())) {
    await logoutButton.click();
    await page.waitForLoadState('networkidle');
  }
}

/**
 * Wait for page network idle and DOM content loaded.
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForLoadState('networkidle').catch(() => {});
}

/**
 * Navigate to a specific route with full load wait.
 */
export async function navigateTo(page: Page, path: string): Promise<void> {
  await page.goto(path);
  await waitForPageLoad(page);
}

/**
 * Click an option inside an open picker, modal, popover, or select dropdown.
 */
export async function clickOptionInPicker(
  page: Page,
  optionText: string | RegExp
): Promise<void> {
  const overlay = page.locator(
    [
      '.smart-select-page:visible',
      '.smart-select-popover:visible',
      '.popup:visible',
      '.sheet-modal:visible',
      '.popover:visible',
      '[role="listbox"]:visible',
    ].join(', ')
  );

  if ((await overlay.count()) > 0) {
    const option = overlay.getByText(optionText).first();
    await expect(option).toBeVisible({ timeout: 10000 });
    await option.click();
  } else {
    // Direct dropdown option match
    const directOption = page.getByRole('option', { name: optionText }).or(page.getByText(optionText)).first();
    if (await directOption.isVisible()) {
      await directOption.click();
    }
  }
}

/**
 * Capture screenshot on test failure.
 */
export async function takeScreenshotOnFailure(page: Page, testInfo: TestInfo): Promise<void> {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot();
    await testInfo.attach('screenshot', {
      body: screenshot,
      contentType: 'image/png',
    });
  }
}

/**
 * Clear local and session storage.
 */
export async function clearLocalStorage(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Mock API response route.
 */
export async function mockApiResponse(
  page: Page,
  url: string,
  response: any,
  status = 200
): Promise<void> {
  await page.route(url, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}
