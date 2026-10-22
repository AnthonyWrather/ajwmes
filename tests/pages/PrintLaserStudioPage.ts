import { Page, Locator, expect } from '@playwright/test';

export class PrintLaserStudioPage {
  readonly page: Page;

  // Studio Elements
  readonly studioContainer: Locator;
  readonly assetSelectorCard: Locator;
  readonly assetSelectorFlyer: Locator;
  readonly renderModePaper: Locator;
  readonly renderModeAcrylic: Locator;
  readonly renderModeWood: Locator;
  readonly downloadPrintPdfBtn: Locator;
  readonly downloadLaserSvgBtn: Locator;
  readonly cardSideFrontBtn: Locator;
  readonly cardSideBackBtn: Locator;
  readonly businessCardPreview: Locator;
  readonly a5FlyerPreview: Locator;

  // Panel Cloud Images Archive Elements
  readonly panelCloudArchive: Locator;
  readonly panelAssetCards: Locator;
  readonly panelAssetImageTriggers: Locator;
  readonly panelAssetOpenJobBtns: Locator;
  readonly panelAssetCadLinks: Locator;

  // Lightbox Modal
  readonly lightboxModal: Locator;
  readonly lightboxCloseBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // Studio Locators
    this.studioContainer = page.getByTestId('print-laser-asset-studio');
    this.assetSelectorCard = page.getByTestId('asset-selector-card');
    this.assetSelectorFlyer = page.getByTestId('asset-selector-flyer');
    this.renderModePaper = page.getByTestId('render-mode-paper');
    this.renderModeAcrylic = page.getByTestId('render-mode-acrylic');
    this.renderModeWood = page.getByTestId('render-mode-wood');
    this.downloadPrintPdfBtn = page.getByTestId('download-print-pdf-btn');
    this.downloadLaserSvgBtn = page.getByTestId('download-laser-svg-btn');
    this.cardSideFrontBtn = page.getByTestId('card-side-front-btn');
    this.cardSideBackBtn = page.getByTestId('card-side-back-btn');
    this.businessCardPreview = page.getByTestId('business-card-preview');
    this.a5FlyerPreview = page.getByTestId('a5-flyer-preview');

    // Panel Cloud Images Archive Locators
    this.panelCloudArchive = page.getByTestId('panel-cloud-archive');
    this.panelAssetCards = page.getByTestId('panel-asset-card');
    this.panelAssetImageTriggers = page.getByTestId('panel-asset-image-trigger');
    this.panelAssetOpenJobBtns = page.getByTestId('panel-asset-open-job-btn');
    this.panelAssetCadLinks = page.getByTestId('panel-asset-cad-link');

    // Lightbox Modal Locators
    this.lightboxModal = page.getByTestId('image-lightbox-modal');
    this.lightboxCloseBtn = page.getByTestId('image-lightbox-close');
  }

  async verifyStudioVisible(): Promise<void> {
    await expect(this.studioContainer).toBeVisible({ timeout: 15000 });
    await expect(this.assetSelectorCard).toBeVisible({ timeout: 5000 });
    await expect(this.assetSelectorFlyer).toBeVisible({ timeout: 5000 });
  }

  async selectAsset(type: 'card' | 'flyer'): Promise<void> {
    if (type === 'card') {
      await this.assetSelectorCard.click({ force: true });
      await expect(this.businessCardPreview).toBeVisible({ timeout: 5000 });
    } else {
      await this.assetSelectorFlyer.click({ force: true });
      await expect(this.a5FlyerPreview).toBeVisible({ timeout: 5000 });
    }
  }

  async selectRenderMode(mode: 'paper' | 'acrylic' | 'wood'): Promise<void> {
    switch (mode) {
      case 'paper':
        await this.renderModePaper.click({ force: true });
        break;
      case 'acrylic':
        await this.renderModeAcrylic.click({ force: true });
        break;
      case 'wood':
        await this.renderModeWood.click({ force: true });
        break;
    }
  }

  async flipCardSide(side: 'front' | 'back'): Promise<void> {
    if (side === 'front') {
      await this.cardSideFrontBtn.click({ force: true });
    } else {
      await this.cardSideBackBtn.click({ force: true });
    }
  }

  async downloadLaserSvg(expectedFilename?: string): Promise<{ filename: string; content: string }> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadLaserSvgBtn.click({ force: true })
    ]);

    const filename = download.suggestedFilename();
    if (expectedFilename) {
      expect(filename).toBe(expectedFilename);
    }

    const stream = await download.createReadStream();
    let content = '';
    if (stream) {
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.from(chunk));
      }
      content = Buffer.concat(chunks).toString('utf-8');
    }

    return { filename, content };
  }

  async verifyPanelArchiveVisible(): Promise<void> {
    await expect(this.panelCloudArchive).toBeVisible({ timeout: 15000 });
    await expect(this.panelAssetCards.first()).toBeVisible({ timeout: 10000 });
  }

  async openPanelPhotoInLightbox(index: number = 0): Promise<void> {
    const trigger = this.panelAssetImageTriggers.nth(index);
    await trigger.scrollIntoViewIfNeeded();
    await trigger.click();
    await expect(this.lightboxModal).toBeVisible({ timeout: 10000 });
  }

  async closeLightbox(): Promise<void> {
    await this.lightboxCloseBtn.click({ force: true });
    await expect(this.lightboxModal).toBeHidden({ timeout: 5000 });
  }

  async jumpToJobFromPanel(index: number = 0): Promise<void> {
    await this.panelAssetOpenJobBtns.nth(index).click({ force: true });
  }
}
