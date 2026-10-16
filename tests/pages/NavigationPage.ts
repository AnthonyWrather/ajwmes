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
    const viewport = this.page.viewportSize();
    const isMobile = viewport ? viewport.width < 1280 : await this.mobileMenuToggle.isVisible();

    if (isMobile) {
      await expect(this.mobileMenuToggle).toBeVisible();
      await this.mobileMenuToggle.click({ force: true });
      await expect(this.mobileStoreTab).toBeVisible();
      await this.mobileStoreTab.click({ force: true });
    } else {
      await expect(this.desktopStoreTab).toBeVisible();
      await this.desktopStoreTab.click();
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
