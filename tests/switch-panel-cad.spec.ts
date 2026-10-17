import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { SwitchPanelCADPage } from './pages/SwitchPanelCADPage';
import { CartDrawerPage } from './pages/CartDrawerPage';

test.describe('Custom Switch Panel CAD Configurator (UJ-07) E2E Flow', () => {
  test('should allow boat owner to design bespoke switch panel, customize circuits & BOM, download SVG, add to cart, and submit quote inquiry', async ({ page }) => {
    const navigationPage = new NavigationPage(page);
    const cadPage = new SwitchPanelCADPage(page);
    const cartPage = new CartDrawerPage(page);

    // 1. Navigate to landing page and access Custom Switch Panel Designer tab
    await test.step('1. Navigate to landing page and access Custom Switch Panel Designer tab', async () => {
      await navigationPage.navigateToLanding();
      await navigationPage.navigateToDesigner();
      await cadPage.assertLoaded();
    });

    // 2. Verify initial CAD scale preview, default 6-gang configuration, dimensions (190mm × 130mm), and calculated price (£175.00)
    await test.step('2. Verify initial CAD preview, dimensions, and default calculated price', async () => {
      await expect(cadPage.calculatedPrice).toHaveText('£175.00');
      await expect(cadPage.packageBadge).toHaveText('assembled wired');
      await expect(cadPage.dimensionPreview).toContainText('190mm × 130mm');
      await expect(cadPage.circuitCountBadge).toContainText('6 Circuits');
      await expect(cadPage.cadSvg).toBeVisible();

      // Check default voltmeter and USB cutouts are rendered in the SVG
      await expect(cadPage.voltmeterCutout).toBeVisible();
      await expect(cadPage.usbCutout).toBeVisible();
    });

    // 3. Customize panel material (Teak veneer +£25 surcharge, Gloss White, Matte Black) and assert real-time pricing and plate styling
    await test.step('3. Select panel materials and assert dynamic material surcharges', async () => {
      // Teak Veneer surcharge (+£25 => £200.00)
      await cadPage.selectMaterial('wood_teak');
      await expect(cadPage.calculatedPrice).toHaveText('£200.00');
      await expect(cadPage.circuitCountBadge).toContainText('wood teak');

      // Birch Plywood surcharge (+£15 => £190.00)
      await cadPage.selectMaterial('wood_birch');
      await expect(cadPage.calculatedPrice).toHaveText('£190.00');
      await expect(cadPage.circuitCountBadge).toContainText('wood birch');

      // Gloss White Acrylic (base acrylic price => £175.00)
      await cadPage.selectMaterial('acrylic_white');
      await expect(cadPage.calculatedPrice).toHaveText('£175.00');
      await expect(cadPage.circuitCountBadge).toContainText('acrylic white');

      // Return to Matte Black Marine Acrylic
      await cadPage.selectMaterial('acrylic_black');
      await expect(cadPage.calculatedPrice).toHaveText('£175.00');
      await expect(cadPage.circuitCountBadge).toContainText('acrylic black');
    });

    // 4. Change gang circuit count (4-gang, 8-gang with auto minimum width scaling) and adjust dimensions
    await test.step('4. Change gang count and verify minimum width scaling', async () => {
      // 4 Gang: base 35 + 4*2.5 (10) + 8 + 10 = 63. assembled_wired: 63 + 4*12 (48) + 35 = £146.00
      await cadPage.selectGangCount(4);
      await expect(cadPage.calculatedPrice).toHaveText('£146.00');
      await expect(cadPage.circuitCountBadge).toContainText('4 Circuits');
      await expect(cadPage.getSvgSwitch(3)).toBeVisible();
      await expect(cadPage.getSvgSwitch(4)).not.toBeVisible();

      // 8 Gang: base 35 + 8*2.5 + 8 + 10 + 8*12 + 35 = £204.00
      // Auto minimum width for 8 gangs with voltmeter: ceil(8/2)*55 + 45 = 265mm
      await cadPage.selectGangCount(8);
      await expect(cadPage.calculatedPrice).toHaveText('£204.00');
      await expect(cadPage.circuitCountBadge).toContainText('8 Circuits');
      await expect(cadPage.getSvgSwitch(7)).toBeVisible();

      // Verify width input auto-scaled to minimum 265mm
      const widthValue = await cadPage.inputWidth.inputValue();
      expect(Number(widthValue)).toBeGreaterThanOrEqual(265);

      // Adjust dimensions manually
      await cadPage.setDimensions(280, 160);
      await expect(cadPage.dimensionPreview).toContainText('280mm × 160mm');
    });

    // 5. Customize individual circuit switch labels and circuit breaker ratings
    await test.step('5. Customize switch circuit labels and breaker ratings', async () => {
      await cadPage.customizeSwitchCircuit(0, 'RADAR SCANNER', 15);
      await cadPage.customizeSwitchCircuit(1, 'AUTOHELM', 20);

      // Assert laser engraved circuit labels update live in the SVG
      await expect(cadPage.getSvgSwitchLabel(0)).toHaveText('RADAR SCANNER');
      await expect(cadPage.getSvgSwitchAmps(0)).toHaveText('15A');
      await expect(cadPage.getSvgSwitchLabel(1)).toHaveText('AUTOHELM');
      await expect(cadPage.getSvgSwitchAmps(1)).toHaveText('20A');
    });

    // 6. Configure packaging readiness tiers and accessory cutouts
    await test.step('6. Configure packaging readiness tiers and accessory cutouts', async () => {
      // Toggle off Voltmeter: price drops by £8 (from £204.00 to £196.00)
      await cadPage.toggleVoltmeterCutout();
      await expect(cadPage.calculatedPrice).toHaveText('£196.00');
      await expect(cadPage.voltmeterCutout).not.toBeVisible();

      // Toggle Voltmeter back on: price returns to £204.00
      await cadPage.toggleVoltmeterCutout();
      await expect(cadPage.calculatedPrice).toHaveText('£204.00');
      await expect(cadPage.voltmeterCutout).toBeVisible();

      // Toggle on 12V Socket (+£6 => £210.00)
      await cadPage.toggle12vSocketCutout();
      await expect(cadPage.calculatedPrice).toHaveText('£210.00');
      await expect(cadPage.socket12vCutout).toBeVisible();

      // Switch to Faceplate Only: base acrylic + 8 gangs + cutouts = 35 + 20 + 8 + 10 + 6 = £79.00
      await cadPage.selectPackage('faceplate_only');
      await expect(cadPage.calculatedPrice).toHaveText('£79.00');
      await expect(cadPage.packageBadge).toHaveText('faceplate only');

      // Switch to DIY Assembly Kit: base (79) + 8*8 + 12 = 79 + 64 + 12 = £155.00
      await cadPage.selectPackage('diy_kit');
      await expect(cadPage.calculatedPrice).toHaveText('£155.00');
      await expect(cadPage.packageBadge).toHaveText('diy kit');

      // Return to Assembled & Bench-Tested: base (79) + 8*12 + 35 = 79 + 96 + 35 = £210.00
      await cadPage.selectPackage('assembled_wired');
      await expect(cadPage.calculatedPrice).toHaveText('£210.00');
      await expect(cadPage.packageBadge).toHaveText('assembled wired');
    });

    // 7. Save CAD to cloud storage and download SVG CAD drawing
    await test.step('7. Save CAD to Cloud Storage and download SVG template', async () => {
      // Trigger cloud save
      await cadPage.saveCadToCloud();
      await expect(cadPage.designerNotice).toContainText('CAD');

      // Trigger download SVG
      const filename = await cadPage.downloadCadSvg();
      expect(filename).toMatch(/^ajw_marine_switch_panel_8gang_.*\.svg$/);
    });

    // 8. Add configured switch panel directly to workshop cart
    await test.step('8. Add custom switch panel to cart and verify cart drawer', async () => {
      await cadPage.addPanelToCart();

      // Verify cart drawer is opened with the custom panel item
      await cartPage.verifyDrawerOpen();
      await expect(cartPage.cartDrawer).toContainText('Custom Switch Panel (8-Gang');
      await expect(cartPage.cartDrawer).toContainText('£210.00');

      // Close cart drawer to return to designer
      await cartPage.closeDrawer();
      await expect(cartPage.cartDrawer).not.toBeVisible();
      await navigationPage.navigateToDesigner();
      await cadPage.assertLoaded();
    });

    // 9. Open specification review modal and proceed to Booking & Quote request
    await test.step('9. Review specification modal and submit custom panel quote inquiry', async () => {
      await cadPage.openOrderQuoteModal();
      await expect(cadPage.specSummary).toContainText('8-gang');
      await expect(cadPage.specSummary).toContainText('£210.00');
      await expect(cadPage.specCircuits).toContainText('RADAR SCANNER (15A)');
      await expect(cadPage.specCircuits).toContainText('AUTOHELM (20A)');

      // Continue to Quote & Booking modal
      await cadPage.continueToQuoteAndBooking();
      await expect(cadPage.bookingModal).toBeVisible();
      await expect(cadPage.bookingServiceSelect).toHaveValue('custom_panel');
      await expect(cadPage.bookingPanelBanner).toBeVisible();
      await expect(cadPage.bookingPanelBanner).toContainText('8-Gang Panel');
      await expect(cadPage.bookingPanelBanner).toContainText('£210.00');

      // Submit the booking request
      await cadPage.submitBookingQuote({
        vesselName: 'Solent Sovereign',
        berthLocation: 'Port Hamble Marina, Berth E12',
        clientName: 'Julian Croft',
        clientEmail: 'julian.croft@solent-yachts.co.uk',
        clientPhone: '07700 900582',
        notes: 'Need this custom 8-gang acrylic panel with Carling switches to replace my corroded original board.'
      });

      // Verify confirmation reference is rendered
      await expect(cadPage.bookingReferencePill).toContainText('AJW-2026-');

      // Close modal
      await cadPage.bookingDismissBtn.click({ force: true });
      await expect(cadPage.bookingModal).not.toBeVisible();
    });
  });
});
