import { ResendAppConfig } from '../types';
import { getEnvStorageItem, setEnvStorageItem, removeEnvStorageItem } from './envStorage';

/**
 * Storage keys for custom Resend API key management.
 * Follows the existing firebaseConfig and envStorage architecture.
 */
export const STORAGE_CUSTOM_RESEND_KEY = 'custom_resend_api_key';
export const DEFAULT_RESEND_FROM = 'AJW Marine <notifications@ajwmes.co.uk>';
export const DEFAULT_RESEND_REPLY_TO = 'info@ajwmes.co.uk';
export const TEST_ONBOARDING_FROM = 'AJW Marine <onboarding@resend.dev>';

/**
 * Validates whether a provided string conforms to the Resend API key format.
 * Resend production and test keys begin with 're_' followed by alphanumeric characters.
 */
export function isValidResendApiKey(key: unknown): boolean {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  return (
    trimmed.startsWith('re_') &&
    trimmed.length >= 24 &&
    !trimmed.includes(' ') &&
    !trimmed.includes('<') &&
    !trimmed.toLowerCase().includes('your_') &&
    !trimmed.toLowerCase().includes('placeholder')
  );
}

/**
 * Retrieve user-entered custom Resend API key from scoped environment storage.
 */
export function getCustomResendApiKey(): string | null {
  try {
    const val = getEnvStorageItem<string | null>(STORAGE_CUSTOM_RESEND_KEY, null);
    if (val && isValidResendApiKey(val)) return val.trim();
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist custom Resend API key into scoped environment storage.
 */
export function setCustomResendApiKey(key: string | null): void {
  try {
    if (key && isValidResendApiKey(key)) {
      setEnvStorageItem(STORAGE_CUSTOM_RESEND_KEY, key.trim());
    } else {
      removeEnvStorageItem(STORAGE_CUSTOM_RESEND_KEY);
    }
  } catch (e) {
    console.warn('Could not persist custom Resend API key:', e);
  }
}

/**
 * Clear custom Resend API key override.
 */
export function clearCustomResendApiKey(): void {
  try {
    removeEnvStorageItem(STORAGE_CUSTOM_RESEND_KEY);
  } catch (e) {
    console.warn('Could not clear custom Resend API key:', e);
  }
}

/**
 * Resolves active Resend configuration using existing hierarchy:
 * 1. User-configured custom key from browser local storage (highest priority)
 * 2. Build-time environment variable (import.meta.env.VITE_RESEND_API_KEY)
 * 3. Fallback: Simulated mode (safe development mode that logs dispatches)
 */
export function resolveResendConfig(): ResendAppConfig {
  const customKey = getCustomResendApiKey();
  const envKey = typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env.VITE_RESEND_API_KEY === 'string'
    ? import.meta.env.VITE_RESEND_API_KEY.trim()
    : undefined;

  let resolvedKey = '';
  if (customKey && isValidResendApiKey(customKey)) {
    resolvedKey = customKey;
  } else if (isValidResendApiKey(envKey)) {
    resolvedKey = envKey!;
  }

  const isConfigured = Boolean(resolvedKey && resolvedKey.length > 0);

  // When using a temporary test key without a verified custom domain, Resend requires onboarding@resend.dev
  const envFrom = typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env.VITE_RESEND_FROM_EMAIL === 'string'
    ? import.meta.env.VITE_RESEND_FROM_EMAIL.trim()
    : undefined;
  const envReplyTo = typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env.VITE_RESEND_REPLY_TO === 'string'
    ? import.meta.env.VITE_RESEND_REPLY_TO.trim()
    : undefined;

  const fromEmail = envFrom || DEFAULT_RESEND_FROM;
  const replyTo = envReplyTo || DEFAULT_RESEND_REPLY_TO;

  return {
    apiKey: resolvedKey,
    fromEmail,
    fromName: 'AJW Marine Electrical Services',
    replyTo,
    isConfigured,
    isSimulatedMode: !isConfigured
  };
}

export const resendConfig: ResendAppConfig = resolveResendConfig();

export default resendConfig;
