import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { TechnicianWorkspacePage } from './pages/TechnicianWorkspacePage';

const SAMPLE_JPEG_BUFFER = Buffer.from(
  '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=',
  'base64'
);

test.describe('Journey UJ-11: Offline Pontoon Resilience & Mutation Queue Replay', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage for a clean test baseline
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('should handle offline signal loss aboard pontoon, queue photos & sign-off in IndexedDB, and automatically replay upon reconnection', async ({ page, context }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    const tech = new TechnicianWorkspacePage(page);

    // Mock network auth endpoints if intercepted at network layer
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token-tech-2026',
          user: {
            id: 'usr-tech-0000-0000-0000-000000000002',
            email: 'jack.tech@ajwmes.co.uk',
            name: 'Jack Henderson',
            role: 'technician'
          }
        })
      });
    });

    await test.step('1. Authenticate as Solent Marine Technician and verify active connected sync bar', async () => {
      await nav.navigateToLanding();
      await nav.openSignInModal();
      await auth.verifyModalVisible();
      await auth.signIn('jack.tech@ajwmes.co.uk', 'ajwmes2026');

      await tech.verifyWorkspaceVisible();
      await expect(page.getByText('Solent Field Technician Workstation')).toBeVisible();
      await nav.expectUserProfile('Jack Henderson');

      // Verify initial online connection status
      await tech.expectConnectedState();
    });

    await test.step('2. Select a pontoon diagnostic job from the queue', async () => {
      await tech.filterAllButton.click({ force: true });
      const firstJobCard = page.locator('[data-testid^="job-card-"]').first();
      await expect(firstJobCard).toBeVisible({ timeout: 10000 });
      await firstJobCard.click({ force: true });

      await expect(tech.selectedJobDetails).toBeVisible();
      await expect(tech.selectedJobVessel).toBeVisible();
    });

    await test.step('3. Simulate signal loss aboard vessel (entering hull / pontoon dead zone)', async () => {
      // Emulate offline network conditions and trigger window offline event
      await context.setOffline(true);
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'onLine', { value: false, configurable: true });
        window.dispatchEvent(new Event('offline'));
      });

      // Verify sync bar detects offline pontoon mode immediately
      await tech.expectOfflineState();
      await expect(tech.syncStatusDescription).toContainText('IndexedDB is caching photos, signatures & hours');
    });

    await test.step('4. Capture and compress diagnostic work photo offline (Stored in IndexedDB)', async () => {
      await tech.uploadFitmentPhoto({
        name: 'solent_lithium_bank_multimeter.jpg',
        mimeType: 'image/jpeg',
        buffer: SAMPLE_JPEG_BUFFER
      });

      // Verify photo gallery renders locally cached photo with awaiting upload badge
      await expect(tech.offlinePhotosGallery).toBeVisible({ timeout: 10000 });
      await expect(tech.queuedPhotosBadge).toBeVisible();
      await expect(tech.queuedPhotosBadge).toHaveText('Awaiting Cloud Upload');
      await expect(tech.queuedPhotoThumbnails.first()).toBeVisible();

      // Verify sync bar updates pending photo count
      await expect(tech.pendingPhotosBadge).toBeVisible();
      await expect(tech.pendingPhotosBadge).toContainText('1 Photos');
    });

    await test.step('5. Collect digital customer sign-off aboard vessel while disconnected', async () => {
      await tech.openCustomerSignOff();
      await expect(page.getByTestId('signoff-summary-card')).toBeVisible();

      await tech.fillSignOffForm({
        name: 'David Mercer',
        role: 'vessel_owner',
        feedback: 'Lithium battery bank installation verified working offline on Haslar pontoon.'
      });

      // Draw handwritten signature on HTML5 canvas
      await tech.drawHandwrittenSignature();

      // Submit sign-off while disconnected
      await tech.submitSignOff();

      // Verify sign-off receipt card renders optimistic sign-off
      await tech.verifySignOffCard({ signerName: 'David Mercer' });

      // Verify sync bar reflects both queued photo and queued customer sign-off
      await expect(tech.pendingSignaturesBadge).toBeVisible();
      await expect(tech.pendingSignaturesBadge).toContainText('1 Signatures');
      await expect(tech.pendingPhotosBadge).toContainText('1 Photos');
    });

    await test.step('6. Restore cellular connection and execute mutation queue replay', async () => {
      // Re-enable browser network
      await context.setOffline(false);
      await page.evaluate(() => {
        Object.defineProperty(navigator, 'onLine', { value: true, configurable: true });
        window.dispatchEvent(new Event('online'));
      });

      // Trigger manual sync or let auto-sync engage
      if (await tech.manualSyncButton.isVisible()) {
        await tech.triggerManualSync().catch(() => {});
      }

      // 1. Verify mutation queue drains completely to 0 pending items
      await expect(tech.syncQueueBadge).not.toBeVisible({ timeout: 20000 });

      // 2. Verify sync bar returns to connected state with 0 pending items
      await tech.expectConnectedState({ timeout: 10000 });

      // Verify sync feedback notice if present
      const notice = tech.syncFeedbackNotice;
      if (await notice.isVisible().catch(() => false)) {
        await expect(notice).toContainText(/Successfully synced|All pontoon items already synchronized/i);
      }
    });

    await test.step('7. Verify persisted customer sign-off remains intact post-replay', async () => {
      await expect(tech.customerSignOffCard).toBeVisible();
      await expect(tech.signOffSignerNameDisplay).toContainText('David Mercer');
    });
  });
});
