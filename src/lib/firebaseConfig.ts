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

export const KNOWN_FIREBASE_PROJECTS: Record<string, FirebaseAppConfig> = {
  'gen-lang-client-0618772940': {
    projectId: 'gen-lang-client-0618772940',
    appId: '1:310512231306:web:35ac83e7f7f56d49a39e73',
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || 'AIzaSyCeLVmFhxzY8Ojh2NFUvuyGax-LVDk5tIg',
    authDomain: 'gen-lang-client-0618772940.firebaseapp.com',
    firestoreDatabaseId: 'ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a',
    storageBucket: 'gen-lang-client-0618772940.firebasestorage.app',
    messagingSenderId: '310512231306',
    measurementId: 'G-3S81J5JS3L',
    oAuthClientId: '310512231306-client.apps.googleusercontent.com',
    recaptchaSiteKey: ''
  },
  'prime-sign-454323-a1': {
    projectId: 'prime-sign-454323-a1',
    appId: '1:586239323703:web:a059280dbd46b59fe419b2',
    apiKey: 'AIzaSyDl0x-9hJ3arA1eC2rUWnHESlw6whWZsm4',
    authDomain: 'prime-sign-454323-a1.firebaseapp.com',
    firestoreDatabaseId: 'ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a',
    storageBucket: 'prime-sign-454323-a1.firebasestorage.app',
    messagingSenderId: '586239323703',
    measurementId: '',
    oAuthClientId: '586239323703-kn4f1cde1ptvk0j57bbh10jajruf9cki.apps.googleusercontent.com',
    recaptchaSiteKey: ''
  }
};

const STORAGE_KEY = 'ajwmes_active_firebase_project';

export function getStoredProjectOverride(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setStoredProjectOverride(projectId: string | null) {
  if (typeof window === 'undefined') return;
  try {
    if (projectId) {
      localStorage.setItem(STORAGE_KEY, projectId);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('Could not persist project override:', e);
  }
}

function resolveActiveConfig(): FirebaseAppConfig {
  const override = getStoredProjectOverride();
  if (override && KNOWN_FIREBASE_PROJECTS[override]) {
    return { ...KNOWN_FIREBASE_PROJECTS[override] };
  }

  // Next check env var or rawConfig
  const envProject = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string)?.trim();
  const rawProject = rawConfig.projectId?.trim();

  // If env specifies gen-lang-client-0618772940, use gen-lang profile with env overrides
  if (envProject === 'gen-lang-client-0618772940' || (!override && envProject)) {
    return {
      projectId: envProject || 'gen-lang-client-0618772940',
      appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || KNOWN_FIREBASE_PROJECTS['gen-lang-client-0618772940'].appId,
      apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || KNOWN_FIREBASE_PROJECTS['gen-lang-client-0618772940'].apiKey,
      authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || KNOWN_FIREBASE_PROJECTS['gen-lang-client-0618772940'].authDomain,
      firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || 'ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a',
      storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || KNOWN_FIREBASE_PROJECTS['gen-lang-client-0618772940'].storageBucket,
      messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || KNOWN_FIREBASE_PROJECTS['gen-lang-client-0618772940'].messagingSenderId,
      measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || 'G-3S81J5JS3L',
      oAuthClientId: (import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID as string) || KNOWN_FIREBASE_PROJECTS['gen-lang-client-0618772940'].oAuthClientId,
      recaptchaSiteKey: rawConfig.recaptchaSiteKey || '',
    };
  }

  // Fallback to rawConfig or prime-sign
  if (rawProject && KNOWN_FIREBASE_PROJECTS[rawProject]) {
    return { ...KNOWN_FIREBASE_PROJECTS[rawProject] };
  }

  return { ...KNOWN_FIREBASE_PROJECTS['prime-sign-454323-a1'] };
}

export const firebaseConfig: FirebaseAppConfig = resolveActiveConfig();

export default firebaseConfig;
