import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDocFromServer, 
  collection, 
  onSnapshot, 
  setDoc, 
  getDocs,
  writeBatch,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JobRecord, CatalogItem, PostalOrder, VesselSpec, FirestoreConnectionState } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

// Initialize Firebase App
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export { storage, uploadSwitchPanelImage, uploadMultiplePanelImages, deleteSwitchPanelImage, isFirebaseStorageUrl } from './storage';
export type { UploadedPanelImage, UploadProgressInfo } from './storage';

// Connection state manager
let connectionState: FirestoreConnectionState = {
  isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isChecking: false,
  lastConnectedAt: null,
  pendingSyncCount: 0,
  errorMessage: undefined,
  isSimulatedOffline: false,
};

const connectionListeners: Set<(state: FirestoreConnectionState) => void> = new Set();

function updateConnectionState(partial: Partial<FirestoreConnectionState>) {
  connectionState = { ...connectionState, ...partial };
  connectionListeners.forEach((listener) => {
    try {
      listener(connectionState);
    } catch (e) {
      console.warn('Error in connection state listener:', e);
    }
  });
}

export function getConnectionState(): FirestoreConnectionState {
  return connectionState;
}

export function subscribeConnectionState(listener: (state: FirestoreConnectionState) => void): () => void {
  connectionListeners.add(listener);
  listener(connectionState);
  return () => {
    connectionListeners.delete(listener);
  };
}

// Active connection verification
export async function checkFirestoreConnection(): Promise<boolean> {
  if (connectionState.isSimulatedOffline) {
    updateConnectionState({ isConnected: false, isChecking: false, errorMessage: 'Simulated offline mode' });
    return false;
  }

  updateConnectionState({ isChecking: true });
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({
      isConnected: true,
      isChecking: false,
      lastConnectedAt: nowStr,
      errorMessage: undefined,
    });
    return true;
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const isOffline =
      errMessage.includes('the client is offline') ||
      errMessage.includes('unavailable') ||
      (typeof navigator !== 'undefined' && !navigator.onLine);

    updateConnectionState({
      isConnected: !isOffline,
      isChecking: false,
      errorMessage: isOffline ? 'The client is currently offline or disconnected from Firestore.' : undefined,
    });
    return !isOffline;
  }
}

// Retry / Reconnect
export async function retryFirestoreConnection(): Promise<boolean> {
  updateConnectionState({ isChecking: true });
  try {
    if (connectionState.isSimulatedOffline) {
      connectionState.isSimulatedOffline = false;
    }
    await enableNetwork(db);
    return await checkFirestoreConnection();
  } catch (error) {
    console.warn('Failed to re-enable Firestore network:', error);
    updateConnectionState({ isChecking: false, isConnected: false, errorMessage: 'Failed to reconnect to Firestore server.' });
    return false;
  }
}

// Simulated offline mode (for QA & interactive verification of the delayed sync indicator)
export async function toggleSimulatedOffline(forceOffline: boolean): Promise<boolean> {
  if (forceOffline) {
    try {
      await disableNetwork(db);
    } catch (e) {
      console.warn('disableNetwork notice:', e);
    }
    updateConnectionState({
      isConnected: false,
      isChecking: false,
      isSimulatedOffline: true,
      errorMessage: 'Simulated connection loss (Firestore network disabled for testing)'
    });
    return false;
  } else {
    try {
      await enableNetwork(db);
    } catch (e) {
      console.warn('enableNetwork notice:', e);
    }
    updateConnectionState({ isSimulatedOffline: false });
    return await checkFirestoreConnection();
  }
}

// Setup browser online/offline listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    checkFirestoreConnection();
  });
  window.addEventListener('offline', () => {
    updateConnectionState({
      isConnected: false,
      errorMessage: 'Browser has lost internet connectivity',
    });
  });
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errMessage = error instanceof Error ? error.message : String(error);
  if (errMessage.includes('the client is offline') || errMessage.includes('unavailable')) {
    updateConnectionState({ isConnected: false, errorMessage: 'Disconnected from Firestore' });
  }

  const errInfo: FirestoreErrorInfo = {
    error: errMessage,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test as mandated by the Firebase Integration Skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is offline. Local state fallback will be active.');
      updateConnectionState({ isConnected: false, errorMessage: 'Firebase client is offline' });
    }
  }
}
testConnection();

// Realtime listeners & persistence helpers
export function subscribeJobs(onUpdate: (jobs: JobRecord[]) => void) {
  const colPath = 'jobs';
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const remoteJobs = snapshot.docs.map((docSnap) => docSnap.data() as JobRecord);
        onUpdate(remoteJobs);
      }
      if (!snapshot.metadata.fromCache) {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        updateConnectionState({ isConnected: true, lastConnectedAt: nowStr });
      }
    },
    (error) => {
      if (error instanceof Error && (error.message.includes('offline') || error.message.includes('unavailable'))) {
        updateConnectionState({ isConnected: false, errorMessage: error.message });
      }
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

function cleanForFirestore<T>(obj: T): any {
  return JSON.parse(JSON.stringify(obj));
}

export async function syncJobToFirestore(job: JobRecord) {
  const docPath = `jobs/${job.id}`;
  try {
    await setDoc(doc(db, 'jobs', job.id), cleanForFirestore(job), { merge: true });
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ lastConnectedAt: nowStr });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export function subscribeCatalog(onUpdate: (catalog: CatalogItem[]) => void) {
  const colPath = 'catalog';
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((docSnap) => docSnap.data() as CatalogItem);
        onUpdate(items);
      }
      if (!snapshot.metadata.fromCache) {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        updateConnectionState({ isConnected: true, lastConnectedAt: nowStr });
      }
    },
    (error) => {
      if (error instanceof Error && (error.message.includes('offline') || error.message.includes('unavailable'))) {
        updateConnectionState({ isConnected: false, errorMessage: error.message });
      }
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export async function syncCatalogItemToFirestore(item: CatalogItem) {
  const docPath = `catalog/${item.id}`;
  try {
    await setDoc(doc(db, 'catalog', item.id), cleanForFirestore(item), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function seedCatalogToFirestore(items: CatalogItem[]) {
  const colPath = 'catalog';
  try {
    const existing = await getDocs(collection(db, colPath));
    if (existing.empty) {
      const batch = writeBatch(db);
      for (const item of items) {
        batch.set(doc(db, colPath, item.id), cleanForFirestore(item));
      }
      await batch.commit();
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, colPath);
  }
}

export function subscribePostalOrders(onUpdate: (orders: PostalOrder[]) => void) {
  const colPath = 'postal_orders';
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const orders = snapshot.docs.map((docSnap) => docSnap.data() as PostalOrder);
        onUpdate(orders);
      }
      if (!snapshot.metadata.fromCache) {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        updateConnectionState({ isConnected: true, lastConnectedAt: nowStr });
      }
    },
    (error) => {
      if (error instanceof Error && (error.message.includes('offline') || error.message.includes('unavailable'))) {
        updateConnectionState({ isConnected: false, errorMessage: error.message });
      }
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export async function syncPostalOrderToFirestore(order: PostalOrder) {
  const docPath = `postal_orders/${order.id}`;
  try {
    await setDoc(doc(db, 'postal_orders', order.id), cleanForFirestore(order), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export function subscribeVesselSpec(onUpdate: (spec: VesselSpec) => void) {
  const colPath = 'vessel_specs';
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const spec = snapshot.docs[0].data() as VesselSpec;
        onUpdate(spec);
      }
      if (!snapshot.metadata.fromCache) {
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        updateConnectionState({ isConnected: true, lastConnectedAt: nowStr });
      }
    },
    (error) => {
      if (error instanceof Error && (error.message.includes('offline') || error.message.includes('unavailable'))) {
        updateConnectionState({ isConnected: false, errorMessage: error.message });
      }
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export async function syncVesselSpecToFirestore(spec: VesselSpec) {
  const docPath = `vessel_specs/${spec.id}`;
  try {
    await setDoc(doc(db, 'vessel_specs', spec.id), cleanForFirestore(spec), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

