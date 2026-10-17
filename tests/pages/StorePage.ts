import { Page, Locator, expect } from '@playwright/test';

export class StorePage {
  readonly page: Page;
  readonly catalogGrid: Locator;
  readonly productCards: Locator;
  readonly addToCartButtons: Locator;
  readonly viewCartDrawerButton: Locator;
  readonly storeCartTriggerButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.catalogGrid = page.getByTestId('store-catalog-grid');
    this.productCards = page.getByTestId('product-card');
    this.addToCartButtons = page.getByTestId('add-to-cart-button');
    this.viewCartDrawerButton = page.getByTestId('view-cart-drawer-button');
    this.storeCartTriggerButton = page.getByTestId('store-cart-trigger-button');
  }

  async verifyStoreVisible(): Promise<void> {
    await expect(this.catalogGrid).toBeVisible({ timeout: 10000 });
  }

  async addProductToCart(index: number = 0): Promise<void> {
    const inStockButtons = this.page.locator('button[data-testid="add-to-cart-button"]:not([disabled])');
    await expect(inStockButtons.first()).toBeVisible({ timeout: 10000 });
    const count = await inStockButtons.count();
    // Prefer high-inventory cable items (index 2+) if available, otherwise use specified index
    const targetIndex = count > 2 ? Math.min(index + 2, count - 1) : 0;
    const targetButton = inStockButtons.nth(targetIndex);
    await expect(targetButton).toBeVisible({ timeout: 10000 });
    await targetButton.scrollIntoViewIfNeeded();
    await targetButton.click({ force: true });
    // Verify item was added by waiting for the floating cart button to appear
    await expect(this.viewCartDrawerButton).toBeVisible({ timeout: 10000 });
  }

  async openCartDrawer(): Promise<void> {
    // Dismiss any overlapping toast if present
    const toastClose = this.page.locator('[data-testid="auth-toast"] button');
    if (await toastClose.isVisible()) {
      await toastClose.click({ force: true });
    }

    const drawer = this.page.getByTestId('cart-drawer');
    const navCart = this.page.getByTestId('nav-cart-button');

    if (await this.viewCartDrawerButton.isVisible()) {
      await this.viewCartDrawerButton.scrollIntoViewIfNeeded();
      await this.viewCartDrawerButton.click({ force: true });
    } else {
      await navCart.scrollIntoViewIfNeeded();
      await navCart.click({ force: true });
    }

    // If drawer didn't open yet, try navCart with force
    try {
      await expect(drawer).toBeVisible({ timeout: 3000 });
    } catch {
      await navCart.scrollIntoViewIfNeeded();
      await navCart.click({ force: true });
      await expect(drawer).toBeVisible({ timeout: 5000 });
    }
  }
}
