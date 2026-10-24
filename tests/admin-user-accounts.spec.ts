import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { UserAccountsManagerPage } from './pages/UserAccountsManagerPage';

test.describe('Admin User Accounts Directory, Role Elevation & Environment Isolation (UJ-17) E2E Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clean browser state and mock window.print & confirm for headless stability
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.print = () => {};
      window.confirm = () => true;
    });
  });

  test('should audit accounts directory, filter by role pills, multi-field search, provision new boat owner, elevate role inline, and safely delete account', async ({ page }) => {
    test.slow();
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    const admin = new AdminDashboardPage(page);
    const accounts = new UserAccountsManagerPage(page);

    const testTimestamp = Date.now();
    const testUserName = `Capt. Eleanor Vance ${testTimestamp.toString().slice(-4)}`;
    const testUserEmail = `e.vance.${testTimestamp}@hamble-yachts.co.uk`;

    // =========================================================================
    // 1. Admin Authentication & Accounts Tab Access
    // =========================================================================
    await test.step('1. Authenticate as Workshop Admin and navigate to User Accounts tab', async () => {
      await nav.navigateToLanding();
      await nav.openSignInModal();
      await auth.verifyModalVisible();
      await auth.signIn('anthonywrather@gmail.com', 'ajwmes2026');

      await admin.verifyDashboardVisible();
      await nav.expectUserProfile('Anthony Wrather');

      // Switch to accounts tab
      await admin.switchTab('accounts');
      await accounts.verifyManagerVisible();

      // Assert environment partition banner & role summary KPIs
      await expect(page.getByText('Firestore Collection:').first()).toBeVisible();
      await expect(page.getByText('User Accounts & Access Control').first()).toBeVisible();

      await expect(accounts.statClients).toBeVisible();
      await expect(accounts.statTechnicians).toBeVisible();
      await expect(accounts.statDispatchers).toBeVisible();
      await expect(accounts.statAdmin).toBeVisible();
      await expect(accounts.statSite).toBeVisible();

      // Verify non-zero counts
      await expect(accounts.statClients).not.toHaveText('0', { timeout: 15000 });
      await expect(accounts.statAdmin).not.toHaveText('0', { timeout: 15000 });
    });

    // =========================================================================
    // 2. Real-Time Search & Role Pill Filtering
    // =========================================================================
    await test.step('2. Filter directory by role pills and verify card partitioning', async () => {
      // Filter by client
      await accounts.filterByRole('client');
      const clientCards = accounts.userCards;
      const clientCount = await clientCards.count();
      expect(clientCount).toBeGreaterThan(0);
      for (let i = 0; i < Math.min(clientCount, 5); i++) {
        await expect(clientCards.nth(i)).toContainText(/CLIENT|Yacht/i);
      }

      // Filter by technician
      await accounts.filterByRole('technician');
      const techCards = accounts.userCards;
      await expect(techCards.first()).toContainText(/TECHNICIAN|Field/i, { timeout: 10000 });
      const techCount = await techCards.count();
      expect(techCount).toBeGreaterThan(0);
      for (let i = 0; i < techCount; i++) {
        await expect(techCards.nth(i)).toContainText(/TECHNICIAN|Field/i);
      }

      // Reset filter to all
      await accounts.filterByRole('all');
      const allCount = await accounts.userCards.count();
      expect(allCount).toBeGreaterThan(clientCount);
    });

    await test.step('3. Search across vessel name, berth, and email, handling empty states', async () => {
      // Search by vessel name: Windbird III
      await accounts.searchAccounts('Windbird III');
      await expect(accounts.getUserCard('David Mercer')).toBeVisible({ timeout: 15000 });
      await expect(accounts.getUserCard('Jack Henderson')).toBeHidden({ timeout: 15000 });

      // Search by marina berth: Haslar Marina
      await accounts.searchAccounts('Haslar Marina');
      await expect(accounts.getUserCard('David Mercer')).toBeVisible({ timeout: 15000 });

      // Search by staff email: jack.tech@ajwmes.co.uk
      await accounts.searchAccounts('jack.tech@ajwmes.co.uk');
      await expect(accounts.getUserCard('Jack Henderson')).toBeVisible({ timeout: 15000 });
      await expect(accounts.getUserCard('David Mercer')).toBeHidden({ timeout: 15000 });

      // Search for unmatched query -> assert empty state
      await accounts.searchAccounts('NonExistentYachtXZ123');
      await expect(accounts.emptyState).toBeVisible({ timeout: 15000 });
      await expect(accounts.emptyState).toContainText('No user accounts found matching your query');

      // Clear search -> verify list restored
      await accounts.clearSearch();
      await expect(accounts.emptyState).toBeHidden({ timeout: 15000 });
      await expect(accounts.getUserCard('Anthony Wrather')).toBeVisible({ timeout: 15000 });
    });

    // =========================================================================
    // 3. New Boat Owner Account Provisioning Modal
    // =========================================================================
    await test.step('4. Provision new vessel owner account via Add Account modal', async () => {
      await accounts.openAddUserModal();

      await accounts.fillAndSubmitNewUser({
        name: testUserName,
        email: testUserEmail,
        phone: '023 9258 4411',
        role: 'client',
        vesselName: 'Hamble Star',
        vesselType: 'Sailing Yacht',
        marinaBerth: 'Port Hamble Marina',
        systemVoltage: '24V'
      });

      // Verify user card rendered in directory with profile metadata
      const newCard = accounts.getUserCard(testUserEmail);
      await expect(newCard).toBeVisible({ timeout: 15000 });
      await expect(newCard).toContainText(testUserEmail);
      await expect(newCard).toContainText('Hamble Star (Sailing Yacht)');
      await expect(newCard).toContainText('Port Hamble Marina');
    });

    // =========================================================================
    // 4. Inline RBAC Role Elevation & Edit Profile
    // =========================================================================
    await test.step('5. Elevate newly created user role and edit profile metadata', async () => {
      // Elevate Captain Eleanor Vance from client to technician
      await accounts.elevateUserRole(testUserEmail, 'technician');
      await expect(page.getByText('Role updated to TECHNICIAN')).toBeVisible({ timeout: 15000 });

      // Verify updated role badge on card
      const elevatedCard = accounts.getUserCard(testUserEmail);
      await expect(elevatedCard).toContainText(/Field Tech|Technician/i);
      await expect(elevatedCard.getByTestId('user-role-select')).toHaveValue('technician');

      // Edit profile details via Edit User Modal
      await accounts.openEditUserModal(testUserEmail);
      await accounts.fillAndSubmitEditUser({
        phone: '023 9258 9900',
        vesselName: 'Hamble Star II'
      });
      await expect(page.getByText(`Account details for ${testUserName} updated`)).toBeVisible({ timeout: 15000 });

      // Verify edited details reflected on card
      const editedCard = accounts.getUserCard(testUserEmail);
      await expect(editedCard).toContainText('Hamble Star II', { timeout: 15000 });
      await expect(editedCard).toContainText('023 9258 9900', { timeout: 15000 });
    });

    await test.step('6. Verify Website Admin account is protected against modification', async () => {
      // Filter by searching for Website Admin account (site@ajwmes.co.uk)
      await accounts.searchAccounts('site@ajwmes.co.uk');
      const siteCard = accounts.getUserCard('site@ajwmes.co.uk');
      await expect(siteCard).toBeVisible();
      await expect(siteCard.getByTestId('locked-site-role-badge')).toBeVisible();
      await expect(siteCard.getByTestId('locked-site-role-badge')).toContainText('Site Admin (Protected)');

      // Ensure role selector and delete button are absent/disabled for site admin
      await expect(siteCard.getByTestId('user-role-select')).toBeHidden();
      await expect(siteCard.getByTestId('delete-user-button')).toBeHidden();

      // Clear search to restore full directory view
      await accounts.clearSearch();
    });

    // =========================================================================
    // 5. Safe Account Deletion
    // =========================================================================
    await test.step('7. Safely delete test account and assert removal from directory', async () => {
      await accounts.deleteUser(testUserEmail);
      await expect(page.getByText(`Account ${testUserName} removed from database`)).toBeVisible({ timeout: 15000 });

      // Assert card is no longer in DOM
      await expect(accounts.getUserCard(testUserEmail)).toBeHidden({ timeout: 15000 });
    });
  });
});
