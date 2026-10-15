import { JobExpense, ExpenseCategory, JobRecord } from '../types';

export const ALL_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'fuel',
  'travel',
  'subcontractor',
  'berthing_harbor',
  'equipment_hire',
  'consumables',
  'other'
];

/**
 * Maps an expense category key to human-readable label
 */
export function getCategoryLabel(category: ExpenseCategory): string {
  switch (category) {
    case 'fuel':
      return 'Van / Boat Fuel';
    case 'travel':
      return 'Travel, Ferry & Mileage';
    case 'subcontractor':
      return 'External Sub-Contractor';
    case 'berthing_harbor':
      return 'Berthing & Harbor Dues';
    case 'equipment_hire':
      return 'Specialist Tool & Gear Hire';
    case 'consumables':
      return 'Workshop Consumables & Fasteners';
    case 'other':
    default:
      return 'Other Out-of-Pocket Expense';
  }
}

/**
 * Returns Tailwind badge styling classes for an expense category
 */
export function getCategoryBadgeClass(category: ExpenseCategory): string {
  switch (category) {
    case 'fuel':
      return 'bg-amber-950/80 text-amber-300 border-amber-500/40';
    case 'travel':
      return 'bg-sky-950/80 text-sky-300 border-sky-500/40';
    case 'subcontractor':
      return 'bg-purple-950/80 text-purple-300 border-purple-500/40';
    case 'berthing_harbor':
      return 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';
    case 'equipment_hire':
      return 'bg-orange-950/80 text-orange-300 border-orange-500/40';
    case 'consumables':
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
    case 'other':
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

/**
 * Safely sums the amounts of a list of expenses
 */
export function calculateTotalExpenses(expenses: JobExpense[] | undefined | null): number {
  if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
    return 0;
  }
  const total = expenses.reduce((sum, item) => {
    const val = typeof item.amount === 'number' && !isNaN(item.amount) ? Math.max(0, item.amount) : 0;
    return sum + val;
  }, 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculates total expenses billable/rechargeable to the customer
 */
export function calculateBillableExpenses(expenses: JobExpense[] | undefined | null): number {
  if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
    return 0;
  }
  const billable = expenses.filter(e => Boolean(e.isBillableToClient));
  return calculateTotalExpenses(billable);
}

/**
 * Calculates total non-billable expenses (workshop overhead)
 */
export function calculateOverheadExpenses(expenses: JobExpense[] | undefined | null): number {
  if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
    return 0;
  }
  const nonBillable = expenses.filter(e => !e.isBillableToClient);
  return calculateTotalExpenses(nonBillable);
}

/**
 * Returns breakdown of expense amounts grouped by category
 */
export function calculateExpensesByCategory(
  expenses: JobExpense[] | undefined | null
): Record<ExpenseCategory, number> {
  const breakdown: Record<ExpenseCategory, number> = {
    fuel: 0,
    travel: 0,
    subcontractor: 0,
    berthing_harbor: 0,
    equipment_hire: 0,
    consumables: 0,
    other: 0
  };

  if (!expenses || !Array.isArray(expenses)) {
    return breakdown;
  }

  for (const exp of expenses) {
    const cat = exp.category;
    const amount = typeof exp.amount === 'number' && !isNaN(exp.amount) ? Math.max(0, exp.amount) : 0;
    if (Object.prototype.hasOwnProperty.call(breakdown, cat)) {
      breakdown[cat] = Math.round((breakdown[cat] + amount) * 100) / 100;
    } else {
      breakdown.other = Math.round((breakdown.other + amount) * 100) / 100;
    }
  }

  return breakdown;
}

/**
 * Filters a list of expenses by a specific job ID
 */
export function filterExpensesByJob(expenses: JobExpense[] | undefined | null, jobId: string): JobExpense[] {
  if (!expenses || !Array.isArray(expenses) || !jobId) {
    return [];
  }
  return expenses.filter(e => e.jobId === jobId);
}

export interface JobFinancialSummary {
  diagnosticHours: number;
  hourlyRate: number;
  laborTotal: number;
  catalogMaterialsTotal: number;
  nonCatalogExpensesTotal: number;
  billableExpensesTotal: number;
  overheadExpensesTotal: number;
  clientInvoiceTotal: number;
  directCostTotal: number;
  grossProfit: number;
  profitMarginPercent: number;
  expensesCount: number;
}

/**
 * Calculates the complete job financial summary including labor, catalog materials,
 * and associated non-catalog expenses.
 */
export function calculateJobFinancialSummary(
  job: JobRecord,
  allExpenses: JobExpense[] = []
): JobFinancialSummary {
  const jobExpenses = filterExpensesByJob(allExpenses, job.id);
  
  const diagnosticHours = typeof job.diagnosticHours === 'number' ? Math.max(0, job.diagnosticHours) : 0;
  const hourlyRate = typeof job.hourlyRate === 'number' ? Math.max(0, job.hourlyRate) : 25;
  
  // Labor total
  const laborTotal = typeof job.totalLabor === 'number' 
    ? job.totalLabor 
    : Math.round(diagnosticHours * hourlyRate * 100) / 100;

  // Catalog materials total
  const catalogMaterialsTotal = typeof job.totalMaterials === 'number'
    ? job.totalMaterials
    : Array.isArray(job.materialsUsed)
    ? job.materialsUsed.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    : 0;

  // Non-catalog expenses
  const nonCatalogExpensesTotal = calculateTotalExpenses(jobExpenses);
  const billableExpensesTotal = calculateBillableExpenses(jobExpenses);
  const overheadExpensesTotal = calculateOverheadExpenses(jobExpenses);

  // Client invoice includes labor, materials, and recharged non-catalog expenses
  const clientInvoiceTotal = Math.round((laborTotal + catalogMaterialsTotal + billableExpensesTotal) * 100) / 100;

  // Direct costs to workshop: catalog materials + all non-catalog out-of-pocket expenses
  const directCostTotal = Math.round((catalogMaterialsTotal + nonCatalogExpensesTotal) * 100) / 100;

  // Gross profit: client invoice total minus direct costs
  const grossProfit = Math.round((clientInvoiceTotal - directCostTotal) * 100) / 100;

  // Profit margin %
  const profitMarginPercent = clientInvoiceTotal > 0
    ? Math.round((grossProfit / clientInvoiceTotal) * 1000) / 10
    : 0;

  return {
    diagnosticHours,
    hourlyRate,
    laborTotal: Math.round(laborTotal * 100) / 100,
    catalogMaterialsTotal: Math.round(catalogMaterialsTotal * 100) / 100,
    nonCatalogExpensesTotal,
    billableExpensesTotal,
    overheadExpensesTotal,
    clientInvoiceTotal,
    directCostTotal,
    grossProfit,
    profitMarginPercent,
    expensesCount: jobExpenses.length
  };
}
