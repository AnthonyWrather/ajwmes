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
  writeBatch
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { JobRecord, CatalogItem, PostalOrder, VesselSpec } from '../types';

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
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is offline. Local state fallback will be active.');
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
    },
    (error) => {
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
    },
    (error) => {
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
    },
    (error) => {
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
    },
    (error) => {
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
