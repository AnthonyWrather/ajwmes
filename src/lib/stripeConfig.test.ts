import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { 
  getCustomStripeKey, 
  setCustomStripeKey, 
  clearCustomStripeKey, 
  resolveStripeConfig 
} from './stripeConfig';

describe('stripeConfig module', () => {
  beforeEach(() => {
    clearCustomStripeKey();
  });

  it('defaults to simulated mode when no custom key or env key is provided', () => {
    const config = resolveStripeConfig();
    assert.strictEqual(config.isConfigured, false);
    assert.strictEqual(config.mode, 'simulated');
    assert.strictEqual(config.publishableKey, '');
  });

  it('stores and retrieves a valid custom Stripe test publishable key', () => {
    const validTestKey = 'pk_test_51MarineTestKey1234567890abcdef123';
    setCustomStripeKey(validTestKey);

    const retrieved = getCustomStripeKey();
    assert.strictEqual(retrieved, validTestKey);

    const config = resolveStripeConfig();
    assert.strictEqual(config.isConfigured, true);
    assert.strictEqual(config.mode, 'test');
    assert.strictEqual(config.publishableKey, validTestKey);
  });

  it('stores and retrieves a valid custom Stripe live publishable key', () => {
    const validLiveKey = 'pk_live_51MarineLiveKey1234567890abcdef123';
    setCustomStripeKey(validLiveKey);

    const config = resolveStripeConfig();
    assert.strictEqual(config.isConfigured, true);
    assert.strictEqual(config.mode, 'live');
    assert.strictEqual(config.publishableKey, validLiveKey);
  });

  it('ignores invalid or placeholder keys on setCustomStripeKey', () => {
    setCustomStripeKey('invalid_key_format');
    assert.strictEqual(getCustomStripeKey(), null);

    setCustomStripeKey('pk_test_your_key_placeholder');
    assert.strictEqual(getCustomStripeKey(), null);
  });

  it('clears custom key successfully', () => {
    setCustomStripeKey('pk_test_51MarineTestKey1234567890abcdef123');
    assert.ok(getCustomStripeKey());

    clearCustomStripeKey();
    assert.strictEqual(getCustomStripeKey(), null);
    assert.strictEqual(resolveStripeConfig().mode, 'simulated');
  });
});
