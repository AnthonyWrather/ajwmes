import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { StorePage } from './pages/StorePage';
import { CartDrawerPage } from './pages/CartDrawerPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { VesselPortalPage } from './pages/VesselPortalPage';

test.describe('Stripe Payment Integration E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to guarantee pristine session state
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('should render the Stripe Payment Gateway card in Multi-Environment Manager modal', async ({ page }) => {
    // 1. Navigate to application root
    await page.goto('/');

    // 2. Open Multi-Environment Settings Modal via the version badge in header
    const headerBadge = page.getByTestId('header-version-badge');
    await expect(headerBadge).toBeVisible();
    await headerBadge.click();

    // 3. Locate Stripe Payment Gateway card
    const stripeCard = page.getByTestId('stripe-card');
    await stripeCard.scrollIntoViewIfNeeded();
    await expect(stripeCard).toBeVisible();

    // 4. Verify mode badge (default safe dev / simulated mode)
    const modeBadge = page.getByTestId('stripe-mode-badge');
    await expect(modeBadge).toBeVisible();
    await expect(modeBadge).toContainText(/Simulated Dev Mode/i);

    // 5. Verify configuration inputs and action controls
    const keyInput = page.getByTestId('stripe-api-key-input');
    const saveButton = page.getByTestId('save-stripe-key-button');
    const resetButton = page.getByTestId('reset-stripe-key-button');

    await expect(keyInput).toBeVisible();
    await expect(saveButton).toBeVisible();
    await expect(resetButton).toBeVisible();
  });

  test('should validate and reject invalid Stripe Publishable Key formats', async ({ page }) => {
    await page.goto('/');

    // 1. Open Multi-Environment Settings Modal
    const headerBadge = page.getByTestId('header-version-badge');
    await expect(headerBadge).toBeVisible();
    await headerBadge.click();

    const stripeCard = page.getByTestId('stripe-card');
    await stripeCard.scrollIntoViewIfNeeded();
    await expect(stripeCard).toBeVisible();

    // 2. Enter malformed key (does not start with 'pk_test_' or 'pk_live_')
    const keyInput = page.getByTestId('stripe-api-key-input');
    await keyInput.scrollIntoViewIfNeeded();
    await keyInput.fill('invalid_stripe_key_12345');

    // 3. Attempt to save
    const saveButton = page.getByTestId('save-stripe-key-button');
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click({ force: true });

    // 4. Verify validation error notice
    const notice = page.getByTestId('stripe-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(/must start with "pk_test_" or "pk_live_"/i);
  });

  test('should allow saving valid Stripe test key and updating mode badge', async ({ page }) => {
    await page.goto('/');

    // 1. Open Multi-Environment Settings Modal
    const headerBadge = page.getByTestId('header-version-badge');
    await expect(headerBadge).toBeVisible();
    await headerBadge.click();

    const stripeCard = page.getByTestId('stripe-card');
    await stripeCard.scrollIntoViewIfNeeded();

    // 2. Enter valid Stripe test publishable key
    const validTestKey = 'pk_test_51MarineTestSampleKey1234567890abcdef123';
    const keyInput = page.getByTestId('stripe-api-key-input');
    await keyInput.scrollIntoViewIfNeeded();
    await keyInput.fill(validTestKey);

    // 3. Click Save
    const saveButton = page.getByTestId('save-stripe-key-button');
    await saveButton.click({ force: true });

    // 4. Verify success notice and updated test mode badge
    const notice = page.getByTestId('stripe-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(/saved for this browser session/i);

    const modeBadge = page.getByTestId('stripe-mode-badge');
    await expect(modeBadge).toContainText(/Stripe Test Mode/i);

    // 5. Reset key back to simulated mode
    const resetButton = page.getByTestId('reset-stripe-key-button');
    await resetButton.click({ force: true });
    await expect(modeBadge).toContainText(/Simulated Dev Mode/i);
  });

  test('should complete full e2e store checkout with Stripe Card payment and generate payment reference', async ({ page }) => {
    const nav = new NavigationPage(page);
    const store = new StorePage(page);
    const cart = new CartDrawerPage(page);

    // 1. Navigate to Store
    await nav.navigateToLanding();
    await nav.navigateToStore();
    await store.verifyStoreVisible();

    // 2. Add product to cart
    await store.addProductToCart(0);

    // 3. Open Cart Drawer and choose postal delivery
    await store.openCartDrawer();
    await cart.verifyDrawerOpen();
    await cart.proceedToShippingDetails();

    // 4. Fill shipping information
    await cart.fillShippingAddress({
      name: 'Captain Edward Davies',
      email: 'edward@solentyachting.co.uk',
      phone: '07700 900333',
      address: 'Berth 14, Haslar Marina',
      city: 'Gosport',
      postcode: 'PO12 1NU'
    });

    // 5. Proceed to payment
    await cart.proceedToPayment();

    // 6. Select Card (Stripe) payment method
    await cart.selectPaymentMethod('card');
    await cart.verifyStripeCheckoutVisible();

    // 7. Place order
    await cart.placeOrder();

    // 8. Verify order confirmation with Stripe payment reference
    await cart.verifyOrderConfirmation({
      expectedCustomer: 'Captain Edward Davies',
      expectedMethod: 'Royal Mail Tracked',
      expectStripeRef: true
    });
  });

  test('should allow boat owner to authorize diagnostic deposit via Stripe in Vessel Portal discussion thread', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    const portal = new VesselPortalPage(page);

    // 1. Authenticate as David Mercer (Registered Client)
    await nav.navigateToLanding();
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.selectTestPersona('d.mercer@solent-sail.co.uk');
    await nav.expectUserProfile('David Mercer');

    // 2. Navigate to Vessel Portal
    await nav.navigateToPortal();
    await portal.verifyPortalVisible();

    // 3. Switch to Jobs & Activity sub-tab
    await portal.selectSubTab('jobs');

    // 4. Pay Deposit via Stripe and verify secured badge
    await portal.payJobDepositViaStripe();
  });
});

