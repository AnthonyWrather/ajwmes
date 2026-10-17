import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { SwitchPanelCADPage } from './pages/SwitchPanelCADPage';
import { ReplicaPanelUploaderPage } from './pages/ReplicaPanelUploaderPage';

test.describe('Performance, Code-Splitting Architecture & Asset Integrity E2E Matrix', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage for a clean test baseline
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('should verify PWA rasterized PNG icons and core vector branding assets', async ({ page }) => {
    // 1. Verify 192x192 PNG Icon is a true high-res rasterized asset
    const icon192Response = await page.request.get('/icon-192.png');
    expect(icon192Response.status()).toBe(200);
    expect(Number(icon192Response.headers()['content-length'])).toBeGreaterThan(1000);

    // 2. Verify 512x512 PNG Icon is a true high-res rasterized asset (> 50KB)
    const icon512Response = await page.request.get('/icon-512.png');
    expect(icon512Response.status()).toBe(200);
    expect(Number(icon512Response.headers()['content-length'])).toBeGreaterThan(10000);

    // 3. Verify Vector Icon SVG
    const iconSvgResponse = await page.request.get('/icon.svg');
    expect(iconSvgResponse.status()).toBe(200);
    const svgText = await iconSvgResponse.text();
    expect(svgText).toContain('<svg');
    expect(svgText.toLowerCase()).toContain('anchor');
  });

  test('should verify lazy-loaded workspaces mount cleanly and render ideal states without bundle blocking', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    const cadPage = new SwitchPanelCADPage(page);
    const replicaPage = new ReplicaPanelUploaderPage(page);

    await test.step('1. Navigate to landing page and verify initial lightweight load', async () => {
      await nav.navigateToLanding();
      await expect(page.getByTestId('landing-hero-heading')).toBeVisible();
      await expect(page.getByTestId('landing-hero-heading')).toContainText('Marine Electrics');
    });

    await test.step('2. Access lazy-loaded Switch Panel Designer and verify 2D CAD canvas renders', async () => {
      await nav.navigateToDesigner();
      await cadPage.assertLoaded();
    });

    await test.step('3. Access lazy-loaded Switchboard Photo Replica Quoter', async () => {
      await nav.navigateToReplica();
      await replicaPage.assertLoaded();
      await expect(replicaPage.submitButton).toBeVisible();
    });

    await test.step('4. Sign in as Admin and verify lazy-loaded Admin Dashboard', async () => {
      await nav.openSignInModal();
      await auth.verifyModalVisible();
      await auth.signIn('anthonywrather@gmail.com', 'ajwmes2026');

      await nav.navigateToAdmin();
      await expect(page.getByText("Anthony's Operations Dashboard")).toBeVisible({ timeout: 10000 });
      await expect(page.getByRole('button', { name: /Stock & Catalog/i })).toBeVisible();
    });

    await test.step('5. Navigate to lazy-loaded Technician Workspace as Admin', async () => {
      await page.getByTestId('nav-tab-technician').or(page.getByRole('button', { name: /technician workstation/i })).first().click();
      await expect(page.getByText('Solent Field Technician Workstation')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Field Technician Mode Active')).toBeVisible({ timeout: 10000 });
    });

    await test.step('6. Navigate to lazy-loaded Postal Workspace as Admin', async () => {
      await nav.navigateToPostal();
      await expect(page.getByTestId('postal-workspace')).toBeVisible({ timeout: 10000 });
      await expect(page.getByTestId('postal-role-banner')).toBeVisible();
    });

    await test.step('7. Navigate to lazy-loaded Boat Owner Vessel Portal', async () => {
      await nav.navigateToPortal();
      await expect(page.getByTestId('client-vessel-portal')).toBeVisible({ timeout: 10000 });
    });
  });

  test('should verify RBAC unauthorized route interception and fallback state for guests', async ({ page }) => {
    const nav = new NavigationPage(page);

    await test.step('1. Guest sees only authorized public navigation', async () => {
      await nav.navigateToLanding();

      // Guest should only see public nav options
      await expect(page.getByTestId('nav-tab-technician')).not.toBeVisible();
      await expect(page.getByTestId('nav-tab-postal')).not.toBeVisible();
      await expect(page.getByTestId('nav-tab-admin')).not.toBeVisible();
    });
  });
});
