import { Page, Locator, expect } from '@playwright/test';

export interface ExpenseRecordPayload {
  jobId?: string;
  category: string;
  amount: number | string;
  description: string;
  date?: string;
  vendor?: string;
  receipt?: string;
  isBillable?: boolean;
  paymentMethod?: string;
  status?: string;
  notes?: string;
}

export class AdminDashboardPage {
  readonly page: Page;

  // Root Dashboard Elements
  readonly adminDashboard: Locator;
  readonly dashboardTitle: Locator;

  // Tabs
  readonly tabJobs: Locator;
  readonly tabExpenses: Locator;
  readonly tabCatalog: Locator;
  readonly tabOrders: Locator;
  readonly tabAccounts: Locator;
  readonly tabPanels: Locator;
  readonly tabPrint: Locator;

  // Top Metrics
  readonly metricTotalWorkload: Locator;
  readonly metricHoursLabor: Locator;
  readonly metricGrossRecorded: Locator;
  readonly metricNonCatalogExpenses: Locator;
  readonly metricPendingQuotes: Locator;

  // Critical Depletion Banner
  readonly zeroStockBanner: Locator;
  readonly bannerReorderBtn: Locator;
  readonly bannerViewCatalogBtn: Locator;

  // Expenses Manager
  readonly expensesManager: Locator;
  readonly btnExportExpensesCsv: Locator;
  readonly btnOpenCreateExpense: Locator;
  readonly metricTotalRecordedExpenses: Locator;
  readonly metricTravelExpenses: Locator;
  readonly metricSubcontractorExpenses: Locator;
  readonly metricBillableExpenses: Locator;
  readonly jobFinancialRollupCard: Locator;
  readonly btnAddExpenseToJob: Locator;
  readonly btnClearJobFocus: Locator;

  // Expenses Filter & Search
  readonly expensesSearchInput: Locator;
  readonly expensesJobFilter: Locator;
  readonly expensesCategoryFilter: Locator;
  readonly expensesBillableFilter: Locator;
  readonly expensesResetFiltersBtn: Locator;
  readonly expenseQuickFilterAll: Locator;

  // Expense Create / Edit Modal
  readonly expenseModal: Locator;
  readonly expenseFormJobSelect: Locator;
  readonly expenseFormCategorySelect: Locator;
  readonly expenseFormAmountInput: Locator;
  readonly expenseFormDescriptionInput: Locator;
  readonly expenseFormDateInput: Locator;
  readonly expenseFormVendorInput: Locator;
  readonly expenseFormReceiptInput: Locator;
  readonly expenseFormPaymentSelect: Locator;
  readonly expenseFormBillableCheckbox: Locator;
  readonly expenseFormStatusSelect: Locator;
  readonly expenseFormNotesInput: Locator;
  readonly expenseFormSubmitBtn: Locator;
  readonly expenseFormCancelBtn: Locator;
  readonly expenseModalCloseBtn: Locator;

  // Delete Expense Confirmation
  readonly deleteExpenseModal: Locator;
  readonly confirmDeleteExpenseBtn: Locator;
  readonly cancelDeleteExpenseBtn: Locator;

  // Supplier Reorder Modal
  readonly supplierReorderModal: Locator;
  readonly reorderSupplierSelect: Locator;
  readonly reorderQuantityInput: Locator;
  readonly reorderUnitCostInput: Locator;
  readonly reorderShippingSpeedSelect: Locator;
  readonly copyPoEmailBtn: Locator;
  readonly restockNowBtn: Locator;
  readonly sendPoEmailBtn: Locator;
  readonly closeSupplierReorderModalBtn: Locator;
  readonly cancelReorderBtn: Locator;

  // Catalog Snapshots (Save Points)
  readonly toggleSnapshotsBtn: Locator;
  readonly snapshotLabelInput: Locator;
  readonly saveSnapshotBtn: Locator;
  readonly snapshotsList: Locator;

  constructor(page: Page) {
    this.page = page;

    // Root Dashboard
    this.adminDashboard = page.getByTestId('admin-dashboard');
    this.dashboardTitle = page.getByTestId('admin-dashboard-title');

    // Tabs
    this.tabJobs = page.getByTestId('admin-tab-jobs');
    this.tabExpenses = page.getByTestId('admin-tab-expenses');
    this.tabCatalog = page.getByTestId('admin-tab-catalog');
    this.tabOrders = page.getByTestId('admin-tab-orders');
    this.tabAccounts = page.getByTestId('admin-tab-accounts');
    this.tabPanels = page.getByTestId('admin-tab-panels');
    this.tabPrint = page.getByTestId('admin-tab-print');

    // Metrics
    this.metricTotalWorkload = page.getByTestId('metric-total-workload');
    this.metricHoursLabor = page.getByTestId('metric-hours-labor');
    this.metricGrossRecorded = page.getByTestId('metric-gross-recorded');
    this.metricNonCatalogExpenses = page.getByTestId('metric-non-catalog-expenses');
    this.metricPendingQuotes = page.getByTestId('metric-pending-quotes');

    // Zero-Stock Banner
    this.zeroStockBanner = page.getByTestId('zero-stock-banner');
    this.bannerReorderBtn = page.getByTestId('banner-reorder-btn');
    this.bannerViewCatalogBtn = page.getByTestId('banner-view-catalog-btn');

    // Expenses Manager
    this.expensesManager = page.getByTestId('expenses-manager');
    this.btnExportExpensesCsv = page.getByTestId('export-expenses-csv-btn');
    this.btnOpenCreateExpense = page.getByTestId('open-create-expense-btn');
    this.metricTotalRecordedExpenses = page.getByTestId('metric-total-recorded-expenses');
    this.metricTravelExpenses = page.getByTestId('metric-travel-expenses');
    this.metricSubcontractorExpenses = page.getByTestId('metric-subcontractor-expenses');
    this.metricBillableExpenses = page.getByTestId('metric-billable-expenses');
    this.jobFinancialRollupCard = page.getByTestId('job-financial-rollup-card');
    this.btnAddExpenseToJob = page.getByTestId('add-expense-to-job-btn');
    this.btnClearJobFocus = page.getByTestId('clear-job-focus-btn');

    // Expenses Filter
    this.expensesSearchInput = page.getByTestId('expenses-search-input');
    this.expensesJobFilter = page.getByTestId('expenses-job-filter');
    this.expensesCategoryFilter = page.getByTestId('expenses-category-filter');
    this.expensesBillableFilter = page.getByTestId('expenses-billable-filter');
    this.expensesResetFiltersBtn = page.getByTestId('expenses-reset-filters-btn');
    this.expenseQuickFilterAll = page.getByTestId('expense-quick-filter-all');

    // Expense Form Modal
    this.expenseModal = page.getByTestId('expense-modal');
    this.expenseFormJobSelect = page.getByTestId('expense-form-job-select');
    this.expenseFormCategorySelect = page.getByTestId('expense-form-category-select');
    this.expenseFormAmountInput = page.getByTestId('expense-form-amount-input');
    this.expenseFormDescriptionInput = page.getByTestId('expense-form-description-input');
    this.expenseFormDateInput = page.getByTestId('expense-form-date-input');
    this.expenseFormVendorInput = page.getByTestId('expense-form-vendor-input');
    this.expenseFormReceiptInput = page.getByTestId('expense-form-receipt-input');
    this.expenseFormPaymentSelect = page.getByTestId('expense-form-payment-select');
    this.expenseFormBillableCheckbox = page.getByTestId('expense-form-billable-checkbox');
    this.expenseFormStatusSelect = page.getByTestId('expense-form-status-select');
    this.expenseFormNotesInput = page.getByTestId('expense-form-notes-input');
    this.expenseFormSubmitBtn = page.getByTestId('expense-form-submit-btn');
    this.expenseFormCancelBtn = page.getByTestId('expense-form-cancel-btn');
    this.expenseModalCloseBtn = page.getByTestId('expense-modal-close-btn');

    // Delete Modal
    this.deleteExpenseModal = page.getByTestId('delete-expense-modal');
    this.confirmDeleteExpenseBtn = page.getByTestId('confirm-delete-expense-btn');
    this.cancelDeleteExpenseBtn = page.getByTestId('cancel-delete-expense-btn');

    // Supplier Reorder Modal
    this.supplierReorderModal = page.getByTestId('supplier-reorder-modal');
    this.reorderSupplierSelect = page.getByTestId('reorder-supplier-select');
    this.reorderQuantityInput = page.getByTestId('reorder-quantity-input');
    this.reorderUnitCostInput = page.getByTestId('reorder-unit-cost-input');
    this.reorderShippingSpeedSelect = page.getByTestId('reorder-shipping-speed-select');
    this.copyPoEmailBtn = page.getByTestId('copy-po-email-btn');
    this.restockNowBtn = page.getByTestId('restock-now-btn');
    this.sendPoEmailBtn = page.getByTestId('send-po-email-btn');
    this.closeSupplierReorderModalBtn = page.getByTestId('close-supplier-reorder-modal-btn');
    this.cancelReorderBtn = page.getByTestId('cancel-reorder-btn');

    // Catalog Snapshots
    this.toggleSnapshotsBtn = page.getByTestId('toggle-snapshots-btn');
    this.snapshotLabelInput = page.getByTestId('snapshot-label-input');
    this.saveSnapshotBtn = page.getByTestId('save-snapshot-btn');
    this.snapshotsList = page.getByTestId('snapshots-list');
  }

  async verifyDashboardVisible(): Promise<void> {
    await expect(this.adminDashboard).toBeVisible({ timeout: 10000 });
    await expect(this.dashboardTitle).toBeVisible();
    await expect(this.dashboardTitle).toContainText("Anthony's Operations Dashboard");
  }

  async switchTab(tab: 'jobs' | 'expenses' | 'catalog' | 'orders' | 'accounts' | 'panels' | 'print'): Promise<void> {
    switch (tab) {
      case 'jobs':
        await this.tabJobs.click({ force: true });
        break;
      case 'expenses':
        await this.tabExpenses.click({ force: true });
        await expect(this.expensesManager).toBeVisible({ timeout: 5000 });
        break;
      case 'catalog':
        await this.tabCatalog.click({ force: true });
        break;
      case 'orders':
        await this.tabOrders.click({ force: true });
        break;
      case 'accounts':
        await this.tabAccounts.click({ force: true });
        break;
      case 'panels':
        await this.tabPanels.click({ force: true });
        break;
      case 'print':
        await this.tabPrint.click({ force: true });
        break;
    }
  }

  async recordExpense(payload: ExpenseRecordPayload): Promise<void> {
    await this.btnOpenCreateExpense.click({ force: true });
    await expect(this.expenseModal).toBeVisible({ timeout: 5000 });

    if (payload.jobId) {
      await this.expenseFormJobSelect.selectOption(payload.jobId);
    }

    await this.expenseFormCategorySelect.selectOption(payload.category);
    await this.expenseFormAmountInput.fill(payload.amount.toString());
    await this.expenseFormDescriptionInput.fill(payload.description);

    if (payload.date) {
      await this.expenseFormDateInput.fill(payload.date);
    }
    if (payload.vendor) {
      await this.expenseFormVendorInput.fill(payload.vendor);
    }
    if (payload.receipt) {
      await this.expenseFormReceiptInput.fill(payload.receipt);
    }
    if (payload.paymentMethod) {
      await this.expenseFormPaymentSelect.selectOption(payload.paymentMethod);
    }
    if (payload.isBillable !== undefined) {
      const isChecked = await this.expenseFormBillableCheckbox.isChecked();
      if (isChecked !== payload.isBillable) {
        await this.expenseFormBillableCheckbox.click({ force: true });
      }
    }
    if (payload.status) {
      await this.expenseFormStatusSelect.selectOption(payload.status);
    }
    if (payload.notes) {
      await this.expenseFormNotesInput.fill(payload.notes);
    }

    await this.expenseFormSubmitBtn.click({ force: true });
    await expect(this.expenseModal).toBeHidden({ timeout: 5000 });
  }

  async toggleBillable(expenseId: string): Promise<void> {
    const toggleBtn = this.page.getByTestId(`toggle-billable-${expenseId}`);
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.click({ force: true });
  }

  async deleteExpense(expenseId: string): Promise<void> {
    const deleteBtn = this.page.getByTestId(`delete-expense-${expenseId}`);
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click({ force: true });

    await expect(this.deleteExpenseModal).toBeVisible();
    await this.confirmDeleteExpenseBtn.click({ force: true });
    await expect(this.deleteExpenseModal).toBeHidden({ timeout: 5000 });
  }

  async filterExpenses(opts: {
    search?: string;
    jobId?: string;
    category?: string;
    billable?: 'all' | 'billable' | 'overhead';
  }): Promise<void> {
    if (opts.search !== undefined) {
      await this.expensesSearchInput.fill(opts.search);
    }
    if (opts.jobId !== undefined) {
      await this.expensesJobFilter.selectOption(opts.jobId);
    }
    if (opts.category !== undefined) {
      await this.expensesCategoryFilter.selectOption(opts.category);
    }
    if (opts.billable !== undefined) {
      await this.expensesBillableFilter.selectOption(opts.billable);
    }
  }

  async createCatalogSnapshot(label: string): Promise<void> {
    await this.switchTab('catalog');
    if (!(await this.snapshotLabelInput.isVisible())) {
      await this.toggleSnapshotsBtn.click({ force: true });
    }
    await expect(this.snapshotLabelInput).toBeVisible({ timeout: 5000 });
    await this.snapshotLabelInput.fill(label);
    await this.saveSnapshotBtn.click({ force: true });
    await expect(this.snapshotsList).toContainText(label, { timeout: 5000 });
  }
}
