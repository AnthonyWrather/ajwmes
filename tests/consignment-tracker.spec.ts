import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { ConsignmentTrackerPage } from './pages/ConsignmentTrackerPage';

test.describe('Solent Marine Postal Consignment Timeline Tracker (UJ-06) E2E Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant clipboard permissions where supported
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    } catch {
      // Ignore unsupported browser contexts
    }

    // Clean browser state and mock print & clipboard for headless stability
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.print = () => {};

      if (!navigator.clipboard) {
        (navigator as unknown as { clipboard: unknown }).clipboard = {
          writeText: async () => {},
          readText: async () => ''
        };
      }
    });
  });

  test('should allow guest and clients to track postal orders, inspect timeline milestones, verify carrier checkpoints, and simulate lifecycle progression', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    const tracker = new ConsignmentTrackerPage(page);

    await test.step('1. Navigate to landing page and access Postal Order Tracker tab', async () => {
      await nav.navigateToLanding();
      await nav.navigateToTracker();
      await tracker.verifyTrackerVisible();
      await expect(page.getByText('Postal Order Tracker').first()).toBeVisible();
      await expect(page.getByText('Gosport Marine Electrical Dispatch')).toBeVisible();
    });

    await test.step('2. Inspect active consignments queue and verify order switcher pills', async () => {
      await expect(tracker.orderTabsContainer).toBeVisible();
      const tabCount = await tracker.orderTabs.count();
      expect(tabCount).toBeGreaterThanOrEqual(2);

      // Verify default selected order details
      await expect(tracker.activeOrderCard).toBeVisible();
      await expect(tracker.orderNumber).toBeVisible();
      await expect(tracker.orderStatusPill).toBeVisible();
    });

    await test.step('3. Search and filter consignments by postcode and order number', async () => {
      // Search by Isle of Wight Cowes postcode
      await tracker.searchOrders('PO31 7BD');
      await expect(tracker.orderTabs.filter({ hasText: 'AJW-POST-2839' })).toBeVisible({ timeout: 5000 });
      expect(await tracker.orderTabs.count()).toBe(1);

      // Select the filtered order
      await tracker.selectOrderByNumber('AJW-POST-2839');
      await tracker.verifyActiveOrder('AJW-POST-2839');

      // Clear search and verify full consignment list is restored
      await tracker.clearSearch();
      const restoredCount = await tracker.orderTabs.count();
      expect(restoredCount).toBeGreaterThan(1);
    });

    await test.step('4. Verify visual 4-stage timeline progress bar and milestone statuses', async () => {
      // Ensure AJW-POST-2839 (dispatched order) is active
      await tracker.selectOrderByNumber('AJW-POST-2839');
      await tracker.verifyActiveOrder('AJW-POST-2839');

      // Verify desktop or mobile timeline representation
      const isMobile = (page.viewportSize()?.width ?? 1280) < 768;
      if (isMobile) {
        await expect(tracker.mobileTimeline).toBeVisible();
        await expect(tracker.getMobileStageNode('dispatched')).toBeVisible();
      } else {
        await expect(tracker.desktopTimeline).toBeVisible();
        await expect(tracker.progressBar).toBeVisible();
        await expect(tracker.getDesktopStageNode('dispatched')).toBeVisible();
      }

      // Assert fulfillment percentage indicates In Transit (80%)
      await expect(tracker.fulfillmentPercent).toContainText('80% Completed');
      await expect(tracker.activeStageBanner).toContainText(/In Transit|Dispatched/i);
    });

    await test.step('5. Validate carrier logistics, tracking reference, and copy interaction', async () => {
      await expect(tracker.carrierBox).toBeVisible();
      await expect(tracker.shippingMethod).toContainText(/Royal Mail/i);
      await expect(tracker.trackingNumber).toBeVisible();
      const trackingCode = (await tracker.trackingNumber.textContent())?.trim();
      expect(trackingCode).toBeTruthy();
      expect(trackingCode).toMatch(/^GB[0-9A-Z]+RM$/);

      // Test Copy tracking interaction
      await tracker.copyTrackingBtn.scrollIntoViewIfNeeded();
      await tracker.copyTrackingBtn.click({ force: true });
      await expect(tracker.copyTrackingBtn).toContainText(/Copied!/i);
    });

    await test.step('6. Open and audit simulated live carrier checkpoints modal', async () => {
      const trackingCode = (await tracker.trackingNumber.textContent())?.trim();
      await tracker.openCarrierCheckpoints();
      await expect(tracker.modalTrackingNumber).toContainText(trackingCode!);

      // Verify logistics scan checkpoint entries
      const checkpointCount = await tracker.checkpointEntries.count();
      expect(checkpointCount).toBeGreaterThanOrEqual(3);
      await expect(page.getByText('Southampton Mail Hub')).toBeVisible();
      await expect(page.getByText('Gosport High Street')).toBeVisible();

      // Close modal
      await tracker.closeCarrierCheckpoints();
    });

    await test.step('7. Inspect destination specifications for marina pontoon vs standard UK postal', async () => {
      // Ensure Cowes residential order (AJW-POST-2839) is active
      await tracker.selectOrderByNumber('AJW-POST-2839');
      await expect(tracker.destinationBox).toBeVisible();
      await expect(tracker.destinationName).toContainText('Sarah Jenkins');
      await expect(tracker.destinationAddress).toContainText('Cowes, Isle of Wight');

      // Switch to Marcus Bennett marina order (AJW-POST-2841)
      await tracker.selectOrderByNumber('AJW-POST-2841');
      await tracker.verifyActiveOrder('AJW-POST-2841');
      await expect(tracker.destinationName).toContainText('Marcus Bennett');
      await expect(tracker.destinationAddress).toContainText('Hamble Point Marina');
      await expect(tracker.destinationAddress).toContainText('Pontoon F-12');
    });

    await test.step('8. Toggle parcel items accordion and inspect BOM components and billing totals', async () => {
      // Toggle accordion to view components
      await expect(tracker.itemsContainer).toBeVisible();
      const itemCount = await tracker.itemRows.count();
      expect(itemCount).toBeGreaterThan(0);

      // Verify line item specifics and total paid
      await expect(page.getByText('Tinned Twin Flat Marine Cable 2.5mm²')).toBeVisible();
      await expect(tracker.totalPaid).toBeVisible();
      const totalText = await tracker.totalPaid.textContent();
      expect(totalText).toMatch(/£\d+\.\d{2}/);

      // Test collapse and re-expand
      await tracker.toggleParcelItems();
      await expect(tracker.itemsContainer).not.toBeVisible();
      await tracker.toggleParcelItems();
      await expect(tracker.itemsContainer).toBeVisible();
    });

    await test.step('9. Authenticate as Workshop Admin and verify profile continuity', async () => {
      // Authenticate as workshop administrator (Anthony Wrather)
      await nav.openSignInModal();
      await auth.verifyModalVisible();
      await auth.signIn('anthonywrather@gmail.com', 'ajwmes2026');
      await nav.expectUserProfile('Anthony');

      // Navigate back to tracker to ensure authenticated state renders cleanly
      await nav.navigateToTracker();
      await tracker.verifyTrackerVisible();
    });

    await test.step('10. Simulate order lifecycle transitions using Quick Status Controls', async () => {
      // Target AJW-POST-2845 (starts in Processing stage)
      await tracker.selectOrderByNumber('AJW-POST-2845');
      await expect(tracker.orderStatusPill).toContainText(/Processing/i);
      await expect(tracker.statusSimulator).toBeVisible();

      // Transition to Dispatched
      await tracker.simulateStatus('dispatched');
      await expect(tracker.fulfillmentPercent).toContainText('80% Completed');
      await expect(tracker.orderStatusPill).toContainText(/Dispatched/i);

      // Transition to Delivered
      await tracker.simulateStatus('delivered');
      await expect(tracker.fulfillmentPercent).toContainText('100% Completed');
      await expect(tracker.orderStatusPill).toContainText(/Delivered/i);

      // Transition back to Pending
      await tracker.simulateStatus('pending');
      await expect(tracker.fulfillmentPercent).toContainText('15% Completed');
      await expect(tracker.orderStatusPill).toContainText(/Pending/i);

      // Transition to Processing
      await tracker.simulateStatus('processing');
      await expect(tracker.fulfillmentPercent).toContainText('48% Completed');
      await expect(tracker.orderStatusPill).toContainText(/Processing/i);
    });
  });
});
