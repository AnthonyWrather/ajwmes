/**
 * Pure domain calculations and queue validation for offline pontoon operations.
 * Governs mutation queue rollups, synchronization progress, and replay sequencing.
 */

import { CustomerSignOffRecord, OfflineQueuedMedia, OfflineJobSheetUpdate, MaterialLineItem } from '../types';

export interface QueueTotalsSummary {
  totalPending: number;
  pendingPhotos: number;
  pendingSignatures: number;
  pendingJobs: number;
  pendingEmails: number;
  hasPendingItems: boolean;
}

export type PontoonConnectionState = 'offline' | 'pending' | 'connected';

export interface PontoonStatusDescriptor {
  state: PontoonConnectionState;
  title: string;
  statusBadge: string;
  description: string;
}

/**
 * Calculates total queued items across all offline storage stores.
 */
export function calculateQueueTotals(
  photosCount: number,
  signaturesCount: number,
  jobsCount: number,
  emailsCount: number = 0
): QueueTotalsSummary {
  const safePhotos = Math.max(0, Math.floor(photosCount || 0));
  const safeSigs = Math.max(0, Math.floor(signaturesCount || 0));
  const safeJobs = Math.max(0, Math.floor(jobsCount || 0));
  const safeEmails = Math.max(0, Math.floor(emailsCount || 0));

  const total = safePhotos + safeSigs + safeJobs + safeEmails;

  return {
    totalPending: total,
    pendingPhotos: safePhotos,
    pendingSignatures: safeSigs,
    pendingJobs: safeJobs,
    pendingEmails: safeEmails,
    hasPendingItems: total > 0
  };
}

/**
 * Computes safe, clamped synchronization progress percentage.
 * Allows custom initial offset (default: 10%) and scale factor (default: 80%).
 */
export function calculateSyncProgressPercent(
  processedCount: number,
  totalCount: number,
  baseOffset = 10,
  scale = 80
): number {
  if (totalCount <= 0) return 100;
  const safeProcessed = Math.max(0, Math.min(processedCount, totalCount));
  const calculated = Math.round((safeProcessed / totalCount) * scale) + baseOffset;
  return Math.min(100, Math.max(0, calculated));
}

/**
 * Formats a Date object into UK locale 24-hour time string (HH:MM:SS).
 */
export function formatSyncTimestamp(date: Date = new Date()): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

/**
 * Derives UI status descriptor based on device connectivity and queued item volume.
 */
export function getPontoonConnectionStatus(
  isOnline: boolean,
  totalPending: number,
  lastSyncedAt?: string | null
): PontoonStatusDescriptor {
  if (!isOnline) {
    return {
      state: 'offline',
      title: 'Vessel Pontoon Offline Mode',
      statusBadge: 'Disconnected',
      description: 'IndexedDB is caching photos, signatures & hours locally on this device.'
    };
  }

  if (totalPending > 0) {
    return {
      state: 'pending',
      title: 'Pending Pontoon Queue',
      statusBadge: 'Online',
      description: `${totalPending} ${totalPending === 1 ? 'item' : 'items'} stored locally awaiting background transmission.`
    };
  }

  return {
    state: 'connected',
    title: 'Pontoon Sync Active & Connected',
    statusBadge: 'Online',
    description: lastSyncedAt
      ? `Last synchronized with Solent Cloud at ${lastSyncedAt}`
      : 'All vessel records are in sync with Google Firestore.'
  };
}

export type QueueReplayItemType = 'signature' | 'job' | 'email' | 'photo';

export interface PrioritizableReplayItem {
  id: string;
  type: QueueReplayItemType;
  timestamp: string | number;
}

/**
 * Prioritizes mutation queue items for replaying.
 * Lightweight structural data (signatures, job sheets, emails) is prioritized before
 * heavy binary media (photos) to maximize data resilience over intermittent Solent marina WiFi.
 */
export function prioritizeQueueReplayOrder<T extends PrioritizableReplayItem>(items: T[]): T[] {
  const typePriority: Record<QueueReplayItemType, number> = {
    signature: 1,
    job: 2,
    email: 3,
    photo: 4
  };

  return [...items].sort((a, b) => {
    const priorityDiff = typePriority[a.type] - typePriority[b.type];
    if (priorityDiff !== 0) return priorityDiff;

    const timeA = typeof a.timestamp === 'number' ? a.timestamp : new Date(a.timestamp).getTime();
    const timeB = typeof b.timestamp === 'number' ? b.timestamp : new Date(b.timestamp).getTime();
    return timeA - timeB;
  });
}

/**
 * Validates integrity of customer sign-off record before transmission.
 */
export function validateSignOffPayload(signOff: Partial<CustomerSignOffRecord> | null | undefined): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!signOff) {
    return { valid: false, errors: ['Sign-off payload is missing'] };
  }

  if (!signOff.jobId || typeof signOff.jobId !== 'string' || !signOff.jobId.trim()) {
    errors.push('Missing or invalid jobId');
  }
  if (!signOff.clientName || typeof signOff.clientName !== 'string' || !signOff.clientName.trim()) {
    errors.push('Client/signee name is required');
  }
  if (!signOff.signatureDataUrl || typeof signOff.signatureDataUrl !== 'string' || !signOff.signatureDataUrl.startsWith('data:image/')) {
    errors.push('Valid canvas signature image is required');
  }
  if (typeof signOff.agreedDiagnosticHours !== 'number' || signOff.agreedDiagnosticHours < 0) {
    errors.push('Agreed diagnostic hours must be a non-negative number');
  }
  if (typeof signOff.agreedTotalEstimate !== 'number' || signOff.agreedTotalEstimate < 0) {
    errors.push('Agreed total estimate must be a non-negative number');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates integrity of queued photo record before transmission.
 */
export function validateQueuedPhotoPayload(photo: Partial<OfflineQueuedMedia> | null | undefined): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (!photo) {
    return { valid: false, errors: ['Photo payload is missing'] };
  }

  if (!photo.id || typeof photo.id !== 'string') {
    errors.push('Missing photo queue ID');
  }
  if (!photo.jobId || typeof photo.jobId !== 'string') {
    errors.push('Missing photo jobId');
  }
  if (!photo.blob && !photo.previewUrl) {
    errors.push('Photo must have binary blob or base64 previewUrl');
  }
  if (typeof photo.fileSizeBytes === 'number' && photo.fileSizeBytes <= 0) {
    errors.push('Invalid photo file size');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

export interface JobSheetReplayEvaluation {
  shouldSave: boolean;
  resolvedMaterials: MaterialLineItem[];
}

/**
 * Pure evaluation for replaying offline job sheet and customer sign-off mutations.
 * Ensures diagnostic labor hours logged without materials are never skipped upon queue replay.
 * Preserves existing job materials when a customer sign-off payload is replayed.
 */
export function evaluateJobSheetReplay(
  hours: number = 0,
  materials?: MaterialLineItem[],
  existingMaterials?: MaterialLineItem[],
  isSignOff?: boolean
): JobSheetReplayEvaluation {
  const hasHours = typeof hours === 'number' && hours > 0;
  const hasMaterials = Array.isArray(materials) && materials.length > 0;
  const shouldSave = hasHours || hasMaterials;

  const resolvedMaterials: MaterialLineItem[] = hasMaterials
    ? materials
    : (isSignOff && Array.isArray(existingMaterials) && existingMaterials.length > 0
        ? existingMaterials
        : (Array.isArray(materials) ? materials : []));

  return { shouldSave, resolvedMaterials };
}
