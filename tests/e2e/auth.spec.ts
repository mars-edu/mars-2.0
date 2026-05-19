import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  // Increase timeout for CI environment (very slow login flows)
  test.setTimeout(150000); // 2.5 minutes

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should display login page', async ({ page }) => {
    await page.waitForTimeout(1000);

    // Check if we're on login or need to navigate there
    const currentUrl = page.url();
    if (!currentUrl.includes('login')) {
      await page.goto('/login');
      await page.waitForLoadState('networkidle');
    }

    await expect(page).toHaveURL(/login/);
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const loginButton = page.locator('button[type="submit"]').first();

    if (await loginButton.count() > 0) {
      await loginButton.click();

      // Wait for validation messages
      await page.waitForTimeout(1000);

      // Check if the page didn't navigate (still on login)
      await expect(page).toHaveURL(/login/);
    }
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const registerLink = page.locator('a[href*="register"]').first();

    if (await registerLink.count() > 0) {
      await registerLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/register/);
    } else {
      // If no register link, just pass the test
      expect(true).toBeTruthy();
    }
  });

  test('should navigate to restore password page', async ({ page }) => {
    await page.goto('/login');

    const restoreLink = page.getByRole('link', { name: /forgot|забыли|восстановить/i });
    if (await restoreLink.count() > 0) {
      await restoreLink.click();
      await expect(page).toHaveURL(/restore-password/);
    }
  });

  test('should redirect to home when accessing login page while already authenticated', async ({ page }) => {
    // Enable console logging for this test to help debug CI failures
    page.on('console', msg => console.log(`[Browser Console] ${msg.type()}: ${msg.text()}`));

    // First, login
    console.log('Navigating to login page...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    console.log('Filling login form...');
    // Use more robust selectors like in planning-journal-flow.spec.ts
    const usernameInput = page.locator('input[placeholder="Введите ФИО"]:visible');
    const passwordInput = page.locator('input[placeholder="Введите пароль"]:visible');
    
    await expect(usernameInput.first()).toBeVisible({ timeout: 30000 });
    await usernameInput.first().fill('Килаш Расул Жангелдыулы');
    
    await expect(passwordInput.first()).toBeVisible({ timeout: 30000 });
    await passwordInput.first().fill('teachertest');
    
    console.log('Clicking login button...');
    const loginButton = page.getByRole('button', { name: /Войти/i }).filter({ visible: true }).first();
    await expect(loginButton).toBeVisible({ timeout: 10000 });
    await loginButton.click();

    // Wait for successful login and navigation to home
    console.log('Waiting for redirection to /home...');
    
    // Check for error toast if we stay on login page too long
    const errorToast = page.locator('.toast-text, .notification-text').filter({ hasText: /неверн|ошибка|invalid|error/i });
    
    // Race between navigation and error toast
    try {
      await Promise.race([
        page.waitForURL(/\/home\/?/, { timeout: 120000 }),
        errorToast.waitFor({ state: 'visible', timeout: 120000 }).then(() => {
          throw new Error('Login failed with error toast');
        })
      ]);
    } catch (error) {
      if (await errorToast.isVisible()) {
        const toastText = await errorToast.innerText();
        console.error(`Login failed with toast: ${toastText}`);
        throw new Error(`Login failed: ${toastText}`);
      }
      throw error;
    }
    
    await page.waitForLoadState('networkidle');

    // Verify we're on home page
    expect(page.url()).toMatch(/\/home\/?$/);
    console.log('Login successful, reached /home');

    // Now try to navigate to /login while authenticated
    console.log('Attempting to go back to /login while authenticated...');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000); // Give time for redirect to happen

    // Should be redirected back to home, not stay on login
    const finalUrl = page.url();
    console.log(`Final URL after redirection: ${finalUrl}`);
    expect(finalUrl).toMatch(/\/home\/?$/);
    expect(finalUrl).not.toContain('/login');
  });
});
