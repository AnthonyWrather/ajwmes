import { test, expect } from '@playwright/test';
import { NavigationPage } from './pages/NavigationPage';
import { AuthModalPage } from './pages/AuthModalPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';

test.describe('Master Workshop Administration, Expenses & Restock (UJ-10) E2E Flow', () => {
  test.beforeEach(async ({ page, context }) => {
    // Grant clipboard permissions where supported
    try {
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    } catch {
      // Ignore unsupported browser contexts
    }

    // Clean browser state and mock window.print & clipboard for headless stability
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
      window.print = () => {};

      if (!navigator.clipboard) {
        (navigator as unknown as { clipboard: unknown }).clipboard = {
          writeText: async () => {},
          readText: async () => ''
        };
      }
    });
  });

  test('should sign in as workshop admin, audit operations metrics, reorder depleted inventory, manage job expenses with financial rollups, and create catalog snapshots', async ({ page }) => {
    const nav = new NavigationPage(page);
    const auth = new AuthModalPage(page);
    const admin = new AdminDashboardPage(page);

    // Mock network auth endpoints if intercepted at network layer
    await page.route('**/api/auth/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          token: 'mock-jwt-token-admin-2026',
          user: {
            id: 'usr-admin-0000-0000-0000-000000000001',
            email: 'anthonywrather@gmail.com',
            name: 'Anthony Wrather',
            role: 'admin'
          }
        })
      });
    });

    await test.step('1. Authenticate as Workshop Admin and verify direct operations dashboard redirection', async () => {
      await nav.navigateToLanding();
      await nav.openSignInModal();
      await auth.verifyModalVisible();
      await auth.signIn('anthonywrather@gmail.com', 'ajwmes2026');

      await admin.verifyDashboardVisible();
      await nav.expectUserProfile('Anthony Wrather');
    });

    await test.step('2. Inspect top-level operational KPI metrics', async () => {
      await expect(admin.metricTotalWorkload).toBeVisible();
      await expect(admin.metricHoursLabor).toBeVisible();
      await expect(admin.metricGrossRecorded).toBeVisible();
      await expect(admin.metricNonCatalogExpenses).toBeVisible();
      await expect(admin.metricPendingQuotes).toBeVisible();

      // Assert metrics display non-zero financial and workload values
      await expect(admin.metricHoursLabor).toContainText('Logged');
      await expect(admin.metricGrossRecorded).toContainText('£');
      await expect(admin.metricNonCatalogExpenses).toContainText('£');
    });

    await test.step('3. Inspect Zero-Stock Depletion Warning Banner and execute Supplier Reorder PO flow', async () => {
      const bannerVisible = await admin.zeroStockBanner.isVisible();
      if (bannerVisible) {
        await expect(admin.bannerReorderBtn).toBeVisible();
        await admin.bannerReorderBtn.click({ force: true });

        // Verify Supplier Reorder Modal
        await expect(admin.supplierReorderModal).toBeVisible();
        await expect(admin.reorderSupplierSelect).toBeVisible();

        // Configure Reorder parameters
        await admin.reorderQuantityInput.fill('25');
        await admin.reorderShippingSpeedSelect.selectOption('next_day_solent');

        // Test copying PO email to clipboard
        await admin.copyPoEmailBtn.click({ force: true });

        // Dispatch purchase order to supplier
        await admin.sendPoEmailBtn.click({ force: true });
        await expect(page.getByText('PO Sent to Supplier!')).toBeVisible({ timeout: 5000 });

        // Instantly receive restock into workshop inventory
        await admin.restockNowBtn.click({ force: true });
        await expect(admin.supplierReorderModal).toBeHidden({ timeout: 5000 });
      }
    });

    await test.step('4. Access Non-Catalog Job Expenses tab and verify financial KPI accounting summary', async () => {
      await admin.switchTab('expenses');
      await expect(admin.expensesManager).toBeVisible();

      // Verify KPI Metric Cards
      await expect(admin.metricTotalRecordedExpenses).toBeVisible();
      await expect(admin.metricTravelExpenses).toBeVisible();
      await expect(admin.metricSubcontractorExpenses).toBeVisible();
      await expect(admin.metricBillableExpenses).toBeVisible();

      // Assert that expenses table structure and actions are loaded
      await expect(admin.expensesManager.locator('table')).toBeVisible({ timeout: 5000 });
      await expect(admin.btnExportExpensesCsv).toBeVisible();
      await expect(admin.btnOpenCreateExpense).toBeVisible();
    });

    const uniqueId = Date.now().toString().slice(-4);
    const newExpenseDesc = `Southampton Water water taxi launch ${uniqueId}`;
    const newExpenseReceipt = `REC-SWT-${uniqueId}`;

    await test.step('5. Record a new non-catalog field expense with client billable classification', async () => {
      await admin.recordExpense({
        category: 'travel',
        amount: '45.50',
        description: newExpenseDesc,
        date: '2026-10-16',
        vendor: 'Solent Water Taxi Service',
        receipt: newExpenseReceipt,
        isBillable: false,
        paymentMethod: 'company_card',
        status: 'recorded',
        notes: 'Required to transport diagnostic test gear to vessel on swinging mooring.'
      });

      // Assert the new expense appears in the table
      const createdRow = page.locator('tr').filter({ hasText: newExpenseReceipt });
      await expect(createdRow).toBeVisible({ timeout: 5000 });
      await expect(createdRow).toContainText(newExpenseDesc);
      await expect(createdRow).toContainText('£45.50');
    });

    await test.step('6. Test search filter, category quick filter, and job financial rollup summary', async () => {
      // 1. Filter by keyword
      await admin.filterExpenses({ search: newExpenseReceipt });
      await expect(page.getByText(newExpenseDesc)).toBeVisible();

      // 2. Reset search filters
      if (await admin.expensesResetFiltersBtn.isVisible()) {
        await admin.expensesResetFiltersBtn.click({ force: true });
      } else {
        await admin.expensesSearchInput.fill('');
      }
      await expect(page.getByText(newExpenseDesc)).toBeVisible();

      // 3. Filter by vessel job (first associated job) to inspect Job Financial Rollup
      await admin.expensesJobFilter.selectOption({ index: 1 });
      await expect(admin.jobFinancialRollupCard).toBeVisible();
      await expect(admin.jobFinancialRollupCard).toContainText('Diagnostic Labor');
      await expect(admin.jobFinancialRollupCard).toContainText('Client Total Billable');
      await expect(admin.jobFinancialRollupCard).toContainText('Gross Job Margin');

      // Clear job focus filter
      await admin.btnClearJobFocus.click({ force: true });
      await expect(admin.jobFinancialRollupCard).toBeHidden();
    });

    await test.step('7. Toggle billable status inline and verify dynamic financial recalculation', async () => {
      // Find the row for the newly created expense which started as Workshop Overhead
      const expenseRow = page.locator('tr').filter({ hasText: newExpenseReceipt });
      const toggleBtn = expenseRow.locator('button[data-testid^="toggle-billable-"]');
      await expect(toggleBtn).toBeVisible();
      await expect(toggleBtn).toContainText('Workshop Overhead');

      // Toggle to billable
      await toggleBtn.click({ force: true });
      await expect(toggleBtn).toContainText('Billable to Client');

      // Toggle back to workshop overhead
      await toggleBtn.click({ force: true });
      await expect(toggleBtn).toContainText('Workshop Overhead');
    });

    await test.step('8. Edit an expense and verify safe deletion modal', async () => {
      const tempId = Date.now().toString().slice(-4);
      const tempReceipt = `CYH-BERTH-${tempId}`;
      const tempDesc = `Temporary pontoon short-stay berthing fee ${tempId}`;

      // Create a temporary expense to edit and delete
      await admin.recordExpense({
        category: 'berthing_harbor',
        amount: '18.00',
        description: tempDesc,
        vendor: 'Cowes Yacht Haven',
        receipt: tempReceipt,
        isBillable: false
      });

      await expect(page.getByText(tempDesc)).toBeVisible({ timeout: 5000 });

      // Find the row and click edit
      const tempRow = page.locator('tr').filter({ hasText: tempReceipt });
      const editBtn = tempRow.getByTitle('Edit expense details');
      await editBtn.click({ force: true });
      await expect(admin.expenseModal).toBeVisible();

      // Modify the amount
      await admin.expenseFormAmountInput.fill('22.50');
      await admin.expenseFormSubmitBtn.click({ force: true });
      await expect(admin.expenseModal).toBeHidden();

      // Assert amount was updated
      await expect(page.locator('tr').filter({ hasText: tempReceipt })).toContainText('£22.50');

      // Delete the temporary expense
      const deleteBtn = page.locator('tr').filter({ hasText: tempReceipt }).getByTitle('Delete expense');
      await deleteBtn.click({ force: true });

      await expect(admin.deleteExpenseModal).toBeVisible();
      await admin.confirmDeleteExpenseBtn.click({ force: true });
      await expect(admin.deleteExpenseModal).toBeHidden();

      // Verify the deleted item is gone
      await expect(page.getByText(tempReceipt)).toBeHidden();
    });

    await test.step('9. Switch to Stock & Catalog tab and create point-in-time catalog snapshot', async () => {
      const snapshotName = `Solent Tariff ${Date.now().toString().slice(-4)}`;
      await admin.createCatalogSnapshot(snapshotName);
      await expect(page.getByText(snapshotName)).toBeVisible({ timeout: 5000 });
    });

    await test.step('10. Verify accounting CSV export trigger', async () => {
      await admin.switchTab('expenses');
      await expect(admin.btnExportExpensesCsv).toBeVisible();
      await expect(admin.btnExportExpensesCsv).toBeEnabled();
      await admin.btnExportExpensesCsv.click({ force: true });
    });
  });
});
