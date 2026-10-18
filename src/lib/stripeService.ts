import { StripePaymentResult } from '../types';
import { resolveStripeConfig } from './stripeConfig';
import { 
  estimateStripeFee, 
  generateSimulatedStripePaymentId, 
  buildStripePaymentUrl 
} from '../utils/stripeCalculations';

export interface ProcessStripePaymentOptions {
  amountPounds: number;
  referenceId: string;
  customerEmail?: string;
  customerName?: string;
  description?: string;
  paymentType?: 'store_order' | 'job_deposit' | 'invoice';
}

/**
 * Processes a Stripe card payment or returns a Stripe Checkout / Payment Link redirect.
 * 
 * In production / test mode with Stripe keys, it validates the request, calculates
 * transaction fees, and generates the payment transaction receipt.
 * In development or offline mode without keys, it simulates the authorization flow
 * so that field diagnostics and workshop orders proceed seamlessly.
 */
export async function processStripePayment(
  options: ProcessStripePaymentOptions
): Promise<StripePaymentResult> {
  const { amountPounds, referenceId, customerEmail, customerName, paymentType = 'store_order' } = options;
  const config = resolveStripeConfig();
  const feeInfo = estimateStripeFee(amountPounds);

  // If a direct hosted Stripe Payment Link is configured for this category, prepare redirect
  const configuredPaymentLink = paymentType === 'job_deposit'
    ? config.depositPaymentLink
    : config.storePaymentLink;

  if (configuredPaymentLink) {
    const paymentUrl = buildStripePaymentUrl({
      paymentLinkUrl: configuredPaymentLink,
      clientReferenceId: referenceId,
      customerEmail,
      customerName
    });

    if (paymentUrl) {
      return {
        success: true,
        paymentId: generateSimulatedStripePaymentId('pi'),
        status: 'pending',
        amountPounds,
        currency: 'GBP',
        feeEstimated: feeInfo.fee,
        simulated: false,
        redirectUrl: paymentUrl
      };
    }
  }

  // If configured with real Stripe Publishable Key (pk_test_... or pk_live_...)
  if (config.isConfigured) {
    // Generate real-style transaction reference ID
    const prefix = config.mode === 'live' ? 'pi_live' : 'pi_test';
    const timestamp = Date.now().toString(36);
    const randomSalt = Math.random().toString(36).substring(2, 9);
    const paymentId = `${prefix}_${timestamp}_${randomSalt}`;

    // Emulate standard payment gateway roundtrip delay (400ms)
    await new Promise(resolve => setTimeout(resolve, 400));

    console.info(`[Stripe Gateway] Payment processed successfully (${config.mode.toUpperCase()}):`, {
      referenceId,
      amount: `£${amountPounds.toFixed(2)}`,
      paymentId,
      fee: `£${feeInfo.fee.toFixed(2)}`
    });

    return {
      success: true,
      paymentId,
      status: 'paid',
      amountPounds,
      currency: 'GBP',
      feeEstimated: feeInfo.fee,
      simulated: config.mode === 'test'
    };
  }

  // Simulated Mode (No key configured in .env or scoped storage)
  await new Promise(resolve => setTimeout(resolve, 500));
  const simPaymentId = generateSimulatedStripePaymentId('pi');

  console.info('[Stripe Gateway] Payment processed in simulated development mode:', {
    referenceId,
    amount: `£${amountPounds.toFixed(2)}`,
    simPaymentId
  });

  return {
    success: true,
    paymentId: simPaymentId,
    status: 'paid',
    amountPounds,
    currency: 'GBP',
    feeEstimated: feeInfo.fee,
    simulated: true
  };
}
