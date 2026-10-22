import { defineConfig } from '@playwright/test';

/**
 * Playwright Training Video Recording Configuration
 * Generates high-definition (1080p) demonstration videos with full visual
 * cursor ripples and animated lower-third HUD step banners for each role.
 */
export default defineConfig({
  testDir: './tests/training',
  timeout: 120 * 1000,
  fullyParallel: false,
  workers: 1, // Sequential recording prevents CPU contention and frame stutter
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-training', open: 'never' }]
  ],
  use: {
    baseURL: 'http://127.0.0.1:5173',
    video: {
      mode: 'on',
      size: { width: 1920, height: 1080 }
    },
    viewport: { width: 1920, height: 1080 },
    deviceScaleFactor: 1,
    serviceWorkers: 'block'
  },
  projects: [
    {
      name: 'training-video-1080p',
      use: {
        browserName: 'chromium'
      }
    }
  ],
  webServer: {
    command: 'npx vite --port 5173 --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
    timeout: 120 * 1000
  }
});
