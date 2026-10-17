import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { PostalWorkspacePage } from './pages/PostalWorkspacePage';

test.describe('Solent Marine Postal Workshop Fulfillment & Dispatch E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage for a clean test baseline and mock window.print
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.print = () => {};
    });
  });

  test('should sign in as postal dispatcher, inspect order queue, generate packing slip, advance through bench pack, courier dispatch, and pontoon delivery', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    const postal = new PostalWorkspacePage(page);

    // Mock network auth endpoints if intercepted at network layer
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token-postal-2026',
          user: {
            id: 'usr-postal-0000-0000-0000-000000000003',
            email: 'sarah.postal@ajwmes.co.uk',
            name: 'Sarah Miller',
            role: 'postal'
          }
        })
      });
    });

    await test.step('1. Navigate to landing page and sign in as Postal Dispatcher', async () => {
      await nav.navigateToLanding();
      await nav.openSignInModal();
      await auth.verifyModalVisible();
      await auth.signIn('sarah.postal@ajwmes.co.uk', 'ajwmes2026');
    });

    await test.step('2. Verify direct redirect to Gosport Marine Postal Dispatch Station', async () => {
      await postal.verifyWorkspaceVisible();
      await expect(page.getByText('Gosport Marine Postal Dispatch Station')).toBeVisible();
      await expect(page.getByText('Postal Role Active')).toBeVisible();
      await nav.expectUserProfile('Sarah Miller');
    });

    await test.step('3. Inspect postal fulfillment metrics and order queue filtering', async () => {
      await expect(postal.metricAwaitingPacking).toBeVisible();
      await expect(postal.metricPacked).toBeVisible();
      await expect(postal.metricDispatched).toBeVisible();
      await expect(postal.metricDelivered).toBeVisible();

      // Ensure All filter is active and queue cards are visible
      await postal.filterOrdersAll.click({ force: true });
      await expect(postal.allOrderCards.first()).toBeVisible({ timeout: 10000 });
      const orderCount = await postal.allOrderCards.count();
      expect(orderCount).toBeGreaterThan(0);

      // Verify search input operates smoothly
      await expect(postal.ordersSearchInput).toBeVisible();
    });

    await test.step('4. Select an active consignment and inspect workshop pick & pack list', async () => {
      // Filter by 'To Pack' to deterministically target an order needing bench packaging
      await postal.filterOrdersReceived.click({ force: true });
      await page.waitForTimeout(200);
      const packCard = postal.allOrderCards.filter({ hasText: 'Needs Packing' }).first();
      await expect(packCard).toBeVisible({ timeout: 10000 });
      await packCard.click({ force: true });

      await expect(postal.selectedOrderDetails).toBeVisible();
      await expect(postal.selectedOrderNumber).toBeVisible();
      await expect(postal.selectedOrderStatus).toContainText(/Needs Packing|received/i);

      // Verify Pick & Pack List is presented
      await expect(page.getByText('Workshop Pick & Pack List')).toBeVisible();
      await expect(page.getByText('Order Total:')).toBeVisible();
    });

    await test.step('5. Open and inspect waterproof A4 Packing Slip modal', async () => {
      await postal.openPackingSlip();

      // Verify packing slip letterhead and branding inside printable sheet
      await expect(postal.packingSlipSheet.getByRole('heading', { name: 'AJW MARINE ELECTRICAL' })).toBeVisible();
      await expect(postal.packingSlipSheet.getByText('Unit 4, Haslar Marina Trade Yard, Gosport, Hampshire PO12 1NU')).toBeVisible();
      await expect(postal.packingSlipOrderNumber).toBeVisible();

      // Verify price toggle interaction
      await postal.toggleShowPrices.scrollIntoViewIfNeeded();
      await expect(postal.toggleShowPrices).toBeVisible();
      await postal.toggleShowPrices.click({ force: true });
      await postal.toggleShowPrices.click({ force: true });

      // Close modal
      await postal.closePackingSlip();
      await page.waitForTimeout(300);
    });

    await test.step('6. Advance fulfillment workflow through Bench Packing and Carrier Dispatch', async () => {
      // Pack the order from workshop bench
      await postal.markOrderPacked();

      // Assert carrier select and tracking number inputs appear
      await expect(postal.carrierSelect).toBeVisible({ timeout: 10000 });
      await expect(postal.trackingNumberInput).toBeVisible();

      // Select carrier and assign custom tracking reference
      await postal.dispatchWithTracking('Royal Mail Tracked 24', 'GB987654321RM');

      // Verify order transitions to Dispatched
      await expect(page.getByText('Dispatched and Consignment Logged').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('GB987654321RM').first()).toBeVisible();
    });

    await test.step('7. Confirm vessel pontoon delivery', async () => {
      await postal.markOrderDelivered();
      await expect(page.getByText('Delivered to Vessel / Marina').first()).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('FULFILLED').first()).toBeVisible();
    });

    await test.step('8. Audit Visual Progress Timelines view and lifecycle milestones', async () => {
      await postal.switchToTimelinesView();
      await expect(page.getByText('Order Progress Timelines & Lifecycle History')).toBeVisible({ timeout: 10000 });
      await expect(postal.timelineContainer.first()).toBeVisible();

      // Verify visual stepper cards
      await expect(page.locator('[data-testid="timeline-step-received"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="timeline-step-packed"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="timeline-step-dispatched"]').first()).toBeVisible();
      await expect(page.locator('[data-testid="timeline-step-delivered"]').first()).toBeVisible();

      // Return to Manager view
      await postal.switchToManagerView();
      await expect(postal.selectedOrderDetails).toBeVisible();
    });
  });
});
