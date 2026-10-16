import { Page, Locator, expect } from '@playwright/test';

export class ConsignmentTrackerPage {
  readonly page: Page;

  // Root & Header
  readonly trackerContainer: Locator;
  readonly searchInput: Locator;
  readonly clearSearchBtn: Locator;
  readonly orderTabsContainer: Locator;
  readonly orderTabs: Locator;

  // Active Order Details
  readonly activeOrderCard: Locator;
  readonly orderNumber: Locator;
  readonly orderStatusPill: Locator;
  readonly destinationPreview: Locator;

  // Visual Timeline
  readonly timelineSection: Locator;
  readonly desktopTimeline: Locator;
  readonly progressBar: Locator;
  readonly mobileTimeline: Locator;
  readonly activeStageBanner: Locator;
  readonly fulfillmentPercent: Locator;

  // Carrier & Dispatch Logistics
  readonly carrierBox: Locator;
  readonly shippingMethod: Locator;
  readonly trackingNumber: Locator;
  readonly trackingCarrier: Locator;
  readonly copyTrackingBtn: Locator;
  readonly checkpointsBtn: Locator;

  // Checkpoints Modal
  readonly checkpointsModal: Locator;
  readonly modalTrackingNumber: Locator;
  readonly checkpointEntries: Locator;
  readonly closeCheckpointsBtn: Locator;
  readonly modalCloseActionBtn: Locator;

  // Destination Details
  readonly destinationBox: Locator;
  readonly destinationName: Locator;
  readonly destinationAddress: Locator;

  // Parcel Contents Accordion
  readonly itemsToggleBtn: Locator;
  readonly itemsContainer: Locator;
  readonly itemRows: Locator;
  readonly totalPaid: Locator;

  // Status Simulator Controls
  readonly statusSimulator: Locator;
  readonly simulatePendingBtn: Locator;
  readonly simulateProcessingBtn: Locator;
  readonly simulateDispatchedBtn: Locator;
  readonly simulateDeliveredBtn: Locator;

  // Empty State
  readonly emptyState: Locator;
  readonly shopStockBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // Root & Header
    this.trackerContainer = page.getByTestId('postal-order-tracker');
    this.searchInput = page.getByTestId('tracker-search-input');
    this.clearSearchBtn = page.getByTestId('tracker-clear-search-btn');
    this.orderTabsContainer = page.getByTestId('tracker-order-tabs');
    this.orderTabs = page.getByTestId('tracker-order-tab');

    // Active Order Details
    this.activeOrderCard = page.getByTestId('tracker-active-order-card');
    this.orderNumber = page.getByTestId('tracker-order-number');
    this.orderStatusPill = page.getByTestId('tracker-order-status-pill');
    this.destinationPreview = page.getByTestId('tracker-destination-preview');

    // Visual Timeline
    this.timelineSection = page.getByTestId('tracker-timeline-section');
    this.desktopTimeline = page.getByTestId('tracker-desktop-timeline');
    this.progressBar = page.getByTestId('tracker-progress-bar');
    this.mobileTimeline = page.getByTestId('tracker-mobile-timeline');
    this.activeStageBanner = page.getByTestId('tracker-active-stage-banner');
    this.fulfillmentPercent = page.getByTestId('tracker-fulfillment-percent');

    // Carrier Logistics
    this.carrierBox = page.getByTestId('tracker-carrier-box');
    this.shippingMethod = page.getByTestId('tracker-shipping-method');
    this.trackingNumber = page.getByTestId('tracker-tracking-number');
    this.trackingCarrier = page.getByTestId('tracker-tracking-carrier');
    this.copyTrackingBtn = page.getByTestId('tracker-copy-tracking-btn');
    this.checkpointsBtn = page.getByTestId('tracker-checkpoints-btn');

    // Modal
    this.checkpointsModal = page.getByTestId('tracker-checkpoints-modal');
    this.modalTrackingNumber = page.getByTestId('tracker-modal-tracking-number');
    this.checkpointEntries = page.getByTestId('tracker-checkpoint-entry');
    this.closeCheckpointsBtn = page.getByTestId('tracker-close-checkpoints-btn');
    this.modalCloseActionBtn = page.getByTestId('tracker-modal-close-action-btn');

    // Destination Box
    this.destinationBox = page.getByTestId('tracker-destination-box');
    this.destinationName = page.getByTestId('tracker-destination-name');
    this.destinationAddress = page.getByTestId('tracker-destination-address');

    // Parcel Contents
    this.itemsToggleBtn = page.getByTestId('tracker-items-toggle');
    this.itemsContainer = page.getByTestId('tracker-items-container');
    this.itemRows = page.getByTestId('tracker-item-row');
    this.totalPaid = page.getByTestId('tracker-total-paid');

    // Simulator Controls
    this.statusSimulator = page.getByTestId('tracker-status-simulator');
    this.simulatePendingBtn = page.getByTestId('simulate-status-pending');
    this.simulateProcessingBtn = page.getByTestId('simulate-status-processing');
    this.simulateDispatchedBtn = page.getByTestId('simulate-status-dispatched');
    this.simulateDeliveredBtn = page.getByTestId('simulate-status-delivered');

    // Empty State
    this.emptyState = page.getByTestId('tracker-empty-state');
    this.shopStockBtn = page.getByTestId('tracker-shop-stock-btn');
  }

  async verifyTrackerVisible(): Promise<void> {
    await expect(this.trackerContainer).toBeVisible({ timeout: 10000 });
  }

  async searchOrders(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async clearSearch(): Promise<void> {
    await this.clearSearchBtn.click();
    await expect(this.clearSearchBtn).not.toBeVisible();
  }

  async selectOrderByNumber(orderNumber: string): Promise<void> {
    const tab = this.page.locator(`[data-testid="tracker-order-tab"][data-order-number="${orderNumber}"]`);
    await tab.click({ timeout: 10000, force: true });
    await expect(this.orderNumber).toContainText(orderNumber);
  }

  async verifyActiveOrder(orderNumber: string): Promise<void> {
    await expect(this.activeOrderCard).toBeVisible({ timeout: 10000 });
    await expect(this.orderNumber).toContainText(orderNumber);
  }

  async openCarrierCheckpoints(): Promise<void> {
    await expect(this.checkpointsBtn).toBeVisible({ timeout: 10000 });
    await this.checkpointsBtn.click({ force: true });
    await expect(this.checkpointsModal).toBeVisible({ timeout: 10000 });
  }

  async closeCarrierCheckpoints(): Promise<void> {
    if (await this.closeCheckpointsBtn.isVisible()) {
      await this.closeCheckpointsBtn.click({ force: true });
    } else {
      await this.modalCloseActionBtn.click({ force: true });
    }
    await expect(this.checkpointsModal).not.toBeVisible();
  }

  async toggleParcelItems(): Promise<void> {
    await this.itemsToggleBtn.scrollIntoViewIfNeeded();
    await this.itemsToggleBtn.click({ force: true });
  }

  async simulateStatus(status: 'pending' | 'processing' | 'dispatched' | 'delivered'): Promise<void> {
    let btn: Locator;
    switch (status) {
      case 'pending':
        btn = this.simulatePendingBtn;
        break;
      case 'processing':
        btn = this.simulateProcessingBtn;
        break;
      case 'dispatched':
        btn = this.simulateDispatchedBtn;
        break;
      case 'delivered':
        btn = this.simulateDeliveredBtn;
        break;
    }
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ force: true });
  }

  getDesktopStageNode(stageKey: string): Locator {
    return this.page.getByTestId(`timeline-stage-${stageKey}`);
  }

  getMobileStageNode(stageKey: string): Locator {
    return this.page.getByTestId(`mobile-timeline-stage-${stageKey}`);
  }
}
