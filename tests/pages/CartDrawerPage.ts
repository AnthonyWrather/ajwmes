import { Page, Locator, expect } from '@playwright/test';

export interface CheckoutShippingDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postcode: string;
}

export class CartDrawerPage {
  readonly page: Page;
  readonly cartDrawer: Locator;
  readonly closeDrawerButton: Locator;
  readonly collectionOption: Locator;
  readonly royalMailOption: Locator;
  readonly dpdOption: Locator;
  readonly proceedToShippingButton: Locator;

  readonly nameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;
  readonly address1Input: Locator;
  readonly cityInput: Locator;
  readonly postcodeInput: Locator;
  readonly proceedToPaymentButton: Locator;

  readonly cardPaymentMethod: Locator;
  readonly bacsPaymentMethod: Locator;
  readonly placeOrderButton: Locator;

  readonly confirmationContainer: Locator;
  readonly confirmationHeading: Locator;
  readonly confirmationNumber: Locator;
  readonly confirmationCustomer: Locator;
  readonly confirmationMethod: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartDrawer = page.getByTestId('cart-drawer');
    this.closeDrawerButton = page.getByTestId('close-cart-drawer-button');
    this.collectionOption = page.getByTestId('shipping-method-solent-pickup');
    this.royalMailOption = page.getByTestId('shipping-method-royal-mail');
    this.dpdOption = page.getByTestId('shipping-method-dpd');
    this.proceedToShippingButton = page.getByTestId('proceed-to-shipping-button');

    this.nameInput = page.getByTestId('checkout-name-input');
    this.emailInput = page.getByTestId('checkout-email-input');
    this.phoneInput = page.getByTestId('checkout-phone-input');
    this.address1Input = page.getByTestId('checkout-address1-input');
    this.cityInput = page.getByTestId('checkout-city-input');
    this.postcodeInput = page.getByTestId('checkout-postcode-input');
    this.proceedToPaymentButton = page.getByTestId('proceed-to-payment-button');

    this.cardPaymentMethod = page.getByTestId('payment-method-card');
    this.bacsPaymentMethod = page.getByTestId('payment-method-bacs');
    this.placeOrderButton = page.getByTestId('place-order-button');

    this.confirmationContainer = page.getByTestId('order-confirmation-container');
    this.confirmationHeading = page.getByTestId('order-confirmation-heading');
    this.confirmationNumber = page.getByTestId('order-confirmation-number');
    this.confirmationCustomer = page.getByTestId('order-confirmation-customer');
    this.confirmationMethod = page.getByTestId('order-confirmation-method');
  }

  async verifyDrawerOpen(): Promise<void> {
    await expect(this.cartDrawer).toBeVisible();
  }

  async selectCollectionMethod(): Promise<void> {
    await expect(this.collectionOption).toBeVisible();
    await this.collectionOption.scrollIntoViewIfNeeded();
    await this.collectionOption.click({ force: true });
    // Confirm Free rate is displayed
    await expect(this.collectionOption).toContainText('FREE');
    await expect(this.collectionOption).toContainText('Gosport Workshop Collection');
  }

  async proceedToShippingDetails(): Promise<void> {
    await expect(this.proceedToShippingButton).toBeVisible();
    await this.proceedToShippingButton.scrollIntoViewIfNeeded();
    await this.proceedToShippingButton.click({ force: true });
  }

  async fillShippingAddress(data: CheckoutShippingDetails): Promise<void> {
    await expect(this.nameInput).toBeVisible();
    await this.nameInput.fill(data.name);
    await this.emailInput.fill(data.email);
    await this.phoneInput.fill(data.phone);
    await this.address1Input.fill(data.address);
    await this.cityInput.fill(data.city);
    await this.postcodeInput.fill(data.postcode);
  }

  async proceedToPayment(): Promise<void> {
    await expect(this.proceedToPaymentButton).toBeVisible();
    await this.proceedToPaymentButton.scrollIntoViewIfNeeded();
    await this.proceedToPaymentButton.click({ force: true });
  }

  async selectPaymentMethod(method: 'card' | 'bank_transfer' = 'card'): Promise<void> {
    if (method === 'card') {
      await expect(this.cardPaymentMethod).toBeVisible();
      await this.cardPaymentMethod.scrollIntoViewIfNeeded();
      await this.cardPaymentMethod.click({ force: true });
    } else {
      await expect(this.bacsPaymentMethod).toBeVisible();
      await this.bacsPaymentMethod.scrollIntoViewIfNeeded();
      await this.bacsPaymentMethod.click({ force: true });
    }
  }

  async placeOrder(): Promise<void> {
    await expect(this.placeOrderButton).toBeVisible();
    await this.placeOrderButton.scrollIntoViewIfNeeded();
    await this.placeOrderButton.click({ force: true });
  }

  async verifyOrderConfirmation(options: { expectedCustomer: string; expectedMethod?: string }): Promise<void> {
    await expect(this.confirmationContainer).toBeVisible({ timeout: 15000 });
    await expect(this.confirmationHeading).toHaveText('Order Confirmed!');
    await expect(this.confirmationNumber).toHaveText(/AJW-POST-\d+/);
    await expect(this.confirmationCustomer).toContainText(options.expectedCustomer);
    if (options.expectedMethod) {
      await expect(this.confirmationMethod).toContainText(options.expectedMethod);
    }
  }
}
