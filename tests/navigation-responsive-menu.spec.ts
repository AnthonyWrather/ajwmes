import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';

test.describe('Navigation Main Menu Consistency & Responsive Resilience E2E Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage for clean baseline state
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('should display consistent bordered pill style with colored icons across all desktop menu items', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    const nav = new NavigationPage(page);

    await nav.navigateToLanding();

    // Verify all public/guest desktop tabs have uniform bordered pill structure & SVG icons
    const guestTabs = [
      { locator: nav.desktopStoreTab, expectedName: 'Parts Store' },
      { locator: nav.desktopTrackerTab, expectedName: 'Track Order' },
      { locator: nav.desktopDesignerTab, expectedName: 'Switch Panels' },
      { locator: nav.desktopReplicaTab, expectedName: 'Replica Panels' },
    ];

    for (const tab of guestTabs) {
      await expect(tab.locator).toBeVisible();
      // Verify bordered pill geometry
      await expect(tab.locator).toHaveClass(/border/);
      await expect(tab.locator).toHaveClass(/rounded-lg/);
      // Verify SVG icon exists
      const icon = tab.locator.locator('svg');
      await expect(icon).toBeVisible();
      await expect(icon).toHaveClass(/w-3\.5/);
    }

    // Verify active styling transitions cleanly between tabs
    await nav.navigateToStore();
    await expect(nav.desktopStoreTab).toHaveClass(/bg-sky-950/);
    await expect(nav.desktopStoreTab).toHaveClass(/border-sky-500/);

    await nav.navigateToTracker();
    await expect(nav.desktopTrackerTab).toHaveClass(/bg-sky-950/);
    await expect(nav.desktopTrackerTab).toHaveClass(/border-sky-500/);
  });

  test('should ensure admin menu with all 8 tabs stays contained within viewport without escaping screen', async ({ page }) => {
    // Standard 13" laptop viewport
    await page.setViewportSize({ width: 1280, height: 800 });
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);

    // Mock admin authentication endpoint
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token-admin-2026',
          user: {
            id: 'usr-admin-0000-0000-0000-000000000001',
            email: 'anthonywrather@gmail.com',
            name: 'Anthony Wrather',
            role: 'admin'
          }
        })
      });
    });

    await nav.navigateToLanding();
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('anthonywrather@gmail.com', 'ajwmes2026');

    // Verify all 8 admin tabs render with consistent bordered pill styles
    const allAdminTabs = [
      nav.desktopStoreTab,
      nav.desktopTrackerTab,
      nav.desktopDesignerTab,
      nav.desktopReplicaTab,
      nav.desktopPortalTab,
      nav.desktopTechnicianTab,
      nav.desktopPostalTab,
      nav.desktopAdminTab,
    ];

    for (const tab of allAdminTabs) {
      await expect(tab).toBeVisible();
      await expect(tab).toHaveClass(/border/);
      await expect(tab).toHaveClass(/rounded-lg/);
      const icon = tab.locator('svg');
      await expect(icon).toBeVisible();
    }

    // Verify header does not overflow horizontally or escape the viewport
    const viewportWidth = 1280;
    const documentScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentScrollWidth).toBeLessThanOrEqual(viewportWidth);

    // Verify header bar maintains crisp single-tier height
    const headerHeight = await page.evaluate(() => {
      const header = document.querySelector('header');
      return header ? header.getBoundingClientRect().height : 0;
    });
    expect(headerHeight).toBeLessThanOrEqual(72);
  });

  test('should render compact, uniform 2-column mobile drawer without oversized buttons or escaping screen', async ({ page }) => {
    // Standard mobile portrait viewport
    await page.setViewportSize({ width: 375, height: 667 });
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);

    // Mock admin authentication to verify complete 8-button mobile grid
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token-admin-2026',
          user: {
            id: 'usr-admin-0000-0000-0000-000000000001',
            email: 'anthonywrather@gmail.com',
            name: 'Anthony Wrather',
            role: 'admin'
          }
        })
      });
    });

    await nav.navigateToLanding();
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('anthonywrather@gmail.com', 'ajwmes2026');

    // Open mobile drawer
    await nav.ensureMobileMenuOpen();

    const mobileButtons = [
      nav.mobileStoreTab,
      nav.mobileTrackerTab,
      nav.mobileDesignerTab,
      nav.mobileReplicaTab,
      nav.mobilePortalTab,
      nav.mobileTechnicianTab,
      nav.mobilePostalTab,
      nav.mobileAdminTab,
    ];

    for (const button of mobileButtons) {
      await expect(button).toBeVisible();
      // Must NOT be oversized col-span-2
      await expect(button).not.toHaveClass(/col-span-2/);
      // Must be styled with compact uniform rounded-xl border
      await expect(button).toHaveClass(/rounded-xl/);
      await expect(button).toHaveClass(/border/);
      // Must include a colored Lucide icon
      const icon = button.locator('svg');
      await expect(icon).toBeVisible();
    }

    // Verify mobile drawer does not escape mobile viewport
    const drawerFitsScreen = await page.evaluate(() => {
      const drawer = document.querySelector('header > div.xl\\:hidden');
      if (!drawer) return false;
      const rect = drawer.getBoundingClientRect();
      return rect.bottom <= window.innerHeight + 10;
    });
    expect(drawerFitsScreen).toBe(true);
  });
});
