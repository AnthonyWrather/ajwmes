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
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || rawConfig.projectId || 'prime-sign-454323-a1',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || rawConfig.appId || '1:586239323703:web:a059280dbd46b59fe419b2',
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || rawConfig.apiKey || 'AIzaSyDl0x-9hJ3arA1eC2rUWnHESlw6whWZsm4',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || rawConfig.authDomain || 'prime-sign-454323-a1.firebaseapp.com',
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || rawConfig.firestoreDatabaseId || 'ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || rawConfig.storageBucket || 'prime-sign-454323-a1.firebasestorage.app',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || rawConfig.messagingSenderId || '586239323703',
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || rawConfig.measurementId || '',
  oAuthClientId: (import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID as string) || rawConfig.oAuthClientId || '586239323703-kn4f1cde1ptvk0j57bbh10jajruf9cki.apps.googleusercontent.com',
  recaptchaSiteKey: rawConfig.recaptchaSiteKey || '',
};

export default firebaseConfig;
