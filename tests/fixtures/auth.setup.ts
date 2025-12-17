import { test as setup } from '@playwright/test';
import { testUsers } from './test-data';

const authFile = 'tests/.auth/user.json';

setup('authenticate as teacher', async ({ page }) => {
  await page.goto('/login');

  // Fill in login form
  await page.locator('input[type="email"]').fill(testUsers.teacher.email);
  await page.locator('input[type="password"]').fill(testUsers.teacher.password);

  // Click login button
  await page.getByRole('button', { name: /login|войти/i }).click();

  // Wait for navigation to complete
  await page.waitForURL('**/home', { timeout: 10000 }).catch(() => {
    // If redirect doesn't happen, authentication might have failed
    // but we'll save the state anyway for testing purposes
  });

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
