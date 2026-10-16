import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { StorePage } from './pages/StorePage';
import { CartDrawerPage } from './pages/CartDrawerPage';
import { VesselPortalPage } from './pages/VesselPortalPage';

test.describe('Landing & Authentication E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to guarantee pristine session state
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('As a guest, I want to order a product for collection', async ({ page }) => {
    const nav = new NavigationPage(page);
    const store = new StorePage(page);
    const cart = new CartDrawerPage(page);

    await test.step('1. Navigate to landing page and verify branding', async () => {
      await nav.navigateToLanding();
      const heroHeading = page.getByTestId('landing-hero-heading');
      await expect(heroHeading).toBeVisible();
      await expect(heroHeading).toContainText('Reliable Marine Electrics');
      await expect(heroHeading).toContainText('Every Boat & Budget');
    });

    await test.step('2. Navigate to Parts Store via responsive navigation', async () => {
      await nav.navigateToStore();
      await store.verifyStoreVisible();
    });

    await test.step('3. Select marine product and add to postal order basket', async () => {
      await store.addProductToCart(0);
    });

    await test.step('4. Open basket and select Gosport Workshop Collection', async () => {
      await store.openCartDrawer();
      await cart.verifyDrawerOpen();
      await cart.selectCollectionMethod();
    });

    await test.step('5. Proceed to delivery step and enter guest contact details', async () => {
      await cart.proceedToShippingDetails();
      await cart.fillShippingAddress({
        name: 'Guest Sailor',
        email: 'guest.sailor@solent-yachting.co.uk',
        phone: '07700 900123',
        address: 'Haslar Pontoon A-12',
        city: 'Gosport',
        postcode: 'PO12 1NU'
      });
    });

    await test.step('6. Proceed to payment and place workshop collection order', async () => {
      await cart.proceedToPayment();
      await cart.selectPaymentMethod('card');
      await cart.placeOrder();
    });

    await test.step('7. Verify order confirmation screen and collection status', async () => {
      await cart.verifyOrderConfirmation({
        expectedCustomer: 'Guest Sailor',
        expectedMethod: 'solent pickup'
      });
    });
  });

  test('should complete authentication flow and display authenticated dashboard message', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);

    // Mock network auth endpoints if intercepted at network layer
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token-solent-2026',
          user: {
            id: 'usr-admin-01',
            email: 'anthonywrather@gmail.com',
            name: 'Anthony Wrather',
            role: 'admin'
          }
        })
      });
    });

    // 1. Navigate to application root
    await nav.navigateToLanding();

    // 2. Open authentication modal
    await nav.openSignInModal();
    await auth.verifyModalVisible();

    // 3. Fill in user credentials and submit
    await auth.signIn('anthonywrather@gmail.com', 'ajwmes2026');

    // 4. Assert successful redirect to workspace / dashboard and verify account state
    const adminDashboard = page.getByTestId('admin-dashboard');
    await expect(adminDashboard).toBeVisible({ timeout: 10000 });

    const dashboardTitle = page.getByTestId('admin-dashboard-title');
    await expect(dashboardTitle).toBeVisible();
    await expect(dashboardTitle).toContainText("Anthony's Operations Dashboard");

    // 5. Verify navigation updates to display authenticated user profile badge
    await nav.expectUserProfile('Anthony Wrather');
  });

  test('should allow user to pick system preset avatar and custom photo in Profile & Details', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);

    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token-solent-2026',
          user: {
            id: 'usr-admin-01',
            email: 'anthonywrather@gmail.com',
            name: 'Anthony Wrather',
            role: 'admin'
          }
        })
      });
    });

    await nav.navigateToLanding();

    // 1. Sign in as admin
    await nav.openSignInModal();
    await auth.signIn('anthonywrather@gmail.com', 'ajwmes2026');
    await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 10000 });

    // 2. Open User Account Dropdown and click Manage Account & Specs
    const userAccountBtn = page.getByTestId('user-account-button');
    await userAccountBtn.scrollIntoViewIfNeeded();
    await userAccountBtn.click({ force: true });

    const manageAccountBtn = page.getByTestId('nav-manage-account-button');
    await manageAccountBtn.scrollIntoViewIfNeeded();
    await manageAccountBtn.click({ force: true });

    // 3. Verify Account modal is open
    const accountModal = page.getByTestId('account-management-modal');
    await expect(accountModal).toBeVisible();

    // 4. Verify avatar URL input is present
    const avatarUrlInput = page.getByTestId('profile-avatar-url-input');
    await expect(avatarUrlInput).toBeVisible();

    // 5. Click on system supplied preset avatar (index 1: Helm Navigator)
    const presetBtn1 = page.getByTestId('preset-avatar-1');
    await expect(presetBtn1).toBeVisible();
    await presetBtn1.scrollIntoViewIfNeeded();
    await presetBtn1.click({ force: true });

    // 6. Verify URL is filled in successfully
    await expect(avatarUrlInput).toHaveValue('/assets/images/marine_helm_navigation_1791400844235.jpg');

    // 7. Click another preset (index 3: Cruiser Captain)
    const presetBtn3 = page.getByTestId('preset-avatar-3');
    await presetBtn3.scrollIntoViewIfNeeded();
    await presetBtn3.click({ force: true });
    await expect(avatarUrlInput).toHaveValue('/assets/images/budget_small_cruiser_boat_1791420135992.jpg');

    // 8. Test picking a photo file via the file input
    const fileInput = page.getByTestId('profile-photo-file-input');
    const testImageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    await fileInput.setInputFiles({
      name: 'boat_avatar.png',
      mimeType: 'image/png',
      buffer: testImageBuffer
    });

    // Verify avatar URL is populated with data URL
    await expect(avatarUrlInput).toHaveValue(/^data:image\/png;base64,/);

    // 9. Save profile changes
    const saveButton = page.getByTestId('save-profile-button');
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click({ force: true });

    // Verify success feedback
    await expect(accountModal).toContainText('Account profile updated');

    // 10. Verify Vessel Specifications tab visibility matches Vessel Portal access by role
    const vesselTab = page.getByTestId('account-tab-vessel');
    await expect(vesselTab).toBeVisible();
    await expect(vesselTab).toContainText('Vessel Specifications');

    // Switch to Role & Permissions tab and test roles without Vessel Portal access
    await page.getByTestId('account-tab-role').click({ force: true });
    await page.getByTestId('switch-persona-technician').click({ force: true });
    await expect(vesselTab).toHaveCount(0);

    await page.getByTestId('switch-persona-postal').click({ force: true });
    await expect(vesselTab).toHaveCount(0);

    // Switch to Client (has Vessel Portal access) and verify tab is restored
    await page.getByTestId('switch-persona-client').click({ force: true });
    await expect(vesselTab).toBeVisible();

    // 11. Click Vessel Specifications tab: verify registered boats list & portal link
    await vesselTab.click({ force: true });
    const vesselTabContent = page.getByTestId('account-vessel-tab-content');
    await expect(vesselTabContent).toBeVisible();

    // Verify it only displays registered boats list and does not render the old input form
    await expect(vesselTabContent).toContainText('Registered Vessels');
    await expect(vesselTabContent).toContainText('Windbird III');
    await expect(page.locator('input[placeholder="Westerly Discus 33"]')).toHaveCount(0);
    await expect(page.locator('button:has-text("Save Vessel Details")')).toHaveCount(0);

    // Verify the link to the full vessel portal remains
    const portalLink = page.getByTestId('vessel-portal-link-btn');
    await expect(portalLink).toBeVisible();
    await expect(portalLink).toContainText('Open Full Portal');

    // Click link to navigate to full vessel portal
    await portalLink.click({ force: true });
    await expect(accountModal).not.toBeVisible();

    // In full vessel portal: verify boat details, hull type pick list, and dimensions (LOA, LWL, Beam, Draft)
    const editSpecsBtn = page.getByTestId('edit-vessel-specs-button');
    await expect(editSpecsBtn).toBeVisible();
    await editSpecsBtn.click({ force: true });

    // Verify Hull Type pick list exists and has options
    const hullTypeSelect = page.getByTestId('vessel-edit-hull-type');
    await expect(hullTypeSelect).toBeVisible();
    await expect(hullTypeSelect).toContainText('Monohull Fin Keel');
    await expect(hullTypeSelect).toContainText('Monohull Wing Keel');
    await expect(hullTypeSelect).toContainText('Monohull Bilge Keel');
    await expect(hullTypeSelect).toContainText('Catamaran');
    await expect(hullTypeSelect).toContainText('Tender');
    await expect(hullTypeSelect).toContainText('RIB');

    // Verify dimensions fields exist (LOA, LWL, Beam, Draft)
    const loaInput = page.getByTestId('vessel-edit-loa');
    const lwlInput = page.getByTestId('vessel-edit-lwl');
    const beamInput = page.getByTestId('vessel-edit-beam');
    const draftInput = page.getByTestId('vessel-edit-draft');

    await expect(loaInput).toBeVisible();
    await expect(lwlInput).toBeVisible();
    await expect(beamInput).toBeVisible();
    await expect(draftInput).toBeVisible();

    // Test editing draft, then saving
    await draftInput.scrollIntoViewIfNeeded();
    await draftInput.fill('4.80 ft / 1.46 m');
    const saveSpecsBtn = page.getByTestId('save-vessel-specs-button');
    await saveSpecsBtn.scrollIntoViewIfNeeded();
    await saveSpecsBtn.click();

    // Verify saved value in display mode
    await expect(page.getByText('4.80 ft / 1.46 m')).toBeVisible();
  });

  test('As a boat owner without a registered boat, I want to order a product for collection', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    const portal = new VesselPortalPage(page);
    const store = new StorePage(page);
    const cart = new CartDrawerPage(page);

    const testEmail = `sarah.connor.${Date.now()}@solent-sail.co.uk`;

    await test.step('1. Open authentication modal and navigate to Create Account tab', async () => {
      await nav.navigateToLanding();
      await nav.openSignInModal();
      await auth.verifyModalVisible();
      await auth.switchToRegisterTab();
    });

    await test.step('2. Register new boat owner account verifying vessel fields are omitted', async () => {
      await auth.verifyVesselFieldsAbsent();
      await auth.registerNewBoatOwner({
        name: 'Sarah Connor',
        email: testEmail,
        password: 'securepass123',
        phone: '07700 900777'
      });
    });

    await test.step('3. Verify landing on Vessel Portal in unregistered boat state', async () => {
      await nav.expectUserProfile('Sarah Connor');
      await portal.verifyNoVesselRegisteredBanner();
    });

    await test.step('4. Click "Order Parts from Workshop" to navigate to Parts Store', async () => {
      await portal.clickOrderPartsFromWorkshop();
      await store.verifyStoreVisible();
    });

    await test.step('5. Select product and add to postal order basket', async () => {
      await store.addProductToCart(0);
    });

    await test.step('6. Open basket and select Gosport Workshop Collection', async () => {
      await store.openCartDrawer();
      await cart.verifyDrawerOpen();
      await cart.selectCollectionMethod();
    });

    await test.step('7. Proceed to shipping details and confirm contact information', async () => {
      await cart.proceedToShippingDetails();
      await cart.fillShippingAddress({
        name: 'Sarah Connor',
        email: testEmail,
        phone: '07700 900777',
        address: 'Workshop Bench Collection, Haslar Marina',
        city: 'Gosport',
        postcode: 'PO12 1NU'
      });
    });

    await test.step('8. Complete checkout and verify workshop collection confirmation', async () => {
      await cart.proceedToPayment();
      await cart.selectPaymentMethod('card');
      await cart.placeOrder();
      await cart.verifyOrderConfirmation({
        expectedCustomer: 'Sarah Connor',
        expectedMethod: 'solent pickup'
      });
    });
  });

  test('should display GitHub commit-linked version in header and open Multi-Environment Manager', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);

    await nav.navigateToLanding();

    // 1. Verify header version badge displays SemVer with commit SHA
    const headerBadge = page.getByTestId('header-version-badge');
    await expect(headerBadge).toBeVisible();
    await expect(headerBadge).toHaveText(/v\d+\.\d+\.\d+-[a-f0-9]+/i);

    // 2. Click version badge to open Environment Settings Modal
    await headerBadge.click();

    // 3. Verify modal version tag matches
    const modalVersionTag = page.getByTestId('modal-version-tag');
    await expect(modalVersionTag).toBeVisible();
    await expect(modalVersionTag).toHaveText(/v\d+\.\d+\.\d+-[a-f0-9]+/i);

    // 4. Verify GitHub commit verification card is present with SHA and links
    const commitCard = page.getByTestId('github-commit-card');
    await expect(commitCard).toBeVisible();

    const commitSha = page.getByTestId('github-commit-sha');
    await expect(commitSha).toBeVisible();
    await expect(commitSha).toHaveText(/^[a-f0-9]{7}$/i);

    const githubLink = page.getByTestId('view-github-commit-link');
    await expect(githubLink).toBeVisible();
    await expect(githubLink).toHaveAttribute('href', /https:\/\/github\.com\/anthonywrather\/ajwmes\/commit\/[a-f0-9]+/i);

    // 5. Switch to Production Live ('github-deployed') and close modal
    const prodSwitchBtn = page.getByTestId('env-switch-github-deployed');
    await prodSwitchBtn.scrollIntoViewIfNeeded();
    await prodSwitchBtn.click({ force: true });

    const closeEnvModalBtn = page.getByTestId('close-env-settings-modal');
    await closeEnvModalBtn.click({ force: true });

    // 6. In Production as Guest, the header version badge must be disabled
    await expect(headerBadge).toBeDisabled();

    // 7. Open Sign In modal in Production and verify production UI rules
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await expect(auth.signInHeading).toContainText('Sign In');
    await expect(auth.signInHeading).not.toContainText('AJWMES Portal Sign In');

    // Verify Test Accounts & Roles, Test Password hint, and 1-Click Team Roles tab are removed in production
    await expect(page.getByTestId('test-accounts-box')).toHaveCount(0);
    await expect(page.getByTestId('test-password-hint')).toHaveCount(0);
    await expect(page.getByTestId('tab-quick-personas')).toHaveCount(0);

    // 8. Switch to Create Account tab in Production and verify heading is "Create Your Account"
    await auth.switchToRegisterTab();
    await expect(auth.registerHeading).toBeVisible();
    await expect(auth.registerHeading).toHaveText('Create Your Account');

    // 9. Sign in as Administrator in Production and verify header version badge becomes enabled
    await page.getByTestId('tab-signin').click({ force: true });
    await auth.signIn('anthonywrather@gmail.com', 'ajwmes2026');

    await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 10000 });
    await expect(headerBadge).toBeEnabled();
  });
});
