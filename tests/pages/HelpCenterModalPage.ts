import { Page, Locator, expect } from '@playwright/test';
import { UserRole } from '../../src/types';

export class HelpCenterModalPage {
  readonly page: Page;
  readonly modal: Locator;
  readonly closeButton: Locator;
  readonly roleTabsContainer: Locator;
  readonly searchInput: Locator;
  readonly chapterList: Locator;
  readonly stepChecklist: Locator;
  readonly videoContainer: Locator;
  readonly jumpToFeatureButton: Locator;
  readonly downloadQuickRefButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.getByTestId('help-center-modal');
    this.closeButton = page.getByTestId('close-help-modal-button');
    this.roleTabsContainer = page.getByTestId('manual-role-tabs');
    this.searchInput = page.getByTestId('manual-search-input');
    this.chapterList = page.getByTestId('manual-chapter-list');
    this.stepChecklist = page.getByTestId('step-checklist');
    this.videoContainer = page.getByTestId('video-player-container');
    this.jumpToFeatureButton = page.getByTestId('jump-to-feature-btn');
    this.downloadQuickRefButton = page.getByTestId('download-quickref-btn');
  }

  getRoleTab(role: UserRole): Locator {
    return this.page.getByTestId(`role-tab-${role}`);
  }

  getChapterItem(chapterId: string): Locator {
    return this.page.getByTestId(`chapter-item-${chapterId}`);
  }

  getStepRow(stepId: string): Locator {
    return this.page.getByTestId(`step-row-${stepId}`);
  }

  async selectRole(role: UserRole) {
    const tab = this.getRoleTab(role);
    await tab.click();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async clearSearch() {
    await this.searchInput.fill('');
  }

  async selectChapter(chapterId: string) {
    const item = this.getChapterItem(chapterId);
    await item.click();
  }

  async clickStep(stepId: string) {
    const row = this.getStepRow(stepId);
    await row.click();
  }

  async jumpToFeature() {
    await this.jumpToFeatureButton.click();
  }

  async close() {
    await this.closeButton.click();
  }

  async expectOpen() {
    await expect(this.modal).toBeVisible();
  }

  async expectClosed() {
    await expect(this.modal).not.toBeVisible();
  }
}
