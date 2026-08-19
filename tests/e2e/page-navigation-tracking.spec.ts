import { test, expect } from '@playwright/test';

test.describe('Page Navigation Tracking', () => {
  // Increase timeout for CI environment (very slow login flows)
  test.setTimeout(35000); // 2.5 minutes

  test.beforeEach(async ({ page }) => {
    // Login with real Convex authentication
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill in login credentials (must exist in Convex database)
    await page.getByRole('textbox', { name: /ФИО/i }).fill('Килаш Расул Жангелдыулы');
    await page.getByRole('textbox', { name: /Пароль/i }).fill('teachertest');
    await page.getByRole('button', { name: /Войти/i }).click();

    // Wait for successful login and navigation to home
    // Increased timeout for very slow CI environment
    await page.waitForURL(/\/home/, { timeout: 120000 }); // 2 minutes
    await page.waitForLoadState('networkidle');
  });

  test('should have unique data-page-id attribute on each page', async ({ page }) => {
    // Get initial home page ID (use .last() to get current visible page)
    const homePageId1 = await page.locator('[data-page-name="home"]').last().getAttribute('data-page-id');
    expect(homePageId1).toBeTruthy();
    expect(homePageId1).toContain('home-');

    // Navigate to journals
    await page.locator('aside nav').getByText('Журналы').first().click({ force: true });
    await page.waitForURL(/\/journals/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Get journals page ID
    const journalsPageId = await page.locator('[data-page-name="journals"]').last().getAttribute('data-page-id');
    expect(journalsPageId).toBeTruthy();
    expect(journalsPageId).toContain('journals-');

    // Page IDs should be different between home and journals
    expect(journalsPageId).not.toBe(homePageId1);
  });

  test('should change data-page-id on page refresh', async ({ page }) => {
    // Get initial page ID (use .last() to get current visible page)
    const pageId1 = await page.locator('[data-page-name="home"]').last().getAttribute('data-page-id');
    expect(pageId1).toBeTruthy();

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Get new page ID
    const pageId2 = await page.locator('[data-page-name="home"]').last().getAttribute('data-page-id');
    expect(pageId2).toBeTruthy();

    // Page ID should be different after refresh
    expect(pageId2).not.toBe(pageId1);
  });

  test('should track navigation through multiple pages', async ({ page }) => {
    const visitedPages: Array<{ name: string; id: string }> = [];

    // Track home page (use .last() to get current visible page)
    const homePage = await page.locator('[data-page-name="home"]').last();
    visitedPages.push({
      name: await homePage.getAttribute('data-page-name') || '',
      id: await homePage.getAttribute('data-page-id') || '',
    });

    // Navigate to journals
    await page.locator('aside nav').getByText('Журналы').first().click({ force: true });
    await page.waitForURL(/\/journals/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    const journalsPage = await page.locator('[data-page-name="journals"]').last();
    visitedPages.push({
      name: await journalsPage.getAttribute('data-page-name') || '',
      id: await journalsPage.getAttribute('data-page-id') || '',
    });

    // Navigate to notifications page directly
    await page.goto('/notifications');
    await page.waitForURL(/\/notifications/, { timeout: 15000 });
    await page.waitForLoadState('networkidle');

    const notifPage = await page.locator('[data-page-name="notifications"]').last();
    visitedPages.push({
      name: await notifPage.getAttribute('data-page-name') || '',
      id: await notifPage.getAttribute('data-page-id') || '',
    });

    // Verify all pages have unique IDs
    expect(visitedPages.length).toBe(3);
    expect(visitedPages[0].name).toBe('home');
    expect(visitedPages[1].name).toBe('journals');
    expect(visitedPages[2].name).toBe('notifications');

    // All IDs should be unique
    const uniqueIds = new Set(visitedPages.map(p => p.id));
    expect(uniqueIds.size).toBe(3);

    // Each ID should contain the page name
    expect(visitedPages[0].id).toContain('home-');
    expect(visitedPages[1].id).toContain('journals-');
    expect(visitedPages[2].id).toContain('notifications-');
  });
});
