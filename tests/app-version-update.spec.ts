import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';

test.describe('Issue #18: In-Browser Version Update Indicator & First-Refresh Deployment', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      if (window.name !== '__ajwmes_update_test_booted__') {
        window.localStorage.clear();
        window.sessionStorage.clear();
        window.name = '__ajwmes_update_test_booted__';
      }
    });
  });

  test('should detect a newly rolled-out version, show the in-browser indicator, support banner minimize, and deploy on the first refresh', async ({ page }) => {
    const nav = new NavigationPage(page);

    let serveNewRelease = false;
    const simulatedNewRelease = {
      version: '0.0.1',
      commitSha: '9cf41a2',
      commitFullSha: '9cf41a2000000000000000000000000000000000',
      commitMessage: 'feat: deploy instant single-refresh marine release update',
      branch: 'main',
      buildDate: '2026-10-18',
      fullTag: 'v0.0.1-9cf41a2',
    };

    await page.route('**/version.json*', async (route) => {
      if (serveNewRelease) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
          body: JSON.stringify(simulatedNewRelease),
        });
      } else {
        await route.continue();
      }
    });

    await test.step('1. Verify baseline up-to-date state has no update banner or header pill', async () => {
      await nav.navigateToLanding();
      await expect(page.getByTestId('app-update-banner')).toHaveCount(0);
      await expect(page.getByTestId('header-update-available-badge')).toHaveCount(0);
    });

    await test.step('2. Roll out new version on /version.json and verify in-browser indicator appears', async () => {
      serveNewRelease = true;

      // Trigger focus event (simulating user switching back to tab or periodic check)
      await page.evaluate(() => {
        window.dispatchEvent(new Event('focus'));
      });

      const updateBanner = page.getByTestId('app-update-banner');
      await expect(updateBanner).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('app-update-target-version')).toHaveText('v0.0.1-9cf41a2');
      await expect(page.getByTestId('header-update-available-badge')).toBeVisible();
    });

    await test.step('3. Minimize top update banner and verify sticky header indicator pill persists', async () => {
      await page.getByTestId('app-update-dismiss-button').click();
      await expect(page.getByTestId('app-update-banner')).toHaveCount(0);
      await expect(page.getByTestId('header-update-available-badge')).toBeVisible();
    });

    await test.step('4. Deploy update on the very first browser refresh without needing multiple reloads', async () => {
      await page.reload();

      // After the first refresh, the update banner and pending indicator must be cleared
      // and the new version is active immediately
      await expect(page.getByTestId('app-update-banner')).toHaveCount(0);
      await expect(page.getByTestId('header-update-available-badge')).toHaveCount(0);
      await expect(nav.headerVersionBadge).toHaveAttribute('title', /v0\.0\.1-9cf41a2/);
    });
  });

  test('should support 1-click Update & Refresh Now button and EnvironmentSettingsModal release controls including offline resilience', async ({ page }) => {
    const nav = new NavigationPage(page);

    await test.step('1. Open Multi-Environment & Release Manager modal and trigger simulated rollout', async () => {
      await nav.navigateToLanding();
      await nav.headerVersionBadge.click();

      const commitCard = page.getByTestId('github-commit-card');
      await expect(commitCard).toBeVisible();

      await page.getByTestId('simulate-version-update-button').click();
      await expect(page.getByTestId('app-update-status-notice')).toContainText('v0.0.1-9cf41a2');
      await expect(page.getByTestId('app-update-banner')).toBeVisible();
    });

    await test.step('2. Close modal and click 1-click Update & Refresh Now CTA on the banner', async () => {
      await page.getByTestId('close-env-settings-modal').click();

      const reloadButton = page.getByTestId('app-update-reload-button');
      await expect(reloadButton).toBeVisible();
      await reloadButton.click();

      // Wait for single reload to complete and verify new version is deployed
      await expect(page.getByTestId('app-update-banner')).toHaveCount(0);
      await expect(page.getByTestId('header-update-available-badge')).toHaveCount(0);
      await expect(nav.headerVersionBadge).toHaveAttribute('title', /v0\.0\.1-9cf41a2/);
    });

    await test.step('3. Verify offline resilience when checking for updates without network', async () => {
      await nav.headerVersionBadge.click();
      await expect(page.getByTestId('github-commit-card')).toBeVisible();

      await page.evaluate(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
      });

      await page.getByTestId('check-app-update-button').click();
      await expect(page.getByTestId('app-update-status-notice')).toHaveText('Offline — using cached release');
      await expect(page.getByTestId('app-update-banner')).toHaveCount(0);
    });
  });
});
