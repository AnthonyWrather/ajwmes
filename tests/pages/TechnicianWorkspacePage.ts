import { Page, Locator, expect } from '@playwright/test';

export class TechnicianWorkspacePage {
  readonly page: Page;
  readonly workspace: Locator;
  readonly filterAllButton: Locator;
  readonly filterActiveButton: Locator;
  readonly filterScheduledButton: Locator;

  // Selected job panel
  readonly selectedJobDetails: Locator;
  readonly selectedJobReference: Locator;
  readonly selectedJobVessel: Locator;
  readonly selectedJobBerth: Locator;
  readonly openStopwatchButton: Locator;
  readonly openSignOffButton: Locator;
  readonly laborTotalDisplay: Locator;
  readonly materialsTotalDisplay: Locator;

  // Status buttons
  readonly statusScheduledButton: Locator;
  readonly statusInProgressButton: Locator;
  readonly statusCompletedButton: Locator;

  // Timer modal
  readonly timerModal: Locator;
  readonly stopwatchDisplay: Locator;
  readonly stopwatchHoursLogged: Locator;
  readonly stopwatchToggleButton: Locator;
  readonly stopwatchResetButton: Locator;
  readonly timerCatalogSelect: Locator;
  readonly timerMaterialQtyInput: Locator;
  readonly timerAddMaterialButton: Locator;
  readonly timerMaterialsList: Locator;
  readonly timerSummaryLaborCost: Locator;
  readonly timerSummaryMaterialsCost: Locator;
  readonly timerSummaryTotalCost: Locator;
  readonly timerModalSaveButton: Locator;
  readonly timerModalCancelButton: Locator;

  // Sign-off modal
  readonly signOffModal: Locator;
  readonly closeSignOffModalButton: Locator;
  readonly signOffTotalAmount: Locator;
  readonly signOffSignerNameInput: Locator;
  readonly signOffSignerRoleSelect: Locator;
  readonly clearSignatureButton: Locator;
  readonly signatureCanvas: Locator;
  readonly signOffFeedbackInput: Locator;
  readonly submitSignOffButton: Locator;
  readonly customerSignOffCard: Locator;
  readonly signOffSignerNameDisplay: Locator;
  readonly signOffSignatureImage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.workspace = page.getByTestId('technician-workspace');
    this.filterAllButton = page.getByTestId('filter-jobs-all');
    this.filterActiveButton = page.getByTestId('filter-jobs-active');
    this.filterScheduledButton = page.getByTestId('filter-jobs-scheduled');

    this.selectedJobDetails = page.getByTestId('selected-job-details');
    this.selectedJobReference = page.getByTestId('selected-job-reference');
    this.selectedJobVessel = page.getByTestId('selected-job-vessel');
    this.selectedJobBerth = page.getByTestId('selected-job-berth');
    this.openStopwatchButton = page.getByTestId('open-diagnostic-stopwatch-button');
    this.openSignOffButton = page.getByTestId('open-customer-signoff-button');
    this.laborTotalDisplay = page.getByTestId('selected-job-labor-total');
    this.materialsTotalDisplay = page.getByTestId('selected-job-materials-total');

    this.statusScheduledButton = page.getByTestId('status-btn-scheduled');
    this.statusInProgressButton = page.getByTestId('status-btn-in_progress');
    this.statusCompletedButton = page.getByTestId('status-btn-completed');

    this.timerModal = page.getByTestId('diagnostic-timer-modal');
    this.stopwatchDisplay = page.getByTestId('stopwatch-display');
    this.stopwatchHoursLogged = page.getByTestId('stopwatch-hours-logged');
    this.stopwatchToggleButton = page.getByTestId('stopwatch-toggle-button');
    this.stopwatchResetButton = page.getByTestId('stopwatch-reset-button');
    this.timerCatalogSelect = page.getByTestId('timer-catalog-select');
    this.timerMaterialQtyInput = page.getByTestId('timer-material-qty-input');
    this.timerAddMaterialButton = page.getByTestId('timer-add-material-button');
    this.timerMaterialsList = page.getByTestId('timer-materials-list');
    this.timerSummaryLaborCost = page.getByTestId('timer-summary-labor-cost');
    this.timerSummaryMaterialsCost = page.getByTestId('timer-summary-materials-cost');
    this.timerSummaryTotalCost = page.getByTestId('timer-summary-total-cost');
    this.timerModalSaveButton = page.getByTestId('timer-modal-save-button');
    this.timerModalCancelButton = page.getByTestId('timer-modal-cancel-button');

    this.signOffModal = page.getByTestId('customer-signoff-modal');
    this.closeSignOffModalButton = page.getByTestId('close-signoff-modal-button');
    this.signOffTotalAmount = page.getByTestId('signoff-total-amount');
    this.signOffSignerNameInput = page.getByTestId('signoff-signer-name-input');
    this.signOffSignerRoleSelect = page.getByTestId('signoff-signer-role-select');
    this.clearSignatureButton = page.getByTestId('clear-signature-canvas-button');
    this.signatureCanvas = page.getByTestId('signature-canvas');
    this.signOffFeedbackInput = page.getByTestId('signoff-feedback-input');
    this.submitSignOffButton = page.getByTestId('submit-signoff-button');
    this.customerSignOffCard = page.getByTestId('customer-signoff-card');
    this.signOffSignerNameDisplay = page.getByTestId('signoff-signer-name');
    this.signOffSignatureImage = page.getByTestId('signoff-signature-img');
  }

  async verifyWorkspaceVisible(): Promise<void> {
    await expect(this.workspace).toBeVisible({ timeout: 10000 });
  }

  async selectJob(jobId: string): Promise<void> {
    const jobCard = this.page.getByTestId(`job-card-${jobId}`);
    await expect(jobCard).toBeVisible();
    await jobCard.scrollIntoViewIfNeeded();
    await jobCard.click({ force: true });
  }

  async setJobStatus(status: 'scheduled' | 'in_progress' | 'completed'): Promise<void> {
    const btn = status === 'scheduled'
      ? this.statusScheduledButton
      : status === 'in_progress'
      ? this.statusInProgressButton
      : this.statusCompletedButton;

    await expect(btn).toBeVisible();
    await btn.scrollIntoViewIfNeeded();
    await btn.click({ force: true });
  }

  async openStopwatch(): Promise<void> {
    await expect(this.openStopwatchButton).toBeVisible();
    await this.openStopwatchButton.scrollIntoViewIfNeeded();
    await this.openStopwatchButton.click({ force: true });
    await expect(this.timerModal).toBeVisible();
  }

  async toggleStopwatch(): Promise<void> {
    await expect(this.stopwatchToggleButton).toBeVisible();
    await this.stopwatchToggleButton.click({ force: true });
  }

  async resetStopwatch(): Promise<void> {
    await expect(this.stopwatchResetButton).toBeVisible();
    await this.stopwatchResetButton.click({ force: true });
  }

  async addMaterialFromCatalog(quantity: number): Promise<void> {
    await expect(this.timerCatalogSelect).toBeVisible();
    await expect(this.timerMaterialQtyInput).toBeVisible();
    await this.timerMaterialQtyInput.fill(String(quantity));
    await this.timerAddMaterialButton.click({ force: true });
  }

  async saveJobSheet(): Promise<void> {
    await expect(this.timerModalSaveButton).toBeVisible();
    await this.timerModalSaveButton.scrollIntoViewIfNeeded();
    await this.timerModalSaveButton.click({ force: true });
    await expect(this.timerModal).not.toBeVisible({ timeout: 10000 });
  }

  async openCustomerSignOff(): Promise<void> {
    await expect(this.openSignOffButton).toBeVisible();
    await this.openSignOffButton.scrollIntoViewIfNeeded();
    await this.openSignOffButton.click({ force: true });
    await expect(this.signOffModal).toBeVisible();
  }

  async fillSignOffForm(data: { name: string; role?: string; feedback?: string }): Promise<void> {
    await expect(this.signOffSignerNameInput).toBeVisible();
    await this.signOffSignerNameInput.fill(data.name);
    if (data.role) {
      await this.signOffSignerRoleSelect.selectOption(data.role);
    }
    if (data.feedback) {
      await this.signOffFeedbackInput.fill(data.feedback);
    }
  }

  async drawHandwrittenSignature(): Promise<void> {
    await expect(this.signatureCanvas).toBeVisible();
    await this.signatureCanvas.scrollIntoViewIfNeeded();
    await this.page.waitForTimeout(200);

    const box = await this.signatureCanvas.boundingBox();
    if (!box) {
      throw new Error('Signature canvas bounding box not found');
    }

    const startX = box.x + box.width * 0.2;
    const startY = box.y + box.height * 0.5;
    const midX = box.x + box.width * 0.5;
    const midY = box.y + box.height * 0.3;
    const endX = box.x + box.width * 0.8;
    const endY = box.y + box.height * 0.6;

    await this.page.mouse.move(startX, startY);
    await this.page.mouse.down();
    await this.page.mouse.move(midX, midY, { steps: 5 });
    await this.page.mouse.move(endX, endY, { steps: 5 });
    await this.page.mouse.up();
  }

  async submitSignOff(): Promise<void> {
    await expect(this.submitSignOffButton).toBeVisible();
    await this.submitSignOffButton.scrollIntoViewIfNeeded();
    await this.submitSignOffButton.click({ force: true });
    await expect(this.signOffModal).not.toBeVisible({ timeout: 10000 });
  }

  async verifySignOffCard(options: { signerName: string }): Promise<void> {
    await expect(this.customerSignOffCard).toBeVisible({ timeout: 10000 });
    await expect(this.signOffSignerNameDisplay).toContainText(options.signerName);
    await expect(this.signOffSignatureImage).toBeVisible();
  }
}
