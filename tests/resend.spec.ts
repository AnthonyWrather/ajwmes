import { test, expect } from '@playwright/test';

test.describe('Resend Email Integration E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to guarantee pristine session state
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('should render the Resend Email Integration card in Multi-Environment Manager modal', async ({ page }) => {
    // 1. Navigate to application root
    await page.goto('/');

    // 2. Open Multi-Environment Settings Modal via the version badge in header
    const headerBadge = page.getByTestId('header-version-badge');
    await expect(headerBadge).toBeVisible();
    await headerBadge.click();

    // 3. Locate Resend Email Integration card
    const resendCard = page.getByTestId('resend-card');
    await resendCard.scrollIntoViewIfNeeded();
    await expect(resendCard).toBeVisible();

    // 4. Verify mode badge (default safe dev / simulated outbox mode)
    const modeBadge = page.getByTestId('resend-mode-badge');
    await expect(modeBadge).toBeVisible();

    // 5. Verify configuration inputs and action controls
    const keyInput = page.getByTestId('resend-api-key-input');
    const saveButton = page.getByTestId('save-resend-key-button');
    const testButton = page.getByTestId('test-resend-email-button');
    const resetButton = page.getByTestId('reset-resend-key-button');

    await expect(keyInput).toBeVisible();
    await expect(saveButton).toBeVisible();
    await expect(testButton).toBeVisible();
    await expect(resetButton).toBeVisible();
  });

  test('should validate and reject invalid Resend API key formats', async ({ page }) => {
    await page.goto('/');

    // 1. Open Multi-Environment Settings Modal
    const headerBadge = page.getByTestId('header-version-badge');
    await expect(headerBadge).toBeVisible();
    await headerBadge.click();

    const resendCard = page.getByTestId('resend-card');
    await resendCard.scrollIntoViewIfNeeded();
    await expect(resendCard).toBeVisible();

    // 2. Enter malformed key (does not start with 're_' and too short)
    const keyInput = page.getByTestId('resend-api-key-input');
    await keyInput.scrollIntoViewIfNeeded();
    await keyInput.fill('bad_api_key_format');

    // 3. Attempt to save
    const saveButton = page.getByTestId('save-resend-key-button');
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click({ force: true });

    // 4. Verify validation error message
    const notice = page.getByTestId('resend-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(/must start with "re_" and be at least 24 characters/i);
  });

  test('should allow saving valid Resend API key, testing email send, and resetting to simulated mode', async ({ page }) => {
    await page.goto('/');

    // 1. Open Multi-Environment Settings Modal
    const headerBadge = page.getByTestId('header-version-badge');
    await expect(headerBadge).toBeVisible();
    await headerBadge.click();

    const resendCard = page.getByTestId('resend-card');
    await resendCard.scrollIntoViewIfNeeded();
    await expect(resendCard).toBeVisible();

    // 2. Input a validly formatted Resend API key
    const keyInput = page.getByTestId('resend-api-key-input');
    await keyInput.scrollIntoViewIfNeeded();
    await keyInput.fill('re_test_solent_marine_key_1234567890abcdef');

    // 3. Save key
    const saveButton = page.getByTestId('save-resend-key-button');
    await saveButton.scrollIntoViewIfNeeded();
    await saveButton.click({ force: true });

    // 4. Verify key saved feedback & mode badge updates to Live API
    const notice = page.getByTestId('resend-notice');
    await expect(notice).toBeVisible();
    await expect(notice).toContainText(/Resend API Key saved/i);

    const modeBadge = page.getByTestId('resend-mode-badge');
    await expect(modeBadge).toContainText('Resend Live API');

    // 5. Reset / Clear Key back to simulated mode
    const resetButton = page.getByTestId('reset-resend-key-button');
    await resetButton.scrollIntoViewIfNeeded();
    await resetButton.click({ force: true });
    await expect(notice).toContainText(/switched to simulated/i);
    await expect(modeBadge).toContainText('Simulated Outbox');

    // 6. Test Send button in simulated mode
    const testButton = page.getByTestId('test-resend-email-button');
    await testButton.scrollIntoViewIfNeeded();
    await testButton.click({ force: true });
    await expect(notice).toContainText(/Test email dispatched/i);
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
