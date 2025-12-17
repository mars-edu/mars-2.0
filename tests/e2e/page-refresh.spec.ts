import { test, expect } from '@playwright/test';

test.describe('Page Refresh Persistence', () => {
  test.beforeEach(async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    await page.getByRole('textbox', { name: /ФИО/i }).fill('Килаш Расул Жангелдыулы');
    await page.getByRole('textbox', { name: /Пароль/i }).fill('teachertest');
    await page.getByRole('button', { name: /Войти/i }).click();

    // Wait for successful login
    await page.waitForURL(/\/home/, { timeout: 5000 });
  });

  test('should maintain clean URL after page refresh on home', async ({ page }) => {
    // Verify we're on home page with clean URL (no hash)
    await expect(page).toHaveURL(/^http:\/\/[^#]+\/home\/?$/);
    expect(page.url()).not.toContain('#!/');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Should still be on home with clean URL
    await expect(page).toHaveURL(/^http:\/\/[^#]+\/home\/?$/);
    expect(page.url()).not.toContain('#!/');
  });

  test('should maintain clean URL after page refresh on journals', async ({ page }) => {
    // Wait for home page to fully load
    await page.waitForTimeout(500);

    // Navigate to journals page - click on the visible navigation item
    const journalsLink = page.locator('nav').getByText('Журналы');
    await journalsLink.click();
    await page.waitForURL(/\/journals\/?/, { timeout: 5000 });

    // Verify clean URL (no hash)
    const urlBeforeRefresh = page.url();
    expect(urlBeforeRefresh).toMatch(/^http:\/\/[^#]+\/journals\/?$/);
    expect(urlBeforeRefresh).not.toContain('#!/');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for any redirects

    // Should still be on journals with clean URL
    const urlAfterRefresh = page.url();
    expect(urlAfterRefresh).toMatch(/^http:\/\/[^#]+\/journals\/?$/);
    expect(urlAfterRefresh).not.toContain('#!/');

    // Verify journals content is displayed
    const hasJournals = await page.locator('h1').getByText(/Журналы/i).count() > 0;
    expect(hasJournals).toBeTruthy();
  });

  test('should maintain clean URL after page refresh on discipline-catalog', async ({ page }) => {
    // Navigate to discipline catalog
    await page.locator('nav').getByText('Каталог дисциплин').click();
    await page.waitForURL(/\/discipline-catalog\/?/, { timeout: 5000 });

    // Verify clean URL (no hash)
    const urlBeforeRefresh = page.url();
    expect(urlBeforeRefresh).toMatch(/^http:\/\/[^#]+\/discipline-catalog\/?$/);
    expect(urlBeforeRefresh).not.toContain('#!/');

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000); // Wait for any redirects

    // Should still be on discipline-catalog with clean URL
    const urlAfterRefresh = page.url();
    expect(urlAfterRefresh).toMatch(/^http:\/\/[^#]+\/discipline-catalog\/?$/);
    expect(urlAfterRefresh).not.toContain('#!/');
  });

  test('should maintain authentication state after page refresh', async ({ page }) => {
    // Navigate to profile
    await page.getByText(/Профиль/).first().click();
    await page.waitForURL(/\/profile\/?/, { timeout: 5000 });

    // Refresh the page
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Should not redirect to login page
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');

    // Should stay on profile or home (if profile redirects)
    expect(currentUrl).toMatch(/\/(profile|home)\/?$/);
  });

  test('should use clean URLs without hash after full navigation flow', async ({ page }) => {
    // Wait for home page to fully load
    await page.waitForTimeout(500);

    const pages = [
      { name: 'Журналы', urlPattern: /\/journals\/?/ },
      { name: 'Каталог дисциплин', urlPattern: /\/discipline-catalog\/?/ },
      { name: 'Главная', urlPattern: /\/home\/?/ },
    ];

    for (const pageInfo of pages) {
      // Navigate to page using nav locator for reliability
      const link = page.locator('nav').getByText(pageInfo.name);
      await link.click();
      await page.waitForTimeout(500);

      // Verify clean URL
      const url = page.url();
      expect(url).not.toContain('#!/');
      expect(url).toMatch(pageInfo.urlPattern);
    }
  });
});
