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

  test('should wrap admin and client desktop menus into two rows without horizontal scrollbar and clean AdminDashboard pane', async ({ page }) => {
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

    // Verify desktop nav menu has no horizontal scrollbar and wraps into two rows
    const adminNavMetrics = await nav.desktopNavMenu.evaluate((el) => {
      const buttons = Array.from(el.querySelectorAll('button'));
      const rowTops = new Set(buttons.map((b) => Math.round(b.getBoundingClientRect().top)));
      return {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        rowCount: rowTops.size,
      };
    });
    expect(adminNavMetrics.scrollWidth).toBeLessThanOrEqual(adminNavMetrics.clientWidth);
    expect(adminNavMetrics.rowCount).toBe(2);

    // Verify Anthony's Operations Dashboard pane is clean and does not include redundant "AJWMES Field & Workshop Control Center"
    await expect(page.getByTestId('admin-dashboard-title')).toBeVisible();
    await expect(page.getByText('AJWMES Field & Workshop Control Center')).toHaveCount(0);

    // Verify header does not overflow horizontally or escape the viewport
    const viewportWidth = 1280;
    const documentScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(documentScrollWidth).toBeLessThanOrEqual(viewportWidth);

    // Sign out and sign in as Client to verify Client 5-button menu also wraps into two rows without scrollbar
    await nav.signOut();
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('d.mercer@solent-sail.co.uk', 'ajwmes2026');

    const clientTabs = [
      nav.desktopStoreTab,
      nav.desktopTrackerTab,
      nav.desktopDesignerTab,
      nav.desktopReplicaTab,
      nav.desktopPortalTab,
    ];
    for (const tab of clientTabs) {
      await expect(tab).toBeVisible();
    }

    const clientNavMetrics = await nav.desktopNavMenu.evaluate((el) => {
      const buttons = Array.from(el.querySelectorAll('button'));
      const rowTops = new Set(buttons.map((b) => Math.round(b.getBoundingClientRect().top)));
      return {
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
        rowCount: rowTops.size,
      };
    });
    expect(clientNavMetrics.scrollWidth).toBeLessThanOrEqual(clientNavMetrics.clientWidth);
    expect(clientNavMetrics.rowCount).toBe(2);
  });

  test('should render compact hamburger menu buttons matching main menu size so 4+ items fit per row when space permits', async ({ page }) => {
    // Tablet / wide mobile viewport (< 1280px) where 4+ compact buttons easily fit on a single row
    await page.setViewportSize({ width: 768, height: 900 });
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);

    // Mock admin authentication to verify complete 8-button mobile menu
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
      // Must match main menu button size & pill classes (rounded-lg, px-2.5, py-1, w-3.5 h-3.5 icon)
      await expect(button).toHaveClass(/rounded-lg/);
      await expect(button).toHaveClass(/border/);
      await expect(button).toHaveClass(/px-2\.5/);
      await expect(button).toHaveClass(/py-1/);
      const icon = button.locator('svg');
      await expect(icon).toBeVisible();
      await expect(icon).toHaveClass(/w-3\.5/);
    }

    // Verify 4 or more items fit on the first row in the Hamburger menu
    const firstRowCount = await nav.mobileNavGrid.evaluate((el) => {
      const buttons = Array.from(el.querySelectorAll('button'));
      if (buttons.length === 0) return 0;
      const firstTop = Math.round(buttons[0].getBoundingClientRect().top);
      return buttons.filter((b) => Math.abs(Math.round(b.getBoundingClientRect().top) - firstTop) <= 4).length;
    });
    expect(firstRowCount).toBeGreaterThanOrEqual(4);

    // Also verify on narrow portrait mobile (375x667) that the drawer fits within the screen
    await page.setViewportSize({ width: 375, height: 667 });
    await nav.ensureMobileMenuOpen();
    const drawerFitsScreen = await page.evaluate(() => {
      const drawer = document.querySelector('header > div.xl\\:hidden');
      if (!drawer) return false;
      const rect = drawer.getBoundingClientRect();
      return rect.bottom <= window.innerHeight + 10;
    });
    expect(drawerFitsScreen).toBe(true);
  });
});
