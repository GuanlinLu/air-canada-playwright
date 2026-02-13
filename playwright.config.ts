import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright config for Air Canada booking smoke tests.
 * CI-friendly: retries, trace on first retry, artifacts only on failure.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 120_000, // 2 min per test; results/booking steps can be slow
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 1,
  workers: process.env.CI ? 2 : undefined,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: 'https://www.aircanada.com',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  outputDir: 'test-results/',
});
