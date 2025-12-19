import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI || process.env.HEADED ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report-prod' }],
    ['json', { outputFile: 'test-results/results-prod.json' }],
    ['list']
  ],

  use: {
    baseURL: 'http://localhost:4173',
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
      name: 'chromium-production',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    env: {
      PLAYWRIGHT_BASE_URL: 'http://localhost:4173',
    },
  },
});
