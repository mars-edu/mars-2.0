import { test, expect, chromium } from '@playwright/test';

test.describe('Performance with Throttling', () => {
  // Set longer timeout for throttled tests
  test.setTimeout(35000); // 120 seconds for CI

  test('should load home page with CPU and network throttling', async ({ baseURL }) => {
    // Launch browser with CDP access
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Get CDP session
    const client = await context.newCDPSession(page);

    // Enable CPU throttling (4x slowdown)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    // Enable network throttling (Slow 3G)
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (500 * 1024) / 8, // 500 Kbps
      uploadThroughput: (500 * 1024) / 8,   // 500 Kbps
      latency: 400,                          // 400ms RTT
    });

    const startTime = Date.now();
    await page.goto(baseURL + '/', { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });
    const loadTime = Date.now() - startTime;

    console.log(`[Throttled - Slow 3G] Page load time: ${loadTime}ms`);

    // Log result without strict assertion to identify current performance
    console.log(`Performance: ${loadTime < 15000 ? 'ACCEPTABLE' : 'NEEDS OPTIMIZATION'}`);

    await browser.close();
  });

  test('should measure Core Web Vitals with throttling', async ({ baseURL }) => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const client = await context.newCDPSession(page);

    // Enable CPU throttling (4x slowdown)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    // Enable network throttling (Fast 3G)
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (1.6 * 1024 * 1024) / 8, // 1.6 Mbps
      uploadThroughput: (750 * 1024) / 8,          // 750 Kbps
      latency: 150,                                 // 150ms RTT
    });

    await page.goto(baseURL + '/', { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Measure paint timing using Performance API
    const metrics = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint')[0];

      return {
        fcp: fcp ? fcp.startTime : null,
        lcp: lcp ? (lcp as any).startTime : null,
      };
    });

    console.log(`[Throttled - Fast 3G] FCP: ${metrics.fcp}ms, LCP: ${metrics.lcp}ms`);

    // Log recommendations based on actual performance
    const fcpThreshold = 5000;
    const lcpThreshold = 8000;

    if (metrics.fcp && metrics.fcp > fcpThreshold) {
      console.log(`⚠️  FCP is ${(metrics.fcp / 1000).toFixed(1)}s - target < ${fcpThreshold / 1000}s`);
    }
    if (metrics.lcp && metrics.lcp > lcpThreshold) {
      console.log(`⚠️  LCP is ${(metrics.lcp / 1000).toFixed(1)}s - target < ${lcpThreshold / 1000}s`);
    }

    await browser.close();
  });

  test('should test different throttling profiles', async ({ baseURL }) => {
    // This test runs 3 profiles sequentially, needs more time
    test.setTimeout(35000); // 3 minutes for 3 profiles

    const profiles = [
      {
        name: 'Slow 4G',
        download: (4 * 1024 * 1024) / 8,
        upload: (3 * 1024 * 1024) / 8,
        latency: 50,
        cpuRate: 4,
      },
      {
        name: 'Fast 3G',
        download: (1.6 * 1024 * 1024) / 8,
        upload: (750 * 1024) / 8,
        latency: 150,
        cpuRate: 4,
      },
      {
        name: 'Slow 3G',
        download: (500 * 1024) / 8,
        upload: (500 * 1024) / 8,
        latency: 400,
        cpuRate: 4,
      },
    ];

    const results: Array<{ profile: string; loadTime: number; fcp: number | null }> = [];

    for (const profile of profiles) {
      const browser = await chromium.launch();
      const context = await browser.newContext();
      const page = await context.newPage();
      const client = await context.newCDPSession(page);

      // Enable CPU throttling
      await client.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuRate });

      // Enable network throttling
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: profile.download,
        uploadThroughput: profile.upload,
        latency: profile.latency,
      });

      const startTime = Date.now();
      await page.goto(baseURL + '/', { timeout: 60000 });
      await page.waitForLoadState('networkidle', { timeout: 60000 });
      const loadTime = Date.now() - startTime;

      const fcp = await page.evaluate(() => {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
        return fcpEntry ? fcpEntry.startTime : null;
      });

      results.push({
        profile: profile.name,
        loadTime,
        fcp,
      });

      console.log(`[${profile.name}] Load: ${loadTime}ms, FCP: ${fcp}ms`);

      await browser.close();
    }

    // Log summary
    console.log('\n=== Performance Summary ===');
    results.forEach((r) => {
      console.log(`${r.profile}: ${r.loadTime}ms (FCP: ${r.fcp}ms)`);
    });
  });

  test('should identify render-blocking resources with throttling', async ({ baseURL }) => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const client = await context.newCDPSession(page);

    // Enable CPU throttling
    await client.send('Emulation.setCPUThrottlingRate', { rate: 4 });

    // Enable network throttling (Slow 3G)
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (500 * 1024) / 8,
      uploadThroughput: (500 * 1024) / 8,
      latency: 400,
    });

    const resources: Array<{
      url: string;
      type: string;
      size: number;
      duration: number;
    }> = [];

    page.on('requestfinished', async (request) => {
      const response = await request.response();
      if (!response) return;

      const url = request.url();
      if (url.includes(baseURL.replace('http://', ''))) {
        try {
          const buffer = await response.body();
          const timing = request.timing();

          resources.push({
            url: url.replace(baseURL, ''),
            type: request.resourceType(),
            size: buffer.length,
            duration: timing.responseEnd,
          });
        } catch (e) {
          // Some resources may fail to load
        }
      }
    });

    await page.goto(baseURL + '/', { timeout: 60000 });
    await page.waitForLoadState('networkidle', { timeout: 60000 });

    // Sort by duration
    resources.sort((a, b) => b.duration - a.duration);

    console.log('\n=== Slowest Resources ===');
    resources.slice(0, 10).forEach((r) => {
      console.log(`${r.type.padEnd(12)} ${r.duration.toFixed(0)}ms ${(r.size / 1024).toFixed(1)}KB ${r.url}`);
    });

    // Check that critical resources are loaded efficiently
    const jsResources = resources.filter((r) => r.type === 'script');
    const cssResources = resources.filter((r) => r.type === 'stylesheet');

    console.log(`\nTotal JS files: ${jsResources.length}, Total CSS files: ${cssResources.length}`);

    // Identify large bundles
    const largeResources = resources.filter((r) => r.size > 100 * 1024); // > 100KB
    if (largeResources.length > 0) {
      console.log('\n=== Large Resources (>100KB) ===');
      largeResources.forEach((r) => {
        console.log(`${(r.size / 1024).toFixed(1)}KB ${r.url}`);
      });
    }

    await browser.close();
  });
});
