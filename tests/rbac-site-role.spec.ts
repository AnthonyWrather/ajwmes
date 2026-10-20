import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';

test.describe('RBAC: Website Administrator (site) Role & Platform Config Decoupling (Issue #32)', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage for pristine session
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('should enforce least-privilege decoupling: header version badge is disabled for guest and admin, but enabled for site', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);

    await nav.navigateToLanding();

    // 1. Unauthenticated Guest: header badge is visible but disabled
    const headerBadge = page.getByTestId('header-version-badge');
    await expect(headerBadge).toBeVisible();
    await expect(headerBadge).toBeDisabled();

    // 2. Workshop Admin (anthonywrather@gmail.com): header badge remains strictly disabled
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('anthonywrather@gmail.com', 'ajwmes2026');
    await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 10000 });
    await expect(headerBadge).toBeDisabled();

    // Sign out from admin
    await nav.signOut();
    await expect(headerBadge).toBeDisabled();

    // 3. Website Administrator (site@ajwmes.co.uk): header badge becomes enabled and interactive
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('site@ajwmes.co.uk', 'ajwmes2026');
    await expect(headerBadge).toBeEnabled();

    // Clicking header badge opens Multi-Environment & Release Manager
    await headerBadge.click();
    const envModal = page.getByTestId('env-settings-modal');
    await expect(envModal).toBeVisible();

    const closeBtn = page.getByTestId('close-env-settings-modal');
    await closeBtn.click();
    await expect(envModal).not.toBeVisible();
  });

  test('should support 1-click test credentials and quick persona for site role in SignInModal', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);

    await nav.navigateToLanding();
    await nav.openSignInModal();
    await auth.verifyModalVisible();

    // 1. Verify 1-click test account chip for site
    const siteChip = page.getByTestId('test-account-chip-site');
    await expect(siteChip).toBeVisible();
    await siteChip.click();

    // Verify email input is pre-filled with site@ajwmes.co.uk
    await expect(page.getByTestId('auth-email-input')).toHaveValue('site@ajwmes.co.uk');

    // Submit sign in
    await page.getByTestId('auth-submit-button').click();
    await expect(page.getByTestId('auth-modal')).not.toBeVisible({ timeout: 10000 });
    await nav.expectUserProfile('Anthony Wrather — Website Admin');

    // Sign out to test quick persona
    await nav.signOut();

    // 2. Open quick personas tab and verify quick-persona-site
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    const quickPersonasTab = page.getByTestId('tab-quick-personas');
    await expect(quickPersonasTab).toBeVisible();
    await quickPersonasTab.click();

    const sitePersona = page.getByTestId('quick-persona-site');
    await expect(sitePersona).toBeVisible();
    await sitePersona.click();

    await expect(page.getByTestId('auth-modal')).not.toBeVisible({ timeout: 10000 });
    await nav.expectUserProfile('Anthony Wrather — Website Admin');
  });

  test('should provide quick link in user dropdown for site role to open EnvironmentSettingsModal', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);

    await nav.navigateToLanding();
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('site@ajwmes.co.uk', 'ajwmes2026');

    // Open user dropdown
    await expect(nav.userAccountButton).toBeVisible();
    await nav.userAccountButton.click();

    // Verify nav-site-settings-button is visible
    const siteSettingsBtn = page.getByTestId('nav-site-settings-button');
    await expect(siteSettingsBtn).toBeVisible();
    await siteSettingsBtn.click();

    // Verify EnvironmentSettingsModal opens
    const envModal = page.getByTestId('env-settings-modal');
    await expect(envModal).toBeVisible();

    // Verify Firebase API Key controls are present for site role
    const keyInput = page.getByTestId('firebase-api-key-input');
    await keyInput.scrollIntoViewIfNeeded();
    await expect(keyInput).toBeVisible();

    const saveKeyBtn = page.getByTestId('save-firebase-key-button');
    await expect(saveKeyBtn).toBeVisible();

    await page.getByTestId('close-env-settings-modal').click();
  });

  test('should prevent operational admin from modifying, assigning, or deleting site role accounts', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);

    await nav.navigateToLanding();

    // Authenticate as Workshop Admin
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('anthonywrather@gmail.com', 'ajwmes2026');

    // Navigate to Master Workshop (/admin)
    await nav.navigateToAdmin();
    await expect(page.getByTestId('admin-dashboard')).toBeVisible({ timeout: 15000 });

    // Switch to User Accounts tab
    const accountsTab = page.getByRole('button', { name: /User Accounts|Accounts/i });
    await accountsTab.click();

    // Filter by site role
    const siteFilterBtn = page.getByTestId('user-role-filter-site');
    await expect(siteFilterBtn).toBeVisible();
    await siteFilterBtn.click();

    // Verify locked badge is rendered on site user row
    const lockedBadge = page.getByTestId('locked-site-role-badge');
    await expect(lockedBadge).toBeVisible();
    await expect(lockedBadge).toContainText(/Site Admin/i);
  });

  test('should restrict Free Hosting Guide footer link to site role', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);

    await nav.navigateToLanding();

    // 1. Guest: footer hosting guide button not rendered
    const footerGuideBtn = page.getByTestId('footer-hosting-guide-button');
    await expect(footerGuideBtn).toHaveCount(0);

    // 2. Admin: footer hosting guide button not rendered
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('anthonywrather@gmail.com', 'ajwmes2026');
    await expect(footerGuideBtn).toHaveCount(0);

    // Sign out
    await nav.signOut();

    // 3. Site: footer hosting guide button is visible
    await nav.openSignInModal();
    await auth.verifyModalVisible();
    await auth.signIn('site@ajwmes.co.uk', 'ajwmes2026');
    await expect(footerGuideBtn).toBeVisible();
  });
});
