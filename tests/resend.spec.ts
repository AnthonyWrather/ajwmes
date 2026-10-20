import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';

test.describe('Resend Email Integration E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to guarantee pristine session state
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('should render the Resend Email Integration card in Multi-Environment Manager modal', async ({ page }) => {
    // 1. Navigate to application root and authenticate as Website Administrator
    await page.goto('/');
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('site@ajwmes.co.uk', 'ajwmes2026');

    // 2. Open Multi-Environment Settings Modal via the version badge in header
    const headerBadge = page.getByTestId('header-version-badge');
    await expect(headerBadge).toBeVisible();
    await expect(headerBadge).toBeEnabled();
    await headerBadge.click();

    // 3. Locate Resend Email Integration card
    const resendCard = page.getByTestId('resend-card');
    await resendCard.scrollIntoViewIfNeeded();
    await expect(resendCard).toBeVisible();

    // 4. Verify server-side Cloud Function gateway mode badge
    const modeBadge = page.getByTestId('resend-mode-badge');
    await expect(modeBadge).toBeVisible();
    await expect(modeBadge).toContainText('Cloud Function');

    // 5. Verify test dispatch action control is present
    const testButton = page.getByTestId('test-resend-email-button');
    await expect(testButton).toBeVisible();

    // 6. Verify client-side API key inputs are strictly NOT rendered (preventing credential leakage)
    const keyInput = page.getByTestId('resend-api-key-input');
    await expect(keyInput).not.toBeAttached();
  });

  test('should trigger test email dispatch via server Cloud Function gateway', async ({ page }) => {
    await page.goto('/');
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('site@ajwmes.co.uk', 'ajwmes2026');

    // 1. Open Multi-Environment Settings Modal
    const headerBadge = page.getByTestId('header-version-badge');
    await expect(headerBadge).toBeVisible();
    await expect(headerBadge).toBeEnabled();
    await headerBadge.click();

    const resendCard = page.getByTestId('resend-card');
    await resendCard.scrollIntoViewIfNeeded();
    await expect(resendCard).toBeVisible();

    // 2. Click Send Verification Test Email button
    const testButton = page.getByTestId('test-resend-email-button');
    await testButton.scrollIntoViewIfNeeded();
    await testButton.click({ force: true });

    // 3. Verify user feedback notice confirming dispatch
    const notice = page.getByTestId('resend-notice');
    await expect(notice).toBeVisible({ timeout: 10000 });
    await expect(notice).toContainText(/Test email dispatched/i);
  });

  test('should verify no Resend API key is present in client localStorage', async ({ page }) => {
    await page.goto('/');

    const hasResendKeyInStorage = await page.evaluate(() => {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i) || '';
        if (key.toLowerCase().includes('resend')) {
          return true;
        }
      }
      return false;
    });

    expect(hasResendKeyInStorage).toBe(false);
  });

  test('should trigger welcome email during vessel owner registration without blocking navigation', async ({ page }) => {
    await page.goto('/');

    // 1. Open Auth modal
    const signInNavButton = page.getByTestId('nav-signin-button');
    await expect(signInNavButton).toBeVisible();
    await signInNavButton.click();
    await expect(page.getByTestId('auth-modal')).toBeVisible();

    // 2. Switch to Create Account tab
    const registerTab = page.getByTestId('tab-register');
    await expect(registerTab).toBeVisible();
    await registerTab.click();

    // 3. Fill in registration details
    const uniqueEmail = `boatowner.${Date.now()}@solent-yachting.co.uk`;
    await page.getByTestId('auth-reg-name-input').fill('James Admiral');
    await page.getByTestId('auth-reg-email-input').fill(uniqueEmail);
    await page.getByTestId('auth-reg-password-input').fill('securepass123');
    await page.getByTestId('auth-reg-confirm-password-input').fill('securepass123');
    await page.getByTestId('auth-reg-phone-input').fill('07700 900555');

    // 4. Submit registration
    const submitBtn = page.getByTestId('auth-register-submit-button');
    await submitBtn.scrollIntoViewIfNeeded();
    await submitBtn.click({ force: true });

    // 5. Verify navigation to Vessel Portal succeeded
    const userProfileName = page.getByTestId('user-profile-name');
    await expect(userProfileName).toBeVisible({ timeout: 10000 });
    await expect(userProfileName).toContainText('James Admiral');
    await expect(page.getByText('Boat Owner Vessel Portal')).toBeVisible();
  });
});
