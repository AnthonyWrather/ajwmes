import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { VesselPortalPage } from './pages/VesselPortalPage';
import { StorePage } from './pages/StorePage';

test.describe('Boat Owner Vessel Portal & Certificate PDF Export (UJ-09) E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to guarantee clean session state
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('should allow boat owner to manage vessel specifications, log electrical history, switch multiple vessels, register a new boat, and export custom on-board PDF dossier', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    const portal = new VesselPortalPage(page);
    const store = new StorePage(page);

    // 1. Authenticate as registered Boat Owner client (David Mercer)
    await test.step('1. Authenticate as David Mercer and access Boat Owner Vessel Portal', async () => {
      await nav.navigateToLanding();
      await nav.openSignInModal();
      await auth.verifyModalVisible();

      // Quick 1-click login as David Mercer (registered client with 2 boats)
      await auth.selectTestPersona('d.mercer@solent-sail.co.uk');
      await nav.expectUserProfile('David Mercer');

      // Navigate to Vessel Portal
      await nav.navigateToPortal();
      await portal.verifyPortalVisible();
      await portal.verifyActiveVessel('Windbird III');
    });

    // 2. Multi-vessel switching between Windbird III and Solent Skiff
    await test.step('2. Switch between multiple owned vessels (Windbird III and Solent Skiff)', async () => {
      // Switch from Windbird III to secondary vessel Solent Skiff
      await portal.switchVessel('vessel-mercer-skiff');
      await portal.verifyActiveVessel('Solent Skiff');
      await expect(portal.specManager.getByText('Cheetah Marine 6.9m Catamaran Tender').first()).toBeVisible();

      // Switch back to primary vessel Windbird III
      await portal.switchVessel('vessel-mercer-windbird');
      await portal.verifyActiveVessel('Windbird III');
      await expect(portal.specManager.getByText('Moody 33 Centre Cockpit').first()).toBeVisible();
    });

    // 3. Sub-tab switching: Specs, Jobs & Activity, and Postal Orders
    await test.step('3. Inspect sub-tabs: Jobs & Activity and Postal Orders', async () => {
      // Jobs & Activity sub-tab
      await portal.selectSubTab('jobs');
      await expect(page.getByText(/Your Service History/i).first()).toBeVisible({ timeout: 5000 });
      await expect(page.getByText('AJW-2026-088').first()).toBeVisible();

      // Postal Orders sub-tab
      await portal.selectSubTab('orders');
      await expect(page.getByText('AJW-POST-2845').first()).toBeVisible({ timeout: 5000 });

      // Return to Technical Specs & PDF sub-tab
      await portal.selectSubTab('specs');
      await expect(portal.specManager).toBeVisible({ timeout: 5000 });
    });

    // 4. Category navigation and live vessel specification editing
    await test.step('4. Navigate specification categories and live edit vessel specs', async () => {
      // Navigate to DC Batteries & Charging category
      await portal.selectCategory('dc');
      await expect(portal.specManager.getByText(/DC Battery Banks/i).first()).toBeVisible({ timeout: 10000 });
      await expect(portal.specManager.getByText('200Ah Domestic Capacity').first()).toBeVisible({ timeout: 10000 });

      // Navigate to AC Shore Power category
      await portal.selectCategory('ac');
      await expect(portal.specManager.getByText(/230V AC Shore Power/i).first()).toBeVisible({ timeout: 10000 });

      // Navigate back to Overview to edit dimensions
      await portal.selectCategory('overview');
      await portal.enterEditMode();

      // Update dimensions and details
      await portal.editBeam.fill('3.55m');
      await portal.editDraft.fill('1.48m');
      await portal.saveSpecs();

      // Verify updated values persisted
      await expect(portal.specManager.getByText('3.55m').first()).toBeVisible();
      await expect(portal.specManager.getByText('1.48m').first()).toBeVisible();
    });

    // 5. Add a new electrical history audit log entry
    await test.step('5. Record new electrical maintenance upgrade in chronological history log', async () => {
      await portal.addHistoryLog({
        title: 'Victron SmartSolar MPPT 100/30 Replacement',
        category: 'solar',
        contractor: 'AJW Marine Electrical Services',
        description: 'Installed replacement Victron SmartSolar MPPT 100/30 charge controller with Bluetooth dongle and 40A MIDI fuse.',
        parts: 'Victron SmartSolar MPPT 100/30, 40A MIDI Fuse, 16mm² Oceanflex Cable'
      });

      // Assert entry is rendered in history timeline
      await expect(portal.specManager.getByText('Victron SmartSolar MPPT 100/30 Replacement').first()).toBeVisible();
      await expect(portal.specManager.getByText('16mm² Oceanflex Cable').first()).toBeVisible();
    });

    // 6. Register an additional boat to David Mercer portfolio
    await test.step('6. Register a new boat (Solent Osprey) to owner account', async () => {
      await portal.registerNewVessel({
        name: 'Solent Osprey',
        makeModel: 'Sadler 34',
        year: 1989,
        voltage: '12V',
        batteryType: 'LiFePO4 Lithium',
        marina: 'Haslar Marina, Gosport',
        berth: 'Pontoon B22'
      });

      // Verify new vessel is now active in portal
      await portal.verifyActiveVessel('Solent Osprey');
      await expect(portal.specManager.getByText('Sadler 34').first()).toBeVisible();

      // Switch back to Windbird III for PDF station export
      await portal.switchVessel('vessel-mercer-windbird');
      await portal.verifyActiveVessel('Windbird III');
    });

    // 7. Configure On-Board Print Station (PDF) Options
    await test.step('7. Open On-Board Print Station and customize PDF export parameters', async () => {
      await portal.openPrintStation();

      // Toggle layout modes
      await portal.selectPdfLayoutMode('single_page');
      await portal.selectPdfLayoutMode('comprehensive');

      // Toggle color schemes
      await portal.selectPdfTheme('mono');
      await portal.selectPdfTheme('navy');

      // Set custom skipper note
      const customNote = 'Skipper Note: Spare Class T fuses kept in portside chart drawer. Master isolator key next to companionway.';
      await portal.setPdfCustomNote(customNote);

      // Verify Interactive Visual Sheet Preview
      await portal.switchToPreviewTab();
      await expect(portal.pdfPreviewCanvas).toContainText('WINDBIRD III');
      await expect(portal.pdfPreviewCanvas).toContainText('12V DC SYSTEM');
      await expect(portal.pdfPreviewCanvas).toContainText('ON-BOARD ELECTRICAL SAFETY & EMERGENCY ISOLATION');
      await expect(portal.pdfPreviewCanvas).toContainText(customNote);

      // Return to options tab
      await portal.switchToOptionsTab();
    });

    // 8. Generate client-side jsPDF document and trigger direct print
    await test.step('8. Trigger client-side jsPDF download and direct print routines', async () => {
      // Trigger PDF download
      await portal.downloadPdfSpec();

      // Trigger direct print
      await portal.triggerDirectPrint();

      // Dismiss modal
      await portal.closePdfStation();
    });

    // 9. Unregistered boat owner onboarding fallback state
    await test.step('9. Verify unregistered boat owner state and seamless store redirection', async () => {
      // Sign off David Mercer session
      await nav.signOut();

      // Register a brand new boat owner account without vessels
      await nav.openSignInModal();
      await auth.switchToRegisterTab();
      await auth.registerNewBoatOwner({
        name: 'Solent Guest Skipper',
        email: `guest.skipper.${Date.now()}@solent-cruising.co.uk`,
        password: 'Password123!',
        phone: '07700 900888'
      });

      // Verify landing on Vessel Portal in empty/unregistered state
      await portal.verifyPortalVisible();
      await portal.verifyNoVesselRegisteredBanner();

      // Click "Order Parts from Workshop" and confirm store redirection
      await portal.clickOrderPartsFromWorkshop();
      await store.verifyStoreVisible();
    });
  });
});
