import { MaterialLineItem, SwitchPanelConfig } from '../types';

export interface DiagnosticLaborCalculation {
  hoursLogged: number;
  laborCost: number;
}

export interface DiagnosticTotalCalculation {
  hoursLogged: number;
  laborCost: number;
  materialsCost: number;
  totalCost: number;
}

/**
 * Calculates logged diagnostic hours and labor cost at the Solent flat rate (£25/hr standard).
 */
export function calculateDiagnosticLabor(
  seconds: number,
  hourlyRate: number = 25
): DiagnosticLaborCalculation {
  const safeSeconds = Math.max(0, Number.isFinite(seconds) ? seconds : 0);
  const safeRate = Math.max(0, Number.isFinite(hourlyRate) ? hourlyRate : 25);
  
  const hoursLogged = Number((safeSeconds / 3600).toFixed(2));
  const laborCost = Number((hoursLogged * safeRate).toFixed(2));
  
  return {
    hoursLogged,
    laborCost
  };
}

/**
 * Computes the itemized sum of materials, cables, fuses, and hardware used on a job.
 */
export function calculateMaterialsCost(materials: MaterialLineItem[] = []): number {
  if (!Array.isArray(materials) || materials.length === 0) {
    return 0;
  }

  const rawSum = materials.reduce((acc, item) => {
    const qty = Math.max(0, Number.isFinite(item?.quantity) ? item.quantity : 0);
    const unitPrice = Math.max(0, Number.isFinite(item?.unitPrice) ? item.unitPrice : 0);
    return acc + qty * unitPrice;
  }, 0);

  return Number(rawSum.toFixed(2));
}

/**
 * Combines diagnostic labor and workshop materials into a total job estimate.
 */
export function calculateDiagnosticTotal(
  seconds: number,
  hourlyRate: number = 25,
  materials: MaterialLineItem[] = []
): DiagnosticTotalCalculation {
  const { hoursLogged, laborCost } = calculateDiagnosticLabor(seconds, hourlyRate);
  const materialsCost = calculateMaterialsCost(materials);
  const totalCost = Number((laborCost + materialsCost).toFixed(2));

  return {
    hoursLogged,
    laborCost,
    materialsCost,
    totalCost
  };
}

/**
 * Formats elapsed seconds into HH:MM:SS stopwatch string.
 */
export function formatStopwatchTime(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(Number.isFinite(totalSeconds) ? totalSeconds : 0));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;
  
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Computes estimated custom switch panel price based on material, gang count,
 * cutouts (voltmeter, USB, 12V socket), and packaging tiers.
 */
export function calculateSwitchPanelPrice(cfg: SwitchPanelConfig): number {
  let base = 35; // base laser cut & setup

  // Material factor
  if (cfg.material === 'wood_teak') base += 25;
  if (cfg.material === 'wood_birch') base += 15;

  // Gang count
  const safeGangs = Math.max(0, Number.isFinite(cfg.gangCount) ? cfg.gangCount : 0);
  base += safeGangs * 2.5;

  // Add-on cutouts
  if (cfg.hasVoltmeter) base += 8;
  if (cfg.hasUsbCharger) base += 10;
  if (cfg.has12vSocket) base += 6;

  // Package multiplier
  if (cfg.packageOption === 'faceplate_only') {
    return Math.round(base);
  } else if (cfg.packageOption === 'diy_kit') {
    return Math.round(base + safeGangs * 8 + 12);
  } else {
    // assembled_wired
    return Math.round(base + safeGangs * 12 + 35);
  }
}

/**
 * Computes minimum panel width in mm to safely accommodate switch columns and cutouts.
 */
export function calculateMinimumPanelWidth(gangCount: number, hasVoltmeter: boolean): number {
  const count = Math.max(1, Number.isFinite(gangCount) ? gangCount : 1);
  return Math.max(160, Math.ceil(count / 2) * 55 + (hasVoltmeter ? 45 : 0));
}

export interface ReplicaPanelQuoteParams {
  switchCount: number;
  materialPreference: string;
  hasUsbCharger?: boolean;
  hasVoltmeter?: boolean;
}

export interface ReplicaPanelQuoteResult {
  digitizingLabor: number;
  laserCuttingBase: number;
  materialSurcharge: number;
  switchesHardware: number;
  totalMaterials: number;
  totalEstimated: number;
  turnaroundDays: string;
}

/**
 * Computes an estimated quote for a weathered switchboard replica replacement.
 * Standardizes CAD laser scanning/digitizing labor (£25.00), base laser cutout plate (£35.00),
 * marine switch hardware (£8.00/gang), and material surcharges.
 */
export function calculateReplicaPanelQuote(params: ReplicaPanelQuoteParams): ReplicaPanelQuoteResult {
  const digitizingLabor = 25.0; // 1 hour CAD scanning/digitizing at Solent £25/hr rate
  const laserCuttingBase = 35.0;

  let materialSurcharge = 0;
  if (params?.materialPreference === 'wood_teak') {
    materialSurcharge = 25.0;
  } else if (params?.materialPreference === 'wood_birch') {
    materialSurcharge = 15.0;
  }

  const rawCount = params?.switchCount;
  const safeSwitches = Number.isFinite(rawCount) ? Math.max(1, rawCount) : 1;
  const switchesHardware = Number((safeSwitches * 8.0).toFixed(2));

  let optionalExtras = 0;
  if (params?.hasVoltmeter) optionalExtras += 8.0;
  if (params?.hasUsbCharger) optionalExtras += 10.0;

  const totalMaterials = Number((laserCuttingBase + materialSurcharge + switchesHardware + optionalExtras).toFixed(2));
  const totalEstimated = Number((digitizingLabor + totalMaterials).toFixed(2));

  return {
    digitizingLabor,
    laserCuttingBase,
    materialSurcharge,
    switchesHardware,
    totalMaterials,
    totalEstimated,
    turnaroundDays: '3–5 business days in Gosport workshop'
  };
}

