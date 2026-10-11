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
  deleteDoc,
  getDocs,
  writeBatch,
  enableNetwork,
  disableNetwork
} from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';
import { detectEnvironment } from './environment';
import { JobRecord, CatalogItem, CategoryItem, PostalOrder, VesselSpec, UserProfile, FirestoreConnectionState } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

/**
 * Returns environment-scoped Firestore collection name
 * e.g., 'ais_dev_jobs' vs 'jobs' (for GitHub production)
 */
export function getScopedCollection(baseCollection: string): string {
  const env = detectEnvironment();
  return `${env.firestoreCollectionPrefix}${baseCollection}`;
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
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export { storage, uploadSwitchPanelImage, uploadMultiplePanelImages, deleteSwitchPanelImage, isFirebaseStorageUrl } from './storage';
export type { UploadedPanelImage, UploadProgressInfo } from './storage';

// Connection state manager
const currentEnv = detectEnvironment();
const hasApiKey = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 0);

let connectionState: FirestoreConnectionState = {
  isConnected: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isChecking: false,
  lastConnectedAt: null,
  pendingSyncCount: 0,
  errorMessage: undefined,
  isSimulatedOffline: false,
  isIsolatedMode: false,
  environment: currentEnv.envCode,
  environmentName: currentEnv.envName,
  hasApiKey: true
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
  const env = detectEnvironment();
  const validKey = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 0);

  if (!validKey) {
    updateConnectionState({
      isConnected: false,
      isChecking: false,
      isIsolatedMode: true,
      environment: env.envCode,
      environmentName: env.envName,
      hasApiKey: false,
      errorMessage: 'AI Studio Isolated Test Storage Active'
    });
    return false;
  }

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
      isIsolatedMode: false,
      environment: env.envCode,
      environmentName: env.envName,
      hasApiKey: true,
      lastConnectedAt: nowStr,
      errorMessage: undefined,
    });
    return true;
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : String(error);
    const isOffline =
      errMessage.includes('offline') ||
      errMessage.includes('unavailable') ||
      (typeof navigator !== 'undefined' && !navigator.onLine);

    updateConnectionState({
      isConnected: !isOffline,
      isChecking: false,
      environment: env.envCode,
      environmentName: env.envName,
      hasApiKey: true,
      errorMessage: isOffline ? 'The client is currently offline or disconnected from Firestore.' : undefined,
    });
    return !isOffline;
  }
}

// Retry / Reconnect
export async function retryFirestoreConnection(): Promise<boolean> {
  const validKey = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 0);
  if (!validKey) {
    return false;
  }

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
async function testConnection(retryCount = 0) {
  const env = detectEnvironment();
  const validKey = Boolean(firebaseConfig.apiKey && firebaseConfig.apiKey.trim().length > 0);

  if (!validKey) {
    updateConnectionState({
      isConnected: false,
      isIsolatedMode: true,
      environment: env.envCode,
      environmentName: env.envName,
      hasApiKey: false,
      errorMessage: 'AI Studio Isolated Test Storage Active'
    });
    return;
  }

  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ 
      isConnected: true, 
      isIsolatedMode: false,
      environment: env.envCode,
      environmentName: env.envName,
      hasApiKey: true,
      lastConnectedAt: nowStr, 
      errorMessage: undefined 
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is offline. Local state fallback will be active.');
      updateConnectionState({ 
        isConnected: false, 
        isIsolatedMode: false,
        environment: env.envCode,
        environmentName: env.envName,
        hasApiKey: true,
        errorMessage: 'Firebase client is offline' 
      });
    }
    // Retry up to 3 times with exponential backoff on initial load
    if (retryCount < 3) {
      setTimeout(() => {
        testConnection(retryCount + 1);
      }, (retryCount + 1) * 2000);
    }
  }
}
testConnection();

// Realtime listeners & persistence helpers
export function subscribeJobs(onUpdate: (jobs: JobRecord[]) => void) {
  if (!firebaseConfig.apiKey) {
    return () => {};
  }
  const colPath = getScopedCollection('jobs');
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const remoteJobs = snapshot.docs.map((docSnap) => docSnap.data() as JobRecord);
        onUpdate(remoteJobs);
      }
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
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
  if (!firebaseConfig.apiKey) return;
  const colPath = getScopedCollection('jobs');
  const docPath = `${colPath}/${job.id}`;
  try {
    await setDoc(doc(db, colPath, job.id), cleanForFirestore(job), { merge: true });
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export function subscribeCatalog(onUpdate: (catalog: CatalogItem[]) => void) {
  if (!firebaseConfig.apiKey) {
    return () => {};
  }
  const colPath = getScopedCollection('catalog');
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const items = snapshot.docs.map((docSnap) => docSnap.data() as CatalogItem);
        onUpdate(items);
      }
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
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
  if (!firebaseConfig.apiKey) return;
  const colPath = getScopedCollection('catalog');
  const docPath = `${colPath}/${item.id}`;
  try {
    await setDoc(doc(db, colPath, item.id), cleanForFirestore(item), { merge: true });
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function seedCatalogToFirestore(items: CatalogItem[]) {
  if (!firebaseConfig.apiKey) return;
  const colPath = getScopedCollection('catalog');
  try {
    const existing = await getDocs(collection(db, colPath));
    if (existing.empty) {
      const batch = writeBatch(db);
      for (const item of items) {
        batch.set(doc(db, colPath, item.id), cleanForFirestore(item));
      }
      await batch.commit();
    }
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, colPath);
  }
}

export async function deleteCatalogItemFromFirestore(itemId: string) {
  if (!firebaseConfig.apiKey) return;
  const colPath = getScopedCollection('catalog');
  const docPath = `${colPath}/${itemId}`;
  try {
    await deleteDoc(doc(db, colPath, itemId));
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export function subscribeCategories(onUpdate: (categories: CategoryItem[]) => void) {
  if (!firebaseConfig.apiKey) {
    return () => {};
  }
  const colPath = getScopedCollection('categories');
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const categories = snapshot.docs.map((docSnap) => docSnap.data() as CategoryItem);
        onUpdate(categories);
      }
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
    },
    (error) => {
      if (error instanceof Error && (error.message.includes('offline') || error.message.includes('unavailable'))) {
        updateConnectionState({ isConnected: false, errorMessage: error.message });
      }
      handleFirestoreError(error, OperationType.GET, colPath);
    }
  );
}

export async function syncCategoryToFirestore(category: CategoryItem) {
  if (!firebaseConfig.apiKey) return;
  const colPath = getScopedCollection('categories');
  const docPath = `${colPath}/${category.id}`;
  try {
    await setDoc(doc(db, colPath, category.id), cleanForFirestore(category), { merge: true });
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function deleteCategoryFromFirestore(categoryId: string) {
  if (!firebaseConfig.apiKey) return;
  const colPath = getScopedCollection('categories');
  const docPath = `${colPath}/${categoryId}`;
  try {
    await deleteDoc(doc(db, colPath, categoryId));
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function seedCategoriesToFirestore(categories: CategoryItem[]) {
  if (!firebaseConfig.apiKey) return;
  const colPath = getScopedCollection('categories');
  try {
    const existing = await getDocs(collection(db, colPath));
    if (existing.empty) {
      const batch = writeBatch(db);
      for (const cat of categories) {
        batch.set(doc(db, colPath, cat.id), cleanForFirestore(cat));
      }
      await batch.commit();
    }
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, colPath);
  }
}

export function subscribePostalOrders(onUpdate: (orders: PostalOrder[]) => void) {
  if (!firebaseConfig.apiKey) {
    return () => {};
  }
  const colPath = getScopedCollection('postal_orders');
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const orders = snapshot.docs.map((docSnap) => docSnap.data() as PostalOrder);
        onUpdate(orders);
      }
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
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
  if (!firebaseConfig.apiKey) return;
  const colPath = getScopedCollection('postal_orders');
  const docPath = `${colPath}/${order.id}`;
  try {
    await setDoc(doc(db, colPath, order.id), cleanForFirestore(order), { merge: true });
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export function subscribeVesselSpec(onUpdate: (spec: VesselSpec) => void) {
  if (!firebaseConfig.apiKey) {
    return () => {};
  }
  const colPath = getScopedCollection('vessel_specs');
  return onSnapshot(
    collection(db, colPath),
    (snapshot) => {
      if (!snapshot.empty) {
        const spec = snapshot.docs[0].data() as VesselSpec;
        onUpdate(spec);
      }
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
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
  if (!firebaseConfig.apiKey) return;
  const colPath = getScopedCollection('vessel_specs');
  const docPath = `${colPath}/${spec.id}`;
  try {
    await setDoc(doc(db, colPath, spec.id), cleanForFirestore(spec), { merge: true });
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

// ==========================================
// User Account Database Operations (Firestore)
// ==========================================

export function subscribeUsers(onUpdate: (users: UserProfile[]) => void) {
  if (!firebaseConfig.apiKey) {
    return () => {};
  }
  const colPath = getScopedCollection('users');
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
      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
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
  if (!userId || !firebaseConfig.apiKey) return () => {};
  const colPath = getScopedCollection('users');
  const docPath = `${colPath}/${userId}`;
  return onSnapshot(
    doc(db, colPath, userId),
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
  if (!firebaseConfig.apiKey) return;
  const colPath = getScopedCollection('users');
  const docId = profile.id;
  const docPath = `${colPath}/${docId}`;
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
    await setDoc(doc(db, colPath, docId), cleanForFirestore(payload), { merge: true });
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    updateConnectionState({ isConnected: true, lastConnectedAt: nowStr, errorMessage: undefined });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

export async function seedUsersToFirestore(defaultProfiles: UserProfile[]): Promise<void> {
  if (!firebaseConfig.apiKey) return;
  const colPath = getScopedCollection('users');
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
  if (!firebaseConfig.apiKey) return;
  const colPath = getScopedCollection('users');
  const docPath = `${colPath}/${userId}`;
  try {
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, colPath, userId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}


