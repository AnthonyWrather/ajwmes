import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQueueTotals,
  calculateSyncProgressPercent,
  formatSyncTimestamp,
  getPontoonConnectionStatus,
  prioritizeQueueReplayOrder,
  validateSignOffPayload,
  validateQueuedPhotoPayload,
  PrioritizableReplayItem
} from './offlineQueueCalculations';

describe('offlineQueueCalculations', () => {
  describe('calculateQueueTotals', () => {
    it('returns zeroes and false for empty queue counts', () => {
      const result = calculateQueueTotals(0, 0, 0, 0);
      assert.deepEqual(result, {
        totalPending: 0,
        pendingPhotos: 0,
        pendingSignatures: 0,
        pendingJobs: 0,
        pendingEmails: 0,
        hasPendingItems: false
      });
    });

    it('sums positive queue counts correctly', () => {
      const result = calculateQueueTotals(3, 1, 2, 4);
      assert.deepEqual(result, {
        totalPending: 10,
        pendingPhotos: 3,
        pendingSignatures: 1,
        pendingJobs: 2,
        pendingEmails: 4,
        hasPendingItems: true
      });
    });

    it('sanitizes negative, fractional, or NaN values safely', () => {
      const result = calculateQueueTotals(-5, 2.7, NaN, 1);
      assert.deepEqual(result, {
        totalPending: 3,
        pendingPhotos: 0,
        pendingSignatures: 2,
        pendingJobs: 0,
        pendingEmails: 1,
        hasPendingItems: true
      });
    });
  });

  describe('calculateSyncProgressPercent', () => {
    it('returns 100% when totalCount is 0', () => {
      assert.equal(calculateSyncProgressPercent(0, 0), 100);
      assert.equal(calculateSyncProgressPercent(5, 0), 100);
    });

    it('calculates expected progression percentages with base offset', () => {
      // 0 processed: 0/4 * 80 + 10 = 10%
      assert.equal(calculateSyncProgressPercent(0, 4), 10);
      // 2 processed: 2/4 * 80 + 10 = 50%
      assert.equal(calculateSyncProgressPercent(2, 4), 50);
      // 4 processed: 4/4 * 80 + 10 = 90%
      assert.equal(calculateSyncProgressPercent(4, 4), 90);
    });

    it('clamps to valid bounds 0 - 100', () => {
      assert.equal(calculateSyncProgressPercent(10, 5), 90);
      assert.equal(calculateSyncProgressPercent(10, 5, 50, 60), 100);
    });
  });

  describe('formatSyncTimestamp', () => {
    it('formats valid Date into HH:MM:SS format', () => {
      const fixedDate = new Date('2026-10-17T14:32:05Z');
      const formatted = formatSyncTimestamp(fixedDate);
      assert.match(formatted, /^\d{2}:\d{2}:\d{2}$/);
    });

    it('defaults to current time without arguments', () => {
      const formatted = formatSyncTimestamp();
      assert.match(formatted, /^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('getPontoonConnectionStatus', () => {
    it('returns offline state when isOnline is false regardless of queue count', () => {
      const status = getPontoonConnectionStatus(false, 3);
      assert.equal(status.state, 'offline');
      assert.equal(status.title, 'Vessel Pontoon Offline Mode');
      assert.equal(status.statusBadge, 'Disconnected');
      assert.match(status.description, /IndexedDB is caching photos/i);
    });

    it('returns pending state when online with queued items', () => {
      const status = getPontoonConnectionStatus(true, 4);
      assert.equal(status.state, 'pending');
      assert.equal(status.title, 'Pending Pontoon Queue');
      assert.equal(status.statusBadge, 'Online');
      assert.equal(status.description, '4 items stored locally awaiting background transmission.');
    });

    it('handles singular grammar for single queued item', () => {
      const status = getPontoonConnectionStatus(true, 1);
      assert.equal(status.description, '1 item stored locally awaiting background transmission.');
    });

    it('returns connected state when online with 0 pending items', () => {
      const status = getPontoonConnectionStatus(true, 0, '14:30:00');
      assert.equal(status.state, 'connected');
      assert.equal(status.title, 'Pontoon Sync Active & Connected');
      assert.equal(status.statusBadge, 'Online');
      assert.equal(status.description, 'Last synchronized with Solent Cloud at 14:30:00');
    });

    it('returns connected state with fallback description if lastSyncedAt is null', () => {
      const status = getPontoonConnectionStatus(true, 0, null);
      assert.equal(status.state, 'connected');
      assert.equal(status.description, 'All vessel records are in sync with Google Firestore.');
    });
  });

  describe('prioritizeQueueReplayOrder', () => {
    it('sorts lightweight signatures and job sheets before heavy media photos', () => {
      const items: PrioritizableReplayItem[] = [
        { id: 'photo-1', type: 'photo', timestamp: 1000 },
        { id: 'job-1', type: 'job', timestamp: 1100 },
        { id: 'sig-1', type: 'signature', timestamp: 1200 },
        { id: 'email-1', type: 'email', timestamp: 1300 },
        { id: 'photo-2', type: 'photo', timestamp: 1050 }
      ];

      const sorted = prioritizeQueueReplayOrder(items);
      const sortedTypes = sorted.map(i => i.type);

      assert.deepEqual(sortedTypes, ['signature', 'job', 'email', 'photo', 'photo']);
      assert.equal(sorted[3].id, 'photo-1'); // earlier photo first
      assert.equal(sorted[4].id, 'photo-2');
    });
  });

  describe('validateSignOffPayload', () => {
    it('accepts complete, valid sign-off payload', () => {
      const validPayload = {
        jobId: 'job-haslar-01',
        clientName: 'David Mercer',
        signerRole: 'vessel_owner' as const,
        agreedDiagnosticHours: 2.5,
        agreedTotalEstimate: 62.5,
        signatureDataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      };

      const result = validateSignOffPayload(validPayload);
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    it('flags missing required fields', () => {
      const result = validateSignOffPayload({
        jobId: '',
        clientName: '  ',
        agreedDiagnosticHours: -1,
        agreedTotalEstimate: -10,
        signatureDataUrl: 'invalid-url'
      });

      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('jobId')));
      assert.ok(result.errors.some(e => e.includes('name is required')));
      assert.ok(result.errors.some(e => e.includes('canvas signature')));
      assert.ok(result.errors.some(e => e.includes('hours must be a non-negative')));
      assert.ok(result.errors.some(e => e.includes('total estimate must be a non-negative')));
    });

    it('handles null or undefined payload', () => {
      const result = validateSignOffPayload(null);
      assert.equal(result.valid, false);
      assert.equal(result.errors[0], 'Sign-off payload is missing');
    });
  });

  describe('validateQueuedPhotoPayload', () => {
    it('accepts complete, valid photo queue item', () => {
      const validPhoto = {
        id: 'photo-123',
        jobId: 'job-1',
        previewUrl: 'data:image/jpeg;base64,abc',
        fileSizeBytes: 204800
      };

      const result = validateQueuedPhotoPayload(validPhoto);
      assert.equal(result.valid, true);
      assert.equal(result.errors.length, 0);
    });

    it('flags missing ID, missing jobId, and missing blob/previewUrl', () => {
      const result = validateQueuedPhotoPayload({
        id: '',
        jobId: '',
        fileSizeBytes: -10
      });

      assert.equal(result.valid, false);
      assert.ok(result.errors.some(e => e.includes('queue ID')));
      assert.ok(result.errors.some(e => e.includes('jobId')));
      assert.ok(result.errors.some(e => e.includes('binary blob or base64')));
      assert.ok(result.errors.some(e => e.includes('file size')));
    });

    it('handles null payload', () => {
      const result = validateQueuedPhotoPayload(null);
      assert.equal(result.valid, false);
      assert.equal(result.errors[0], 'Photo payload is missing');
    });
  });
});
