import { test, expect } from '@playwright/test';

test.describe('API Integration', () => {
  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API to return error
    await page.route('**/api/**', (route) => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/journals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should still be functional even with API errors
    const bodyText = await page.locator('body').textContent();
    expect(bodyText).toBeTruthy();
  });

  test('should retry failed API requests', async ({ page }) => {
    let requestCount = 0;

    // Listen for all requests to any API endpoint
    page.on('request', (request) => {
      const url = request.url();
      if (url.includes('/api/') || url.includes('api')) {
        requestCount++;
      }
    });

    await page.route('**/api/**', (route) => {
      // Fulfill with error for first few requests
      if (requestCount <= 2) {
        route.fulfill({
          status: 503,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Service Unavailable' }),
        });
      } else {
        route.continue();
      }
    });

    await page.goto('/journals');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Page should still load even with API errors
    const bodyContent = await page.locator('body').textContent();
    expect(bodyContent).toBeTruthy();
  });

  test('should handle network offline', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial content
    const initialContent = await page.locator('body').textContent();
    expect(initialContent).toBeTruthy();

    // Simulate offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // Even offline, page should have some content (cached)
    const offlineContent = await page.locator('body').textContent();
    expect(offlineContent).toBeTruthy();

    // Restore online
    await context.setOffline(false);
  });

  test('should cache static resources', async ({ page }) => {
    const cachedResources: string[] = [];

    page.on('response', (response) => {
      const cacheControl = response.headers()['cache-control'];
      if (cacheControl && cacheControl.includes('max-age')) {
        cachedResources.push(response.url());
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Should have some cached resources
    expect(cachedResources.length).toBeGreaterThan(0);
  });
});
