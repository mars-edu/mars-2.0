import { test, expect } from '@playwright/test';

test.describe('Page Navigation Tracking', () => {
  // Increase timeout for CI environment (slow login flows)
  test.setTimeout(90000);

  test.beforeEach(async ({ page }) => {
    // Login with real Convex authentication
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Fill in login credentials (must exist in Convex database)
    await page.getByRole('textbox', { name: /ФИО/i }).fill('Килаш Расул Жангелдыулы');
    await page.getByRole('textbox', { name: /Пароль/i }).fill('teachertest');
    await page.getByRole('button', { name: /Войти/i }).click();

    // Wait for successful login and navigation to home
    // Increased timeout for CI environment
    await page.waitForURL(/\/home/, { timeout: 60000 });
    await page.waitForLoadState('networkidle');
  });

  test('should have unique data-page-id attribute on each page', async ({ page }) => {
    // Get initial home page ID (use .last() to get current visible page)
    const homePageId1 = await page.locator('[data-page-name="home"]').last().getAttribute('data-page-id');
    expect(homePageId1).toBeTruthy();
    expect(homePageId1).toContain('home-');

    // Navigate to journals
    await page.getByText('doc_text_fillЖурналы').first().click();
    await page.waitForURL(/\/journals/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Get journals page ID
    const journalsPageId = await page.locator('[data-page-name="journals"]').last().getAttribute('data-page-id');
    expect(journalsPageId).toBeTruthy();
    expect(journalsPageId).toContain('journals-');

    // Navigate back to home
    await page.getByText('house_fillГлавная').first().click();
    await page.waitForURL(/\/home/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    // Get new home page ID
    const homePageId2 = await page.locator('[data-page-name="home"]').last().getAttribute('data-page-id');
    expect(homePageId2).toBeTruthy();
    expect(homePageId2).toContain('home-');

    // Page IDs should be different (page was remounted)
    expect(homePageId2).not.toBe(homePageId1);
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
    await page.getByText('doc_text_fillЖурналы').first().click();
    await page.waitForURL(/\/journals/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    const journalsPage = await page.locator('[data-page-name="journals"]').last();
    visitedPages.push({
      name: await journalsPage.getAttribute('data-page-name') || '',
      id: await journalsPage.getAttribute('data-page-id') || '',
    });

    // Navigate to discipline catalog
    await page.getByText('book_fillКаталог дисциплин').first().click();
    await page.waitForURL(/\/discipline-catalog/, { timeout: 5000 });
    await page.waitForLoadState('networkidle');

    const disciplinePage = await page.locator('[data-page-name="discipline-catalog"]').last();
    visitedPages.push({
      name: await disciplinePage.getAttribute('data-page-name') || '',
      id: await disciplinePage.getAttribute('data-page-id') || '',
    });

    // Verify all pages have unique IDs
    expect(visitedPages.length).toBe(3);
    expect(visitedPages[0].name).toBe('home');
    expect(visitedPages[1].name).toBe('journals');
    expect(visitedPages[2].name).toBe('discipline-catalog');

    // All IDs should be unique
    const uniqueIds = new Set(visitedPages.map(p => p.id));
    expect(uniqueIds.size).toBe(3);

    // Each ID should contain the page name
    expect(visitedPages[0].id).toContain('home-');
    expect(visitedPages[1].id).toContain('journals-');
    expect(visitedPages[2].id).toContain('discipline-catalog-');
  });
});
