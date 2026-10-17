import { Page, Locator, expect } from '@playwright/test';

export class VesselPortalPage {
  readonly page: Page;
  
  // Portal Header & Overview
  readonly portalContainer: Locator;
  readonly portalHeading: Locator;
  readonly portalVesselTitle: Locator;
  readonly vesselSwitcherSelect: Locator;
  readonly addBoatButton: Locator;

  // Sub-tabs
  readonly specsSubTab: Locator;
  readonly jobsSubTab: Locator;
  readonly ordersSubTab: Locator;

  // Print Station triggers
  readonly openPdfStationButton: Locator;
  readonly calloutPdfButton: Locator;
  readonly directPdfButton: Locator;

  // Unregistered state
  readonly noVesselCard: Locator;
  readonly noVesselHeading: Locator;
  readonly registerFirstBoatButton: Locator;
  readonly orderPartsButton: Locator;

  // Add Boat Modal
  readonly addBoatModal: Locator;
  readonly boatNameInput: Locator;
  readonly boatMakeModelInput: Locator;
  readonly boatYearInput: Locator;
  readonly boatHullTypeSelect: Locator;
  readonly boatLoaInput: Locator;
  readonly boatLwlInput: Locator;
  readonly boatBeamInput: Locator;
  readonly boatDraftInput: Locator;
  readonly boatVoltageSelect: Locator;
  readonly boatBatteryTypeSelect: Locator;
  readonly boatMarinaInput: Locator;
  readonly boatBerthInput: Locator;
  readonly boatSubmitButton: Locator;
  readonly boatCancelButton: Locator;

  // Vessel Spec Manager
  readonly specManager: Locator;
  readonly editSpecsButton: Locator;
  readonly saveSpecsButton: Locator;
  readonly saveSuccessBanner: Locator;

  // Category Pills
  readonly tabOverview: Locator;
  readonly tabDc: Locator;
  readonly tabAc: Locator;
  readonly tabNav: Locator;
  readonly tabHistory: Locator;

  // Edit fields (Overview)
  readonly editHullType: Locator;
  readonly editLoa: Locator;
  readonly editLwl: Locator;
  readonly editBeam: Locator;
  readonly editDraft: Locator;
  readonly editDisplacement: Locator;

  // Edit fields (DC Power)
  readonly editBatteryType: Locator;
  readonly editBatteryCapacity: Locator;
  readonly editSolarWatts: Locator;

  // History Log
  readonly addLogEntryButton: Locator;
  readonly addLogModal: Locator;
  readonly logDateInput: Locator;
  readonly logCategorySelect: Locator;
  readonly logTitleInput: Locator;
  readonly logContractorInput: Locator;
  readonly logDescInput: Locator;
  readonly logPartsInput: Locator;
  readonly logSubmitButton: Locator;
  readonly logCancelButton: Locator;

  // Vessel PDF Summary Modal
  readonly pdfModal: Locator;
  readonly pdfCloseButton: Locator;
  readonly pdfTabOptions: Locator;
  readonly pdfTabPreview: Locator;
  readonly pdfModeSinglePage: Locator;
  readonly pdfModeComprehensive: Locator;
  readonly pdfThemeNavy: Locator;
  readonly pdfThemeMono: Locator;
  readonly pdfToggleEmergency: Locator;
  readonly pdfToggleFuses: Locator;
  readonly pdfToggleHistory: Locator;
  readonly pdfCustomNotesInput: Locator;
  readonly pdfPreviewCanvas: Locator;
  readonly pdfDownloadSuccess: Locator;
  readonly pdfPrintButton: Locator;
  readonly pdfDownloadButton: Locator;

  constructor(page: Page) {
    this.page = page;

    // Portal Header & Overview
    this.portalContainer = page.getByTestId('client-vessel-portal');
    this.portalHeading = page.getByText('Boat Owner Vessel Portal');
    this.portalVesselTitle = page.getByTestId('portal-vessel-title');
    this.vesselSwitcherSelect = page.getByTestId('vessel-switcher-select');
    this.addBoatButton = page.getByTestId('portal-add-boat-button').first();

    // Sub-tabs
    this.specsSubTab = page.getByTestId('portal-subtab-specs');
    this.jobsSubTab = page.getByTestId('portal-subtab-jobs');
    this.ordersSubTab = page.getByTestId('portal-subtab-orders');

    // Print Station triggers
    this.openPdfStationButton = page.getByTestId('portal-open-pdf-station-button');
    this.calloutPdfButton = page.getByTestId('portal-callout-pdf-button');
    this.directPdfButton = page.getByTestId('vessel-direct-pdf-button');

    // Unregistered state
    this.noVesselCard = page.getByTestId('no-vessel-registered-card');
    this.noVesselHeading = page.getByTestId('no-vessel-registered-heading');
    this.registerFirstBoatButton = page.getByTestId('portal-register-boat-button');
    this.orderPartsButton = page.getByTestId('portal-order-parts-button');

    // Add Boat Modal
    this.addBoatModal = page.getByTestId('add-boat-modal');
    this.boatNameInput = page.getByTestId('boat-name-input');
    this.boatMakeModelInput = page.getByTestId('boat-make-model-input');
    this.boatYearInput = page.getByTestId('boat-year-input');
    this.boatHullTypeSelect = page.getByTestId('vessel-hull-type-select');
    this.boatLoaInput = page.getByTestId('vessel-loa-input');
    this.boatLwlInput = page.getByTestId('vessel-lwl-input');
    this.boatBeamInput = page.getByTestId('vessel-beam-input');
    this.boatDraftInput = page.getByTestId('vessel-draft-input');
    this.boatVoltageSelect = page.getByTestId('boat-voltage-select');
    this.boatBatteryTypeSelect = page.getByTestId('boat-battery-type-select');
    this.boatMarinaInput = page.getByTestId('boat-marina-input');
    this.boatBerthInput = page.getByTestId('boat-berth-input');
    this.boatSubmitButton = page.getByTestId('boat-submit-button');
    this.boatCancelButton = page.getByTestId('boat-cancel-button');

    // Vessel Spec Manager
    this.specManager = page.getByTestId('vessel-spec-manager');
    this.editSpecsButton = page.getByTestId('edit-vessel-specs-button');
    this.saveSpecsButton = page.getByTestId('save-vessel-specs-button');
    this.saveSuccessBanner = page.getByTestId('vessel-save-success');

    // Category Pills
    this.tabOverview = page.getByTestId('vessel-tab-overview');
    this.tabDc = page.getByTestId('vessel-tab-dc');
    this.tabAc = page.getByTestId('vessel-tab-ac');
    this.tabNav = page.getByTestId('vessel-tab-nav');
    this.tabHistory = page.getByTestId('vessel-tab-history');

    // Edit fields (Overview)
    this.editHullType = page.getByTestId('vessel-edit-hull-type');
    this.editLoa = page.getByTestId('vessel-edit-loa');
    this.editLwl = page.getByTestId('vessel-edit-lwl');
    this.editBeam = page.getByTestId('vessel-edit-beam');
    this.editDraft = page.getByTestId('vessel-edit-draft');
    this.editDisplacement = page.getByTestId('vessel-edit-displacement');

    // Edit fields (DC Power)
    this.editBatteryType = page.getByTestId('vessel-edit-battery-type');
    this.editBatteryCapacity = page.getByTestId('vessel-edit-battery-capacity');
    this.editSolarWatts = page.getByTestId('vessel-edit-solar-watts');

    // History Log
    this.addLogEntryButton = page.getByTestId('add-log-entry-button');
    this.addLogModal = page.getByTestId('add-log-modal');
    this.logDateInput = page.getByTestId('log-date-input');
    this.logCategorySelect = page.getByTestId('log-category-select');
    this.logTitleInput = page.getByTestId('log-title-input');
    this.logContractorInput = page.getByTestId('log-contractor-input');
    this.logDescInput = page.getByTestId('log-desc-input');
    this.logPartsInput = page.getByTestId('log-parts-input');
    this.logSubmitButton = page.getByTestId('log-submit-button');
    this.logCancelButton = page.getByTestId('log-cancel-button');

    // Vessel PDF Summary Modal
    this.pdfModal = page.getByTestId('vessel-pdf-modal');
    this.pdfCloseButton = page.getByTestId('vessel-pdf-close-button');
    this.pdfTabOptions = page.getByTestId('pdf-tab-options');
    this.pdfTabPreview = page.getByTestId('pdf-tab-preview');
    this.pdfModeSinglePage = page.getByTestId('pdf-mode-single-page');
    this.pdfModeComprehensive = page.getByTestId('pdf-mode-comprehensive');
    this.pdfThemeNavy = page.getByTestId('pdf-theme-navy');
    this.pdfThemeMono = page.getByTestId('pdf-theme-mono');
    this.pdfToggleEmergency = page.getByTestId('pdf-toggle-emergency');
    this.pdfToggleFuses = page.getByTestId('pdf-toggle-fuses');
    this.pdfToggleHistory = page.getByTestId('pdf-toggle-history');
    this.pdfCustomNotesInput = page.getByTestId('pdf-custom-notes-input');
    this.pdfPreviewCanvas = page.getByTestId('pdf-preview-canvas');
    this.pdfDownloadSuccess = page.getByTestId('pdf-download-success');
    this.pdfPrintButton = page.getByTestId('pdf-print-button');
    this.pdfDownloadButton = page.getByTestId('pdf-download-button');
  }

  // --- Portal & Navigation Verification ---
  async verifyPortalVisible(): Promise<void> {
    await expect(this.portalHeading).toBeVisible({ timeout: 10000 });
  }

  async verifyActiveVessel(expectedName: string): Promise<void> {
    await this.verifyPortalVisible();
    await expect(this.portalVesselTitle).toContainText(expectedName, { timeout: 10000 });
  }

  async verifyNoVesselRegisteredBanner(): Promise<void> {
    await this.verifyPortalVisible();
    await expect(this.noVesselCard).toBeVisible({ timeout: 10000 });
    await expect(this.noVesselHeading).toHaveText('No Vessel Registered Yet');
  }

  async clickOrderPartsFromWorkshop(): Promise<void> {
    await expect(this.orderPartsButton).toBeVisible();
    await this.orderPartsButton.scrollIntoViewIfNeeded();
    await this.orderPartsButton.click({ force: true });
  }

  // --- Multi-Vessel Switching ---
  async switchVessel(vesselId: string): Promise<void> {
    await expect(this.vesselSwitcherSelect).toBeVisible({ timeout: 10000 });
    await this.vesselSwitcherSelect.selectOption(vesselId);
  }

  // --- Sub-Tab Switching ---
  async selectSubTab(tab: 'specs' | 'jobs' | 'orders'): Promise<void> {
    if (tab === 'specs') {
      await this.specsSubTab.click({ force: true });
    } else if (tab === 'jobs') {
      await this.jobsSubTab.click({ force: true });
    } else if (tab === 'orders') {
      await this.ordersSubTab.click({ force: true });
    }
  }

  // --- Register a New Vessel ---
  async registerNewVessel(details: {
    name: string;
    makeModel?: string;
    year?: number;
    voltage?: '12V' | '24V';
    batteryType?: string;
    marina?: string;
    berth?: string;
  }): Promise<void> {
    if (await this.registerFirstBoatButton.isVisible().catch(() => false)) {
      await this.registerFirstBoatButton.scrollIntoViewIfNeeded();
      await this.registerFirstBoatButton.click();
    } else {
      await this.addBoatButton.scrollIntoViewIfNeeded();
      await this.addBoatButton.click();
    }

    await expect(this.addBoatModal).toBeVisible({ timeout: 10000 });

    await this.boatNameInput.fill(details.name);
    if (details.makeModel) await this.boatMakeModelInput.fill(details.makeModel);
    if (details.year) await this.boatYearInput.fill(String(details.year));
    if (details.voltage) await this.boatVoltageSelect.selectOption(details.voltage);
    if (details.batteryType) await this.boatBatteryTypeSelect.selectOption(details.batteryType);
    if (details.marina) await this.boatMarinaInput.fill(details.marina);
    if (details.berth) await this.boatBerthInput.fill(details.berth);

    await this.boatSubmitButton.scrollIntoViewIfNeeded();
    await this.boatSubmitButton.click({ force: true });
    await expect(this.addBoatModal).not.toBeVisible({ timeout: 5000 });
  }

  // --- Spec Editing & Category Management ---
  async selectCategory(category: 'overview' | 'dc' | 'ac' | 'nav' | 'history'): Promise<void> {
    const tabMap = {
      overview: this.tabOverview,
      dc: this.tabDc,
      ac: this.tabAc,
      nav: this.tabNav,
      history: this.tabHistory
    };
    const tab = tabMap[category];
    await expect(tab).toBeVisible({ timeout: 10000 });
    await tab.scrollIntoViewIfNeeded();
    await tab.click();
  }

  async enterEditMode(): Promise<void> {
    await expect(this.editSpecsButton).toBeVisible({ timeout: 10000 });
    await this.editSpecsButton.scrollIntoViewIfNeeded();
    await this.editSpecsButton.click();
    await expect(this.saveSpecsButton).toBeVisible({ timeout: 10000 });
  }

  async saveSpecs(): Promise<void> {
    await expect(this.saveSpecsButton).toBeVisible({ timeout: 10000 });
    await this.saveSpecsButton.scrollIntoViewIfNeeded();
    await this.saveSpecsButton.click();
    await expect(this.saveSuccessBanner).toBeVisible({ timeout: 10000 });
  }

  // --- Electrical History Logging ---
  async addHistoryLog(entry: {
    title: string;
    category?: string;
    contractor?: string;
    description: string;
    parts?: string;
  }): Promise<void> {
    await this.selectCategory('history');
    await expect(this.addLogEntryButton).toBeVisible({ timeout: 10000 });
    await this.addLogEntryButton.scrollIntoViewIfNeeded();
    await this.addLogEntryButton.click();

    await expect(this.addLogModal).toBeVisible({ timeout: 10000 });
    if (entry.category) await this.logCategorySelect.selectOption(entry.category);
    await this.logTitleInput.fill(entry.title);
    if (entry.contractor) await this.logContractorInput.fill(entry.contractor);
    await this.logDescInput.fill(entry.description);
    if (entry.parts) await this.logPartsInput.fill(entry.parts);

    await this.logSubmitButton.scrollIntoViewIfNeeded();
    await this.logSubmitButton.click({ force: true });
    await expect(this.addLogModal).not.toBeVisible({ timeout: 10000 });
    await expect(this.saveSuccessBanner).toBeVisible({ timeout: 10000 });
  }

  // --- PDF Print Station & Modal Operations ---
  async openPrintStation(): Promise<void> {
    if (await this.openPdfStationButton.isVisible().catch(() => false)) {
      await this.openPdfStationButton.scrollIntoViewIfNeeded();
      await this.openPdfStationButton.click();
    } else {
      await this.calloutPdfButton.scrollIntoViewIfNeeded();
      await this.calloutPdfButton.click();
    }
    await expect(this.pdfModal).toBeVisible({ timeout: 10000 });
  }

  async closePdfStation(): Promise<void> {
    await expect(this.pdfCloseButton).toBeVisible({ timeout: 5000 });
    await this.pdfCloseButton.click({ force: true });
    await expect(this.pdfModal).not.toBeVisible({ timeout: 5000 });
  }

  async selectPdfLayoutMode(mode: 'single_page' | 'comprehensive'): Promise<void> {
    if (mode === 'single_page') {
      await this.pdfModeSinglePage.click({ force: true });
    } else {
      await this.pdfModeComprehensive.click({ force: true });
    }
  }

  async selectPdfTheme(theme: 'navy' | 'mono'): Promise<void> {
    if (theme === 'navy') {
      await this.pdfThemeNavy.click({ force: true });
    } else {
      await this.pdfThemeMono.click({ force: true });
    }
  }

  async setPdfCustomNote(note: string): Promise<void> {
    await expect(this.pdfCustomNotesInput).toBeVisible({ timeout: 5000 });
    await this.pdfCustomNotesInput.fill(note);
  }

  async switchToPreviewTab(): Promise<void> {
    await expect(this.pdfTabPreview).toBeVisible({ timeout: 5000 });
    await this.pdfTabPreview.click({ force: true });
    await expect(this.pdfPreviewCanvas).toBeVisible({ timeout: 5000 });
  }

  async switchToOptionsTab(): Promise<void> {
    await expect(this.pdfTabOptions).toBeVisible({ timeout: 5000 });
    await this.pdfTabOptions.click({ force: true });
  }

  async downloadPdfSpec(): Promise<void> {
    await expect(this.pdfDownloadButton).toBeVisible({ timeout: 5000 });
    await this.pdfDownloadButton.click({ force: true });
    await expect(this.pdfDownloadSuccess).toBeVisible({ timeout: 10000 });
  }

  async triggerDirectPrint(): Promise<void> {
    await expect(this.pdfPrintButton).toBeVisible({ timeout: 5000 });
    await this.pdfPrintButton.click({ force: true });
  }
}
