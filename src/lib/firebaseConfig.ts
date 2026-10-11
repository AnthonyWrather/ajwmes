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
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || rawConfig.apiKey || 'AIzaSyCeLVmFhxzY8Ojh2NFUvuyGax-LVDk5tIg',
    authDomain: 'gen-lang-client-0618772940.firebaseapp.com',
    firestoreDatabaseId: 'ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a',
    storageBucket: 'gen-lang-client-0618772940.firebasestorage.app',
    messagingSenderId: '310512231306',
    measurementId: 'G-3S81J5JS3L',
    oAuthClientId: '310512231306-client.apps.googleusercontent.com',
    recaptchaSiteKey: ''
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
  const override = getStoredProjectOverride();
  if (override && KNOWN_FIREBASE_PROJECTS[override]) {
    return { ...KNOWN_FIREBASE_PROJECTS[override] };
  }

  // Next check env var or rawConfig
  const envProject = (import.meta.env.VITE_FIREBASE_PROJECT_ID as string)?.trim();
  const rawProject = rawConfig.projectId?.trim();

  if (envProject) {
    return {
      projectId: envProject,
      appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || KNOWN_FIREBASE_PROJECTS['gen-lang-client-0618772940'].appId,
      apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || rawConfig.apiKey || KNOWN_FIREBASE_PROJECTS['gen-lang-client-0618772940'].apiKey,
      authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || KNOWN_FIREBASE_PROJECTS['gen-lang-client-0618772940'].authDomain,
      firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || 'ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a',
      storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || KNOWN_FIREBASE_PROJECTS['gen-lang-client-0618772940'].storageBucket,
      messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || KNOWN_FIREBASE_PROJECTS['gen-lang-client-0618772940'].messagingSenderId,
      measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || 'G-3S81J5JS3L',
      oAuthClientId: (import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID as string) || KNOWN_FIREBASE_PROJECTS['gen-lang-client-0618772940'].oAuthClientId,
      recaptchaSiteKey: rawConfig.recaptchaSiteKey || '',
    };
  }

  if (rawProject && KNOWN_FIREBASE_PROJECTS[rawProject]) {
    return { ...KNOWN_FIREBASE_PROJECTS[rawProject] };
  }

  return { ...KNOWN_FIREBASE_PROJECTS['gen-lang-client-0618772940'] };
}

export const firebaseConfig: FirebaseAppConfig = resolveActiveConfig();

export default firebaseConfig;
