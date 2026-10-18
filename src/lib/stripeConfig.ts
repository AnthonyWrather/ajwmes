import { StripeAppConfig } from '../types';
import { getEnvStorageItem, setEnvStorageItem, removeEnvStorageItem } from './envStorage';
import { isValidStripePublishableKey, getStripeKeyMode } from '../utils/stripeCalculations';

/**
 * Storage keys for runtime Stripe Publishable Key management.
 * Follows the existing firebaseConfig / resendConfig scoped environment storage architecture.
 */
export const STORAGE_CUSTOM_STRIPE_KEY = 'custom_stripe_publishable_key';

/**
 * Retrieve user-configured custom Stripe Publishable Key from scoped environment storage.
 */
export function getCustomStripeKey(): string | null {
  try {
    const val = getEnvStorageItem<string | null>(STORAGE_CUSTOM_STRIPE_KEY, null);
    if (val && isValidStripePublishableKey(val)) {
      return val.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist custom Stripe Publishable Key into scoped environment storage.
 */
export function setCustomStripeKey(key: string | null): void {
  try {
    if (key && isValidStripePublishableKey(key)) {
      setEnvStorageItem(STORAGE_CUSTOM_STRIPE_KEY, key.trim());
    } else {
      removeEnvStorageItem(STORAGE_CUSTOM_STRIPE_KEY);
    }
  } catch (e) {
    console.warn('Could not persist custom Stripe Publishable Key:', e);
  }
}

/**
 * Clear custom Stripe Publishable Key override.
 */
export function clearCustomStripeKey(): void {
  try {
    removeEnvStorageItem(STORAGE_CUSTOM_STRIPE_KEY);
  } catch (e) {
    console.warn('Could not clear custom Stripe Publishable Key:', e);
  }
}

/**
 * Resolves active Stripe configuration using existing priority hierarchy:
 * 1. User-configured custom key from browser local storage (highest priority, useful for dev testing)
 * 2. Build-time environment variable (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
 * 3. Fallback: Simulated mode (safe development mode that authorizes transactions without external gateway calls)
 */
export function resolveStripeConfig(): StripeAppConfig {
  const customKey = getCustomStripeKey();
  const envKey = typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY === 'string'
    ? import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY.trim()
    : undefined;

  let resolvedKey = '';
  if (customKey && isValidStripePublishableKey(customKey)) {
    resolvedKey = customKey;
  } else if (isValidStripePublishableKey(envKey)) {
    resolvedKey = envKey!;
  }

  const depositLink = typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env.VITE_STRIPE_PAYMENT_LINK_DEPOSIT === 'string'
    ? import.meta.env.VITE_STRIPE_PAYMENT_LINK_DEPOSIT.trim()
    : undefined;

  const storeLink = typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env.VITE_STRIPE_PAYMENT_LINK_STORE === 'string'
    ? import.meta.env.VITE_STRIPE_PAYMENT_LINK_STORE.trim()
    : undefined;

  const rawMode = getStripeKeyMode(resolvedKey);
  const mode: 'test' | 'live' | 'simulated' = rawMode === 'invalid' ? 'simulated' : rawMode;
  const isConfigured = Boolean(resolvedKey && rawMode !== 'invalid');

  return {
    publishableKey: resolvedKey,
    mode,
    isConfigured,
    depositPaymentLink: depositLink,
    storePaymentLink: storeLink
  };
}
