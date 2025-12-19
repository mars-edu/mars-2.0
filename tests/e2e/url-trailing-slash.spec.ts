import { test, expect } from '@playwright/test';

test.describe('URL Trailing Slash Normalization', () => {
  test('should normalize /login/ to /login on direct navigation', async ({ page }) => {
    await page.goto('/login/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // URL should be normalized to /login without trailing slash
    const url = page.url();
    expect(url).toMatch(/\/login$/);
    expect(url).not.toMatch(/\/login\/$/);
  });

  test('should normalize /login/ with query parameters', async ({ page }) => {
    await page.goto('/login/?redirect=/home');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const url = page.url();
    // Should normalize to /login?redirect=/home (no trailing slash)
    expect(url).toMatch(/\/login\?/);
    expect(url).toContain('redirect=/home');
    expect(url).not.toMatch(/\/login\/\?/);
  });

  test('should normalize /register/ to /register', async ({ page }) => {
    await page.goto('/register/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const url = page.url();
    expect(url).toMatch(/\/register$/);
    expect(url).not.toMatch(/\/register\/$/);
  });

  test('should normalize /restore-password/ to /restore-password', async ({ page }) => {
    await page.goto('/restore-password/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const url = page.url();
    expect(url).toMatch(/\/restore-password$/);
    expect(url).not.toMatch(/\/restore-password\/$/);
  });

  test('should not normalize root path /', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const url = page.url();
    // Root path should either be / or redirect to /login
    expect(url).toMatch(/\/(login)?$/);
  });

  test('should display login page content after normalizing /login/', async ({ page }) => {
    await page.goto('/login/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    // Verify the page actually loads (not just URL change)
    const url = page.url();
    expect(url).toMatch(/\/login$/);

    // Check for login page elements
    const loginButton = page.locator('button[type="submit"]');
    const hasLoginButton = await loginButton.count() > 0;
    expect(hasLoginButton).toBeTruthy();
  });

  test('should handle browser back/forward with trailing slashes', async ({ page }) => {
    // Navigate to login without trailing slash
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    expect(page.url()).toMatch(/\/login$/);

    // Navigate to register without trailing slash
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    expect(page.url()).toMatch(/\/register$/);

    // Go back
    await page.goBack();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Should be back on login without trailing slash
    expect(page.url()).toMatch(/\/login$/);
    expect(page.url()).not.toMatch(/\/login\/$/);

    // Go forward
    await page.goForward();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Should be on register without trailing slash
    expect(page.url()).toMatch(/\/register$/);
    expect(page.url()).not.toMatch(/\/register\/$/);
  });

  test('should normalize protected routes with trailing slashes (redirects to login)', async ({ page }) => {
    // Try to access protected route with trailing slash
    await page.goto('/home/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const url = page.url();
    // Should redirect to login (and login should not have trailing slash)
    if (url.includes('login')) {
      // Check that /login path has no trailing slash (but allow query params)
      expect(url).toMatch(/\/login(\?|$)/);
      expect(url).not.toMatch(/\/login\/(\?|$)/);
    } else {
      // If user is already authenticated, URL should be normalized
      expect(url).toMatch(/\/home$/);
      expect(url).not.toMatch(/\/home\/$/);
    }
  });

  test('should handle multiple consecutive slashes', async ({ page }) => {
    // Framework7 might handle this differently, but we should at least not crash
    await page.goto('/login//');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    // Should either normalize or show 404, but not crash
    const url = page.url();
    const has404 = url.includes('404') || (await page.locator('text=404').count()) > 0;
    const isNormalized = url.match(/\/login$/);

    expect(has404 || isNormalized).toBeTruthy();
  });

  test('should preserve hash fragments when normalizing', async ({ page }) => {
    await page.goto('/login/#section');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const url = page.url();
    // Should have /login (no trailing slash) and preserve hash
    expect(url).toMatch(/\/login#section$/);
    expect(url).not.toMatch(/\/login\/#section$/);
  });

  test('should normalize URL with both trailing slash and hash', async ({ page }) => {
    await page.goto('/login/#section');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(500);

    const url = page.url();
    // Should normalize to /login#section (no trailing slash before hash)
    expect(url).toMatch(/\/login#section$/);
    expect(url).not.toMatch(/\/login\/#section$/);
  });
});
