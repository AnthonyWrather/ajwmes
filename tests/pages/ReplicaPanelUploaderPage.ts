import { Page, Locator, expect } from '@playwright/test';

export class ReplicaPanelUploaderPage {
  readonly page: Page;
  readonly container: Locator;
  readonly makeInput: Locator;
  readonly modelInput: Locator;
  readonly dimensionsInput: Locator;
  readonly switchCountSelect: Locator;
  readonly materialSelect: Locator;
  readonly notesInput: Locator;
  readonly submitButton: Locator;
  readonly estimateCard: Locator;
  readonly estimatedTotal: Locator;
  readonly laborCost: Locator;
  readonly materialsCost: Locator;
  readonly surchargeBadge: Locator;
  readonly turnaroundBadge: Locator;
  readonly cloudBadge: Locator;
  readonly photosGrid: Locator;
  readonly fileUploadInput: Locator;
  readonly uploadDropzone: Locator;
  readonly uploadProgress: Locator;
  readonly successCard: Locator;
  readonly viewPortalButton: Locator;
  readonly newInquiryButton: Locator;
  readonly lightboxModal: Locator;
  readonly lightboxClose: Locator;

  constructor(page: Page) {
    this.page = page;
    this.container = page.getByTestId('replica-card');
    this.makeInput = page.getByTestId('replica-make-input');
    this.modelInput = page.getByTestId('replica-model-input');
    this.dimensionsInput = page.getByTestId('replica-dimensions-input');
    this.switchCountSelect = page.getByTestId('replica-switch-count-select');
    this.materialSelect = page.getByTestId('replica-material-select');
    this.notesInput = page.getByTestId('replica-notes-input');
    this.submitButton = page.getByTestId('replica-submit-btn');
    this.estimateCard = page.getByTestId('replica-estimate-card');
    this.estimatedTotal = page.getByTestId('replica-estimated-total');
    this.laborCost = page.getByTestId('replica-labor-cost');
    this.materialsCost = page.getByTestId('replica-materials-cost');
    this.surchargeBadge = page.getByTestId('replica-surcharge-badge');
    this.turnaroundBadge = page.getByTestId('replica-turnaround-badge');
    this.cloudBadge = page.getByTestId('replica-cloud-badge');
    this.photosGrid = page.getByTestId('replica-photos-grid');
    this.fileUploadInput = page.getByTestId('replica-file-upload-input');
    this.uploadDropzone = page.getByTestId('replica-upload-dropzone');
    this.uploadProgress = page.getByTestId('replica-upload-progress');
    this.successCard = page.getByTestId('replica-success-card');
    this.viewPortalButton = page.getByTestId('replica-view-portal-btn');
    this.newInquiryButton = page.getByTestId('replica-new-inquiry-btn');
    this.lightboxModal = page.getByTestId('image-lightbox-modal');
    this.lightboxClose = page.getByTestId('image-lightbox-close');
  }

  async assertLoaded(): Promise<void> {
    await expect(this.container).toBeVisible({ timeout: 10000 });
    await expect(this.makeInput).toBeVisible({ timeout: 10000 });
    await expect(this.submitButton).toBeVisible({ timeout: 10000 });
  }

  async applyPreset(presetId: string): Promise<void> {
    const presetBtn = this.page.getByTestId(`replica-preset-${presetId}`);
    await expect(presetBtn).toBeVisible({ timeout: 5000 });
    await presetBtn.click();
  }

  async setVesselDetails(make: string, model: string, dimensions?: string): Promise<void> {
    await this.makeInput.fill(make);
    await this.modelInput.fill(model);
    if (dimensions !== undefined) {
      await this.dimensionsInput.fill(dimensions);
    }
  }

  async selectSwitchCount(count: number): Promise<void> {
    await this.switchCountSelect.selectOption(String(count));
  }

  async selectMaterial(material: string): Promise<void> {
    await this.materialSelect.selectOption(material);
  }

  async setNotes(notes: string): Promise<void> {
    await this.notesInput.fill(notes);
  }

  getPhotoCard(index: number): Locator {
    return this.page.getByTestId(`replica-photo-card-${index}`);
  }

  async inspectPhoto(index: number): Promise<void> {
    const inspectBtn = this.page.getByTestId(`replica-inspect-photo-${index}`);
    // Hover over the photo card to reveal the action overlay if necessary
    await this.getPhotoCard(index).hover();
    await inspectBtn.click({ force: true });
    await expect(this.lightboxModal).toBeVisible({ timeout: 5000 });
  }

  async closeLightbox(): Promise<void> {
    await expect(this.lightboxClose).toBeVisible({ timeout: 5000 });
    await this.lightboxClose.click({ force: true });
    await expect(this.lightboxModal).not.toBeVisible({ timeout: 5000 });
  }

  async removePhoto(index: number): Promise<void> {
    const removeBtn = this.page.getByTestId(`replica-remove-photo-${index}`);
    await this.getPhotoCard(index).hover();
    await removeBtn.click({ force: true });
  }

  async uploadPhotoFile(fileName: string, mimeType: string, content: Buffer): Promise<void> {
    await this.fileUploadInput.setInputFiles({
      name: fileName,
      mimeType,
      buffer: content
    });
  }

  async submitInquiry(): Promise<void> {
    await expect(this.submitButton).toBeEnabled({ timeout: 5000 });
    await this.submitButton.click();
  }
}
