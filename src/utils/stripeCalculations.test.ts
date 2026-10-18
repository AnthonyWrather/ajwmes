import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  toStripePence,
  fromStripePence,
  formatGbpCurrency,
  isValidStripePublishableKey,
  getStripeKeyMode,
  estimateStripeFee,
  buildStripePaymentUrl,
  generateSimulatedStripePaymentId
} from './stripeCalculations';

describe('stripeCalculations utility module', () => {
  describe('toStripePence', () => {
    it('converts integer pounds into correct pence', () => {
      assert.strictEqual(toStripePence(50), 5000);
      assert.strictEqual(toStripePence(1), 100);
      assert.strictEqual(toStripePence(100), 10000);
    });

    it('converts decimal pounds into correct pence without floating point drift', () => {
      assert.strictEqual(toStripePence(19.99), 1999);
      assert.strictEqual(toStripePence(45.50), 4550);
      assert.strictEqual(toStripePence(0.99), 99);
      assert.strictEqual(toStripePence(0.01), 1);
    });

    it('handles zero, negative numbers and invalid inputs safely', () => {
      assert.strictEqual(toStripePence(0), 0);
      assert.strictEqual(toStripePence(-25.50), 0);
      assert.strictEqual(toStripePence(NaN), 0);
      assert.strictEqual(toStripePence(Infinity), 0);
      assert.strictEqual(toStripePence('50' as unknown as number), 0);
    });
  });

  describe('fromStripePence', () => {
    it('converts pence back into pounds', () => {
      assert.strictEqual(fromStripePence(5000), 50);
      assert.strictEqual(fromStripePence(1999), 19.99);
      assert.strictEqual(fromStripePence(1), 0.01);
    });

    it('handles zero and invalid inputs safely', () => {
      assert.strictEqual(fromStripePence(0), 0);
      assert.strictEqual(fromStripePence(-500), 0);
      assert.strictEqual(fromStripePence(NaN), 0);
    });
  });

  describe('formatGbpCurrency', () => {
    it('formats numbers as British currency', () => {
      assert.strictEqual(formatGbpCurrency(50), '£50.00');
      assert.strictEqual(formatGbpCurrency(19.99), '£19.99');
      assert.strictEqual(formatGbpCurrency(0), '£0.00');
    });

    it('handles invalid inputs gracefully', () => {
      assert.strictEqual(formatGbpCurrency(NaN), '£0.00');
      assert.strictEqual(formatGbpCurrency('abc' as unknown as number), '£0.00');
    });
  });

  describe('isValidStripePublishableKey', () => {
    it('accepts valid Stripe test publishable keys', () => {
      assert.strictEqual(
        isValidStripePublishableKey('pk_test_51MzAbc1234567890abcdef1234567890'),
        true
      );
    });

    it('accepts valid Stripe live publishable keys', () => {
      assert.strictEqual(
        isValidStripePublishableKey('pk_live_51MzLiveKey1234567890abcdef1234567890'),
        true
      );
    });

    it('rejects keys without proper prefix', () => {
      assert.strictEqual(isValidStripePublishableKey('sk_test_12345678901234567890'), false);
      assert.strictEqual(isValidStripePublishableKey('rk_live_12345678901234567890'), false);
      assert.strictEqual(isValidStripePublishableKey('1234567890123456789012345'), false);
    });

    it('rejects keys that are too short', () => {
      assert.strictEqual(isValidStripePublishableKey('pk_test_short'), false);
    });

    it('rejects placeholders or empty keys', () => {
      assert.strictEqual(isValidStripePublishableKey(''), false);
      assert.strictEqual(isValidStripePublishableKey('pk_test_your_stripe_key_here_placeholder'), false);
      assert.strictEqual(isValidStripePublishableKey('pk_test_<your_key_here>_1234567890'), false);
      assert.strictEqual(isValidStripePublishableKey(null), false);
      assert.strictEqual(isValidStripePublishableKey(undefined), false);
    });
  });

  describe('getStripeKeyMode', () => {
    it('correctly detects test vs live mode', () => {
      assert.strictEqual(
        getStripeKeyMode('pk_test_51MzAbc1234567890abcdef1234567890'),
        'test'
      );
      assert.strictEqual(
        getStripeKeyMode('pk_live_51MzLiveKey1234567890abcdef1234567890'),
        'live'
      );
    });

    it('returns invalid for improper keys', () => {
      assert.strictEqual(getStripeKeyMode('invalid_key'), 'invalid');
      assert.strictEqual(getStripeKeyMode(''), 'invalid');
      assert.strictEqual(getStripeKeyMode(undefined), 'invalid');
    });
  });

  describe('estimateStripeFee', () => {
    it('estimates standard UK card fees correctly for typical amounts', () => {
      // £100.00: 1.5% is £1.50, plus 20p fixed = £1.70. Net: £98.30
      const est100 = estimateStripeFee(100);
      assert.strictEqual(est100.amount, 100);
      assert.strictEqual(est100.fee, 1.70);
      assert.strictEqual(est100.net, 98.30);

      // £50.00 deposit: 1.5% is £0.75, plus 20p fixed = £0.95. Net: £49.05
      const est50 = estimateStripeFee(50);
      assert.strictEqual(est50.amount, 50);
      assert.strictEqual(est50.fee, 0.95);
      assert.strictEqual(est50.net, 49.05);
    });

    it('handles zero or negative amounts', () => {
      const zeroEst = estimateStripeFee(0);
      assert.strictEqual(zeroEst.amount, 0);
      assert.strictEqual(zeroEst.fee, 0);
      assert.strictEqual(zeroEst.net, 0);

      const negEst = estimateStripeFee(-10);
      assert.strictEqual(negEst.amount, 0);
      assert.strictEqual(negEst.fee, 0);
      assert.strictEqual(negEst.net, 0);
    });
  });

  describe('buildStripePaymentUrl', () => {
    it('builds hosted payment link with query parameters', () => {
      const url = buildStripePaymentUrl({
        paymentLinkUrl: 'https://buy.stripe.com/test_deposit_link',
        clientReferenceId: 'JOB-2026-089',
        customerEmail: 'skipper@solent.co.uk'
      });

      assert.ok(url.startsWith('https://buy.stripe.com/test_deposit_link'));
      assert.ok(url.includes('client_reference_id=JOB-2026-089'));
      assert.ok(url.includes('prefilled_email=skipper%40solent.co.uk'));
    });

    it('returns empty string if paymentLinkUrl is missing or invalid', () => {
      assert.strictEqual(
        buildStripePaymentUrl({ clientReferenceId: 'JOB-123' }),
        ''
      );
      assert.strictEqual(
        buildStripePaymentUrl({ paymentLinkUrl: 'not-a-valid-url', clientReferenceId: 'JOB-123' }),
        ''
      );
    });
  });

  describe('generateSimulatedStripePaymentId', () => {
    it('generates traceable simulated payment IDs with specified prefixes', () => {
      const piId = generateSimulatedStripePaymentId('pi');
      assert.ok(piId.startsWith('pi_sim_'));

      const chId = generateSimulatedStripePaymentId('ch');
      assert.ok(chId.startsWith('ch_sim_'));

      // Ensure uniqueness
      const secondPi = generateSimulatedStripePaymentId('pi');
      assert.notStrictEqual(piId, secondPi);
    });
  });
});
