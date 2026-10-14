import { 
  CustomerSignOffRecord, 
  OfflineQueuedMedia, 
  OfflineJobSheetUpdate, 
  OfflineSyncQueueStatus, 
  JobRecord 
} from '../types';
import { uploadSwitchPanelImage } from './storage';

export type { OfflineSyncQueueStatus };

const DB_NAME = 'ajw_marine_field_db';
const DB_VERSION = 1;

const STORE_MEDIA = 'media_queue';
const STORE_SIGNATURES = 'signatures_queue';
const STORE_JOBS = 'jobs_queue';

/**
 * Open or upgrade the IndexedDB instance
 */
function openOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in current environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_SIGNATURES)) {
        db.createObjectStore(STORE_SIGNATURES, { keyPath: 'jobId' });
      }
      if (!db.objectStoreNames.contains(STORE_JOBS)) {
        db.createObjectStore(STORE_JOBS, { keyPath: 'jobId' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Perform a transaction operation on an object store
 */
async function performTx<T>(
  storeName: string, 
  mode: IDBTransactionMode, 
  callback: (store: IDBObjectStore) => IDBRequest<T> | void
): Promise<T> {
  const db = await openOfflineDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    let request: IDBRequest<T> | undefined;

    try {
      request = callback(store) as IDBRequest<T> | undefined;
    } catch (err) {
      reject(err);
      return;
    }

    tx.oncomplete = () => {
      if (request) {
        resolve(request.result);
      } else {
        resolve(undefined as unknown as T);
      }
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

/**
 * Client-side canvas compression for vessel photos
 * Scales down large camera photos (e.g. 12-48MP down to max 1600px width/height)
 * Compresses to JPEG/WebP target < 400KB
 */
export async function compressFieldImage(file: File | Blob): Promise<{ blob: Blob; previewUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX_WIDTH = 1600;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get 2D canvas context'));
          return;
        }

        // Apply slight sharpening / smoothing setup
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas compression to blob failed'));
              return;
            }
            const previewUrl = URL.createObjectURL(blob);
            resolve({ blob, previewUrl });
          },
          'image/jpeg',
          0.82
        );
      };
      img.onerror = () => reject(new Error('Failed to load image into DOM element'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.readAsDataURL(file);
  });
}

/* -------------------------------------------------------------------------- */
/* IndexedDB Queue CRUD Operations                                            */
/* -------------------------------------------------------------------------- */

export async function enqueueOfflinePhoto(
  job: JobRecord,
  file: File | Blob,
  category: OfflineQueuedMedia['category'] = 'work_fitment'
): Promise<OfflineQueuedMedia> {
  const { blob, previewUrl } = await compressFieldImage(file);
  const mediaItem: OfflineQueuedMedia = {
    id: `offline-media-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    jobId: job.id,
    jobReference: job.reference,
    vesselName: job.vesselName,
    category,
    blob,
    previewUrl,
    fileName: `field_proof_${job.reference.toLowerCase()}_${Date.now()}.jpg`,
    fileSizeBytes: blob.size,
    capturedAt: new Date().toISOString(),
    status: 'queued'
  };

  await performTx(STORE_MEDIA, 'readwrite', (store) => store.put(mediaItem));
  notifyQueueChanged();
  return mediaItem;
}

export async function getPendingPhotos(): Promise<OfflineQueuedMedia[]> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_MEDIA, 'readonly');
      const store = tx.objectStore(STORE_MEDIA);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function enqueueCustomerSignOff(signOff: CustomerSignOffRecord): Promise<void> {
  await performTx(STORE_SIGNATURES, 'readwrite', (store) => store.put(signOff));
  notifyQueueChanged();
}

export async function getPendingSignatures(): Promise<CustomerSignOffRecord[]> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_SIGNATURES, 'readonly');
      const store = tx.objectStore(STORE_SIGNATURES);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function enqueueJobSheetUpdate(update: OfflineJobSheetUpdate): Promise<void> {
  await performTx(STORE_JOBS, 'readwrite', (store) => store.put(update));
  notifyQueueChanged();
}

export async function getPendingJobUpdates(): Promise<OfflineJobSheetUpdate[]> {
  try {
    const db = await openOfflineDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_JOBS, 'readonly');
      const store = tx.objectStore(STORE_JOBS);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function deleteQueuedItem(storeName: string, key: string): Promise<void> {
  await performTx(storeName, 'readwrite', (store) => store.delete(key));
  notifyQueueChanged();
}

/* -------------------------------------------------------------------------- */
/* Queue Observer & State Management                                         */
/* -------------------------------------------------------------------------- */

type QueueListener = (status: OfflineSyncQueueStatus) => void;
const listeners = new Set<QueueListener>();

let currentStatus: OfflineSyncQueueStatus = {
  totalPending: 0,
  pendingJobs: 0,
  pendingPhotos: 0,
  pendingSignatures: 0,
  isSyncing: false,
  syncProgressPercent: 0,
  lastSyncedAt: null
};

export function subscribeToQueueStatus(listener: QueueListener): () => void {
  listeners.add(listener);
  // Send initial status
  refreshQueueStatus();
  return () => {
    listeners.delete(listener);
  };
}

export async function refreshQueueStatus(): Promise<OfflineSyncQueueStatus> {
  const [photos, sigs, jobs] = await Promise.all([
    getPendingPhotos(),
    getPendingSignatures(),
    getPendingJobUpdates()
  ]);

  currentStatus = {
    ...currentStatus,
    pendingPhotos: photos.length,
    pendingSignatures: sigs.length,
    pendingJobs: jobs.length,
    totalPending: photos.length + sigs.length + jobs.length
  };

  listeners.forEach((l) => l(currentStatus));
  return currentStatus;
}

function notifyQueueChanged() {
  refreshQueueStatus();
}

/* -------------------------------------------------------------------------- */
/* Seamless Automatic Sync Engine                                             */
/* -------------------------------------------------------------------------- */

export interface SyncCallbacks {
  onJobUpdated?: (jobId: string, hours: number, materials: any[], signOff?: CustomerSignOffRecord, photoUrls?: string[]) => void;
  onPostMessage?: (jobId: string, text: string, attachments?: string[]) => void;
}

let activeCallbacks: SyncCallbacks = {};

export function registerSyncCallbacks(callbacks: SyncCallbacks) {
  activeCallbacks = { ...activeCallbacks, ...callbacks };
}

/**
 * Executes full synchronization of queued photos, signatures, and job updates
 */
export async function triggerSyncNow(): Promise<{ success: boolean; syncedCount: number; errors: string[] }> {
  if (currentStatus.isSyncing) {
    return { success: true, syncedCount: 0, errors: [] };
  }

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) {
    return { success: false, syncedCount: 0, errors: ['Device currently offline'] };
  }

  currentStatus = {
    ...currentStatus,
    isSyncing: true,
    syncProgressPercent: 10,
    lastError: undefined
  };
  listeners.forEach((l) => l(currentStatus));

  const errors: string[] = [];
  let syncedCount = 0;

  try {
    const photos = await getPendingPhotos();
    const signatures = await getPendingSignatures();
    const jobUpdates = await getPendingJobUpdates();
    const totalItems = photos.length + signatures.length + jobUpdates.length;

    if (totalItems === 0) {
      currentStatus = {
        ...currentStatus,
        isSyncing: false,
        syncProgressPercent: 100,
        lastSyncedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      };
      listeners.forEach((l) => l(currentStatus));
      return { success: true, syncedCount: 0, errors: [] };
    }

    let processedItems = 0;

    // 1. Process Photos to Firebase Cloud Storage
    for (const photo of photos) {
      try {
        const fileObj = new File([photo.blob], photo.fileName, { type: photo.blob.type || 'image/jpeg' });
        const uploaded = await uploadSwitchPanelImage(fileObj, {
          jobReference: photo.jobReference,
          vesselName: photo.vesselName,
          category: 'cad_export'
        });

        // Notify chat/job thread
        if (activeCallbacks.onPostMessage) {
          activeCallbacks.onPostMessage(
            photo.jobId,
            `🔧 [Synced Pontoon Work Photo]\nTechnician photo captured offline at ${new Date(photo.capturedAt).toLocaleTimeString('en-GB')}, successfully uploaded to Cloud Storage.`,
            [uploaded.url]
          );
        }

        // Remove from DB
        await deleteQueuedItem(STORE_MEDIA, photo.id);
        syncedCount++;
      } catch (err: any) {
        console.warn(`Failed to sync photo ${photo.id}:`, err);
        errors.push(`Photo ${photo.fileName}: ${err.message || 'Upload error'}`);
      }
      processedItems++;
      currentStatus.syncProgressPercent = Math.round((processedItems / totalItems) * 80) + 10;
      listeners.forEach((l) => l(currentStatus));
    }

    // 2. Process Signatures
    for (const sig of signatures) {
      try {
        const updatedSig: CustomerSignOffRecord = {
          ...sig,
          signedAtSynced: new Date().toISOString(),
          synced: true
        };

        if (activeCallbacks.onJobUpdated) {
          activeCallbacks.onJobUpdated(
            sig.jobId,
            sig.agreedDiagnosticHours,
            [],
            updatedSig
          );
        }

        if (activeCallbacks.onPostMessage) {
          activeCallbacks.onPostMessage(
            sig.jobId,
            `✍️ [Customer Sign-Off Synchronized]\nSigned by ${sig.clientName} (${sig.signerRole.replace('_', ' ')}) aboard vessel on pontoon. Diagnostic Labor: ${sig.agreedDiagnosticHours}h. Total: £${sig.agreedTotalEstimate.toFixed(2)}.`
          );
        }

        await deleteQueuedItem(STORE_SIGNATURES, sig.jobId);
        syncedCount++;
      } catch (err: any) {
        console.warn(`Failed to sync signature for job ${sig.jobId}:`, err);
        errors.push(`Sign-off for ${sig.jobReference}: ${err.message}`);
      }
      processedItems++;
      currentStatus.syncProgressPercent = Math.round((processedItems / totalItems) * 80) + 10;
      listeners.forEach((l) => l(currentStatus));
    }

    // 3. Process Job Sheet Updates
    for (const jobUp of jobUpdates) {
      try {
        if (activeCallbacks.onJobUpdated) {
          activeCallbacks.onJobUpdated(jobUp.jobId, jobUp.hours, jobUp.materials);
        }
        await deleteQueuedItem(STORE_JOBS, jobUp.jobId);
        syncedCount++;
      } catch (err: any) {
        console.warn(`Failed to sync job sheet ${jobUp.jobId}:`, err);
        errors.push(`Job update for ${jobUp.jobId}: ${err.message}`);
      }
      processedItems++;
    }

    currentStatus = {
      ...currentStatus,
      isSyncing: false,
      syncProgressPercent: 100,
      lastSyncedAt: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      lastError: errors.length > 0 ? errors[0] : undefined
    };
    await refreshQueueStatus();
    return { success: errors.length === 0, syncedCount, errors };
  } catch (err: any) {
    currentStatus = {
      ...currentStatus,
      isSyncing: false,
      lastError: err.message
    };
    listeners.forEach((l) => l(currentStatus));
    return { success: false, syncedCount, errors: [err.message] };
  }
}

/**
 * Initialize global auto-sync listeners on online event
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Network reconnected - initiating automatic pontoon sync...');
    setTimeout(() => {
      triggerSyncNow().catch(console.warn);
    }, 1500);
  });
}
