import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
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
import { firebaseConfig } from './firebaseConfig';
import { JobRecord, CatalogItem, PostalOrder, VesselSpec, UserProfile, FirestoreConnectionState } from '../types';

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

// CRITICAL: Initialize Firestore with database ID and experimentalAutoDetectLongPolling
// This ensures iframe preview proxies and cloud environments maintain a rock-solid connection without stream drops
export const db = (() => {
  try {
    return initializeFirestore(
      app,
      {
        experimentalAutoDetectLongPolling: true,
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
})();
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

// ==========================================
// User Account Database Operations (Firestore)
// ==========================================

export function subscribeUsers(onUpdate: (users: UserProfile[]) => void) {
  const colPath = 'users';
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const users = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: data.uid || data.id || docSnap.id,
            name: data.displayName || data.name || 'User',
            email: data.email || '',
            phone: data.phone || '',
            role: data.role || 'client',
            avatarUrl: data.avatarUrl || data.photoURL || '',
            photoURL: data.photoURL || data.avatarUrl || '',
            vesselName: data.vesselName || '',
            vesselType: data.vesselType || '',
            marinaBerth: data.marinaBerth || '',
            systemVoltage: data.systemVoltage || '12V',
            notifyJobUpdates: data.notifyJobUpdates ?? true,
            notifyDispatchSms: data.notifyDispatchSms ?? true,
            createdAt: data.createdAt || '',
            lastLoginAt: data.lastLoginAt || '',
            updatedAt: data.updatedAt || ''
          } as UserProfile;
        });
        onUpdate(users);
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

export function subscribeUserProfile(userId: string, onUpdate: (user: UserProfile | null) => void) {
  if (!userId) return () => {};
  const docPath = `users/${userId}`;
  return onSnapshot(
    doc(db, 'users', userId),
    (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        const profile: UserProfile = {
          id: data.uid || data.id || snap.id,
          name: data.displayName || data.name || 'User',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || 'client',
          avatarUrl: data.avatarUrl || data.photoURL || '',
          photoURL: data.photoURL || data.avatarUrl || '',
          vesselName: data.vesselName || '',
          vesselType: data.vesselType || '',
          marinaBerth: data.marinaBerth || '',
          systemVoltage: data.systemVoltage || '12V',
          notifyJobUpdates: data.notifyJobUpdates ?? true,
          notifyDispatchSms: data.notifyDispatchSms ?? true,
          createdAt: data.createdAt || '',
          lastLoginAt: data.lastLoginAt || '',
          updatedAt: data.updatedAt || ''
        };
        onUpdate(profile);
      } else {
        onUpdate(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  );
}

export async function syncUserToFirestore(profile: UserProfile): Promise<void> {
  const docId = profile.id;
  const docPath = `users/${docId}`;
  try {
    const payload = {
      uid: docId,
      id: docId,
      displayName: profile.name,
      name: profile.name,
      email: profile.email,
      phone: profile.phone || '',
      role: profile.role,
      avatarUrl: profile.avatarUrl || profile.photoURL || '',
      photoURL: profile.photoURL || profile.avatarUrl || '',
      vesselName: profile.vesselName || '',
      vesselType: profile.vesselType || '',
      marinaBerth: profile.marinaBerth || '',
      systemVoltage: profile.systemVoltage || '12V',
      notifyJobUpdates: profile.notifyJobUpdates ?? true,
      notifyDispatchSms: profile.notifyDispatchSms ?? true,
      createdAt: profile.createdAt || new Date().toISOString(),
      lastLoginAt: profile.lastLoginAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'users', docId), cleanForFirestore(payload), { merge: true });
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ lastConnectedAt: nowStr });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function seedUsersToFirestore(defaultProfiles: UserProfile[]): Promise<void> {
  const colPath = 'users';
  try {
    const existing = await getDocs(collection(db, colPath));
    const existingIds = new Set(existing.docs.map(d => d.id));
    const batch = writeBatch(db);
    let countToSeed = 0;

    for (const p of defaultProfiles) {
      if (!existingIds.has(p.id)) {
        const payload = {
          uid: p.id,
          id: p.id,
          displayName: p.name,
          name: p.name,
          email: p.email,
          phone: p.phone || '',
          role: p.role,
          avatarUrl: p.avatarUrl || '',
          photoURL: p.photoURL || p.avatarUrl || '',
          vesselName: p.vesselName || '',
          vesselType: p.vesselType || '',
          marinaBerth: p.marinaBerth || '',
          systemVoltage: p.systemVoltage || '12V',
          notifyJobUpdates: p.notifyJobUpdates ?? true,
          notifyDispatchSms: p.notifyDispatchSms ?? true,
          createdAt: p.createdAt || '2026-10-01T08:00:00Z',
          lastLoginAt: p.lastLoginAt || '2026-10-10T10:00:00Z',
          updatedAt: new Date().toISOString()
        };
        batch.set(doc(db, colPath, p.id), cleanForFirestore(payload));
        countToSeed++;
      }
    }

    if (countToSeed > 0) {
      await batch.commit();
      console.log(`Seeded ${countToSeed} user accounts to Firestore database.`);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, colPath);
  }
}

export async function deleteUserFromFirestore(userId: string): Promise<void> {
  const docPath = `users/${userId}`;
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'users', userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}


