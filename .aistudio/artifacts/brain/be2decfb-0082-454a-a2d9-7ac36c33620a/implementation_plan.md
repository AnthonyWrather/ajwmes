# Field Technician Offline Mode & Pontoon Sync Engine

Comprehensive offline field-service capability enabling Solent Marine electrical engineers to conduct vessel diagnostics, capture compressed fitment photos, obtain customer sign-off signatures on pontoon berths without cell signal, and seamlessly sync queued jobs and media once reconnected.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed during clarification:
> - **Field Diagnostic Photos**: Stored locally in a compressed IndexedDB offline queue with automatic background upload on reconnect.
> - **Customer Pontoon Sign-Off**: Captured via an on-screen HTML5 touch signature pad recording raw vector strokes, customer name, signer role, and offline UTC timestamp.
> - **Synchronization Protocol**: Seamless automatic background synchronization with a persistent progress indicator ribbon and conflict-free transactional reconciliation.

---

### 1. Overview & Core Concept

- **What It Does**: Equips field technicians working in signal-shielded vessel engine rooms, bilge cavities, or distant pontoons with an offline-first workspace. Technicians can log diagnostics, record parts used, snap work photos, and obtain signed customer sign-offs without internet connectivity, queuing all operations locally until online connection is restored.
- **Target Audience / Persona**: Field Marine Electrical Engineers (AJW Marine) servicing yachts, motorboats, and commercial vessels across Solent marinas (Haslar, Gosport, Ocean Village, Hamble).
- **Key Value**: Zero data loss, zero blocking errors when offline, instantaneous local UI feedback, and automatic synchronization back to Firestore and Google Cloud Storage.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **Offline Vessel Inspection & Diagnostic Logging**:
   - Technician arrives at berth, switches device to offline/airplane mode (or loses signal below deck).
   - A persistent, compact offline status indicator confirms: `Offline Mode · Pontoon Storage Active`.
   - Technician starts/stops diagnostic timers, adjusts fault notes, and adds parts (cables, fuses, relays) from local catalog.
2. **Offline Photo Capture & Auto-Compression**:
   - Technician snaps or selects high-resolution camera photos of wiring, battery banks, or panel fitments.
   - Client-side Canvas compresses images to optimal WebP/JPEG (target $\le 450\text{KB}$, max $1600\text{px}$) to prevent quota bloat.
   - Photo is instantly saved to IndexedDB (`tech_media_queue`) and displayed in the job sheet with a subtle `Pending Sync` badge.
3. **Customer Touch Sign-Off on Pontoon**:
   - Technician opens "Customer Job Sign-Off" modal.
   - Shows job summary: billable hours (£25/hr), parts fitted, total estimate.
   - Customer enters their name, confirms satisfaction, and signs directly on the touch-enabled signature pad.
   - Generates a timestamped verification token and embeds the signature record into the offline job payload.
4. **Automatic Reconnection & Sync Engine**:
   - As technician steps onto marina pontoon or returns to workshop Wi-Fi, `navigator.onLine` fires.
   - Background sync worker automatically processes the FIFO queue (Firestore documents first, followed by Cloud Storage media uploads).
   - A smooth top progress bar shows active sync items (`Syncing 3 items... 100%`) before fading into a green `All Pontoon Data Synchronized` banner.

#### Visual Identity & Theme
- **Color Tokens**: Dark marine utilitarian slate theme (`#020617` background, `#0f172a` cards, amber `#f59e0b` accents for technician tools, emerald `#10b981` for sync health, sky `#0ea5e9` for nautical markers).
- **Typography**: Clean monospace font for reference IDs, timestamps, and electrical values; bold sans-serif headers for legible daylight reading on boat decks.
- **Micro-Interactions**: Real-time stroke smoothing on the signature canvas, animated sync progress bar with upload byte counters, and instantaneous card optimistic state updates.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: IndexedDB (`idb-keyval` / custom IndexedDB wrapper) over LocalStorage**:
  - *Chosen Approach*: Dedicated IndexedDB object stores (`pending_job_updates`, `pending_media_queue`, `customer_signatures`).
  - *Why*: LocalStorage has a strict 5MB limit that quickly exhausts with 2-3 camera photos. IndexedDB reliably stores dozens of high-res photos and signatures.
  - *Alternatives Considered*: Base64 in LocalStorage (rejected due to quota crashes).
- **Decision 2: Client-Side Canvas Image Compression Before Enqueueing**:
  - *Chosen Approach*: Resize photos to max $1600\times1200$ at 0.82 JPEG/WebP quality in an offscreen canvas before persisting in IndexedDB.
  - *Why*: Reduces raw camera uploads from 8MB to $\sim 350\text{KB}$, speeding up pontoon sync and minimizing cellular data usage.
- **Decision 3: Non-Blocking Background Queue with Automatic Retry**:
  - *Chosen Approach*: Event-driven queue processor triggered by `window.addEventListener('online')` and periodic heartbeat timer.
  - *Why*: Ensures zero modal lockouts; technicians can navigate and operate unimpeded while background uploads proceed.

---

### 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Field Technician Offline Architecture                │
└────────────────────────────────────────────────────────────────────────┘

  [ Physical Pontoon / Vessel Engine Room (No Cell / Wi-Fi Signal) ]
                               │
                               ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │                 TechnicianWorkspace (React View)                   │
  │  - Diagnostic Labor Timer     - Parts & Hardware Picker           │
  │  - Camera Photo Input         - Customer Sign-Off Pad (Canvas)    │
  └─────────────────┬──────────────────────────────────┬───────────────┘
                    │                                  │
                    ▼ (Mutate State)                   ▼ (Enqueue Actions)
  ┌───────────────────────────────────┐  ┌─────────────────────────────┐
  │ Optimistic App State (React Hook) │  │ OfflineSyncEngine           │
  │ - Instant UI feedback             │  │ - IndexedDB Storage         │
  │ - "Pending Sync" tags             │  │   • tech_job_queue          │
  │ - Local media preview blobs       │  │   • tech_media_queue        │
  └───────────────────────────────────┘  │   • tech_signature_queue    │
                                         └──────────────┬──────────────┘
                                                        │
                      [ Internet Connection Restored ]  │ (Auto-Trigger)
                                                        ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │                    Background Sync Coordinator                     │
  │  1. Check connectivity (`navigator.onLine` + Firestore ping)       │
  │  2. Step 1: Upload compressed photos to Firebase Storage           │
  │  3. Step 2: Swap local blob URLs with Firebase Storage URLs       │
  │  4. Step 3: Batch update JobRecord in Firestore with sign-off & doc│
  │  5. Step 4: Evict synced records from IndexedDB                    │
  └─────────────────┬──────────────────────────────────┬───────────────┘
                    ▼                                  ▼
      ┌───────────────────────────┐      ┌───────────────────────────┐
      │  Firebase Cloud Storage   │      │   Firestore Database      │
      │  (Permanent media URLs)   │      │   (Vessel Job Records)    │
      └───────────────────────────┘      └───────────────────────────┘
```

#### Data Model Extensions

```typescript
export interface CustomerSignOffRecord {
  jobId: string;
  jobReference: string;
  clientName: string;
  signerRole: 'vessel_owner' | 'skipper' | 'marina_agent';
  signatureDataUrl: string; // Base64 PNG stroke vector
  signedAtOffline: string;  // ISO timestamp when captured offline
  signedAtSynced?: string;  // ISO timestamp when synchronized to cloud
  agreedDiagnosticHours: number;
  agreedTotalEstimate: number;
  notes?: string;
  synced: boolean;
}

export interface OfflineQueuedMedia {
  id: string;
  jobId: string;
  jobReference: string;
  vesselName: string;
  category: 'existing_panel' | 'mounting_cavity' | 'cad_export' | 'chat_attachment';
  blob: Blob;
  previewUrl: string;
  fileName: string;
  capturedAt: string;
  status: 'queued' | 'uploading' | 'synced' | 'failed';
  remoteUrl?: string;
}

export interface OfflineQueueStatus {
  totalPending: number;
  pendingJobs: number;
  pendingPhotos: number;
  pendingSignatures: number;
  isSyncing: boolean;
  syncProgressPercent: number;
  lastSyncedAt: string | null;
}
```

#### Implementation Plan Components
1. **`src/lib/offlineSync.ts`**: Complete IndexedDB manager and queue orchestrator. Handles image compression, FIFO queue processing, automatic retry, and synchronization status observables.
2. **`src/components/technician/CustomerSignOffModal.tsx`**: High-precision touch canvas signature modal with touch/pointer events, stroke clearing, name validation, and offline submission.
3. **`src/components/technician/TechnicianSyncBar.tsx`**: Sleek, non-intrusive status bar displaying offline status, pending items counter, manual sync trigger, and animated sync progress bar.
4. **Integration with `TechnicianWorkspace.tsx`**: Wire photo uploads through offline queue, add Customer Sign-Off trigger button, and show offline badges on pending items.
5. **Integration with `App.tsx` and `firebase.ts`**: Register sync listeners on app startup and ensure smooth state reconciliation.
