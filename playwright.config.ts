import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : process.env.HEADED ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Enable headed mode when HEADED=1 environment variable is set
    headless: process.env.HEADED ? false : true,

    // Slow down execution in headed mode for better visibility
    launchOptions: {
      slowMo: process.env.HEADED
        ? (process.env.SLOWMO ? parseInt(process.env.SLOWMO) : 1000)
        : 0,
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Disabled in CI - too slow and causes timeouts
    // Run locally with: CI=false npx playwright test --project=chromium-throttled
    ...(process.env.CI ? [] : [{
      name: 'chromium-throttled',
      use: {
        ...devices['Desktop Chrome'],
        // Enable CPU throttling (4x slowdown) and network throttling (Slow 3G)
        contextOptions: {
          // This will be used in tests to apply throttling
        },
      },
    }]),
    // Uncomment browsers below after installing with: npx playwright install firefox webkit
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 120000,
  },
});
