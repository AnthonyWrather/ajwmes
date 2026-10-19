import { ShipStationAppConfig } from '../types';
import { getEnvStorageItem, setEnvStorageItem, removeEnvStorageItem } from './envStorage';

/**
 * Storage keys for runtime ShipStation configuration.
 * Environment-scoped to prevent cross-contamination between dev/preview/prod.
 */
export const STORAGE_CUSTOM_SHIPSTATION_KEY = 'custom_shipstation_api_key';
export const STORAGE_CUSTOM_SHIPSTATION_MODE = 'custom_shipstation_mode';

/**
 * Retrieve user-configured ShipStation API key from scoped environment storage.
 */
export function getCustomShipStationApiKey(): string | null {
  try {
    const val = getEnvStorageItem<string | null>(STORAGE_CUSTOM_SHIPSTATION_KEY, null);
    if (val && typeof val === 'string' && val.trim().length > 8) {
      return val.trim();
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Persist custom ShipStation API key into scoped environment storage.
 */
export function setCustomShipStationApiKey(key: string | null): void {
  try {
    if (key && key.trim().length > 8) {
      setEnvStorageItem(STORAGE_CUSTOM_SHIPSTATION_KEY, key.trim());
    } else {
      removeEnvStorageItem(STORAGE_CUSTOM_SHIPSTATION_KEY);
    }
  } catch (e) {
    console.warn('Could not persist custom ShipStation API key:', e);
  }
}

/**
 * Clear custom ShipStation API key override.
 */
export function clearCustomShipStationApiKey(): void {
  try {
    removeEnvStorageItem(STORAGE_CUSTOM_SHIPSTATION_KEY);
  } catch (e) {
    console.warn('Could not clear custom ShipStation API key:', e);
  }
}

/**
 * Resolves active ShipStation configuration using priority hierarchy:
 * 1. User-configured custom key from browser local storage (highest priority)
 * 2. Build-time environment variable (import.meta.env.VITE_SHIPSTATION_API_KEY)
 * 3. Default fallback: Simulated mode (safe development mode generating emulated 4x6" thermal labels)
 */
export function resolveShipStationConfig(): ShipStationAppConfig {
  const customKey = getCustomShipStationApiKey();
  const envKey = typeof import.meta !== 'undefined' && import.meta.env && typeof import.meta.env.VITE_SHIPSTATION_API_KEY === 'string'
    ? import.meta.env.VITE_SHIPSTATION_API_KEY.trim()
    : null;

  const activeKey = customKey || envKey;
  const isLive = Boolean(activeKey && activeKey.length > 10 && !activeKey.includes('placeholder'));

  return {
    apiKey: activeKey || undefined,
    mode: isLive ? 'live' : 'simulated',
    carrierDefaults: {
      royalMailServiceCode: 'royal_mail_tracked_24',
      dpdServiceCode: 'dpd_next_day'
    }
  };
}
