import { test, expect } from '@playwright/test';

test.describe('Hardware Inventory & Category Split Save/Restore E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Clear storage for a clean test baseline
    await page.addInitScript(() => {
      window.localStorage.clear();
      window.sessionStorage.clear();
    });
  });

  test('should sign in as admin, verify standalone export/import controls, and sync items and categories', async ({ page }) => {
    // Mock network auth endpoints if intercepted
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

    // 1. Navigate to home page
    await page.goto('/');

    // 2. Sign in as Admin
    const signInNavButton = page.getByTestId('nav-signin-button');
    await expect(signInNavButton).toBeVisible();
    await signInNavButton.click();

    await page.getByTestId('auth-email-input').fill('anthonywrather@gmail.com');
    await page.getByTestId('auth-password-input').fill('ajwmes2026');
    const submitButton = page.getByTestId('auth-submit-button');
    await submitButton.scrollIntoViewIfNeeded();
    await submitButton.click({ force: true });

    // 3. Confirm Admin Operations Dashboard is loaded
    const adminDashboard = page.getByTestId('admin-dashboard');
    await expect(adminDashboard).toBeVisible({ timeout: 10000 });

    // 4. Switch to Stock & Catalog tab
    const catalogTabButton = page.getByTestId('admin-tab-catalog');
    await expect(catalogTabButton).toBeVisible();
    await catalogTabButton.click();

    // 5. Assert the split Export Items and Import Items buttons exist in the toolbar
    const exportItemsBtn = page.getByTestId('export-items-button');
    const importItemsBtn = page.getByTestId('import-items-button');
    const syncMenuBtn = page.getByTestId('sync-menu-button');

    await expect(exportItemsBtn).toBeVisible();
    await expect(importItemsBtn).toBeVisible();
    await expect(syncMenuBtn).toBeVisible();

    // 6. Test Export Items JSON file download
    const downloadPromise = page.waitForEvent('download');
    await exportItemsBtn.click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/ajwmes-inventory-items-.*\.json/);

    // 7. Test Import Items with "Merge & Update Stock" (Google Sheets sync scenario)
    await importItemsBtn.click();
    const importItemsModal = page.getByTestId('import-items-textarea');
    await expect(importItemsModal).toBeVisible();

    // Paste newly updated stock item data
    const newItemJson = JSON.stringify([
      {
        id: 'e2e-sync-inverter-3000w',
        name: 'Victron MultiPlus-II 3000W Inverter Charger',
        category: 'cable',
        specification: 'Pure Sine Wave 12V to 230V 120A Charger',
        unit: 'each',
        unitPrice: 1250.00,
        stockCount: 14,
        inStock: true
      }
    ], null, 2);

    await importItemsModal.fill(newItemJson);

    // Verify validation feedback shows 1 item detected
    const validationBox = page.getByTestId('import-items-validation');
    await expect(validationBox).toBeVisible();
    await expect(validationBox).toContainText('Ready to import 1 items');

    // Ensure Merge strategy is selected
    const mergeMode = page.getByTestId('mode-merge');
    await expect(mergeMode).toBeVisible();

    // Apply import
    const applyImportBtn = page.getByTestId('apply-import-items-button');
    await expect(applyImportBtn).toBeEnabled();
    await applyImportBtn.scrollIntoViewIfNeeded();
    await applyImportBtn.click({ force: true });

    // Modal should close and the new item should be visible in the catalog
    await expect(importItemsModal).not.toBeVisible();
    await expect(page.getByText('Victron MultiPlus-II 3000W Inverter Charger')).toBeVisible();

    // 8. Test Data Sync Dropdown options
    await syncMenuBtn.click();
    const syncDropdown = page.getByTestId('sync-menu-dropdown');
    await expect(syncDropdown).toBeVisible();

    const dropdownExportCats = page.getByTestId('dropdown-export-categories');
    await expect(dropdownExportCats).toBeVisible();
    await syncMenuBtn.click(); // Close dropdown

    // 9. Test Category Management Modal with Category Export & Import
    const categoriesBtn = page.getByRole('button', { name: /Categories \(/i });
    await expect(categoriesBtn).toBeVisible();
    await categoriesBtn.click();

    const exportCatsBtn = page.getByTestId('export-categories-button');
    const importCatsBtn = page.getByTestId('import-categories-button');
    await expect(exportCatsBtn).toBeVisible();
    await expect(importCatsBtn).toBeVisible();

    // Export categories download test
    const catDownloadPromise = page.waitForEvent('download');
    await exportCatsBtn.click({ force: true });
    const catDownload = await catDownloadPromise;
    expect(catDownload.suggestedFilename()).toMatch(/ajwmes-categories-.*\.json/);

    // Import categories test
    await importCatsBtn.click({ force: true });
    const importCatsTextarea = page.getByTestId('import-categories-textarea');
    await expect(importCatsTextarea).toBeVisible();

    const newCategoryJson = JSON.stringify([
      {
        id: 'hybrid_electric',
        label: 'Hybrid Diesel-Electric Propulsion',
        description: 'High voltage 48V electric marine drives and regenerating pods'
      }
    ], null, 2);

    await importCatsTextarea.fill(newCategoryJson);

    const catValidationBox = page.getByTestId('import-categories-validation');
    await expect(catValidationBox).toBeVisible();
    await expect(catValidationBox).toContainText('Ready to import 1 categories');

    const applyCatsBtn = page.getByTestId('apply-import-categories-button');
    await expect(applyCatsBtn).toBeEnabled();
    await applyCatsBtn.scrollIntoViewIfNeeded();
    await applyCatsBtn.click({ force: true });

    // Verify modal closes and category is listed
    await expect(importCatsTextarea).not.toBeVisible();
    await expect(page.getByText('Hybrid Diesel-Electric Propulsion', { exact: true })).toBeVisible();
  });
});
