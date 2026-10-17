import { Page, Locator, expect } from '@playwright/test';

export class PostalWorkspacePage {
  readonly page: Page;

  // Workspace Container & Header
  readonly workspace: Locator;
  readonly roleBanner: Locator;

  // Metrics Row
  readonly metricAwaitingPacking: Locator;
  readonly metricPacked: Locator;
  readonly metricDispatched: Locator;
  readonly metricDelivered: Locator;

  // Primary View Switcher
  readonly viewManagerTab: Locator;
  readonly viewTimelinesTab: Locator;

  // Order Filters & Search
  readonly filterOrdersAll: Locator;
  readonly filterOrdersReceived: Locator;
  readonly filterOrdersPacked: Locator;
  readonly filterOrdersDispatched: Locator;
  readonly ordersSearchInput: Locator;

  // Order List & Details
  readonly allOrderCards: Locator;
  readonly selectedOrderDetails: Locator;
  readonly selectedOrderNumber: Locator;
  readonly selectedOrderStatus: Locator;

  // Packing Slip Modal
  readonly openPackingSlipButton: Locator;
  readonly openAddressLabelButton: Locator;
  readonly packingSlipModal: Locator;
  readonly packingSlipSheet: Locator;
  readonly packingSlipOrderNumber: Locator;
  readonly toggleShowPrices: Locator;
  readonly closePackingSlipButton: Locator;

  // Fulfillment Actions
  readonly markPackedButton: Locator;
  readonly quickDispatchButton: Locator;
  readonly carrierSelect: Locator;
  readonly trackingNumberInput: Locator;
  readonly confirmDispatchButton: Locator;
  readonly markDeliveredButton: Locator;

  // Timeline View Locators
  readonly timelineSearchInput: Locator;
  readonly timelineFilterAll: Locator;
  readonly timelineFilterReceived: Locator;
  readonly timelineFilterPacked: Locator;
  readonly timelineFilterDispatched: Locator;
  readonly timelineFilterDelivered: Locator;
  readonly timelineContainer: Locator;

  constructor(page: Page) {
    this.page = page;

    // Workspace & Header
    this.workspace = page.getByTestId('postal-workspace');
    this.roleBanner = page.getByTestId('postal-role-banner');

    // Metrics
    this.metricAwaitingPacking = page.getByTestId('metric-awaiting-packing');
    this.metricPacked = page.getByTestId('metric-packed');
    this.metricDispatched = page.getByTestId('metric-dispatched');
    this.metricDelivered = page.getByTestId('metric-delivered');

    // View Switcher
    this.viewManagerTab = page.getByTestId('view-manager-tab');
    this.viewTimelinesTab = page.getByTestId('view-timelines-tab');

    // Filters & Search
    this.filterOrdersAll = page.getByTestId('orders-filter-all');
    this.filterOrdersReceived = page.getByTestId('orders-filter-received');
    this.filterOrdersPacked = page.getByTestId('orders-filter-packed');
    this.filterOrdersDispatched = page.getByTestId('orders-filter-dispatched');
    this.ordersSearchInput = page.getByTestId('orders-search-input');

    // Order List & Selection
    this.allOrderCards = page.locator('[data-testid^="order-card-"]');
    this.selectedOrderDetails = page.getByTestId('selected-order-details');
    this.selectedOrderNumber = page.getByTestId('selected-order-number');
    this.selectedOrderStatus = page.getByTestId('selected-order-status');

    // Packing Slip
    this.openPackingSlipButton = page.getByTestId('open-packing-slip-btn');
    this.openAddressLabelButton = page.getByTestId('open-address-label-btn');
    this.packingSlipModal = page.getByTestId('packing-slip-modal');
    this.packingSlipSheet = page.getByTestId('printable-packing-slip');
    this.packingSlipOrderNumber = page.getByTestId('packing-slip-order-number');
    this.toggleShowPrices = page.getByTestId('toggle-show-prices');
    this.closePackingSlipButton = page.getByTestId('close-packing-slip-btn');

    // Fulfillment Status Controls
    this.markPackedButton = page.getByTestId('mark-packed-btn');
    this.quickDispatchButton = page.getByTestId('quick-dispatch-btn');
    this.carrierSelect = page.getByTestId('carrier-select');
    this.trackingNumberInput = page.getByTestId('tracking-number-input');
    this.confirmDispatchButton = page.getByTestId('confirm-dispatch-btn');
    this.markDeliveredButton = page.getByTestId('mark-delivered-btn');

    // Timeline View
    this.timelineSearchInput = page.getByTestId('timeline-search-input');
    this.timelineFilterAll = page.getByTestId('timeline-filter-all');
    this.timelineFilterReceived = page.getByTestId('timeline-filter-received');
    this.timelineFilterPacked = page.getByTestId('timeline-filter-packed');
    this.timelineFilterDispatched = page.getByTestId('timeline-filter-dispatched');
    this.timelineFilterDelivered = page.getByTestId('timeline-filter-delivered');
    this.timelineContainer = page.getByTestId('order-progress-timeline');
  }

  async verifyWorkspaceVisible(): Promise<void> {
    await expect(this.workspace).toBeVisible({ timeout: 15000 });
    await expect(this.roleBanner).toBeVisible();
  }

  async selectFirstOrder(): Promise<void> {
    await expect(this.allOrderCards.first()).toBeVisible({ timeout: 10000 });
    await this.allOrderCards.first().scrollIntoViewIfNeeded();
    await this.allOrderCards.first().click({ force: true });
    await expect(this.selectedOrderDetails).toBeVisible();
  }

  async openPackingSlip(): Promise<void> {
    await this.openPackingSlipButton.scrollIntoViewIfNeeded();
    await expect(this.openPackingSlipButton).toBeVisible({ timeout: 10000 });
    await this.openPackingSlipButton.click({ force: true });
    await expect(this.packingSlipModal).toBeVisible({ timeout: 10000 });
    await expect(this.packingSlipSheet).toBeVisible();
  }

  async closePackingSlip(): Promise<void> {
    await this.closePackingSlipButton.scrollIntoViewIfNeeded();
    await expect(this.closePackingSlipButton).toBeVisible();
    await this.closePackingSlipButton.click({ force: true });
    await expect(this.packingSlipModal).not.toBeVisible({ timeout: 10000 });
  }

  async markOrderPacked(): Promise<void> {
    await this.markPackedButton.scrollIntoViewIfNeeded();
    await expect(this.markPackedButton).toBeVisible({ timeout: 10000 });
    await this.markPackedButton.click({ force: true });
  }

  async dispatchWithTracking(carrier: string, trackingNumber: string): Promise<void> {
    await this.carrierSelect.scrollIntoViewIfNeeded();
    await expect(this.carrierSelect).toBeVisible({ timeout: 10000 });
    await this.carrierSelect.selectOption(carrier);
    await this.trackingNumberInput.scrollIntoViewIfNeeded();
    await this.trackingNumberInput.fill(trackingNumber);
    await this.confirmDispatchButton.scrollIntoViewIfNeeded();
    await expect(this.confirmDispatchButton).toBeVisible();
    await this.confirmDispatchButton.click({ force: true });
  }

  async markOrderDelivered(): Promise<void> {
    const dismissBtn = this.page.getByTestId('dismiss-dispatch-toast-btn');
    if (await dismissBtn.isVisible().catch(() => false)) {
      await dismissBtn.click({ force: true }).catch(() => {});
    }
    await expect(this.markDeliveredButton).toBeVisible({ timeout: 10000 });
    await this.markDeliveredButton.scrollIntoViewIfNeeded();
    await this.markDeliveredButton.click({ force: true });
  }

  async switchToTimelinesView(): Promise<void> {
    await expect(this.viewTimelinesTab).toBeVisible();
    await this.viewTimelinesTab.click({ force: true });
  }

  async switchToManagerView(): Promise<void> {
    await expect(this.viewManagerTab).toBeVisible();
    await this.viewManagerTab.click({ force: true });
  }
}
