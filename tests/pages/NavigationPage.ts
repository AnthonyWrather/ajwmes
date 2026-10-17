import { Page, Locator, expect } from '@playwright/test';

export class NavigationPage {
  readonly page: Page;
  readonly desktopStoreTab: Locator;
  readonly desktopTrackerTab: Locator;
  readonly desktopDesignerTab: Locator;
  readonly desktopReplicaTab: Locator;
  readonly mobileMenuToggle: Locator;
  readonly mobileStoreTab: Locator;
  readonly mobileTrackerTab: Locator;
  readonly mobileDesignerTab: Locator;
  readonly mobileReplicaTab: Locator;
  readonly desktopAdminTab: Locator;
  readonly mobileAdminTab: Locator;
  readonly desktopPortalTab: Locator;
  readonly mobilePortalTab: Locator;
  readonly cartButton: Locator;
  readonly signInNavButton: Locator;
  readonly userAccountButton: Locator;
  readonly userProfileName: Locator;
  readonly headerVersionBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.desktopStoreTab = page.getByTestId('nav-tab-store');
    this.desktopTrackerTab = page.getByTestId('nav-tab-tracker');
    this.desktopDesignerTab = page.getByTestId('nav-tab-designer');
    this.desktopReplicaTab = page.getByTestId('nav-tab-replica');
    this.desktopAdminTab = page.getByTestId('nav-tab-admin');
    this.desktopPortalTab = page.getByTestId('nav-tab-portal');
    this.mobileMenuToggle = page.getByTestId('mobile-menu-toggle');
    this.mobileStoreTab = page.getByTestId('mobile-nav-tab-store');
    this.mobileTrackerTab = page.getByTestId('mobile-nav-tab-tracker');
    this.mobileDesignerTab = page.getByTestId('mobile-nav-tab-designer');
    this.mobileReplicaTab = page.getByTestId('mobile-nav-tab-replica');
    this.mobileAdminTab = page.getByTestId('mobile-nav-tab-admin');
    this.mobilePortalTab = page.getByTestId('mobile-nav-tab-portal');
    this.cartButton = page.getByTestId('nav-cart-button');
    this.signInNavButton = page.getByTestId('nav-signin-button');
    this.userAccountButton = page.getByTestId('user-account-button');
    this.userProfileName = page.getByTestId('user-profile-name');
    this.headerVersionBadge = page.getByTestId('header-version-badge');
  }

  async navigateToLanding(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page).toHaveTitle(/AJW Marine Electrical Services/i);
  }

  async ensureMobileMenuOpen(): Promise<void> {
    await expect(this.mobileMenuToggle).toBeVisible({ timeout: 10000 });
    const storeTab = this.page.getByTestId('mobile-nav-tab-store');
    const isOpen = await storeTab.isVisible().catch(() => false);
    if (!isOpen) {
      await this.mobileMenuToggle.click({ force: true });
      await expect(storeTab).toBeVisible({ timeout: 5000 });
    }
  }

  async navigateToStore(): Promise<void> {
    const isMobile = (this.page.viewportSize()?.width ?? 1280) < 1280;

    if (isMobile) {
      await this.ensureMobileMenuOpen();
      await expect(this.mobileStoreTab).toBeVisible({ timeout: 10000 });
      await this.mobileStoreTab.click({ force: true });
    } else {
      await expect(this.desktopStoreTab).toBeVisible({ timeout: 10000 });
      await this.desktopStoreTab.click({ force: true });
    }
  }

  async navigateToTracker(): Promise<void> {
    const isMobile = (this.page.viewportSize()?.width ?? 1280) < 1280;

    if (isMobile) {
      await this.ensureMobileMenuOpen();
      await expect(this.mobileTrackerTab).toBeVisible({ timeout: 10000 });
      await this.mobileTrackerTab.click({ force: true });
    } else {
      await expect(this.desktopTrackerTab).toBeVisible({ timeout: 10000 });
      await this.desktopTrackerTab.click({ force: true });
    }
  }

  async navigateToDesigner(): Promise<void> {
    const isMobile = (this.page.viewportSize()?.width ?? 1280) < 1280;

    if (isMobile) {
      await this.ensureMobileMenuOpen();
      await expect(this.mobileDesignerTab).toBeVisible({ timeout: 10000 });
      await this.mobileDesignerTab.click({ force: true });
    } else {
      await expect(this.desktopDesignerTab).toBeVisible({ timeout: 10000 });
      await this.desktopDesignerTab.click({ force: true });
    }
  }

  async navigateToReplica(): Promise<void> {
    const isMobile = (this.page.viewportSize()?.width ?? 1280) < 1280;

    if (isMobile) {
      await this.ensureMobileMenuOpen();
      await expect(this.mobileReplicaTab).toBeVisible({ timeout: 10000 });
      await this.mobileReplicaTab.click({ force: true });
    } else {
      await expect(this.desktopReplicaTab).toBeVisible({ timeout: 10000 });
      await this.desktopReplicaTab.click({ force: true });
    }
  }

  async navigateToPostal(): Promise<void> {
    const isMobile = (this.page.viewportSize()?.width ?? 1280) < 1280;

    if (isMobile) {
      await this.ensureMobileMenuOpen();
      const mobilePostal = this.page.getByTestId('mobile-nav-tab-postal');
      await expect(mobilePostal).toBeVisible({ timeout: 10000 });
      await mobilePostal.click({ force: true });
    } else {
      const desktopPostal = this.page.getByTestId('nav-tab-postal');
      await expect(desktopPostal).toBeVisible({ timeout: 10000 });
      await desktopPostal.click({ force: true });
    }
  }

  async navigateToTechnician(): Promise<void> {
    const isMobile = (this.page.viewportSize()?.width ?? 1280) < 1280;

    if (isMobile) {
      await this.ensureMobileMenuOpen();
      const mobileTech = this.page.getByTestId('mobile-nav-tab-technician');
      await expect(mobileTech).toBeVisible({ timeout: 10000 });
      await mobileTech.click({ force: true });
    } else {
      const desktopTech = this.page.getByTestId('nav-tab-technician');
      await expect(desktopTech).toBeVisible({ timeout: 10000 });
      await desktopTech.click({ force: true });
    }
  }

  async navigateToAdmin(): Promise<void> {
    const isMobile = (this.page.viewportSize()?.width ?? 1280) < 1280;

    if (isMobile) {
      await this.ensureMobileMenuOpen();
      await expect(this.mobileAdminTab).toBeVisible({ timeout: 10000 });
      await this.mobileAdminTab.click({ force: true });
    } else {
      await expect(this.desktopAdminTab).toBeVisible({ timeout: 10000 });
      await this.desktopAdminTab.click({ force: true });
    }
  }

  async navigateToPortal(): Promise<void> {
    const isMobile = (this.page.viewportSize()?.width ?? 1280) < 1280;

    if (isMobile) {
      await this.ensureMobileMenuOpen();
      await expect(this.mobilePortalTab).toBeVisible({ timeout: 10000 });
      await this.mobilePortalTab.click({ force: true });
    } else {
      await expect(this.desktopPortalTab).toBeVisible({ timeout: 10000 });
      await this.desktopPortalTab.click({ force: true });
    }
  }

  async openSignInModal(): Promise<void> {
    await expect(this.signInNavButton).toBeVisible();
    await this.signInNavButton.scrollIntoViewIfNeeded();
    await this.signInNavButton.click({ force: true });
  }

  async openCart(): Promise<void> {
    await expect(this.cartButton).toBeVisible();
    await this.cartButton.scrollIntoViewIfNeeded();
    await this.cartButton.click({ force: true });
  }

  async expectUserProfile(name: string): Promise<void> {
    await expect(this.userProfileName).toBeVisible({ timeout: 10000 });
    await expect(this.userProfileName).toContainText(name);
  }

  async signOut(): Promise<void> {
    await expect(this.userAccountButton).toBeVisible({ timeout: 10000 });
    await this.userAccountButton.click({ force: true });
    const signOffBtn = this.page.getByTestId('nav-signoff-button');
    await expect(signOffBtn).toBeVisible({ timeout: 5000 });
    await signOffBtn.click({ force: true });
    const confirmBtn = this.page.getByTestId('confirm-signoff-button');
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click({ force: true });
    await expect(this.signInNavButton).toBeVisible({ timeout: 10000 });
  }
}
