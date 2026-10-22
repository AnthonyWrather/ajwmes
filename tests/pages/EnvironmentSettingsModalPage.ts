import { Page, Locator, expect } from '@playwright/test';
import { ExportedEnvironmentData } from '../../src/lib/envStorage';

export class EnvironmentSettingsModalPage {
  readonly page: Page;
  readonly modal: Locator;
  readonly accessDeniedNotice: Locator;
  readonly closeButton: Locator;
  readonly doneButton: Locator;
  readonly versionTag: Locator;
  readonly tabOverview: Locator;
  readonly tabTestData: Locator;
  readonly tabGuide: Locator;
  readonly envActiveBadge: Locator;
  readonly storagePrefix: Locator;
  readonly firestoreScope: Locator;
  readonly envSwitchAiStudioDev: Locator;
  readonly envSwitchAiStudioPreview: Locator;
  readonly envSwitchGitHubPreview: Locator;
  readonly envSwitchGitHubDeployed: Locator;
  readonly envResetAutoButton: Locator;
  readonly seedTestDataButton: Locator;
  readonly downloadExportButton: Locator;
  readonly copyExportButton: Locator;
  readonly resetStorageCacheButton: Locator;
  readonly importTextarea: Locator;
  readonly importSubmitButton: Locator;
  readonly importStatusInvalid: Locator;
  readonly importStatusError: Locator;
  readonly importStatusSuccess: Locator;
  readonly actionSuccessNotice: Locator;
  readonly openHostingGuideButton: Locator;

  // Free Hosting Guide Modal sub-locators
  readonly freeHostingGuideModal: Locator;
  readonly closeHostingGuideButton: Locator;
  readonly hostingGuideCloseButton: Locator;
  readonly hostingTabFirebase: Locator;
  readonly hostingTabGitHub: Locator;
  readonly hostingTabCustomDomain: Locator;
  readonly hostingTabAuth: Locator;
  readonly copyCliCommandsButton: Locator;
  readonly copyGitHubStepsButton: Locator;
  readonly copyDomainStepsButton: Locator;
  readonly copyAuthStepsButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByTestId('env-settings-modal');
    this.accessDeniedNotice = page.getByTestId('env-settings-access-denied');
    this.closeButton = page.getByTestId('close-env-settings-modal');
    this.doneButton = page.getByTestId('env-modal-done-button');
    this.versionTag = page.getByTestId('modal-version-tag');
    this.tabOverview = page.getByTestId('env-tab-overview');
    this.tabTestData = page.getByTestId('env-tab-testdata');
    this.tabGuide = page.getByTestId('env-tab-guide');
    this.envActiveBadge = page.getByTestId('env-active-badge');
    this.storagePrefix = page.getByTestId('env-storage-prefix');
    this.firestoreScope = page.getByTestId('env-firestore-scope');
    this.envSwitchAiStudioDev = page.getByTestId('env-switch-aistudio-dev');
    this.envSwitchAiStudioPreview = page.getByTestId('env-switch-aistudio-preview');
    this.envSwitchGitHubPreview = page.getByTestId('env-switch-github-preview');
    this.envSwitchGitHubDeployed = page.getByTestId('env-switch-github-deployed');
    this.envResetAutoButton = page.getByTestId('env-reset-auto-button');
    this.seedTestDataButton = page.getByTestId('seed-clean-test-data-button');
    this.downloadExportButton = page.getByTestId('download-environment-data-button');
    this.copyExportButton = page.getByTestId('copy-environment-data-button');
    this.resetStorageCacheButton = page.getByTestId('reset-storage-cache-button');
    this.importTextarea = page.getByTestId('import-test-data-input');
    this.importSubmitButton = page.getByTestId('import-dataset-button');
    this.importStatusInvalid = page.getByTestId('import-status-invalid');
    this.importStatusError = page.getByTestId('import-status-error');
    this.importStatusSuccess = page.getByTestId('import-status-success');
    this.actionSuccessNotice = page.getByTestId('env-action-success-notice');
    this.openHostingGuideButton = page.getByTestId('open-hosting-guide-modal-button');

    this.freeHostingGuideModal = page.getByTestId('free-hosting-guide-modal');
    this.closeHostingGuideButton = page.getByTestId('close-hosting-guide-modal');
    this.hostingGuideCloseButton = page.getByTestId('hosting-guide-close-button');
    this.hostingTabFirebase = page.getByTestId('hosting-tab-firebase');
    this.hostingTabGitHub = page.getByTestId('hosting-tab-github');
    this.hostingTabCustomDomain = page.getByTestId('hosting-tab-custom-domain');
    this.hostingTabAuth = page.getByTestId('hosting-tab-auth');
    this.copyCliCommandsButton = page.getByTestId('copy-cli-commands-button');
    this.copyGitHubStepsButton = page.getByTestId('copy-github-steps-button');
    this.copyDomainStepsButton = page.getByTestId('copy-domain-steps-button');
    this.copyAuthStepsButton = page.getByTestId('copy-auth-steps-button');
  }

  async expectOpen(): Promise<void> {
    await expect(this.modal).toBeVisible({ timeout: 10000 });
  }

  async expectClosed(): Promise<void> {
    await expect(this.modal).not.toBeVisible({ timeout: 10000 });
  }

  async close(): Promise<void> {
    await this.closeButton.click();
    await this.expectClosed();
  }

  async clickDone(): Promise<void> {
    await this.doneButton.click();
    await this.expectClosed();
  }

  async switchTab(tab: 'overview' | 'testdata' | 'guide'): Promise<void> {
    if (tab === 'overview') {
      await this.tabOverview.click();
    } else if (tab === 'testdata') {
      await this.tabTestData.click();
    } else {
      await this.tabGuide.click();
    }
  }

  async switchEnvironment(env: 'aistudio-dev' | 'aistudio-preview' | 'github-preview' | 'github-deployed'): Promise<void> {
    await this.switchTab('overview');
    if (env === 'aistudio-dev') {
      await this.envSwitchAiStudioDev.click();
    } else if (env === 'aistudio-preview') {
      await this.envSwitchAiStudioPreview.click();
    } else if (env === 'github-preview') {
      await this.envSwitchGitHubPreview.click();
    } else if (env === 'github-deployed') {
      await this.envSwitchGitHubDeployed.click();
    }
  }

  async resetToAutoDetection(): Promise<void> {
    await this.switchTab('overview');
    if (await this.envResetAutoButton.isVisible()) {
      await this.envResetAutoButton.click();
    }
  }

  async seedCleanTestData(): Promise<void> {
    await this.switchTab('testdata');
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await this.seedTestDataButton.click();
    await expect(this.actionSuccessNotice).toBeVisible({ timeout: 5000 });
  }

  async resetStorageCache(): Promise<void> {
    await this.switchTab('testdata');
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await this.resetStorageCacheButton.click();
    await expect(this.actionSuccessNotice).toBeVisible({ timeout: 5000 });
  }

  async downloadExportJson(): Promise<ExportedEnvironmentData> {
    await this.switchTab('testdata');
    await this.downloadExportButton.scrollIntoViewIfNeeded();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.downloadExportButton.click({ force: true })
    ]);
    const stream = await download.createReadStream();
    if (!stream) {
      throw new Error('Failed to open download stream');
    }
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk));
    }
    const raw = Buffer.concat(chunks).toString('utf-8');
    return JSON.parse(raw) as ExportedEnvironmentData;
  }

  async importJsonData(data: object | string): Promise<void> {
    await this.switchTab('testdata');
    const raw = typeof data === 'string' ? data : JSON.stringify(data, null, 2);
    await this.importTextarea.fill(raw);
    await expect(this.importSubmitButton).toBeEnabled({ timeout: 5000 });
    await this.importSubmitButton.click();
  }

  async openFreeHostingGuideFromModal(): Promise<void> {
    await this.switchTab('guide');
    await expect(this.openHostingGuideButton).toBeVisible();
    await this.openHostingGuideButton.click();
    await expect(this.freeHostingGuideModal).toBeVisible({ timeout: 10000 });
  }

  async closeFreeHostingGuide(): Promise<void> {
    await this.closeHostingGuideButton.click();
    await expect(this.freeHostingGuideModal).not.toBeVisible({ timeout: 10000 });
  }
}
