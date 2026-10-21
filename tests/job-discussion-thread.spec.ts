import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { VesselPortalPage } from './pages/VesselPortalPage';
import { JobDiscussionThreadPage } from './pages/JobDiscussionThreadPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

test.describe('Bi-Directional Pontoon Job Discussion, Cloud Photo Proofs & Inbound Email (UJ-12) E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear browser storage to guarantee clean session state
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('should support bi-directional job chat, photo proofs, lightbox zoom, quote approval, postal tracking deep-link, and inbound email webhook threading', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    const portal = new VesselPortalPage(page);
    const thread = new JobDiscussionThreadPage(page);
    const admin = new AdminDashboardPage(page);

    const sampleImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );

    // =========================================================================
    // 1. Client Authentication & Job Thread Inspection (/portal -> Jobs & Activity)
    // =========================================================================
    await test.step('1. Authenticate as David Mercer and inspect active job discussion thread', async () => {
      await nav.navigateToLanding();
      await nav.openSignInModal();
      await auth.verifyModalVisible();

      await auth.selectTestPersona('d.mercer@solent-sail.co.uk');
      await nav.expectUserProfile('David Mercer');

      await nav.navigateToPortal();
      await portal.verifyPortalVisible();

      // Navigate to Jobs & Activity sub-tab
      await portal.selectSubTab('jobs');
      await thread.verifyThreadVisible();

      // Verify active job header metadata (job.reference, vessel, berth, £25/hr)
      await expect(page.getByText('AJW-2026-088').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Windbird III').first()).toBeVisible({ timeout: 10000 });
      const isMobile = page.viewportSize() ? page.viewportSize()!.width < 640 : false;
      if (!isMobile) {
        await expect(page.getByText('Flat Rate: £25/hr').first()).toBeVisible({ timeout: 10000 });
      }

      // Verify Billing Sheet sidebar elements
      await expect(page.getByText('Job Billing Sheet').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Labor Hours (@ £25/hr)').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('Materials Used:').first()).toBeVisible({ timeout: 10000 });
      await expect(thread.depositStatus).toBeVisible({ timeout: 10000 });
    });

    // =========================================================================
    // 2. Client Message Dispatch & Visual Styling Assertion
    // =========================================================================
    await test.step('2. Send client question and assert right-aligned message bubble', async () => {
      const clientQuestion = 'Can we fit the Victron SmartShunt behind the chart table bulkhead?';
      await thread.sendMessage(clientQuestion);

      // Verify message appears in feed
      await thread.expectMessagePresent(clientQuestion);

      // Verify sky-blue client bubble styling (bg-sky-600)
      const clientBubble = thread.messagesFeed.getByText(clientQuestion).first().locator('..');
      await expect(clientBubble).toHaveClass(/bg-sky-600/);
    });

    // =========================================================================
    // 3. Client Photo Attachment & Image Lightbox Zoom Inspection
    // =========================================================================
    await test.step('3. Attach switch panel image and inspect in ImageLightboxModal', async () => {
      await thread.attachPhoto({
        name: 'switch-panel-draft.png',
        mimeType: 'image/png',
        buffer: sampleImageBuffer
      });

      // Verify attachment message bubble appears
      await thread.expectMessagePresent(/Attached Switch Panel Image: switch-panel-draft\.png/);

      // Click the thumbnail specifically inside our newly attached message bubble
      const ourAttachmentBubble = thread.messagesFeed.filter({ hasText: 'switch-panel-draft.png' }).first();
      await expect(ourAttachmentBubble).toBeVisible({ timeout: 10000 });
      const thumbnail = ourAttachmentBubble.locator('img[alt="Attached switch panel"]').first();
      await expect(thumbnail).toBeVisible({ timeout: 10000 });
      await thumbnail.click({ force: true });

      // Verify Lightbox Modal renders
      const lightbox = page.getByTestId('image-lightbox-modal');
      await expect(lightbox).toBeVisible({ timeout: 10000 });

      // Close Lightbox Modal
      await page.keyboard.press('Escape');
      await expect(lightbox).not.toBeVisible({ timeout: 5000 });
    });

    // =========================================================================
    // 4. Live Postal Fulfillment Event Card & Visual Tracker Deep-Link
    // =========================================================================
    await test.step('4. Verify postal fulfillment event card and deep-link to /tracker', async () => {
      // Confirm Live Postal Fulfillment Event card for AJW-POST-2845
      await thread.expectPostalEventVisible('AJW-POST-2845');
      await expect(thread.postalEventCard.getByText('Live Postal Fulfillment Event').first()).toBeVisible();

      // Click "Open in Visual Order Tracker"
      await thread.clickOpenVisualTracker();

      // Verify redirect to tracker focused on AJW-POST-2845
      await expect(page.getByTestId('postal-order-tracker')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('AJW-POST-2845').first()).toBeVisible({ timeout: 10000 });

      // Return to Portal -> Jobs & Activity
      await nav.navigateToPortal();
      await portal.selectSubTab('jobs');
      await thread.verifyThreadVisible();
    });

    // =========================================================================
    // 5. Quote Approval Flow (quote_sent -> quote_accepted)
    // =========================================================================
    await test.step('5. Select quote_sent job and approve quote as client', async () => {
      // Switch vessel to Solent Skiff which has the quote_sent solar job AJW-2026-091
      await portal.switchVessel('vessel-mercer-skiff');
      await portal.selectSubTab('jobs');

      // If quote is in quote_sent status, approve it; otherwise verify it is already accepted
      const currentStatus = await thread.statusBadge.textContent();
      if (currentStatus?.toLowerCase().includes('quote sent')) {
        await expect(thread.approveQuoteButton).toBeVisible({ timeout: 10000 });
        await thread.approveQuote();
      }

      // Verify updated status to quote accepted
      await thread.expectStatus('quote accepted');
      await thread.expectMessagePresent(/Quote accepted by boat owner/i);
    });

    // =========================================================================
    // 6. Admin Session & Workshop Laser Proof Photo Upload (/admin)
    // =========================================================================
    await test.step('6. Authenticate as Admin and upload laser proof photo to job thread', async () => {
      // Switch session to Admin (Anthony Wrather)
      await nav.signOut();
      await nav.openSignInModal();
      await auth.verifyModalVisible();
      await auth.selectTestPersona('anthonywrather@gmail.com');
      await nav.expectUserProfile('Anthony Wrather');

      // Navigate to Admin Dashboard -> Jobs tab
      await nav.navigateToAdmin();
      await admin.switchTab('jobs');

      // Select Windbird III job (AJW-2026-088)
      const windbirdAdminCard = page.getByText('AJW-2026-088').first();
      await expect(windbirdAdminCard).toBeVisible({ timeout: 10000 });
      await windbirdAdminCard.click({ force: true });

      // Verify client's previously sent message is visible to admin
      await thread.expectMessagePresent('Can we fit the Victron SmartShunt behind the chart table bulkhead?');

      // Admin uploads workshop laser proof photo
      await thread.uploadAdminWorkshopProof({
        name: 'laser-cut-proof.png',
        mimeType: 'image/png',
        buffer: sampleImageBuffer
      });

      // Verify laser cut proof message appears in thread
      await thread.expectMessagePresent(/🔬 \[Laser Cut Proof & Test Fitting Photo\]/);
    });

    // =========================================================================
    // 7. Inbound Customer Email Webhook Bridge Simulation
    // =========================================================================
    await test.step('7. Simulate inbound customer email webhook and verify automatic thread update', async () => {
      const emailSubject = 'Re: AJW-2026-088 SmartShunt Bulkhead Confirmation';
      const emailBody = 'Yes Anthony, the bulkhead location has ample clearance. Please proceed!';

      await thread.simulateInboundEmail({
        from: 'd.mercer@solent-sail.co.uk',
        subject: emailSubject,
        text: emailBody,
        jobReference: 'AJW-2026-088'
      });

      // Verify inbound email is automatically appended into active thread
      await thread.expectMessagePresent(new RegExp(`📩 \\[Inbound Email: "${emailSubject}"\\]`));
      await thread.expectMessagePresent(emailBody);
    });
  });
});
