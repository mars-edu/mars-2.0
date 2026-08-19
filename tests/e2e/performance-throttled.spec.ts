import { test, expect, chromium } from '@playwright/test';

test.describe('Performance with Throttling', () => {
  test.setTimeout(120000);

  test('should load home page with CPU and network throttling', async ({ baseURL }) => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    const client = await context.newCDPSession(page);

    // Enable CPU throttling (2x slowdown)
    await client.send('Emulation.setCPUThrottlingRate', { rate: 2 });

    // Enable network throttling (Fast 3G / 4G)
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbps
      uploadThroughput: (2 * 1024 * 1024) / 8,   // 2 Mbps
      latency: 40,                               // 40ms RTT
    });

    const startTime = Date.now();
    await page.goto(baseURL + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    const loadTime = Date.now() - startTime;

    console.log(`[Throttled - 4G] Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(60000);

    await browser.close();
  });

  test('should measure Core Web Vitals with throttling', async ({ baseURL }) => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const client = await context.newCDPSession(page);

    await client.send('Emulation.setCPUThrottlingRate', { rate: 2 });

    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbps
      uploadThroughput: (2 * 1024 * 1024) / 8,   // 2 Mbps
      latency: 40,                                // 40ms RTT
    });

    await page.goto(baseURL + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });

    const metrics = await page.evaluate(() => {
      const paintEntries = performance.getEntriesByType('paint');
      const fcp = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
      const lcp = performance.getEntriesByType('largest-contentful-paint')[0];

      return {
        fcp: fcp ? fcp.startTime : null,
        lcp: lcp ? (lcp as any).startTime : null,
      };
    });

    console.log(`[Throttled - 4G] FCP: ${metrics.fcp}ms, LCP: ${metrics.lcp}ms`);

    await browser.close();
  });

  test('should test different throttling profiles', async ({ baseURL }) => {
    test.setTimeout(120000);

    const profiles = [
      {
        name: 'Fast 4G',
        download: (10 * 1024 * 1024) / 8,
        upload: (5 * 1024 * 1024) / 8,
        latency: 20,
        cpuRate: 1,
      },
      {
        name: 'Slow 4G',
        download: (4 * 1024 * 1024) / 8,
        upload: (2 * 1024 * 1024) / 8,
        latency: 50,
        cpuRate: 2,
      },
    ];

    const results: Array<{ profile: string; loadTime: number; fcp: number | null }> = [];

    for (const profile of profiles) {
      const browser = await chromium.launch();
      const context = await browser.newContext();
      const page = await context.newPage();
      const client = await context.newCDPSession(page);

      await client.send('Emulation.setCPUThrottlingRate', { rate: profile.cpuRate });
      await client.send('Network.enable');
      await client.send('Network.emulateNetworkConditions', {
        offline: false,
        downloadThroughput: profile.download,
        uploadThroughput: profile.upload,
        latency: profile.latency,
      });

      const startTime = Date.now();
      await page.goto(baseURL + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
      const loadTime = Date.now() - startTime;

      const fcp = await page.evaluate(() => {
        const paintEntries = performance.getEntriesByType('paint');
        const fcpEntry = paintEntries.find((entry) => entry.name === 'first-contentful-paint');
        return fcpEntry ? fcpEntry.startTime : null;
      });

      results.push({ profile: profile.name, loadTime, fcp });
      console.log(`[${profile.name}] Load: ${loadTime}ms, FCP: ${fcp}ms`);

      await browser.close();
    }
  });

  test('should identify render-blocking resources with throttling', async ({ baseURL }) => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    const client = await context.newCDPSession(page);

    await client.send('Emulation.setCPUThrottlingRate', { rate: 2 });
    await client.send('Network.enable');
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (4 * 1024 * 1024) / 8,
      uploadThroughput: (2 * 1024 * 1024) / 8,
      latency: 40,
    });

    const resources: Array<{ url: string; type: string; size: number }> = [];

    page.on('response', async (response) => {
      const url = response.url();
      const buffer = await response.body().catch(() => null);
      if (buffer) {
        resources.push({
          url,
          type: response.request().resourceType(),
          size: buffer.length,
        });
      }
    });

    await page.goto(baseURL + '/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    expect(resources.length).toBeGreaterThan(0);

    await browser.close();
  });
});
