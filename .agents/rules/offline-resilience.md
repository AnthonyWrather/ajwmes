# Offline-First Resilience & Storage Scoping

## Field Resilience Protocol
Marine diagnostics occur in environments with poor or nonexistent cellular connectivity (boat engine compartments, steel yachts, offshore pontoon berths).

### 1. Graceful Firestore Degradation
- When offline or experiencing DNS resolution failures (`FirebaseError: [code=unavailable]: 14 UNAVAILABLE: Name resolution failed for target dns:firestore.googleapis.com`), the application **must never crash or fail to render**.
- Catch Firestore listener/mutation errors cleanly and switch to cached local state (`src/lib/offlineSync.ts`).
- Never show uncaught promise rejections in the UI.

### 2. Multi-Environment Storage Scoping
The application isolates data per deployment target to prevent sandbox or PR preview runs from corrupting production databases:
- `localhost` & `ais-dev-*.run.app` &rarr; `ajwmes_aistudio_dev_*`
- `ais-pre-*.run.app` &rarr; `ajwmes_aistudio_pre_*`
- `*--*.web.app` (PR previews) &rarr; `ajwmes_github_pre_*`
- `ajwmes.co.uk` & live Firebase &rarr; `ajwmes_github_live_*`

**Implementation Rule**:
Always use `getScopedStorageKey(baseKey)` from `src/lib/envStorage.ts` when reading or writing to `localStorage` or `sessionStorage`.

### 3. Media & Heavy Payload Storage
- High-payload assets such as customer digital pontoon signatures and switch panel replica photos must not be stored directly in `localStorage` due to the 5MB browser quota.
- Store media payloads in IndexedDB database `ajw_marine_field_db` (`signatures_queue`, `media_queue`, `jobs_queue`).
