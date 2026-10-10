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
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || rawConfig.projectId || '',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || rawConfig.appId || '',
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || rawConfig.apiKey || '',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || rawConfig.authDomain || '',
  firestoreDatabaseId: (import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID as string) || rawConfig.firestoreDatabaseId || '',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || rawConfig.storageBucket || '',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || rawConfig.messagingSenderId || '',
  measurementId: (import.meta.env.VITE_FIREBASE_MEASUREMENT_ID as string) || rawConfig.measurementId || '',
  oAuthClientId: (import.meta.env.VITE_FIREBASE_OAUTH_CLIENT_ID as string) || rawConfig.oAuthClientId || '',
  recaptchaSiteKey: rawConfig.recaptchaSiteKey || '',
};

export default firebaseConfig;
