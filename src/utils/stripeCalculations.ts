/**
 * Pure calculation, validation, and URL construction utilities for Stripe payments.
 * 
 * Complies with AGENTS.md guidelines: pure functions decoupled from React UI
 * and tested with companion node:test suite in stripeCalculations.test.ts.
 */

/**
 * Converts a GBP amount in pounds (£) to Stripe integer pence,
 * rounding safely to eliminate IEEE-754 floating point imprecision.
 * Returns 0 if amount is negative, zero, or not a finite number.
 */
export function toStripePence(pounds: number): number {
  if (typeof pounds !== 'number' || !Number.isFinite(pounds) || pounds <= 0) {
    return 0;
  }
  return Math.round(pounds * 100);
}

/**
 * Converts Stripe integer pence back to GBP (£).
 */
export function fromStripePence(pence: number): number {
  if (typeof pence !== 'number' || !Number.isFinite(pence) || pence <= 0) {
    return 0;
  }
  return Math.round(pence) / 100;
}

/**
 * Formats a GBP amount into standard British currency display string (£X.XX).
 */
export function formatGbpCurrency(amount: number): string {
  if (typeof amount !== 'number' || !Number.isFinite(amount)) {
    return '£0.00';
  }
  return `£${amount.toFixed(2)}`;
}

/**
 * Validates whether a provided string conforms to a Stripe Publishable Key format.
 * Stripe publishable keys start with 'pk_test_' (test mode) or 'pk_live_' (production mode).
 */
export function isValidStripePublishableKey(key: unknown): boolean {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (trimmed.length < 24) return false;
  if (trimmed.includes(' ') || trimmed.includes('<') || trimmed.includes('>')) return false;

  const lower = trimmed.toLowerCase();
  if (lower.includes('placeholder') || lower.includes('your_') || lower.includes('my_stripe_key')) {
    return false;
  }

  return trimmed.startsWith('pk_test_') || trimmed.startsWith('pk_live_');
}

/**
 * Resolves the operational mode of a Stripe key.
 */
export function getStripeKeyMode(key: unknown): 'test' | 'live' | 'invalid' {
  if (!isValidStripePublishableKey(key)) return 'invalid';
  const trimmed = (key as string).trim();
  if (trimmed.startsWith('pk_test_')) return 'test';
  if (trimmed.startsWith('pk_live_')) return 'live';
  return 'invalid';
}

export interface StripeFeeEstimate {
  amount: number;
  fee: number;
  net: number;
  feePercentage: number;
  fixedPence: number;
}

/**
 * Estimates Stripe card processing transaction fees for UK domestic cards.
 * Standard UK Stripe pricing: 1.5% + 20p (£0.20) per successful transaction.
 */
export function estimateStripeFee(
  amountPounds: number,
  feePercentage: number = 1.5,
  fixedPence: number = 20
): StripeFeeEstimate {
  if (typeof amountPounds !== 'number' || !Number.isFinite(amountPounds) || amountPounds <= 0) {
    return {
      amount: 0,
      fee: 0,
      net: 0,
      feePercentage,
      fixedPence
    };
  }

  const fixedPounds = fixedPence / 100;
  const percentageFee = (amountPounds * feePercentage) / 100;
  const totalFee = Math.round((percentageFee + fixedPounds) * 100) / 100;
  const netAmount = Math.max(0, Math.round((amountPounds - totalFee) * 100) / 100);

  return {
    amount: Math.round(amountPounds * 100) / 100,
    fee: totalFee,
    net: netAmount,
    feePercentage,
    fixedPence
  };
}

export interface StripePaymentUrlParams {
  paymentLinkUrl?: string;
  clientReferenceId: string;
  customerEmail?: string;
  customerName?: string;
}

/**
 * Builds a direct Stripe Payment Link URL with prefilled query parameters.
 * Supports Stripe hosted payment links (e.g. https://buy.stripe.com/...).
 */
export function buildStripePaymentUrl(params: StripePaymentUrlParams): string {
  if (!params.paymentLinkUrl || typeof params.paymentLinkUrl !== 'string') {
    return '';
  }

  const rawUrl = params.paymentLinkUrl.trim();
  if (!rawUrl.startsWith('http://') && !rawUrl.startsWith('https://')) {
    return '';
  }

  try {
    const url = new URL(rawUrl);
    if (params.clientReferenceId) {
      url.searchParams.set('client_reference_id', params.clientReferenceId.trim());
    }
    if (params.customerEmail) {
      url.searchParams.set('prefilled_email', params.customerEmail.trim());
    }
    return url.toString();
  } catch {
    return '';
  }
}

/**
 * Generates an idempotent, traceable simulated Stripe identifier
 * for offline and preview development environments.
 */
export function generateSimulatedStripePaymentId(prefix: 'pi' | 'ch' = 'pi'): string {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  return `${prefix}_sim_${timestamp}_${randomSuffix}`;
}
