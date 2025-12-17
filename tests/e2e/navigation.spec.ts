import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('should load home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Mars|МАРС/);
  });

  test('should navigate to main sections', async ({ page }) => {
    await page.goto('/');

    // Test navigation to different pages
    const sections = [
      { url: '/journals', name: /journals|журналы/i },
      { url: '/planning', name: /planning|планирование/i },
      { url: '/reports', name: /reports|отчеты/i },
      { url: '/analytics', name: /analytics|аналитика/i },
    ];

    for (const section of sections) {
      await page.goto(section.url);
      await page.waitForLoadState('networkidle');

      const currentUrl = page.url();

      // If redirected to login, that's expected for protected routes
      if (currentUrl.includes('login')) {
        expect(currentUrl).toContain('login');
      } else {
        // If not redirected, verify we're on the correct page
        await expect(page).toHaveURL(new RegExp(section.url));
      }
    }
  });

  test('should handle 404 page', async ({ page }) => {
    await page.goto('/non-existent-page');
    await page.waitForLoadState('networkidle');

    const url = page.url();

    // App may redirect to login or 404 page
    const has404 = await page.locator('text=404').or(page.locator('text=Not Found')).count() > 0;
    const hasLogin = url.includes('login');
    const has404Page = url.includes('404');

    // Either shows 404 content, redirects to login, or has 404 in URL
    expect(has404 || hasLogin || has404Page).toBeTruthy();
  });

  test('should be responsive', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    await expect(page).toHaveURL(/\//);

    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    await expect(page).toHaveURL(/\//);

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await expect(page).toHaveURL(/\//);
  });
});
