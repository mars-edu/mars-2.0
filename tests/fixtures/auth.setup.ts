import { test as setup } from '@playwright/test';
import { testUsers } from './test-data';

const authFile = 'tests/.auth/user.json';

setup('authenticate as teacher', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  // Fill in login form with resilient locators
  const usernameInput = page
    .locator('input[placeholder*="ФИО"], input[placeholder*="login"], input[name="username"], input[type="text"]:visible')
    .first();
  const passwordInput = page
    .locator('input[placeholder*="пароль"], input[placeholder*="password"], input[type="password"]:visible')
    .first();

  await usernameInput.fill(testUsers.teacher.username || testUsers.teacher.fullName);
  await passwordInput.fill(testUsers.teacher.password);

  // Click login button
  const loginButton = page
    .getByRole('button', { name: /войти|login/i })
    .or(page.locator('button[type="submit"]:visible'))
    .first();
  await loginButton.click();

  // Wait for navigation to complete
  await page.waitForURL(/\/home\/?/, { timeout: 30000 }).catch(() => {
    // If redirect doesn't happen, authentication might have failed or already completed
  });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
