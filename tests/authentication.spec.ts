import { test, expect } from '@playwright/test';

test.describe('Landing & Authentication E2E Flows', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage to guarantee pristine session state
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('should navigate to landing page and verify title and hero header text', async ({ page }) => {
    // 1. Navigate to the root URL (configured as http://localhost:5173 in playwright.config.ts)
    await page.goto('/');

    // 2. Verify HTML document title matches expected branding
    await expect(page).toHaveTitle(/AJW Marine Electrical Services/i);

    // 3. Verify main landing hero heading contains key value proposition
    const heroHeading = page.getByTestId('landing-hero-heading');
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText('Reliable Marine Electrics');
    await expect(heroHeading).toContainText('Every Boat & Budget');
  });

  test('should complete authentication flow and display authenticated dashboard message', async ({ page }) => {
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
    await page.goto('/');

    // 2. Locate and click the Sign In button in navigation
    const signInNavButton = page.getByTestId('nav-signin-button');
    await expect(signInNavButton).toBeVisible();
    await signInNavButton.click();

    // 3. Ensure the authentication modal opened
    const authModal = page.getByTestId('auth-modal');
    await expect(authModal).toBeVisible();

    // 4. Fill in user credentials using explicit data-testid selectors
    const emailInput = page.getByTestId('auth-email-input');
    const passwordInput = page.getByTestId('auth-password-input');
    const submitButton = page.getByTestId('auth-submit-button');

    await expect(emailInput).toBeVisible();
    await emailInput.fill('anthonywrather@gmail.com');

    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('ajwmes2026');

    // 5. Submit credentials
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click({ force: true });

    // 6. Assert successful redirect to workspace / dashboard and verify account state
    // Admin role automatically routes to the Admin Operations Dashboard
    const adminDashboard = page.getByTestId('admin-dashboard');
    await expect(adminDashboard).toBeVisible({ timeout: 10000 });

    const dashboardTitle = page.getByTestId('admin-dashboard-title');
    await expect(dashboardTitle).toBeVisible();
    await expect(dashboardTitle).toContainText("Anthony's Operations Dashboard");

    // 7. Verify navigation updates to display authenticated user profile badge
    const userProfileName = page.getByTestId('user-profile-name');
    await expect(userProfileName).toBeVisible();
    await expect(userProfileName).toContainText('Anthony Wrather');
  });

  test('should allow user to pick system preset avatar and custom photo in Profile & Details', async ({ page }) => {
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

    await page.goto('/');

    // 1. Sign in as admin
    await page.getByTestId('nav-signin-button').click();
    await page.getByTestId('auth-email-input').fill('anthonywrather@gmail.com');
    await page.getByTestId('auth-password-input').fill('ajwmes2026');
    const adminSubmitButton = page.getByTestId('auth-submit-button');
    await adminSubmitButton.scrollIntoViewIfNeeded();
    await adminSubmitButton.click({ force: true });
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
  });

  test('should display Create Account tab with vessel fields removed and route to Vessel Portal', async ({ page }) => {
    await page.goto('/');

    // 1. Open authentication modal
    const signInNavButton = page.getByTestId('nav-signin-button');
    await expect(signInNavButton).toBeVisible();
    await signInNavButton.click();

    const authModal = page.getByTestId('auth-modal');
    await expect(authModal).toBeVisible();

    // 2. Click the Create Account tab
    const registerTab = page.getByTestId('tab-register');
    await expect(registerTab).toBeVisible();
    await expect(registerTab).toContainText('Create Account');
    await registerTab.click();

    // 3. Verify user credential fields are present
    const nameInput = page.getByTestId('auth-reg-name-input');
    const emailInput = page.getByTestId('auth-reg-email-input');
    const passwordInput = page.getByTestId('auth-reg-password-input');
    const confirmPasswordInput = page.getByTestId('auth-reg-confirm-password-input');
    const phoneInput = page.getByTestId('auth-reg-phone-input');
    const submitButton = page.getByTestId('auth-register-submit-button');

    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(confirmPasswordInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(submitButton).toContainText('Create Account & Open Vessel Portal');

    // 4. Assert vessel-specific inputs are NOT present on this screen
    await expect(page.locator('input[placeholder="Westerly Discus 33"]')).toHaveCount(0);
    await expect(page.locator('input[placeholder="Haslar Marina, Berth E-14"]')).toHaveCount(0);

    // 5. Fill registration credentials with isolated test email
    const testEmail = `sarah.connor.${Date.now()}@solent-sail.co.uk`;
    await nameInput.fill('Sarah Connor');
    await emailInput.fill(testEmail);
    await passwordInput.fill('securepass123');
    await confirmPasswordInput.fill('securepass123');
    await phoneInput.fill('07700 900777');

    // 6. Submit registration
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click({ force: true });

    // 7. Verify navigation to the Vessel Portal
    const userProfileName = page.getByTestId('user-profile-name');
    await expect(userProfileName).toBeVisible({ timeout: 10000 });
    await expect(userProfileName).toContainText('Sarah Connor');

    // 8. Verify user is on the Vessel Portal route
    await expect(page.getByText('Boat Owner Vessel Portal')).toBeVisible();
  });

  test('should display GitHub commit-linked version in header and open Multi-Environment Manager', async ({ page }) => {
    await page.goto('/');

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
  });
});

