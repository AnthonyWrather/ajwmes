# Offline-First Resilience & Storage Scoping

## Field Resilience Protocol
Marine diagnostics occur in environments with poor or nonexistent cellular connectivity (boat engine compartments, steel yachts, offshore pontoon berths).

### 1. Graceful Firestore & Cloud Functions Degradation
- When offline or experiencing DNS resolution failures (`FirebaseError: [code=unavailable]: 14 UNAVAILABLE: Name resolution failed for target dns:firestore.googleapis.com`), the application **must never crash or fail to render**.
- Catch Firestore listener/mutation errors cleanly and switch to cached local state (`src/lib/offlineSync.ts`).
- When 2nd Gen Firebase Cloud Functions (`sendEmail`, `getShippingRates`, `generateShippingLabel`, `createShipStationOrder`) are unreachable or unprovisioned in local/offline environments, gracefully fall back to:
  - In-memory simulated email outbox & offline queue (`src/lib/emailService.ts`).
  - Deterministic local marine weight/rate calculation & 4x6" SVG thermal shipping label emulation (`src/lib/shipstationService.ts`, `src/utils/shipstationCalculations.ts`).
- Never show uncaught promise rejections in the UI.

### 2. Multi-Environment Storage Scoping
The application isolates data per deployment target to prevent sandbox or PR preview runs from corrupting production databases:
- `localhost` & `ais-dev-*.run.app` &rarr; LocalStorage `ajwmes_aistudio_dev_*` | Firestore `ais_dev_*`
- `ais-pre-*.run.app` &rarr; LocalStorage `ajwmes_aistudio_pre_*` | Firestore `ais_pre_*`
- `*--*.web.app` (PR previews) &rarr; LocalStorage `ajwmes_github_pre_*` | Firestore `gh_pre_*`
- `ajwmes.co.uk` & live Firebase &rarr; LocalStorage `ajwmes_github_live_*` | Firestore root collections

**Implementation Rule**:
Always use `getScopedStorageKey(baseKey)` from `src/lib/envStorage.ts` when reading or writing to `localStorage` or `sessionStorage`.

### 3. Media & Heavy Payload Storage
- High-payload assets such as customer digital pontoon signatures and switch panel replica photos must not be stored directly in `localStorage` due to the 5MB browser quota.
- Store media payloads in IndexedDB database `ajw_marine_field_db` (`signatures_queue`, `media_queue`, `jobs_queue`) and replay mutations in priority order (signatures and job consent before heavy binary work photos) upon reconnection.
