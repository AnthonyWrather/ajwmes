import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { ReplicaPanelUploaderPage } from './pages/ReplicaPanelUploaderPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

test.describe('Weathered Switchboard Photo Replica Quoter (UJ-08) E2E Flow', () => {
  // Pre-generate a 1x1 valid PNG image buffer for simulated photo upload
  const samplePhotoBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
    'base64'
  );

  test('should allow boat owner to inspect templates, calculate live replica pricing, manage photos with lightbox, and submit inquiry to portal and workshop queue', async ({ page }) => {
    const navigationPage = new NavigationPage(page);
    const replicaPage = new ReplicaPanelUploaderPage(page);
    const authModalPage = new AuthModalPage(page);
    const adminPage = new AdminDashboardPage(page);

    // 1. Navigate to landing page and access Replica Panels quoter tab
    await test.step('1. Navigate to landing page and access Replica Panels quoter tab', async () => {
      await navigationPage.navigateToLanding();
      await navigationPage.navigateToReplica();
      await replicaPage.assertLoaded();

      await expect(replicaPage.cloudBadge).toBeVisible();
      await expect(replicaPage.turnaroundBadge).toContainText('3–5 Days Turnaround');
    });

    // 2. Select popular Solent classic yacht presets and assert autocompletion
    await test.step('2. Select classic yacht presets (Westerly Konsort, Sadler 32) and verify autocompletion', async () => {
      // Apply Westerly Konsort preset
      await replicaPage.applyPreset('westerly-konsort');
      await expect(replicaPage.makeInput).toHaveValue('Westerly');
      await expect(replicaPage.modelInput).toHaveValue('Konsort 29');
      await expect(replicaPage.dimensionsInput).toHaveValue('195mm x 140mm');
      await expect(replicaPage.switchCountSelect).toHaveValue('8');
      await expect(replicaPage.materialSelect).toHaveValue('acrylic_black');

      // Apply Sadler 32 preset
      await replicaPage.applyPreset('sadler-32');
      await expect(replicaPage.makeInput).toHaveValue('Sadler');
      await expect(replicaPage.modelInput).toHaveValue('32 (1983)');
      await expect(replicaPage.dimensionsInput).toHaveValue('220mm x 150mm');
      await expect(replicaPage.switchCountSelect).toHaveValue('10');
      await expect(replicaPage.materialSelect).toHaveValue('wood_teak');
    });

    // 3. Dynamic Real-Time Quote Calculation & Surcharge Verification
    await test.step('3. Verify dynamic live quotation, material surcharges, and switch count scaling', async () => {
      // Sadler 32 has 10 switches & wood_teak:
      // digitizingLabor: 25, laserCuttingBase: 35, teak: 25, switches: 10 * 8 = 80 => totalMaterials: 140, totalEstimated: 165
      await expect(replicaPage.surchargeBadge).toBeVisible();
      await expect(replicaPage.surchargeBadge).toContainText('+£25.00 Teak Surcharge');
      await expect(replicaPage.laborCost).toHaveText('£25.00');
      await expect(replicaPage.materialsCost).toHaveText('£140.00');
      await expect(replicaPage.estimatedTotal).toHaveText('£165.00');

      // Switch material back to Matte Black Marine Acrylic (no surcharge):
      await replicaPage.selectMaterial('acrylic_black');
      await expect(replicaPage.surchargeBadge).not.toBeVisible();
      // 10 switches acrylic: base 35 + 80 = 115 materials, total = 140
      await expect(replicaPage.materialsCost).toHaveText('£115.00');
      await expect(replicaPage.estimatedTotal).toHaveText('£140.00');

      // Scale switch count down to 6 switches:
      await replicaPage.selectSwitchCount(6);
      // 6 switches: 35 base + 48 switches = 83 materials, total = £108.00
      await expect(replicaPage.materialsCost).toHaveText('£83.00');
      await expect(replicaPage.estimatedTotal).toHaveText('£108.00');

      // Scale switch count to 8 switches for our final quote inquiry:
      await replicaPage.selectSwitchCount(8);
      // 8 switches: 35 base + 64 switches = 99 materials, total = £124.00
      await expect(replicaPage.materialsCost).toHaveText('£99.00');
      await expect(replicaPage.estimatedTotal).toHaveText('£124.00');
    });

    // 4. Photo Management: Lightbox Inspection, Removal, and Upload
    await test.step('4. Photo management: inspect reference sample in Lightbox, delete, and upload new photo', async () => {
      // Inspect initial reference sample photo
      await expect(replicaPage.getPhotoCard(0)).toBeVisible();
      await replicaPage.inspectPhoto(0);
      await expect(replicaPage.lightboxModal).toBeVisible();

      // Dismiss Lightbox
      await replicaPage.closeLightbox();

      // Remove the initial reference sample photo
      await replicaPage.removePhoto(0);
      await expect(replicaPage.getPhotoCard(0)).not.toBeVisible();

      // Upload new switchboard damage photo
      await replicaPage.uploadPhotoFile(
        'weathered_switchboard_haslar.png',
        'image/png',
        samplePhotoBuffer
      );

      // Verify new photo appears in the grid
      await expect(replicaPage.getPhotoCard(0)).toBeVisible({ timeout: 10000 });
      await expect(replicaPage.getPhotoCard(0)).toContainText('weathered_switchboard_haslar.png');
    });

    // 5. Submit Quote Inquiry & Confirm Vessel Portal Transition
    await test.step('5. Submit replica panel inquiry and confirm quotation in Vessel Portal', async () => {
      // Enter specific yacht requirements
      await replicaPage.setVesselDetails('Westerly', 'Konsort 29', '195mm x 140mm');
      await replicaPage.setNotes(
        'Exact replacement for cracked 1982 Westerly Konsort panel. Need to preserve the 4 corner screw hole spacing.'
      );

      // Submit inquiry
      await replicaPage.submitInquiry();

      // App transitions to Vessel Portal where the submitted quote is shown in the active jobs thread
      await expect(page.getByText('Your Service History & Orders')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText(/AJW-REP-/i).first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Westerly Konsort 29').first()).toBeVisible();

      // Verify the itemized quote details are rendered in discussion thread
      await expect(page.getByText(/Switch Panel Reference Photos/i)).toBeVisible({ timeout: 15000 });
      await expect(page.getByText('Quote Requested').first()).toBeVisible({ timeout: 10000 });
    });

    // 6. Workshop Administrator Inspection & Verification
    await test.step('6. Workshop Admin signs in and audits submitted replica quote in master workshop', async () => {
      // Sign off client session first so guest sign in button is visible
      await navigationPage.signOut();

      // Open sign-in modal and authenticate as Anthony Wrather (Admin)
      await navigationPage.signInNavButton.click();
      await authModalPage.verifyModalVisible();
      await authModalPage.signIn('anthonywrather@gmail.com', 'ajwmes2026');

      // Admin navigates to Operations Dashboard
      await navigationPage.navigateToAdmin();
      await expect(adminPage.adminDashboard).toBeVisible({ timeout: 10000 });

      // Verify top-level operational metrics
      await expect(adminPage.metricTotalWorkload).toBeVisible();
      await expect(adminPage.metricPendingQuotes).toBeVisible();

      // Inspect active Jobs queue: verify the Westerly Konsort replica job is listed
      await expect(page.getByText('Westerly Konsort 29').first()).toBeVisible();
      await expect(page.getByText(/AJW-REP-/i).first()).toBeVisible();
    });
  });
});
