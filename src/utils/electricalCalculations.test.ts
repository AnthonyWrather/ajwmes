import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDiagnosticLabor,
  calculateMaterialsCost,
  calculateDiagnosticTotal,
  formatStopwatchTime,
  calculateSwitchPanelPrice,
  calculateMinimumPanelWidth
} from './electricalCalculations';
import { MaterialLineItem, SwitchPanelConfig } from '../types';

describe('electricalCalculations', () => {
  describe('calculateDiagnosticLabor', () => {
    it('calculates 0 labor cost for 0 seconds elapsed', () => {
      const result = calculateDiagnosticLabor(0);
      assert.equal(result.hoursLogged, 0);
      assert.equal(result.laborCost, 0);
    });

    it('calculates standard £25/hr rate for 1 hour (3600s)', () => {
      const result = calculateDiagnosticLabor(3600, 25);
      assert.equal(result.hoursLogged, 1);
      assert.equal(result.laborCost, 25);
    });

    it('calculates fractional hours accurately (e.g. 30 mins, 45 mins)', () => {
      const halfHour = calculateDiagnosticLabor(1800, 25);
      assert.equal(halfHour.hoursLogged, 0.5);
      assert.equal(halfHour.laborCost, 12.5);

      const fortyFiveMins = calculateDiagnosticLabor(2700, 25);
      assert.equal(fortyFiveMins.hoursLogged, 0.75);
      assert.equal(fortyFiveMins.laborCost, 18.75);
    });

    it('respects custom hourly rates', () => {
      const customRate = calculateDiagnosticLabor(7200, 35); // 2 hours @ £35/hr
      assert.equal(customRate.hoursLogged, 2);
      assert.equal(customRate.laborCost, 70);
    });

    it('safely handles negative or invalid seconds input', () => {
      const negative = calculateDiagnosticLabor(-500);
      assert.equal(negative.hoursLogged, 0);
      assert.equal(negative.laborCost, 0);

      const nanVal = calculateDiagnosticLabor(NaN);
      assert.equal(nanVal.hoursLogged, 0);
      assert.equal(nanVal.laborCost, 0);
    });
  });

  describe('calculateMaterialsCost', () => {
    it('returns 0 for empty or undefined materials list', () => {
      assert.equal(calculateMaterialsCost([]), 0);
      assert.equal(calculateMaterialsCost(undefined as unknown as MaterialLineItem[]), 0);
    });

    it('sums single and multiple line items with floating point precision', () => {
      const materials: MaterialLineItem[] = [
        { id: 'cab-25', name: 'Tinned Cable 2.5mm', quantity: 5, unit: 'per meter', unitPrice: 2.80 },
        { id: 'fuse-st', name: 'ST Blade Fuse Block', quantity: 1, unit: 'each', unitPrice: 42.50 },
        { id: 'term-m8', name: 'M8 Tinned Lugs (Pack of 4)', quantity: 2, unit: 'pack', unitPrice: 4.25 }
      ];

      // 5 * 2.80 = 14.00
      // 1 * 42.50 = 42.50
      // 2 * 4.25 = 8.50
      // Total = 65.00
      assert.equal(calculateMaterialsCost(materials), 65);
    });

    it('handles zero quantities and negative quantities gracefully', () => {
      const materials: MaterialLineItem[] = [
        { id: 'test-1', name: 'Test Cable', quantity: 0, unit: 'm', unitPrice: 10 },
        { id: 'test-2', name: 'Test Breaker', quantity: -2, unit: 'ea', unitPrice: 15 }
      ];
      assert.equal(calculateMaterialsCost(materials), 0);
    });
  });

  describe('calculateDiagnosticTotal', () => {
    it('combines labor hours and materials into grand total with 2-decimal precision', () => {
      const materials: MaterialLineItem[] = [
        { id: 'item-1', name: 'Victron SmartShunt', quantity: 1, unit: 'each', unitPrice: 115.20 },
        { id: 'item-2', name: 'Heavy Duty 35mm² Cable', quantity: 3, unit: 'per meter', unitPrice: 8.50 }
      ];

      // 5400s = 1.5 hours @ £25 = £37.50
      // Materials = 115.20 + 25.50 = £140.70
      // Grand total = 37.50 + 140.70 = £178.20
      const result = calculateDiagnosticTotal(5400, 25, materials);

      assert.equal(result.hoursLogged, 1.5);
      assert.equal(result.laborCost, 37.5);
      assert.equal(result.materialsCost, 140.7);
      assert.equal(result.totalCost, 178.2);
    });
  });

  describe('formatStopwatchTime', () => {
    it('formats seconds into HH:MM:SS with leading zeroes', () => {
      assert.equal(formatStopwatchTime(0), '00:00:00');
      assert.equal(formatStopwatchTime(5), '00:00:05');
      assert.equal(formatStopwatchTime(65), '00:01:05');
      assert.equal(formatStopwatchTime(3600), '01:00:00');
      assert.equal(formatStopwatchTime(3661), '01:01:01');
      assert.equal(formatStopwatchTime(36000), '10:00:00');
    });

    it('clamps negative values to 00:00:00', () => {
      assert.equal(formatStopwatchTime(-120), '00:00:00');
    });
  });

  describe('calculateSwitchPanelPrice', () => {
    const baseConfig: SwitchPanelConfig = {
      material: 'acrylic_black',
      widthMm: 180,
      heightMm: 140,
      gangCount: 4,
      switches: [],
      hasVoltmeter: false,
      hasUsbCharger: false,
      has12vSocket: false,
      mountingHoleStyle: '4_corner',
      backlightColor: 'cyan',
      packageOption: 'faceplate_only',
      estimatedPrice: 0
    };

    it('calculates base faceplate price for acrylic 4-gang panel', () => {
      // Base (35) + 4 * 2.5 (10) = 45
      const price = calculateSwitchPanelPrice(baseConfig);
      assert.equal(price, 45);
    });

    it('adds surcharge for premium materials (wood_teak, wood_birch)', () => {
      const teakPrice = calculateSwitchPanelPrice({ ...baseConfig, material: 'wood_teak' });
      assert.equal(teakPrice, 45 + 25); // 70

      const birchPrice = calculateSwitchPanelPrice({ ...baseConfig, material: 'wood_birch' });
      assert.equal(birchPrice, 45 + 15); // 60
    });

    it('adds cutout charges for accessories (voltmeter, USB, 12V socket)', () => {
      const withAllCutouts = calculateSwitchPanelPrice({
        ...baseConfig,
        hasVoltmeter: true, // +8
        hasUsbCharger: true, // +10
        has12vSocket: true  // +6
      });
      // 45 + 8 + 10 + 6 = 69
      assert.equal(withAllCutouts, 69);
    });

    it('applies packaging tier pricing correctly', () => {
      // Base for 6 gangs acrylic: 35 + 6 * 2.5 = 50
      const sixGangConfig: SwitchPanelConfig = {
        ...baseConfig,
        gangCount: 6
      };

      // faceplate_only: 50
      assert.equal(calculateSwitchPanelPrice({ ...sixGangConfig, packageOption: 'faceplate_only' }), 50);

      // diy_kit: base + gangs * 8 + 12 => 50 + 48 + 12 = 110
      assert.equal(calculateSwitchPanelPrice({ ...sixGangConfig, packageOption: 'diy_kit' }), 110);

      // assembled_wired: base + gangs * 12 + 35 => 50 + 72 + 35 = 157
      assert.equal(calculateSwitchPanelPrice({ ...sixGangConfig, packageOption: 'assembled_wired' }), 157);
    });

    it('calculates the exact default sample panel price (6-gang acrylic, voltmeter, USB, assembled)', () => {
      // 35 (base) + 6 * 2.5 (15) + 8 (voltmeter) + 10 (USB) = 68 base
      // assembled_wired surcharge = 6 * 12 + 35 = 107
      // Total = 68 + 107 = 175
      const samplePanelConfig: SwitchPanelConfig = {
        ...baseConfig,
        gangCount: 6,
        hasVoltmeter: true,
        hasUsbCharger: true,
        packageOption: 'assembled_wired'
      };
      assert.equal(calculateSwitchPanelPrice(samplePanelConfig), 175);
    });
  });

  describe('calculateMinimumPanelWidth', () => {
    it('enforces minimum width of 160mm', () => {
      assert.equal(calculateMinimumPanelWidth(2, false), 160);
      assert.equal(calculateMinimumPanelWidth(4, false), 160);
    });

    it('scales width for larger gang counts and voltmeter cutout', () => {
      // 6 gangs without voltmeter: ceil(3) * 55 = 165
      assert.equal(calculateMinimumPanelWidth(6, false), 165);

      // 6 gangs with voltmeter: ceil(3) * 55 + 45 = 210
      assert.equal(calculateMinimumPanelWidth(6, true), 210);

      // 8 gangs with voltmeter: ceil(4) * 55 + 45 = 265
      assert.equal(calculateMinimumPanelWidth(8, true), 265);
    });
  });
});
