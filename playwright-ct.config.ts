import { defineConfig, devices } from '@playwright/experimental-ct-vue';
import path from 'path';

export default defineConfig({
  testDir: './tests/component',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-ct-report' }],
    ['list']
  ],

  use: {
    trace: 'on-first-retry',
    ctPort: 3100,
    ctViteConfig: {
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        },
        extensions: ['.js', '.ts', '.jsx', '.tsx', '.json', '.vue'],
      },
    },
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
