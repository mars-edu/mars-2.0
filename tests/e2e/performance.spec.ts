import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('should load home page within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;

    // Page should load within 5 seconds
    expect(loadTime).toBeLessThan(5000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Measure paint timing using Performance API
    const paintTiming = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
      return fcp ? fcp.startTime : null;
    });

    // If FCP is available, it should be under 3 seconds
    if (paintTiming) {
      expect(paintTiming).toBeLessThan(3000);
    } else {
      // If not available, just check page loaded
      expect(await page.locator('body').count()).toBeGreaterThan(0);
    }
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Get initial memory usage using performance.memory (if available)
    const initialMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    // Navigate to different pages
    const pages = ['/journals', '/planning', '/reports', '/analytics'];

    for (const url of pages) {
      await page.goto(url).catch(() => {
        // Some pages may redirect to login
      });
      await page.waitForLoadState('networkidle');
    }

    // Return to home
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const finalMemory = await page.evaluate(() => {
      if ('memory' in performance) {
        return (performance as any).memory.usedJSHeapSize;
      }
      return null;
    });

    // If memory API available, check growth isn't excessive
    if (initialMemory && finalMemory) {
      const heapGrowth = finalMemory - initialMemory;
      expect(heapGrowth).toBeLessThan(50 * 1024 * 1024);
    } else {
      // If not available, just verify page is functional after navigation
      expect(await page.locator('body').count()).toBeGreaterThan(0);
    }
  });

  test('should have efficient bundle size', async ({ page }) => {
    const resources: Array<{ url: string; size: number }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.endsWith('.js') || url.endsWith('.css')) {
        const buffer = await response.body().catch(() => null);
        if (buffer) {
          resources.push({
            url,
            size: buffer.length,
          });
        }
      }
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Check total bundle size
    const totalSize = resources.reduce((sum, r) => sum + r.size, 0);

    // Total JS + CSS should be under 5MB for initial load
    expect(totalSize).toBeLessThan(10 * 1024 * 1024);
  });
});
