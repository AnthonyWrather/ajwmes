import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { PrintLaserStudioPage } from './pages/PrintLaserStudioPage';

test.describe('Print & Laser Engraving Marketing Asset Studio & Cloud Panel Archive (UJ-18) E2E Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    } catch {
      // Ignore unsupported browser contexts
    }

    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.print = () => {};
      window.alert = () => {};

      if (!navigator.clipboard) {
        (navigator as unknown as { clipboard: unknown }).clipboard = {
          writeText: async () => {},
          readText: async () => ''
        };
      }
    });
  });

  test('should navigate to print studio, switch cards and flyers, toggle substrates, download LightBurn SVGs, and inspect cloud panel archive', async ({ page }) => {
    test.slow();
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    const admin = new AdminDashboardPage(page);
    const studio = new PrintLaserStudioPage(page);

    // =========================================================================
    // 1. Admin Authentication & Print Studio Navigation
    // =========================================================================
    await test.step('1. Authenticate as Workshop Admin and navigate to Print Studio', async () => {
      await nav.navigateToLanding();
      await nav.openSignInModal();
      await auth.verifyModalVisible();
      await auth.signIn('anthonywrather@gmail.com', 'ajwmes2026');

      await admin.verifyDashboardVisible();
      await nav.expectUserProfile('Anthony Wrather');

      // Switch to Print & Laser Studio tab
      await admin.switchTab('print');
      await studio.verifyStudioVisible();
    });

    // =========================================================================
    // 2. Business Card & A5 Marina Flyer Preview Switching
    // =========================================================================
    await test.step('2. Inspect Business Card (Front/Back) and switch to A5 Marina Flyer', async () => {
      // Verify Business Card is selected by default
      await expect(studio.businessCardPreview).toBeVisible();

      // Assert Front Side Content
      await expect(studio.businessCardPreview).toContainText('AJW MARINE ELECTRICAL SERVICES');
      await expect(studio.businessCardPreview).toContainText('£25 / HOUR FLAT RATE');
      await expect(studio.businessCardPreview).toContainText('Gosport & 1-Hour Travel');

      // Flip to Back Side
      await studio.flipCardSide('back');
      await expect(studio.businessCardPreview).toContainText('Anthony Wrather');
      await expect(studio.businessCardPreview).toContainText('Marine Electrical Specialist');
      await expect(studio.businessCardPreview).toContainText('07700 900142');
      await expect(studio.businessCardPreview).toContainText('anthonywrather@gmail.com');
      await expect(studio.businessCardPreview).toContainText('Haslar · Gosport · Port Solent · Hamble');
      await expect(studio.businessCardPreview).toContainText('Scan to Book');

      // Flip back to Front Side
      await studio.flipCardSide('front');
      await expect(studio.businessCardPreview).toContainText('£25 / HOUR FLAT RATE');

      // Switch to A5 Marina Flyer
      await studio.selectAsset('flyer');
      await expect(studio.a5FlyerPreview).toBeVisible();
      await expect(studio.a5FlyerPreview).toContainText('FLAT RATE: £25 PER HOUR + MATERIALS');
      await expect(studio.a5FlyerPreview).toContainText('Covering Haslar, Gosport, Port Solent, Hamble & Solent Boatyards');
      await expect(studio.a5FlyerPreview).toContainText('Electrical Diagnostics & Fault Finding');
      await expect(studio.a5FlyerPreview).toContainText('Lithium (LiFePO4) & Solar Upgrades');
      await expect(studio.a5FlyerPreview).toContainText('Custom Switch Panels (Acrylic & Wood)');
    });

    // =========================================================================
    // 3. Material Substrate Simulation Modes
    // =========================================================================
    await test.step('3. Toggle substrate render modes (Paper, Acrylic, Wood)', async () => {
      // Toggle to Laser Matte Black Acrylic
      await studio.selectRenderMode('acrylic');
      await expect(studio.a5FlyerPreview).toHaveClass(/border-red-500\/80/);
      await expect(studio.a5FlyerPreview).toHaveClass(/bg-\[#0B0F17\]/);

      // Toggle to Marine Wood Engrave (Solid Teak / Birch)
      await studio.selectRenderMode('wood');
      await expect(studio.a5FlyerPreview).toHaveClass(/bg-\[#92400E\]/);
      await expect(studio.a5FlyerPreview).toHaveClass(/text-\[#FEF3C7\]/);

      // Toggle back to Full Color Print (Paper)
      await studio.selectRenderMode('paper');
      await expect(studio.a5FlyerPreview).toHaveClass(/bg-gradient-to-br/);
      await expect(studio.a5FlyerPreview).toHaveClass(/border-sky-500\/40/);
    });

    // =========================================================================
    // 4. LightBurn Dual-Layer SVG Vector Export Verification
    // =========================================================================
    await test.step('4. Download and verify dual-layer LightBurn SVGs (Flyer and Card)', async () => {
      // While on Flyer: trigger LightBurn SVG download
      const flyerSvg = await studio.downloadLaserSvg('ajwmes-flyer-laser-lightburn.svg');
      expect(flyerSvg.filename).toBe('ajwmes-flyer-laser-lightburn.svg');

      // Assert SVG payload structure: #FF0000 cut line <rect> and #000000 raster engrave <g>
      expect(flyerSvg.content).toContain('viewBox="0 0 148 210"');
      expect(flyerSvg.content).toContain('width="148mm"');
      expect(flyerSvg.content).toContain('height="210mm"');
      expect(flyerSvg.content).toContain('stroke="#FF0000"');
      expect(flyerSvg.content).toContain('stroke-width="0.1"');
      expect(flyerSvg.content).toContain('<g fill="#000000" stroke="none">');
      expect(flyerSvg.content).toContain('FLAT RATE: £25 / HOUR + MATERIALS');

      // Switch back to Business Card and trigger LightBurn SVG download
      await studio.selectAsset('card');
      const cardSvg = await studio.downloadLaserSvg('ajwmes-card-laser-lightburn.svg');
      expect(cardSvg.filename).toBe('ajwmes-card-laser-lightburn.svg');

      // Assert Card SVG payload structure
      expect(cardSvg.content).toContain('viewBox="0 0 85 55"');
      expect(cardSvg.content).toContain('width="85mm"');
      expect(cardSvg.content).toContain('height="55mm"');
      expect(cardSvg.content).toContain('stroke="#FF0000"');
      expect(cardSvg.content).toContain('stroke-width="0.1"');
      expect(cardSvg.content).toContain('<g fill="#000000" stroke="none">');
      expect(cardSvg.content).toContain('AJWMES');
      expect(cardSvg.content).toContain('FLAT RATE: £25 / HOUR + MATERIALS');
    });

    // =========================================================================
    // 5. Panel Cloud Images Archive Inspection
    // =========================================================================
    await test.step('5. Inspect Panel Cloud Images archive, inspect lightbox, and jump to job sheet', async () => {
      // Switch to Panel Cloud Images tab
      await admin.switchTab('panels');
      await studio.verifyPanelArchiveVisible();

      // Assert presence of reference photo cards
      const count = await studio.panelAssetCards.count();
      expect(count).toBeGreaterThan(0);

      const firstCard = studio.panelAssetCards.first();
      // Verify card content structure
      await expect(firstCard.getByTestId('panel-asset-open-job-btn')).toBeVisible();
      await expect(firstCard.getByTestId('panel-asset-cad-link')).toBeVisible();
      await expect(firstCard).toContainText(/Photo #1/i);

      // Open first photo in ImageLightboxModal
      await studio.openPanelPhotoInLightbox(0);
      await expect(studio.lightboxModal).toBeVisible();
      await expect(studio.lightboxModal).toContainText(/Photo 1/i);

      // Close lightbox
      await studio.closeLightbox();
      await expect(studio.lightboxModal).toBeHidden();

      // Jump to job sheet from panel card
      await studio.jumpToJobFromPanel(0);

      // Verify redirection to active Job Queue view
      await expect(page.getByText('Vessel Job Queue').first()).toBeVisible({ timeout: 10000 });
    });
  });
});
