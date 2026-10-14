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
    await submitButton.click();

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
});
