import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { HelpCenterModalPage } from './pages/HelpCenterModalPage';

test.describe('UJ-Help: Role-Based User Manual & Video Guides Modal', () => {
  let nav: NavigationPage;
  let help: HelpCenterModalPage;

  test.beforeEach(async ({ page }) => {
    nav = new NavigationPage(page);
    help = new HelpCenterModalPage(page);
    await nav.navigateToLanding();
  });

  test('opens help center modal from desktop navigation bar', async () => {
    await expect(nav.helpButton).toBeVisible();
    await nav.helpButton.click();

    await help.expectOpen();
    await expect(help.getRoleTab('guest')).toBeVisible();
    await expect(help.chapterList).toBeVisible();
  });

  test('allows switching between all 6 user roles in the manual', async ({ page }) => {
    await nav.helpButton.click();
    await help.expectOpen();

    // Verify technician role manual
    await help.selectRole('technician');
    await expect(help.getChapterItem('tech-diagnostic-workstation')).toBeVisible();

    // Verify postal role manual
    await help.selectRole('postal');
    await expect(help.getChapterItem('postal-fulfillment-dispatch')).toBeVisible();

    // Verify admin role manual
    await help.selectRole('admin');
    await expect(help.getChapterItem('admin-workshop-financials')).toBeVisible();

    // Verify site role manual
    await help.selectRole('site');
    await expect(help.getChapterItem('site-environment-admin')).toBeVisible();

    // Verify client role manual
    await help.selectRole('client');
    await expect(help.getChapterItem('client-vessel-management')).toBeVisible();
  });

  test('filters manual chapters by query and updates step checklist', async ({ page }) => {
    await nav.helpButton.click();
    await help.expectOpen();

    // Search for CAD
    await help.search('CAD');
    await expect(help.getChapterItem('guest-cad-configurator')).toBeVisible();

    // Select CAD chapter and click step
    await help.selectChapter('guest-cad-configurator');
    await expect(help.getStepRow('step-guest-cad-1')).toBeVisible();
    await help.clickStep('step-guest-cad-2');

    // Verify HUD lower-third text matches selected step
    await expect(page.getByTestId('video-player-container').getByText('Step 2')).toBeVisible();
  });

  test('deep-jumps to feature workspace from the user manual modal', async ({ page }) => {
    await nav.helpButton.click();
    await help.expectOpen();

    await help.selectRole('guest');
    await help.selectChapter('guest-cad-configurator');

    await expect(help.jumpToFeatureButton).toBeVisible();
    await help.jumpToFeature();

    // Modal should close and URL/Tab should be Switch Panel Designer
    await help.expectClosed();
    await expect(page.getByTestId('switch-panel-designer')).toBeVisible({ timeout: 10000 });
  });

  test('closes modal with escape key', async ({ page }) => {
    await nav.helpButton.click();
    await help.expectOpen();

    await page.keyboard.press('Escape');
    await help.expectClosed();
  });
});
