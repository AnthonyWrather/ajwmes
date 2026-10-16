import { Page, Locator, expect } from '@playwright/test';

export class NavigationPage {
  readonly page: Page;
  readonly desktopStoreTab: Locator;
  readonly mobileMenuToggle: Locator;
  readonly mobileStoreTab: Locator;
  readonly cartButton: Locator;
  readonly signInNavButton: Locator;
  readonly userProfileName: Locator;
  readonly headerVersionBadge: Locator;

  constructor(page: Page) {
    this.page = page;
    this.desktopStoreTab = page.getByTestId('nav-tab-store');
    this.mobileMenuToggle = page.getByTestId('mobile-menu-toggle');
    this.mobileStoreTab = page.getByTestId('mobile-nav-tab-store');
    this.cartButton = page.getByTestId('nav-cart-button');
    this.signInNavButton = page.getByTestId('nav-signin-button');
    this.userProfileName = page.getByTestId('user-profile-name');
    this.headerVersionBadge = page.getByTestId('header-version-badge');
  }

  async navigateToLanding(): Promise<void> {
    await this.page.goto('/');
    await expect(this.page).toHaveTitle(/AJW Marine Electrical Services/i);
  }

  async navigateToStore(): Promise<void> {
    const isMobile = (this.page.viewportSize()?.width ?? 1280) < 1280;

    if (isMobile) {
      await expect(this.mobileMenuToggle).toBeVisible({ timeout: 10000 });
      await this.mobileMenuToggle.click({ force: true });
      await expect(this.mobileStoreTab).toBeVisible({ timeout: 10000 });
      await this.mobileStoreTab.click({ force: true });
    } else {
      await expect(this.desktopStoreTab).toBeVisible({ timeout: 10000 });
      await this.desktopStoreTab.click({ force: true });
    }
  }

  async navigateToPostal(): Promise<void> {
    const isMobile = (this.page.viewportSize()?.width ?? 1280) < 1280;

    if (isMobile) {
      await expect(this.mobileMenuToggle).toBeVisible({ timeout: 10000 });
      await this.mobileMenuToggle.click({ force: true });
      const mobilePostal = this.page.getByTestId('mobile-nav-tab-postal');
      await expect(mobilePostal).toBeVisible({ timeout: 10000 });
      await mobilePostal.click({ force: true });
    } else {
      const desktopPostal = this.page.getByTestId('nav-tab-postal');
      await expect(desktopPostal).toBeVisible({ timeout: 10000 });
      await desktopPostal.click({ force: true });
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
}
