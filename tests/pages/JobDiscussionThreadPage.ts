import { Page, Locator, expect } from '@playwright/test';

export class JobDiscussionThreadPage {
  readonly page: Page;

  // Root Container & Header
  readonly threadContainer: Locator;
  readonly statusBadge: Locator;

  // Feed & Bubbles
  readonly messagesFeed: Locator;
  readonly messageBubbles: Locator;
  readonly postalEventCard: Locator;
  readonly openTrackerButton: Locator;

  // Input & Send Form
  readonly messageInput: Locator;
  readonly sendButton: Locator;
  readonly attachPhotoInput: Locator;

  // Sidebar Actions & Badges
  readonly depositStatus: Locator;
  readonly approveQuoteButton: Locator;
  readonly payDepositButton: Locator;
  readonly depositSecuredBadge: Locator;

  // Admin Elements
  readonly adminProofInput: Locator;

  constructor(page: Page) {
    this.page = page;

    // Root Container & Header
    this.threadContainer = page.getByTestId('job-discussion-thread');
    this.statusBadge = page.getByTestId('job-thread-status-badge');

    // Feed & Bubbles
    this.messagesFeed = page.getByTestId('chat-messages-feed');
    this.messageBubbles = page.getByTestId('chat-message-bubble');
    this.postalEventCard = page.getByTestId('chat-postal-event-card');
    this.openTrackerButton = page.getByTestId('chat-open-tracker-button');

    // Input & Send Form
    this.messageInput = page.getByTestId('chat-message-input');
    this.sendButton = page.getByTestId('chat-send-button');
    this.attachPhotoInput = page.getByTestId('chat-attach-photo-input');

    // Sidebar Actions & Badges
    this.depositStatus = page.getByTestId('job-deposit-status');
    this.approveQuoteButton = page.getByTestId('approve-quote-button');
    this.payDepositButton = page.getByTestId('stripe-pay-deposit-button');
    this.depositSecuredBadge = page.getByTestId('stripe-deposit-secured-badge');

    // Admin Elements
    this.adminProofInput = page.getByTestId('admin-upload-proof-input');
  }

  // --- Assertions & Navigation ---

  async verifyThreadVisible(): Promise<void> {
    await expect(this.threadContainer).toBeVisible({ timeout: 10000 });
  }

  async expectStatus(statusText: string): Promise<void> {
    await expect(this.statusBadge).toContainText(statusText, { ignoreCase: true, timeout: 10000 });
  }

  async expectMessagePresent(textOrPattern: string | RegExp): Promise<void> {
    if (typeof textOrPattern === 'string') {
      await expect(this.messagesFeed.getByText(textOrPattern).first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(this.messagesFeed.getByText(textOrPattern).first()).toBeVisible({ timeout: 10000 });
    }
  }

  async expectPostalEventVisible(orderRef?: string): Promise<void> {
    await expect(this.postalEventCard.first()).toBeVisible({ timeout: 10000 });
    if (orderRef) {
      await expect(this.postalEventCard.getByText(orderRef).first()).toBeVisible({ timeout: 10000 });
    }
  }

  // --- User Interactions ---

  async sendMessage(text: string): Promise<void> {
    await this.messageInput.scrollIntoViewIfNeeded();
    await this.messageInput.fill(text);
    await this.sendButton.click({ force: true });
  }

  async attachPhoto(payload: { name: string; mimeType: string; buffer: Buffer }): Promise<void> {
    await this.attachPhotoInput.setInputFiles({
      name: payload.name,
      mimeType: payload.mimeType,
      buffer: payload.buffer
    });
  }

  async approveQuote(): Promise<void> {
    await this.approveQuoteButton.scrollIntoViewIfNeeded();
    await expect(this.approveQuoteButton).toBeVisible({ timeout: 5000 });
    await this.approveQuoteButton.click({ force: true });
  }

  async clickOpenVisualTracker(): Promise<void> {
    await this.openTrackerButton.scrollIntoViewIfNeeded();
    await expect(this.openTrackerButton).toBeVisible({ timeout: 5000 });
    await this.openTrackerButton.click({ force: true });
  }

  async uploadAdminWorkshopProof(payload: { name: string; mimeType: string; buffer: Buffer }): Promise<void> {
    await this.adminProofInput.setInputFiles({
      name: payload.name,
      mimeType: payload.mimeType,
      buffer: payload.buffer
    });
  }

  async simulateInboundEmail(payload: {
    from?: string;
    subject?: string;
    text?: string;
    jobReference?: string;
  }): Promise<void> {
    await this.page.evaluate((opts) => {
      const win = window as unknown as {
        ajwSimulateIncomingEmail?: (partial: Record<string, unknown>) => void;
      };
      if (typeof win.ajwSimulateIncomingEmail === 'function') {
        win.ajwSimulateIncomingEmail(opts);
      } else {
        console.warn('ajwSimulateIncomingEmail not found on window');
      }
    }, payload);
  }
}
