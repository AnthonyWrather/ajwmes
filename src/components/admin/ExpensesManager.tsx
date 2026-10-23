import React, { useState, useMemo } from 'react';
import { 
  JobExpense, 
  JobRecord, 
  ExpenseCategory, 
  ExpenseBillableFilter, 
  ExpensePaymentMethod, 
  ExpenseStatus 
} from '../../types';
import { 
  calculateTotalExpenses, 
  calculateBillableExpenses, 
  calculateOverheadExpenses, 
  calculateExpensesByCategory,
  calculateJobFinancialSummary,
  getCategoryLabel,
  getCategoryBadgeClass,
  ALL_EXPENSE_CATEGORIES
} from '../../utils/expenseCalculations';
import { 
  Receipt, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Fuel, 
  Truck, 
  Briefcase, 
  Anchor, 
  Wrench, 
  Package, 
  Coins, 
  Trash2, 
  Edit3, 
  X, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ChevronRight,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

interface ExpensesManagerProps {
  expenses: JobExpense[];
  jobs: JobRecord[];
  onCreateExpense: (expense: Omit<JobExpense, 'id' | 'createdAt'>) => void;
  onUpdateExpense: (expense: JobExpense) => void;
  onDeleteExpense: (expenseId: string) => void;
  initialJobIdFilter?: string;
}

export const ExpensesManager: React.FC<ExpensesManagerProps> = ({
  expenses,
  jobs,
  onCreateExpense,
  onUpdateExpense,
  onDeleteExpense,
  initialJobIdFilter = ''
}) => {
  // Filtering & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>(initialJobIdFilter);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedBillableFilter, setSelectedBillableFilter] = useState<ExpenseBillableFilter>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<JobExpense | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formJobId, setFormJobId] = useState<string>(jobs[0]?.id || '');
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('fuel');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formVendor, setFormVendor] = useState('');
  const [formReceiptRef, setFormReceiptRef] = useState('');
  const [formIsBillable, setFormIsBillable] = useState(false);
  const [formPaymentMethod, setFormPaymentMethod] = useState<ExpensePaymentMethod>('company_card');
  const [formStatus, setFormStatus] = useState<ExpenseStatus>('recorded');
  const [formNotes, setFormNotes] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Open modal for new expense
  const handleOpenCreateModal = (preselectedJobId?: string) => {
    setEditingExpense(null);
    setFormJobId(preselectedJobId || selectedJobFilter || jobs[0]?.id || '');
    setFormCategory('fuel');
    setFormDescription('');
    setFormAmount('');
    setFormDate(new Date().toISOString().split('T')[0]);
    setFormVendor('');
    setFormReceiptRef('');
    setFormIsBillable(false);
    setFormPaymentMethod('company_card');
    setFormStatus('recorded');
    setFormNotes('');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEditModal = (expense: JobExpense) => {
    setEditingExpense(expense);
    setFormJobId(expense.jobId);
    setFormCategory(expense.category);
    setFormDescription(expense.description);
    setFormAmount(expense.amount.toString());
    setFormDate(expense.date);
    setFormVendor(expense.vendor || '');
    setFormReceiptRef(expense.receiptReference || '');
    setFormIsBillable(expense.isBillableToClient);
    setFormPaymentMethod(expense.paymentMethod || 'company_card');
    setFormStatus(expense.status);
    setFormNotes(expense.notes || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  // Submit form
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const associatedJob = jobs.find(j => j.id === formJobId);
    if (!associatedJob) {
      setFormError('Please select a valid vessel job record.');
      return;
    }

    if (!formDescription.trim()) {
      setFormError('Please provide an expense description.');
      return;
    }

    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError('Please enter a valid expense amount greater than £0.00.');
      return;
    }

    if (!formDate) {
      setFormError('Please select a valid expense date.');
      return;
    }

    if (editingExpense) {
      onUpdateExpense({
        ...editingExpense,
        jobId: associatedJob.id,
        jobReference: associatedJob.reference,
        vesselName: associatedJob.vesselName,
        clientName: associatedJob.clientName,
        category: formCategory,
        description: formDescription.trim(),
        amount: Math.round(parsedAmount * 100) / 100,
        date: formDate,
        vendor: formVendor.trim() || undefined,
        receiptReference: formReceiptRef.trim() || undefined,
        isBillableToClient: formIsBillable,
        paymentMethod: formPaymentMethod,
        status: formStatus,
        notes: formNotes.trim() || undefined,
        updatedAt: new Date().toISOString()
      });
    } else {
      onCreateExpense({
        jobId: associatedJob.id,
        jobReference: associatedJob.reference,
        vesselName: associatedJob.vesselName,
        clientName: associatedJob.clientName,
        category: formCategory,
        description: formDescription.trim(),
        amount: Math.round(parsedAmount * 100) / 100,
        date: formDate,
        vendor: formVendor.trim() || undefined,
        receiptReference: formReceiptRef.trim() || undefined,
        isBillableToClient: formIsBillable,
        paymentMethod: formPaymentMethod,
        status: formStatus,
        notes: formNotes.trim() || undefined
      });
    }

    setIsModalOpen(false);
  };

  // Toggle billable inline
  const handleToggleBillable = (expense: JobExpense) => {
    onUpdateExpense({
      ...expense,
      isBillableToClient: !expense.isBillableToClient,
      updatedAt: new Date().toISOString()
    });
  };

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    return expenses.filter(exp => {
      // Job filter
      if (selectedJobFilter && exp.jobId !== selectedJobFilter) {
        return false;
      }
      // Category filter
      if (selectedCategoryFilter !== 'all' && exp.category !== selectedCategoryFilter) {
        return false;
      }
      // Billable filter
      if (selectedBillableFilter === 'billable' && !exp.isBillableToClient) {
        return false;
      }
      if (selectedBillableFilter === 'overhead' && exp.isBillableToClient) {
        return false;
      }
      // Status filter
      if (selectedStatusFilter !== 'all' && exp.status !== selectedStatusFilter) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesDesc = exp.description.toLowerCase().includes(query);
        const matchesVendor = exp.vendor ? exp.vendor.toLowerCase().includes(query) : false;
        const matchesJobRef = exp.jobReference.toLowerCase().includes(query);
        const matchesVessel = exp.vesselName.toLowerCase().includes(query);
        const matchesClient = exp.clientName ? exp.clientName.toLowerCase().includes(query) : false;
        const matchesReceipt = exp.receiptReference ? exp.receiptReference.toLowerCase().includes(query) : false;
        return matchesDesc || matchesVendor || matchesJobRef || matchesVessel || matchesClient || matchesReceipt;
      }
      return true;
    });
  }, [expenses, selectedJobFilter, selectedCategoryFilter, selectedBillableFilter, selectedStatusFilter, searchQuery]);

  // Overall calculations across all expenses
  const totalAmount = calculateTotalExpenses(expenses);
  const billableAmount = calculateBillableExpenses(expenses);
  const overheadAmount = calculateOverheadExpenses(expenses);
  const categoryBreakdown = calculateExpensesByCategory(expenses);

  // Filtered totals
  const filteredTotal = calculateTotalExpenses(filteredExpenses);

  // When a single job is selected, calculate job costing summary
  const selectedJobObj = jobs.find(j => j.id === selectedJobFilter);
  const selectedJobFinancials = selectedJobObj
    ? calculateJobFinancialSummary(selectedJobObj, expenses)
    : null;

  // Category Icon Resolver
  const renderCategoryIcon = (category: ExpenseCategory, className = 'w-3.5 h-3.5') => {
    switch (category) {
      case 'fuel':
        return <Fuel className={className} />;
      case 'travel':
        return <Truck className={className} />;
      case 'subcontractor':
        return <Briefcase className={className} />;
      case 'berthing_harbor':
        return <Anchor className={className} />;
      case 'equipment_hire':
        return <Wrench className={className} />;
      case 'consumables':
        return <Package className={className} />;
      case 'other':
      default:
        return <Receipt className={className} />;
    }
  };

  // Export to CSV
  const handleExportCsv = () => {
    const headers = [
      'Expense ID',
      'Date',
      'Job Reference',
      'Vessel Name',
      'Client Name',
      'Category',
      'Description',
      'Vendor / Payee',
      'Receipt Ref',
      'Amount (£)',
      'Billable To Client',
      'Payment Method',
      'Status',
      'Notes'
    ];

    const rows = filteredExpenses.map(exp => [
      exp.id,
      exp.date,
      `"${exp.jobReference}"`,
      `"${exp.vesselName.replace(/"/g, '""')}"`,
      `"${(exp.clientName || '').replace(/"/g, '""')}"`,
      exp.category,
      `"${exp.description.replace(/"/g, '""')}"`,
      `"${(exp.vendor || '').replace(/"/g, '""')}"`,
      `"${(exp.receiptReference || '').replace(/"/g, '""')}"`,
      exp.amount.toFixed(2),
      exp.isBillableToClient ? 'YES' : 'NO',
      exp.paymentMethod || 'company_card',
      exp.status,
      `"${(exp.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ajwmes-job-expenses-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasActiveFilters = Boolean(
    selectedJobFilter ||
    selectedCategoryFilter !== 'all' ||
    selectedBillableFilter !== 'all' ||
    selectedStatusFilter !== 'all' ||
    searchQuery
  );

  const resetFilters = () => {
    setSelectedJobFilter('');
    setSelectedCategoryFilter('all');
    setSelectedBillableFilter('all');
    setSelectedStatusFilter('all');
    setSearchQuery('');
  };

  return (
    <div data-testid="expenses-manager" className="space-y-6">
      {/* Top Header & Action Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-1">
            <Receipt className="w-4 h-4" />
            <span>Job Cost Accounting &amp; Field Disbursements</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Non-Catalog Job Expenses
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track fuel, Solent travel/ferries, external sub-contractors, harbor dues &amp; specialist gear hire linked to specific vessel jobs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCsv}
            disabled={filteredExpenses.length === 0}
            data-testid="export-expenses-csv-btn"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
            title="Download CSV for accounting"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleOpenCreateModal()}
            data-testid="open-create-expense-btn"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Job Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div data-testid="metric-total-recorded-expenses" className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Total Recorded</span>
            <Receipt className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 block">
            £{totalAmount.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            {expenses.length} total disbursements
          </span>
        </div>

        <div data-testid="metric-travel-expenses" className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Fuel &amp; Solent Travel</span>
            <Fuel className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <span className="text-xl sm:text-2xl font-bold font-mono text-sky-400 mt-1 block">
            £{(categoryBreakdown.fuel + categoryBreakdown.travel).toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Van mileage &amp; ferries
          </span>
        </div>

        <div data-testid="metric-subcontractor-expenses" className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Sub-Contractor Fees</span>
            <Briefcase className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <span className="text-xl sm:text-2xl font-bold font-mono text-purple-400 mt-1 block">
            £{categoryBreakdown.subcontractor.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Riggers, diver assists, etc.
          </span>
        </div>

        <div data-testid="metric-billable-expenses" className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400">Client Billable</span>
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            £{billableAmount.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">
            Overhead absorbed: £{overheadAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* When a specific job is selected: Job Financial Rollup Card */}
      {selectedJobObj && selectedJobFinancials && (
        <div data-testid="job-financial-rollup-card" className="bg-gradient-to-r from-slate-900 via-slate-900 to-sky-950/40 border border-sky-500/40 rounded-2xl p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-950 text-sky-300 border border-sky-500/40">
                  {selectedJobObj.reference}
                </span>
                <span className="text-xs text-slate-400">Associated Vessel Job Financial Summary</span>
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                {selectedJobObj.vesselName} · {selectedJobObj.clientName}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleOpenCreateModal(selectedJobObj.id)}
                data-testid="add-expense-to-job-btn"
                className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense to This Job</span>
              </button>

              <button
                onClick={() => setSelectedJobFilter('')}
                data-testid="clear-job-focus-btn"
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                title="Clear job focus filter"
              >
                <X className="w-3.5 h-3.5" />
                <span>Show All Jobs</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-4 text-xs">
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Diagnostic Labor</span>
              <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                £{selectedJobFinancials.laborTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                {selectedJobFinancials.diagnosticHours}h @ £{selectedJobFinancials.hourlyRate}/h
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Catalog Materials</span>
              <span className="text-sm font-bold font-mono text-white mt-0.5 block">
                £{selectedJobFinancials.catalogMaterialsTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Parts &amp; cables used
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Non-Catalog Expenses</span>
              <span className="text-sm font-bold font-mono text-amber-400 mt-0.5 block">
                £{selectedJobFinancials.nonCatalogExpensesTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                £{selectedJobFinancials.billableExpensesTotal.toFixed(2)} recharged to client
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Client Total Billable</span>
              <span className="text-sm font-bold font-mono text-emerald-400 mt-0.5 block">
                £{selectedJobFinancials.clientInvoiceTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Labor + Parts + Billable Exp
              </span>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
              <span className="text-[10px] text-slate-400 block">Gross Job Margin</span>
              <span className="text-sm font-bold font-mono text-sky-400 mt-0.5 block">
                £{selectedJobFinancials.grossProfit.toFixed(2)} ({selectedJobFinancials.profitMarginPercent}%)
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Direct cost: £{selectedJobFinancials.directCostTotal.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              data-testid="expenses-search-input"
              placeholder="Search expenses, vendors, receipts..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500/60"
            />
          </div>

          {/* Job Filter Dropdown */}
          <div className="md:col-span-3">
            <select
              value={selectedJobFilter}
              data-testid="expenses-job-filter"
              onChange={e => setSelectedJobFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500/60 cursor-pointer"
            >
              <option value="">All Associated Jobs ({jobs.length})</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  [{j.reference}] {j.vesselName} ({j.clientName})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedCategoryFilter}
              data-testid="expenses-category-filter"
              onChange={e => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500/60 cursor-pointer"
            >
              <option value="all">All Categories</option>
              {ALL_EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>
                  {getCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          {/* Billable Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedBillableFilter}
              data-testid="expenses-billable-filter"
              onChange={e => setSelectedBillableFilter(e.target.value as ExpenseBillableFilter)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:border-amber-500/60 cursor-pointer"
            >
              <option value="all">Billable &amp; Overhead</option>
              <option value="billable">Rechargeable to Client</option>
              <option value="overhead">Workshop Overhead Only</option>
            </select>
          </div>

          {/* Reset button */}
          <div className="md:col-span-1 flex justify-end">
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                data-testid="expenses-reset-filters-btn"
                className="w-full px-2.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                title="Reset filters"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 text-[11px] font-mono mr-1 shrink-0">Quick Filter:</span>
          <button
            onClick={() => setSelectedCategoryFilter('all')}
            data-testid="expense-quick-filter-all"
            className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0 text-[11px] font-medium cursor-pointer ${
              selectedCategoryFilter === 'all'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            All ({expenses.length})
          </button>
          {ALL_EXPENSE_CATEGORIES.map(cat => {
            const count = expenses.filter(e => e.category === cat).length;
            if (count === 0 && selectedCategoryFilter !== cat) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategoryFilter(cat)}
                data-testid={`expense-quick-filter-${cat}`}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap shrink-0 text-[11px] font-medium cursor-pointer ${
                  selectedCategoryFilter === cat
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {renderCategoryIcon(cat, 'w-3 h-3')}
                <span>{getCategoryLabel(cat)} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Expenses Table / Listing */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {filteredExpenses.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Receipt className="w-10 h-10 text-slate-600 mx-auto" />
            <div>
              <p className="font-semibold text-white">No expenses match your filters</p>
              <p className="text-xs text-slate-500 mt-0.5">
                {expenses.length === 0
                  ? 'No non-catalog expenses have been recorded yet.'
                  : 'Try adjusting your search keywords, job selector, or category filters.'}
              </p>
            </div>
            {hasActiveFilters ? (
              <button
                onClick={resetFilters}
                className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-xl text-xs font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <span>Clear All Filters</span>
              </button>
            ) : (
              <button
                onClick={() => handleOpenCreateModal()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs inline-flex items-center gap-1.5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Record First Expense</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description &amp; Payee</th>
                  <th className="py-3 px-4">Associated Job Record</th>
                  <th className="py-3 px-4">Recharge / Billable</th>
                  <th className="py-3 px-4 text-right">Amount (£)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredExpenses.map(expense => (
                  <tr key={expense.id} data-testid={`expense-row-${expense.id}`} className="hover:bg-slate-800/40 transition-colors group">
                    {/* Date */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {expense.date}
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border ${getCategoryBadgeClass(expense.category)}`}>
                        {renderCategoryIcon(expense.category, 'w-3 h-3')}
                        <span>{getCategoryLabel(expense.category)}</span>
                      </span>
                    </td>

                    {/* Description & Payee */}
                    <td className="py-3 px-4 max-w-xs sm:max-w-md">
                      <p className="font-semibold text-white leading-snug">{expense.description}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400 flex-wrap">
                        {expense.vendor && (
                          <span className="text-slate-300">Payee: {expense.vendor}</span>
                        )}
                        {expense.receiptReference && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-slate-400">Ref: {expense.receiptReference}</span>
                          </>
                        )}
                        {expense.paymentMethod && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="capitalize text-slate-400">{expense.paymentMethod.replace(/_/g, ' ')}</span>
                          </>
                        )}
                      </div>
                      {expense.notes && (
                        <p className="text-[10px] text-slate-400 italic mt-1 line-clamp-1">
                          {expense.notes}
                        </p>
                      )}
                    </td>

                    {/* Associated Job Record */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedJobFilter(expense.jobId)}
                        className="text-left group/job hover:underline block"
                        title="Click to filter by this job record"
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-sky-400 font-bold text-[11px]">
                            {expense.jobReference}
                          </span>
                          <ChevronRight className="w-3 h-3 text-slate-500 group-hover/job:translate-x-0.5 transition-transform" />
                        </div>
                        <div className="text-[11px] text-white font-medium">
                          {expense.vesselName}
                        </div>
                        {expense.clientName && (
                          <div className="text-[10px] text-slate-500">
                            {expense.clientName}
                          </div>
                        )}
                      </button>
                    </td>

                    {/* Billable Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleBillable(expense)}
                        data-testid={`toggle-billable-${expense.id}`}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold border cursor-pointer transition-colors ${
                          expense.isBillableToClient
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                        title="Click to toggle billable to client"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${expense.isBillableToClient ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                        <span>{expense.isBillableToClient ? 'Billable to Client' : 'Workshop Overhead'}</span>
                      </button>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-sm text-white whitespace-nowrap">
                      £{expense.amount.toFixed(2)}
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono capitalize border ${
                        expense.status === 'billed'
                          ? 'bg-sky-950 text-sky-300 border-sky-500/40'
                          : expense.status === 'reimbursed'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {expense.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEditModal(expense)}
                          data-testid={`edit-expense-${expense.id}`}
                          className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                          title="Edit expense details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setDeleteConfirmId(expense.id)}
                          data-testid={`delete-expense-${expense.id}`}
                          className="p-1.5 hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Delete expense"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer with summary */}
        {filteredExpenses.length > 0 && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-2">
            <div>
              Showing <span className="text-white font-semibold">{filteredExpenses.length}</span> of{' '}
              <span className="text-white font-semibold">{expenses.length}</span> expenses
              {selectedJobObj && (
                <span> for <span className="text-sky-400 font-semibold">{selectedJobObj.vesselName}</span></span>
              )}
            </div>
            <div className="font-mono text-xs">
              Filtered Total:{' '}
              <span className="text-emerald-400 font-bold text-sm">
                £{filteredTotal.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div data-testid="delete-expense-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Delete Expense Record?</h3>
                <p className="text-xs text-slate-400 mt-0.5">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to remove this expense? It will be deleted from the associated job accounting ledger.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                data-testid="cancel-delete-expense-btn"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDeleteExpense(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                data-testid="confirm-delete-expense-btn"
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Delete Expense
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Expense Modal */}
      {isModalOpen && (
        <div data-testid="expense-modal" className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    {editingExpense ? 'Edit Job Expense' : 'Record Non-Catalog Job Expense'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Associate out-of-pocket costs with a vessel job record.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsModalOpen(false)}
                data-testid="expense-modal-close-btn"
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div data-testid="expense-form-error" className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitForm} className="space-y-4 text-xs">
              {/* Job Selector (Required) */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Associated Vessel Job Record <span className="text-rose-400">*</span>
                </label>
                <select
                  value={formJobId}
                  data-testid="expense-form-job-select"
                  onChange={e => setFormJobId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500/60"
                  required
                >
                  {jobs.map(job => (
                    <option key={job.id} value={job.id}>
                      [{job.reference}] {job.vesselName} — {job.clientName} ({job.vesselType})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Expenses must be linked to a specific customer job for cost tracking and billing.
                </p>
              </div>

              {/* Category & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Expense Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formCategory}
                    data-testid="expense-form-category-select"
                    onChange={e => setFormCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500/60"
                  >
                    {ALL_EXPENSE_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>
                        {getCategoryLabel(cat)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Amount (£ GBP) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono">£</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0.00"
                      data-testid="expense-form-amount-input"
                      value={formAmount}
                      onChange={e => setFormAmount(e.target.value)}
                      className="w-full pl-7 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-hidden focus:border-amber-500/60"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Expense Description <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Van diesel to Swanwick Marina / Hydraulic lug crimper hire"
                  data-testid="expense-form-description-input"
                  value={formDescription}
                  onChange={e => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500/60"
                  required
                />
              </div>

              {/* Date & Vendor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Date Incurred <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="date"
                    data-testid="expense-form-date-input"
                    value={formDate}
                    onChange={e => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500/60"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Vendor / Payee Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Shell Gosport / Solent Rigging Ltd"
                    data-testid="expense-form-vendor-input"
                    value={formVendor}
                    onChange={e => setFormVendor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500/60"
                  />
                </div>
              </div>

              {/* Receipt Reference & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Receipt / Invoice Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. REC-9921 / INV-2026-44"
                    data-testid="expense-form-receipt-input"
                    value={formReceiptRef}
                    onChange={e => setFormReceiptRef(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono focus:outline-hidden focus:border-amber-500/60"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Payment Method
                  </label>
                  <select
                    value={formPaymentMethod}
                    data-testid="expense-form-payment-select"
                    onChange={e => setFormPaymentMethod(e.target.value as ExpensePaymentMethod)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500/60"
                  >
                    <option value="company_card">Company Debit / Credit Card</option>
                    <option value="fuel_card">Commercial Fuel Card</option>
                    <option value="bacs_transfer">BACS Bank Transfer</option>
                    <option value="cash">Petty Cash</option>
                    <option value="personal_reimbursement">Personal Out-of-Pocket Reimbursement</option>
                  </select>
                </div>
              </div>

              {/* Billable Checkbox & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-1">
                <label className="flex items-center gap-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-slate-700">
                  <input
                    type="checkbox"
                    data-testid="expense-form-billable-checkbox"
                    checked={formIsBillable}
                    onChange={e => setFormIsBillable(e.target.checked)}
                    className="w-4 h-4 text-emerald-500 rounded border-slate-700 bg-slate-900 focus:ring-emerald-500"
                  />
                  <div>
                    <span className="font-semibold text-white block">Billable to Client</span>
                    <span className="text-[10px] text-slate-400 block">
                      Recharge this line item on the customer's final invoice.
                    </span>
                  </div>
                </label>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">
                    Accounting Status
                  </label>
                  <select
                    value={formStatus}
                    data-testid="expense-form-status-select"
                    onChange={e => setFormStatus(e.target.value as ExpenseStatus)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white focus:outline-hidden focus:border-amber-500/60"
                  >
                    <option value="recorded">Recorded (Draft / Open)</option>
                    <option value="billed">Billed to Client</option>
                    <option value="reimbursed">Reimbursed / Settled</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Accounting &amp; Workshop Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Additional context, sub-contractor deliverables, or ferry booking details..."
                  data-testid="expense-form-notes-input"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:border-amber-500/60"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  data-testid="expense-form-cancel-btn"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-testid="expense-form-submit-btn"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {editingExpense ? 'Save Changes' : 'Record Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
