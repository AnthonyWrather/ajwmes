import { Page, Locator, expect } from '@playwright/test';

export class SwitchPanelCADPage {
  readonly page: Page;

  // Root & Header
  readonly designerContainer: Locator;
  readonly calculatedPrice: Locator;
  readonly packageBadge: Locator;
  readonly dimensionPreview: Locator;
  readonly circuitCountBadge: Locator;
  readonly designerNotice: Locator;

  // CAD Visual Render
  readonly cadSvg: Locator;
  readonly voltmeterCutout: Locator;
  readonly usbCutout: Locator;
  readonly socket12vCutout: Locator;

  // Sub Navigation Tabs
  readonly tabLayout: Locator;
  readonly tabSwitches: Locator;
  readonly tabOptions: Locator;
  readonly tabCloudAssets: Locator;

  // Layout Controls
  readonly inputWidth: Locator;
  readonly inputHeight: Locator;

  // Kit & Accessories Controls
  readonly toggleVoltmeter: Locator;
  readonly toggleUsbCharger: Locator;
  readonly toggle12vSocket: Locator;

  // Action Buttons
  readonly saveCadBtn: Locator;
  readonly savedCadLink: Locator;
  readonly downloadSvgBtn: Locator;
  readonly addToCartBtn: Locator;
  readonly orderQuoteBtn: Locator;

  // Specification Review Modal
  readonly specModal: Locator;
  readonly specSummary: Locator;
  readonly specCircuits: Locator;
  readonly continueToQuoteBtn: Locator;
  readonly closeSpecModalBtn: Locator;

  // Cloud Reference Photos
  readonly uploadPhotoLabel: Locator;
  readonly photoInput: Locator;
  readonly photoCards: Locator;

  // Booking / Quote Modal Integration
  readonly bookingModal: Locator;
  readonly bookingPanelBanner: Locator;
  readonly bookingServiceSelect: Locator;
  readonly bookingVesselName: Locator;
  readonly bookingBerthLocation: Locator;
  readonly bookingClientName: Locator;
  readonly bookingClientEmail: Locator;
  readonly bookingClientPhone: Locator;
  readonly bookingNotes: Locator;
  readonly bookingSubmitBtn: Locator;
  readonly bookingCloseBtn: Locator;
  readonly bookingReferencePill: Locator;
  readonly bookingDismissBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // Root & Header
    this.designerContainer = page.getByTestId('switch-panel-designer');
    this.calculatedPrice = page.getByTestId('panel-calculated-price');
    this.packageBadge = page.getByTestId('panel-package-badge');
    this.dimensionPreview = page.getByTestId('panel-dimension-preview');
    this.circuitCountBadge = page.getByTestId('panel-circuit-count-badge');
    this.designerNotice = page.getByTestId('designer-notice-alert');

    // CAD SVG
    this.cadSvg = page.getByTestId('panel-cad-svg');
    this.voltmeterCutout = page.getByTestId('cutout-voltmeter');
    this.usbCutout = page.getByTestId('cutout-usb');
    this.socket12vCutout = page.getByTestId('cutout-12v-socket');

    // Tabs
    this.tabLayout = page.getByTestId('tab-layout');
    this.tabSwitches = page.getByTestId('tab-switches');
    this.tabOptions = page.getByTestId('tab-options');
    this.tabCloudAssets = page.getByTestId('tab-cloud-assets');

    // Layout
    this.inputWidth = page.getByTestId('input-width-mm');
    this.inputHeight = page.getByTestId('input-height-mm');

    // Kit
    this.toggleVoltmeter = page.getByTestId('toggle-voltmeter');
    this.toggleUsbCharger = page.getByTestId('toggle-usb-charger');
    this.toggle12vSocket = page.getByTestId('toggle-12v-socket');

    // Actions
    this.saveCadBtn = page.getByTestId('save-cad-cloud-btn');
    this.savedCadLink = page.getByTestId('saved-cad-link');
    this.downloadSvgBtn = page.getByTestId('download-cad-svg-btn');
    this.addToCartBtn = page.getByTestId('add-panel-to-cart-btn');
    this.orderQuoteBtn = page.getByTestId('order-panel-quote-btn');

    // Spec Modal
    this.specModal = page.getByTestId('panel-spec-modal');
    this.specSummary = page.getByTestId('panel-spec-summary');
    this.specCircuits = page.getByTestId('panel-spec-circuits');
    this.continueToQuoteBtn = page.getByTestId('continue-to-quote-btn');
    this.closeSpecModalBtn = page.getByTestId('close-spec-modal-btn');

    // Photos
    this.uploadPhotoLabel = page.getByTestId('upload-photo-label');
    this.photoInput = page.getByTestId('reference-photo-input');
    this.photoCards = page.getByTestId('reference-photo-card');

    // Booking Modal
    this.bookingModal = page.getByTestId('booking-quote-modal');
    this.bookingPanelBanner = page.getByTestId('booking-panel-config-banner');
    this.bookingServiceSelect = page.getByTestId('booking-service-select');
    this.bookingVesselName = page.getByTestId('booking-vessel-name');
    this.bookingBerthLocation = page.getByTestId('booking-berth-location');
    this.bookingClientName = page.getByTestId('booking-client-name');
    this.bookingClientEmail = page.getByTestId('booking-client-email');
    this.bookingClientPhone = page.getByTestId('booking-client-phone');
    this.bookingNotes = page.getByTestId('booking-notes');
    this.bookingSubmitBtn = page.getByTestId('booking-submit-btn');
    this.bookingCloseBtn = page.getByTestId('booking-close-btn');
    this.bookingReferencePill = page.getByTestId('booking-reference-pill');
    this.bookingDismissBtn = page.getByTestId('booking-dismiss-btn');
  }

  // Locators with parameters
  getMaterialBtn(material: string): Locator {
    return this.page.getByTestId(`material-btn-${material}`);
  }

  getGangBtn(count: number): Locator {
    return this.page.getByTestId(`gang-btn-${count}`);
  }

  getSwitchRow(index: number): Locator {
    return this.page.getByTestId(`switch-row-${index}`);
  }

  getSwitchLabelInput(index: number): Locator {
    return this.page.getByTestId(`switch-label-input-${index}`);
  }

  getSwitchAmpsSelect(index: number): Locator {
    return this.page.getByTestId(`switch-amps-select-${index}`);
  }

  getSvgSwitch(index: number): Locator {
    return this.page.getByTestId(`svg-switch-${index}`);
  }

  getSvgSwitchLabel(index: number): Locator {
    return this.page.getByTestId(`svg-switch-label-${index}`);
  }

  getSvgSwitchAmps(index: number): Locator {
    return this.page.getByTestId(`svg-switch-amps-${index}`);
  }

  getPackageOption(packageId: string): Locator {
    return this.page.getByTestId(`package-option-${packageId}`);
  }

  // Actions
  async assertLoaded(): Promise<void> {
    await expect(this.designerContainer).toBeVisible({ timeout: 10000 });
    await expect(this.cadSvg).toBeVisible({ timeout: 10000 });
    await expect(this.calculatedPrice).toBeVisible();
  }

  async selectMaterial(material: string): Promise<void> {
    await this.tabLayout.click();
    const btn = this.getMaterialBtn(material);
    await expect(btn).toBeVisible();
    await btn.click();
  }

  async selectGangCount(count: number): Promise<void> {
    await this.tabLayout.click();
    const btn = this.getGangBtn(count);
    await expect(btn).toBeVisible();
    await btn.click();
  }

  async setDimensions(widthMm: number, heightMm: number): Promise<void> {
    await this.tabLayout.click();
    await this.inputWidth.fill(String(widthMm));
    await this.inputHeight.fill(String(heightMm));
  }

  async customizeSwitchCircuit(index: number, label: string, amps: number): Promise<void> {
    await this.tabSwitches.click();
    const labelInput = this.getSwitchLabelInput(index);
    await expect(labelInput).toBeVisible();
    await labelInput.fill(label);

    const ampsSelect = this.getSwitchAmpsSelect(index);
    await expect(ampsSelect).toBeVisible();
    await ampsSelect.selectOption(String(amps));
  }

  async selectPackage(packageId: string): Promise<void> {
    await this.tabOptions.click();
    const option = this.getPackageOption(packageId);
    await expect(option).toBeVisible();
    await option.click();
  }

  async toggleVoltmeterCutout(): Promise<void> {
    await this.tabOptions.click();
    await this.toggleVoltmeter.click();
  }

  async toggleUsbChargerCutout(): Promise<void> {
    await this.tabOptions.click();
    await this.toggleUsbCharger.click();
  }

  async toggle12vSocketCutout(): Promise<void> {
    await this.tabOptions.click();
    await this.toggle12vSocket.click();
  }

  async saveCadToCloud(): Promise<void> {
    await expect(this.saveCadBtn).toBeVisible();
    await this.saveCadBtn.click();
    await expect(this.designerNotice).toBeVisible({ timeout: 10000 });
  }

  async downloadCadSvg(): Promise<string | null> {
    const downloadPromise = this.page.waitForEvent('download');
    await this.downloadSvgBtn.click();
    const download = await downloadPromise;
    return download.suggestedFilename();
  }

  async addPanelToCart(): Promise<void> {
    await expect(this.addToCartBtn).toBeVisible();
    await this.addToCartBtn.scrollIntoViewIfNeeded();
    await this.addToCartBtn.click({ force: true });
  }

  async openOrderQuoteModal(): Promise<void> {
    await expect(this.orderQuoteBtn).toBeVisible();
    await this.orderQuoteBtn.scrollIntoViewIfNeeded();
    await this.orderQuoteBtn.click({ force: true });
    await expect(this.specModal).toBeVisible({ timeout: 10000 });
  }

  async continueToQuoteAndBooking(): Promise<void> {
    await expect(this.continueToQuoteBtn).toBeVisible();
    await this.continueToQuoteBtn.scrollIntoViewIfNeeded();
    await this.continueToQuoteBtn.click({ force: true });
    await expect(this.bookingModal).toBeVisible({ timeout: 10000 });
  }

  async submitBookingQuote(details: {
    vesselName: string;
    berthLocation: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    notes?: string;
  }): Promise<void> {
    await this.bookingVesselName.fill(details.vesselName);
    await this.bookingBerthLocation.fill(details.berthLocation);
    await this.bookingClientName.fill(details.clientName);
    await this.bookingClientEmail.fill(details.clientEmail);
    await this.bookingClientPhone.fill(details.clientPhone);
    if (details.notes) {
      await this.bookingNotes.fill(details.notes);
    }
    await this.bookingSubmitBtn.scrollIntoViewIfNeeded();
    await this.bookingSubmitBtn.click({ force: true });
    await expect(this.bookingReferencePill).toBeVisible({ timeout: 10000 });
  }
}
