import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for React 19 + TypeScript 5 + Vite application.
 * Automatically provisions local Vite dev server on port 5173 before running tests.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }]
  ],
  use: {
    baseURL: 'http://localhost:5173',
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

  /* Boot local Vite development server automatically before test suite executes */
  webServer: {
    command: 'npx vite --port 5173 --host 127.0.0.1',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000
  }
});
