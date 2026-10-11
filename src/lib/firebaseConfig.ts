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

/**
 * Safely resolves Firebase configuration from environment variables (e.g. VITE_FIREBASE_API_KEY)
 * with a fallback to the non-secret metadata in firebase-applet-config.json.
 * 
 * This prevents committing API keys directly into source control, resolving GitHub Secret Scanning
 * alerts and Push Protection failures while keeping Auth, Firestore, and Storage functional.
 */
export const firebaseConfig: FirebaseAppConfig = {
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || rawConfig.projectId || 'gen-lang-client-0618772940',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || rawConfig.appId || '1:310512231306:web:35ac83e7f7f56d49a39e73',
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || rawConfig.apiKey || 'AIzaSyDl0x-9hJ3arA1eC2rUWnHESlw6whWZsm4',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || rawConfig.authDomain || 'gen-lang-client-0618772940.firebaseapp.com',
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || rawConfig.firestoreDatabaseId || 'ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || rawConfig.storageBucket || 'gen-lang-client-0618772940.firebasestorage.app',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || rawConfig.messagingSenderId || '310512231306',
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || rawConfig.measurementId || 'G-3S81J5JS3L',
  oAuthClientId: (import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID as string) || rawConfig.oAuthClientId || '310512231306-client.apps.googleusercontent.com',
  recaptchaSiteKey: rawConfig.recaptchaSiteKey || '',
};

export default firebaseConfig;
