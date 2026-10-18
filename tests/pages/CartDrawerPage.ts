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

  readonly stripeCardContainer: Locator;
  readonly stripeCardholderInput: Locator;
  readonly stripeCardNumberInput: Locator;
  readonly stripeExpiryInput: Locator;
  readonly stripeCvcInput: Locator;
  readonly stripeModeBadge: Locator;

  readonly confirmationContainer: Locator;
  readonly confirmationHeading: Locator;
  readonly confirmationNumber: Locator;
  readonly confirmationCustomer: Locator;
  readonly confirmationMethod: Locator;
  readonly confirmationStripeRef: Locator;

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

    this.stripeCardContainer = page.getByTestId('stripe-card-container');
    this.stripeCardholderInput = page.getByTestId('stripe-cardholder-input');
    this.stripeCardNumberInput = page.getByTestId('stripe-cardnumber-input');
    this.stripeExpiryInput = page.getByTestId('stripe-expiry-input');
    this.stripeCvcInput = page.getByTestId('stripe-cvc-input');
    this.stripeModeBadge = page.getByTestId('stripe-checkout-mode-badge');

    this.confirmationContainer = page.getByTestId('order-confirmation-container');
    this.confirmationHeading = page.getByTestId('order-confirmation-heading');
    this.confirmationNumber = page.getByTestId('order-confirmation-number');
    this.confirmationCustomer = page.getByTestId('order-confirmation-customer');
    this.confirmationMethod = page.getByTestId('order-confirmation-method');
    this.confirmationStripeRef = page.getByTestId('order-confirmation-stripe-ref');

    // Automatically handle any alert dialogs during postal checkout to prevent test runner hangs
    this.page.on('dialog', async (dialog) => {
      await dialog.dismiss().catch(() => {});
    });
  }

  async verifyDrawerOpen(): Promise<void> {
    await expect(this.cartDrawer).toBeVisible();
  }

  async closeDrawer(): Promise<void> {
    await expect(this.closeDrawerButton).toBeVisible();
    await this.closeDrawerButton.click({ force: true });
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

  async verifyStripeCheckoutVisible(): Promise<void> {
    await expect(this.stripeCardContainer).toBeVisible();
    await expect(this.stripeModeBadge).toBeVisible();
  }

  async fillStripeCardDetails(details?: { name?: string; number?: string; expiry?: string; cvc?: string }): Promise<void> {
    if (details?.name) {
      await this.stripeCardholderInput.fill(details.name);
    }
    if (details?.number) {
      await this.stripeCardNumberInput.fill(details.number);
    }
    if (details?.expiry) {
      await this.stripeExpiryInput.fill(details.expiry);
    }
    if (details?.cvc) {
      await this.stripeCvcInput.fill(details.cvc);
    }
  }

  async placeOrder(): Promise<void> {
    await expect(this.placeOrderButton).toBeVisible();
    await this.placeOrderButton.scrollIntoViewIfNeeded();
    await this.placeOrderButton.click({ force: true });
  }

  async verifyOrderConfirmation(options: { expectedCustomer: string; expectedMethod?: string; expectStripeRef?: boolean }): Promise<void> {
    await expect(this.confirmationContainer).toBeVisible({ timeout: 15000 });
    await expect(this.confirmationHeading).toHaveText('Order Confirmed!');
    await expect(this.confirmationNumber).toHaveText(/AJW-POST-\d+/);
    await expect(this.confirmationCustomer).toContainText(options.expectedCustomer);
    if (options.expectedMethod) {
      await expect(this.confirmationMethod).toContainText(options.expectedMethod, { ignoreCase: true });
    }
    if (options.expectStripeRef) {
      await expect(this.confirmationStripeRef).toBeVisible();
      await expect(this.confirmationStripeRef).toContainText(/pi_/);
    }
  }
}
