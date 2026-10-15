import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  calculateTotalExpenses, 
  calculateBillableExpenses, 
  calculateOverheadExpenses, 
  calculateExpensesByCategory, 
  filterExpensesByJob, 
  calculateJobFinancialSummary,
  getCategoryLabel,
  getCategoryBadgeClass
} from './expenseCalculations';
import { JobExpense, JobRecord } from '../types';

const mockExpenses: JobExpense[] = [
  {
    id: 'exp-1',
    jobId: 'job-101',
    jobReference: 'AJW-2026-088',
    vesselName: 'Windbird III',
    clientName: 'David Mercer',
    category: 'fuel',
    description: 'Workshop van diesel to Swanwick Marina',
    amount: 32.50,
    date: '2026-10-08',
    vendor: 'Shell Gosport',
    isBillableToClient: false,
    status: 'recorded',
    createdAt: '2026-10-08T10:00:00Z'
  },
  {
    id: 'exp-2',
    jobId: 'job-101',
    jobReference: 'AJW-2026-088',
    vesselName: 'Windbird III',
    clientName: 'David Mercer',
    category: 'subcontractor',
    description: 'Specialist marine rigger masthead cable pull assist',
    amount: 150.00,
    date: '2026-10-08',
    vendor: 'Solent Rigging Ltd',
    isBillableToClient: true,
    status: 'billed',
    createdAt: '2026-10-08T14:30:00Z'
  },
  {
    id: 'exp-3',
    jobId: 'job-102',
    jobReference: 'AJW-2026-089',
    vesselName: 'Sea Sprite',
    clientName: 'Mark Henderson',
    category: 'travel',
    description: 'Red Funnel ferry vehicle return crossing to Cowes',
    amount: 68.00,
    date: '2026-10-09',
    vendor: 'Red Funnel',
    isBillableToClient: true,
    status: 'recorded',
    createdAt: '2026-10-09T08:15:00Z'
  },
  {
    id: 'exp-4',
    jobId: 'job-101',
    jobReference: 'AJW-2026-088',
    vesselName: 'Windbird III',
    clientName: 'David Mercer',
    category: 'berthing_harbor',
    description: 'Temporary contractor berth access fee',
    amount: 15.00,
    date: '2026-10-08',
    vendor: 'Haslar Marina',
    isBillableToClient: true,
    status: 'billed',
    createdAt: '2026-10-08T16:00:00Z'
  }
];

const mockJob: JobRecord = {
  id: 'job-101',
  reference: 'AJW-2026-088',
  clientName: 'David Mercer',
  clientEmail: 'd.mercer@solent-sail.co.uk',
  clientPhone: '07700 900142',
  vesselName: 'Windbird III',
  vesselType: 'Moody 33 Sailing Yacht',
  berthLocation: 'Haslar Marina, Gosport (Pontoon C14)',
  serviceCategory: 'lithium',
  status: 'in_progress',
  hourlyRate: 25,
  diagnosticHours: 4,
  materialsUsed: [
    { id: 'm1', name: 'Cable 35mm²', quantity: 2, unit: 'm', unitPrice: 10 }
  ],
  notes: 'Testing battery bank',
  totalLabor: 100, // 4 * 25
  totalMaterials: 20, // 2 * 10
  totalEstimated: 120,
  depositPaid: true,
  depositAmount: 50,
  createdAt: '2026-10-06 11:20',
  messages: []
};

describe('expenseCalculations', () => {
  describe('calculateTotalExpenses', () => {
    it('returns 0 for empty or undefined expenses array', () => {
      assert.equal(calculateTotalExpenses([]), 0);
      assert.equal(calculateTotalExpenses(undefined), 0);
      assert.equal(calculateTotalExpenses(null), 0);
    });

    it('sums expense amounts accurately with decimal precision', () => {
      // 32.50 + 150.00 + 68.00 + 15.00 = 265.50
      assert.equal(calculateTotalExpenses(mockExpenses), 265.50);
    });

    it('ignores negative or NaN expense values safely', () => {
      const dirty: JobExpense[] = [
        { ...mockExpenses[0], amount: -20 },
        { ...mockExpenses[1], amount: 50 },
        { ...mockExpenses[2], amount: NaN }
      ];
      assert.equal(calculateTotalExpenses(dirty), 50);
    });
  });

  describe('calculateBillableExpenses & calculateOverheadExpenses', () => {
    it('calculates billable total correctly', () => {
      // Billable: exp-2 (150.00) + exp-3 (68.00) + exp-4 (15.00) = 233.00
      assert.equal(calculateBillableExpenses(mockExpenses), 233.00);
    });

    it('calculates non-billable overhead total correctly', () => {
      // Non-billable: exp-1 (32.50)
      assert.equal(calculateOverheadExpenses(mockExpenses), 32.50);
    });

    it('billable + overhead equals total expenses', () => {
      const billable = calculateBillableExpenses(mockExpenses);
      const overhead = calculateOverheadExpenses(mockExpenses);
      const total = calculateTotalExpenses(mockExpenses);
      assert.equal(Math.round((billable + overhead) * 100) / 100, total);
    });
  });

  describe('calculateExpensesByCategory', () => {
    it('aggregates amounts under corresponding categories', () => {
      const breakdown = calculateExpensesByCategory(mockExpenses);
      assert.equal(breakdown.fuel, 32.50);
      assert.equal(breakdown.subcontractor, 150.00);
      assert.equal(breakdown.travel, 68.00);
      assert.equal(breakdown.berthing_harbor, 15.00);
      assert.equal(breakdown.equipment_hire, 0);
      assert.equal(breakdown.consumables, 0);
      assert.equal(breakdown.other, 0);
    });

    it('handles empty input gracefully', () => {
      const breakdown = calculateExpensesByCategory([]);
      assert.equal(breakdown.fuel, 0);
      assert.equal(breakdown.travel, 0);
      assert.equal(breakdown.subcontractor, 0);
    });
  });

  describe('filterExpensesByJob', () => {
    it('returns only expenses associated with the specified job ID', () => {
      const job101Expenses = filterExpensesByJob(mockExpenses, 'job-101');
      assert.equal(job101Expenses.length, 3);
      assert.ok(job101Expenses.every(e => e.jobId === 'job-101'));

      const job102Expenses = filterExpensesByJob(mockExpenses, 'job-102');
      assert.equal(job102Expenses.length, 1);
      assert.equal(job102Expenses[0].id, 'exp-3');
    });

    it('returns empty array when no matching job or invalid jobId', () => {
      assert.deepEqual(filterExpensesByJob(mockExpenses, 'job-nonexistent'), []);
      assert.deepEqual(filterExpensesByJob(mockExpenses, ''), []);
      assert.deepEqual(filterExpensesByJob(null, 'job-101'), []);
    });
  });

  describe('calculateJobFinancialSummary', () => {
    it('computes correct job financial rollup with labor, materials, and expenses', () => {
      const summary = calculateJobFinancialSummary(mockJob, mockExpenses);

      // Diagnostic Labor: 4 hrs @ £25 = £100
      assert.equal(summary.laborTotal, 100);
      // Catalog Materials: 2 * £10 = £20
      assert.equal(summary.catalogMaterialsTotal, 20);
      // Non-catalog expenses for job-101: 32.50 + 150 + 15 = 197.50
      assert.equal(summary.nonCatalogExpensesTotal, 197.50);
      // Billable expenses: 150 + 15 = 165
      assert.equal(summary.billableExpensesTotal, 165.00);
      // Overhead expenses: 32.50
      assert.equal(summary.overheadExpensesTotal, 32.50);
      // Client invoice: labor (100) + materials (20) + billable expenses (165) = 285.00
      assert.equal(summary.clientInvoiceTotal, 285.00);
      // Direct cost: materials (20) + all non-catalog expenses (197.50) = 217.50
      assert.equal(summary.directCostTotal, 217.50);
      // Gross profit: client invoice (285) - direct cost (217.50) = 67.50
      assert.equal(summary.grossProfit, 67.50);
      // Profit margin: (67.50 / 285) * 100 = 23.68% -> 23.7%
      assert.equal(summary.profitMarginPercent, 23.7);
      assert.equal(summary.expensesCount, 3);
    });

    it('handles job with zero expenses cleanly', () => {
      const summary = calculateJobFinancialSummary(mockJob, []);
      assert.equal(summary.nonCatalogExpensesTotal, 0);
      assert.equal(summary.billableExpensesTotal, 0);
      assert.equal(summary.clientInvoiceTotal, 120); // 100 labor + 20 materials
      assert.equal(summary.grossProfit, 100); // 120 invoice - 20 materials
      assert.equal(summary.expensesCount, 0);
    });
  });

  describe('category labels and badges', () => {
    it('provides descriptive labels for all marine expense categories', () => {
      assert.equal(getCategoryLabel('fuel'), 'Van / Boat Fuel');
      assert.equal(getCategoryLabel('travel'), 'Travel, Ferry & Mileage');
      assert.equal(getCategoryLabel('subcontractor'), 'External Sub-Contractor');
      assert.equal(getCategoryLabel('berthing_harbor'), 'Berthing & Harbor Dues');
    });

    it('provides badge classes for categories', () => {
      assert.ok(getCategoryBadgeClass('fuel').includes('amber'));
      assert.ok(getCategoryBadgeClass('travel').includes('sky'));
      assert.ok(getCategoryBadgeClass('subcontractor').includes('purple'));
    });
  });
});
