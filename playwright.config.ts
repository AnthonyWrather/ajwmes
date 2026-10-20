import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for React 19 + TypeScript 5 + Vite application.
 * Automatically provisions local Vite dev server on port 5173 before running tests.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 90 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.PLAYWRIGHT_WORKERS
    ? parseInt(process.env.PLAYWRIGHT_WORKERS, 10)
    : (process.env.WORKERS
        ? parseInt(process.env.WORKERS, 10)
        : (process.env.CI ? 2 : (process.env.ALL_BROWSERS === 'true' ? 4 : 2))),
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ...(process.env.CI ? [['github'] as const] : [])
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  projects: process.env.ALL_BROWSERS === 'true'
    ? [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] }
        },
        {
          name: 'firefox',
          use: { ...devices['Desktop Firefox'] }
        },
        {
          name: 'webkit',
          use: { ...devices['Desktop Safari'] }
        },
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] }
        },
        {
          name: 'Mobile Safari',
          use: { ...devices['iPhone 12'] }
        }
      ]
    : [
        {
          name: 'chromium',
          use: { ...devices['Desktop Chrome'] }
        },
        {
          name: 'Mobile Chrome',
          use: { ...devices['Pixel 5'] }
        }
      ],

  /* Boot local Vite server: uses production preview in CI for speed & determinism, dev server locally */
  webServer: {
    command: process.env.CI
      ? 'npm run preview -- --port 5173 --host 127.0.0.1'
      : 'npx vite --port 5173 --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});
