import { SwitchConfig, VesselSpec } from '../types';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  formatted?: string;
}

export interface FormValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface SwitchValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface BookingFormData {
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  vesselName: string;
  berthLocation?: string;
}

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

/**
 * Validates email address format with trimming and domain structure check.
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = (email || '').trim();
  if (!trimmed) {
    return { isValid: false, error: 'Email address is required.' };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. skipper@solentyacht.co.uk).' };
  }
  return { isValid: true, formatted: trimmed.toLowerCase() };
}

/**
 * Validates and normalizes UK telephone and mobile numbers.
 * Supports standard UK mobile (07xxx), Solent landlines (023xxx / 01983), and international (+44).
 */
export function validateUkPhone(phone?: string, required: boolean = false): ValidationResult {
  const trimmed = (phone || '').trim();
  if (!trimmed) {
    if (required) {
      return { isValid: false, error: 'Telephone number is required.' };
    }
    return { isValid: true, formatted: '' };
  }

  // Strip spaces, dashes, parentheses
  const cleaned = trimmed.replace(/[\s\-()]/g, '');

  // UK mobile/landline regex: 0[1-9]\d{8,9} or +44[1-9]\d{8,9} or 0044[1-9]\d{8,9}
  const ukLocalRegex = /^0[1-9]\d{8,9}$/;
  const ukIntlRegex = /^(?:\+44|0044)[1-9]\d{8,9}$/;

  if (!ukLocalRegex.test(cleaned) && !ukIntlRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Please enter a valid UK telephone number (e.g. 07700 900551 or +44 7700 900551).'
    };
  }

  // Format to standard localized display
  let formatted = cleaned;
  if (cleaned.startsWith('+44')) {
    formatted = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('0044')) {
    formatted = '0' + cleaned.slice(4);
  }

  if (formatted.length === 11) {
    formatted = `${formatted.slice(0, 5)} ${formatted.slice(5)}`;
  }

  return { isValid: true, formatted };
}

/**
 * Validates the Solent diagnostic and switch panel quote booking form.
 */
export function validateBookingQuoteForm(data: BookingFormData): FormValidationResult {
  const errors: Record<string, string> = {};

  if (!data.clientName || data.clientName.trim().length < 2) {
    errors.clientName = 'Please enter your full name (minimum 2 characters).';
  }

  const emailCheck = validateEmail(data.clientEmail);
  if (!emailCheck.isValid) {
    errors.clientEmail = emailCheck.error || 'Invalid email address.';
  }

  if (data.clientPhone && data.clientPhone.trim().length > 0) {
    const phoneCheck = validateUkPhone(data.clientPhone, false);
    if (!phoneCheck.isValid) {
      errors.clientPhone = phoneCheck.error || 'Invalid telephone number.';
    }
  }

  if (!data.vesselName || data.vesselName.trim().length < 2) {
    errors.vesselName = 'Please enter the vessel name (minimum 2 characters).';
  }

  if (data.berthLocation !== undefined && data.berthLocation.trim().length === 0) {
    errors.berthLocation = 'Please specify marina berth or pontoon location.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates vessel specifications for battery bank sizing, solar rating, and system voltage.
 */
export function validateVesselSpecForm(spec: Partial<VesselSpec>): FormValidationResult {
  const errors: Record<string, string> = {};

  if (!spec.vesselName || spec.vesselName.trim().length < 1) {
    errors.vesselName = 'Vessel name cannot be empty.';
  }

  const validVoltages = ['12V', '24V', '12V/24V Dual'];
  if (spec.systemVoltage && !validVoltages.includes(spec.systemVoltage)) {
    errors.systemVoltage = 'System voltage must be 12V, 24V, or 12V/24V Dual.';
  }

  if (spec.houseCapacityAh !== undefined) {
    if (isNaN(spec.houseCapacityAh) || spec.houseCapacityAh < 0 || spec.houseCapacityAh > 10000) {
      errors.houseCapacityAh = 'House battery capacity must be a positive number up to 10,000 Ah.';
    }
  }

  if (spec.solarWatts !== undefined) {
    if (isNaN(spec.solarWatts) || spec.solarWatts < 0 || spec.solarWatts > 50000) {
      errors.solarWatts = 'Solar array rating must be a positive wattage value.';
    }
  }

  if (spec.year !== undefined) {
    const currentYear = new Date().getFullYear();
    if (isNaN(spec.year) || spec.year < 1900 || spec.year > currentYear + 1) {
      errors.year = `Vessel build year must be between 1900 and ${currentYear + 1}.`;
    }
  }

  if (spec.hullType !== undefined && typeof spec.hullType === 'string' && spec.hullType.trim().length === 0) {
    errors.hullType = 'Hull type cannot be empty.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates switch panel configurations and individual circuit breaker ratings.
 */
export function validateSwitchConfig(switches: SwitchConfig[], gangCount: number): SwitchValidationResult {
  const errors: string[] = [];

  if (!Array.isArray(switches)) {
    return { isValid: false, errors: ['Switch array is required.'] };
  }

  if (switches.length !== gangCount) {
    errors.push(`Configured switches count (${switches.length}) must match panel gang count (${gangCount}).`);
  }

  switches.forEach((sw, idx) => {
    const pos = sw.position || idx + 1;
    if (!sw.label || sw.label.trim().length === 0) {
      errors.push(`Switch #${pos} circuit label cannot be blank.`);
    }
    if (isNaN(sw.breakerRatingAmps) || sw.breakerRatingAmps < 5 || sw.breakerRatingAmps > 60) {
      errors.push(`Switch #${pos} breaker rating (${sw.breakerRatingAmps}A) must be between 5A and 60A.`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
}
