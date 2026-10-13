import rawConfig from '../../firebase-applet-config.json';

export interface FirebaseAppConfig {
  projectId: string;
  appId: string;
  apiKey: string;
  authDomain: string;
  firestoreDatabaseId: string;
  storageBucket: string;
  messagingSenderId: string;
  measurementId?: string;
  oAuthClientId?: string;
  recaptchaSiteKey?: string;
}

export function isValidApiKey(key: unknown): boolean {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  return (
    trimmed.startsWith('AIza') &&
    trimmed.length >= 35 &&
    !trimmed.includes(' ') &&
    !trimmed.includes('<') &&
    !trimmed.toLowerCase().includes('your_') &&
    !trimmed.toLowerCase().includes('placeholder')
  );
}

export const DEFAULT_API_KEY = 'AIzaSyCeLVmFhxzY8Ojh2NFUvuyGax-LVDk5tIg';

const STORAGE_CUSTOM_CONFIG_KEY = 'ajwmes_custom_firebase_config';
const STORAGE_CUSTOM_API_KEY = 'ajwmes_custom_api_key';
const STORAGE_PROJECT_KEY = 'ajwmes_active_firebase_project';

/**
 * Retrieve user-entered custom Firebase Web API key from localStorage.
 */
export function getCustomApiKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(STORAGE_CUSTOM_API_KEY);
    if (val && isValidApiKey(val)) return val.trim();
    return null;
  } catch {
    return null;
  }
}

/**
 * Store a user-entered custom Firebase Web API key in localStorage.
 */
export function setCustomApiKey(key: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (key && isValidApiKey(key)) {
      localStorage.setItem(STORAGE_CUSTOM_API_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_CUSTOM_API_KEY);
    }
  } catch (e) {
    console.warn('Could not persist custom Firebase API key:', e);
  }
}

/**
 * Retrieve custom full Firebase configuration from localStorage.
 */
export function getCustomFirebaseConfig(): Partial<FirebaseAppConfig> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_CUSTOM_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Persist custom full Firebase configuration to localStorage.
 */
export function setCustomFirebaseConfig(config: Partial<FirebaseAppConfig> | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (config) {
      localStorage.setItem(STORAGE_CUSTOM_CONFIG_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(STORAGE_CUSTOM_CONFIG_KEY);
    }
  } catch (e) {
    console.warn('Could not persist custom Firebase config:', e);
  }
}

/**
 * Clears all custom Firebase overrides from localStorage.
 */
export function clearCustomFirebaseConfig(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_CUSTOM_CONFIG_KEY);
    localStorage.removeItem(STORAGE_CUSTOM_API_KEY);
    localStorage.removeItem(STORAGE_PROJECT_KEY);
  } catch (e) {
    console.warn('Could not clear custom Firebase config:', e);
  }
}

export function getStoredProjectOverride(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_PROJECT_KEY);
  } catch {
    return null;
  }
}

export function setStoredProjectOverride(projectId: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (projectId) {
      localStorage.setItem(STORAGE_PROJECT_KEY, projectId);
    } else {
      localStorage.removeItem(STORAGE_PROJECT_KEY);
    }
  } catch (e) {
    console.warn('Could not persist project override:', e);
  }
}

/**
 * Attempt to auto-fetch Firebase Hosting reserved configuration (/__/firebase/init.json)
 * when deployed to Firebase Hosting.
 */
export async function tryAutoFetchHostingConfig(): Promise<Partial<FirebaseAppConfig> | null> {
  if (typeof window === 'undefined') return null;
  const host = window.location.hostname;
  const isHostingDomain = host.includes('web.app') || host.includes('firebaseapp.com');
  if (!isHostingDomain) return null;

  try {
    const res = await fetch('/__/firebase/init.json');
    if (res.ok) {
      const data = await res.json();
      if (data && isValidApiKey(data.apiKey)) {
        return {
          projectId: data.projectId,
          appId: data.appId,
          apiKey: data.apiKey,
          authDomain: data.authDomain,
          storageBucket: data.storageBucket,
          messagingSenderId: data.messagingSenderId,
          measurementId: data.measurementId
        };
      }
    }
  } catch {
    // Ignore fetch errors
  }
  return null;
}

function resolveActiveConfig(): FirebaseAppConfig {
  const customConfig = getCustomFirebaseConfig();
  const customApiKey = getCustomApiKey();

  const envProject = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string)?.trim();
  const projectId = 
    customConfig?.projectId || 
    getStoredProjectOverride() || 
    envProject || 
    rawConfig.projectId || 
    'gen-lang-client-0618772940';

  const envApiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim();
  const rawApiKey = (rawConfig.apiKey as string | undefined)?.trim();

  // API Key priority:
  // 1. Explicit custom API key from user
  // 2. Custom config object apiKey
  // 3. Environment variable (VITE_FIREBASE_API_KEY)
  // 4. Raw config from firebase-applet-config.json
  // 5. Default authentic key
  let resolvedApiKey = DEFAULT_API_KEY;
  if (customApiKey && isValidApiKey(customApiKey)) {
    resolvedApiKey = customApiKey;
  } else if (customConfig?.apiKey && isValidApiKey(customConfig.apiKey)) {
    resolvedApiKey = customConfig.apiKey;
  } else if (isValidApiKey(envApiKey)) {
    resolvedApiKey = envApiKey!;
  } else if (isValidApiKey(rawApiKey)) {
    resolvedApiKey = rawApiKey!;
  }

  const envAppId = (import.meta.env.VITE_FIREBASE_APP_ID as string | undefined)?.trim();
  const resolvedAppId = 
    customConfig?.appId || 
    envAppId || 
    rawConfig.appId || 
    '1:310512231306:web:35ac83e7f7f56d49a39e73';

  const envAuthDomain = (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string | undefined)?.trim();
  const resolvedAuthDomain = 
    customConfig?.authDomain || 
    envAuthDomain || 
    rawConfig.authDomain || 
    `${projectId}.firebaseapp.com`;

  const envStorageBucket = (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string | undefined)?.trim();
  const resolvedStorageBucket = 
    customConfig?.storageBucket || 
    envStorageBucket || 
    rawConfig.storageBucket || 
    `${projectId}.firebasestorage.app`;

  const envDbId = (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string | undefined)?.trim();
  const resolvedDbId = 
    customConfig?.firestoreDatabaseId || 
    envDbId || 
    rawConfig.firestoreDatabaseId || 
    'ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a';

  return {
    projectId,
    appId: resolvedAppId,
    apiKey: resolvedApiKey,
    authDomain: resolvedAuthDomain,
    firestoreDatabaseId: resolvedDbId,
    storageBucket: resolvedStorageBucket,
    messagingSenderId: customConfig?.messagingSenderId || rawConfig.messagingSenderId || '310512231306',
    measurementId: customConfig?.measurementId || rawConfig.measurementId || '',
    oAuthClientId: customConfig?.oAuthClientId || rawConfig.oAuthClientId || '310512231306-ks44mner19rr9n0tctosqiiearofapkc.apps.googleusercontent.com',
    recaptchaSiteKey: customConfig?.recaptchaSiteKey || rawConfig.recaptchaSiteKey || ''
  };
}

export const firebaseConfig: FirebaseAppConfig = resolveActiveConfig();

export default firebaseConfig;
