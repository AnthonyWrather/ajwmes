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

const DEFAULT_API_KEY = 'AIzaSyCeLVmFhxzY8Ojh2NFUvuyGax-LVDk5tIg';

export const KNOWN_FIREBASE_PROJECTS: Record<string, FirebaseAppConfig> = {
  'gen-lang-client-0618772940': {
    projectId: 'gen-lang-client-0618772940',
    appId: rawConfig.appId || '1:310512231306:web:1dd846ba5925aae4a39e73',
    apiKey: isValidApiKey(import.meta.env.VITE_FIREBASE_API_KEY)
      ? (import.meta.env.VITE_FIREBASE_API_KEY as string).trim()
      : (isValidApiKey(rawConfig.apiKey) ? rawConfig.apiKey.trim() : DEFAULT_API_KEY),
    authDomain: rawConfig.authDomain || 'gen-lang-client-0618772940.firebaseapp.com',
    firestoreDatabaseId: rawConfig.firestoreDatabaseId || 'ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a',
    storageBucket: rawConfig.storageBucket || 'gen-lang-client-0618772940.firebasestorage.app',
    messagingSenderId: rawConfig.messagingSenderId || '310512231306',
    measurementId: rawConfig.measurementId || '',
    oAuthClientId: rawConfig.oAuthClientId || '310512231306-ks44mner19rr9n0tctosqiiearofapkc.apps.googleusercontent.com',
    recaptchaSiteKey: rawConfig.recaptchaSiteKey || ''
  }
};

const STORAGE_KEY = 'ajwmes_active_firebase_project';

export function getStoredProjectOverride(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(STORAGE_KEY);
    if (val && !KNOWN_FIREBASE_PROJECTS[val]) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return val;
  } catch {
    return null;
  }
}

export function setStoredProjectOverride(projectId: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (projectId && KNOWN_FIREBASE_PROJECTS[projectId]) {
      localStorage.setItem(STORAGE_KEY, projectId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Could not persist project override:', e);
  }
}

function resolveActiveConfig(): FirebaseAppConfig {
  const envProject = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string)?.trim();
  const projectId = envProject || rawConfig.projectId || 'gen-lang-client-0618772940';

  const envApiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string | undefined)?.trim();
  const rawApiKey = (rawConfig.apiKey as string | undefined)?.trim();

  // For gen-lang-client-0618772940, DEFAULT_API_KEY is the authentic Firebase Identity Platform Web API key.
  // Prevent mistyped AI Studio Gemini keys from overriding the verified Firebase key.
  let resolvedApiKey = DEFAULT_API_KEY;
  if (projectId === 'gen-lang-client-0618772940') {
    resolvedApiKey = DEFAULT_API_KEY;
  } else if (isValidApiKey(envApiKey)) {
    resolvedApiKey = envApiKey!;
  } else if (isValidApiKey(rawApiKey)) {
    resolvedApiKey = rawApiKey!;
  }

  return {
    projectId,
    appId: rawConfig.appId || '1:310512231306:web:1dd846ba5925aae4a39e73',
    apiKey: resolvedApiKey,
    authDomain: rawConfig.authDomain || `${projectId}.firebaseapp.com`,
    firestoreDatabaseId: rawConfig.firestoreDatabaseId || 'ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a',
    storageBucket: rawConfig.storageBucket || `${projectId}.firebasestorage.app`,
    messagingSenderId: rawConfig.messagingSenderId || '310512231306',
    measurementId: rawConfig.measurementId || '',
    oAuthClientId: rawConfig.oAuthClientId || '310512231306-ks44mner19rr9n0tctosqiiearofapkc.apps.googleusercontent.com',
    recaptchaSiteKey: rawConfig.recaptchaSiteKey || ''
  };
}

export const firebaseConfig: FirebaseAppConfig = resolveActiveConfig();

export default firebaseConfig;
