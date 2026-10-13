# Environment-Scoped Firestore Collections & User Account Isolation

Investigate and fix the issue where the Administrator's Operations Dashboard displays user accounts from all environments instead of isolating records to the active environment.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural decisions were confirmed:
> - **Partitioning Strategy**: Dedicated Firestore collection per environment (`ais_dev_users`, `ais_pre_users`, `gh_pre_users`, `users`) with `environment` metadata embedded on each document.
> - **Operations Dashboard View**: Strictly display user accounts belonging to the current environment only.
> - **Scope of Prefixes**: Apply environment collection prefixes to all Firestore collections (including `jobs`, `postal_orders`, `catalog`, `categories`, `vessel_specs`, and `stock_alerts`).

- **Confirmed Decision 1**: Set `firestoreCollectionPrefix` in `src/lib/environment.ts` to `'ais_dev_'`, `'ais_pre_'`, `'gh_pre_'`, and `''` (production).
- **Confirmed Decision 2**: Ensure user profile documents embed the active environment code (`environment: 'aistudio-dev' | 'aistudio-preview' | ...`).
- **Confirmed Decision 3**: Operations Dashboard user list strictly filters to the active environment.

---

## 1. Overview & Core Concept

### What It Does
Ensures strict environment isolation between AI Studio Development, AI Studio Shared Preview, GitHub PR Previews, and Live Production. Each environment will read from and write to its own dedicated Firestore collection partition (e.g. `ais_dev_users` vs `ais_pre_users` vs production `users`), and all user profiles will carry explicit environment metadata.

### Root Cause Analysis
1. `src/lib/environment.ts` returned `firestoreCollectionPrefix: ''` for all environments.
2. `getScopedCollection('users')` evaluated to `'users'` across all instances, causing all environments to share a single unpartitioned collection in Firestore.
3. On application startup, `usersList` was momentarily initialized from environment-namespaced localStorage (`ajwmes_aistudio_dev_users_list`), which made it temporarily look like only local accounts were present.
4. As soon as Firestore connected or a new user registered, the real-time `onSnapshot` listener (`subscribeUsers`) fired and replaced local state with every record in the shared `'users'` collection.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Admin Navigates to Operations Dashboard -> User Accounts**:
   - The dashboard header displays the active environment badge (e.g., `AI Studio Dev Workspace [ais_dev_users]`).
   - The user accounts table only shows users belonging to that specific environment.
   - When a new client registers in the current environment, the record is immediately created in `ais_dev_users`, synchronized to Firestore, and displayed without pulling in users from Preview or Production.
2. **Environment Switching / Simulation**:
   - If an administrator switches environments via the Environment Settings Modal, the dashboard immediately pivots to the corresponding partition (`ais_pre_users`, `gh_pre_users`, or production `users`).

### Visual Identity & Feedback
- Active environment indicator chip in `UserAccountsManager` (e.g., `Active Partition: ais_dev_users`).
- Clear record count specific to the active environment (e.g., `3 Dev Accounts`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Collection-Level Prefixing vs Single Collection with Queries**
  - *Chosen Approach*: Environment-scoped collection names (`ais_dev_users`, `ais_pre_users`, `gh_pre_users`, `users`) as already configured in `firestore.rules`.
  - *Why*: Provides hard physical separation in Firestore, preventing cross-environment quota pollution, accidental data overwrites during test runs, and test data leaking into production.
- **Decision 2: Defensive Client-Side Filtering**
  - *Chosen Approach*: Even within the scoped collection, add an explicit check to ensure records match the active environment, guarding against edge cases during migrations or imports.
- **Decision 3: Anthony Wrather Master Admin Seeding**
  - *Chosen Approach*: Seed Anthony's master administrator account (`anthonywrather@gmail.com`) into each environment partition so admin access is seamless across dev, preview, and deployed environments.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────┐
│                   detectEnvironment()                  │
│       Returns envCode & firestoreCollectionPrefix      │
│  dev: 'ais_dev_' │ preview: 'ais_pre_' │ live: ''      │
└───────────────────────────┬────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│     getScopedCollection()     │ │     Environment Metadata      │
│   e.g. 'ais_dev_users'        │ │   profile.environment =       │
│   e.g. 'ais_dev_jobs'         │ │   'aistudio-dev'              │
└───────────────┬───────────────┘ └───────────────┬───────────────┘
                │                                 │
                ▼                                 ▼
┌────────────────────────────────────────────────────────┐
│                     Firestore DB                       │
│   ais_dev_users / ais_pre_users / gh_pre_users / users  │
│   ais_dev_jobs  / ais_pre_jobs  / gh_pre_jobs  / jobs   │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│           Admin Operations Dashboard                   │
│   UserAccountsManager: strictly shows active partition  │
└────────────────────────────────────────────────────────┘
```

### Files to Update
1. `src/lib/environment.ts`:
   - Set `firestoreCollectionPrefix: 'ais_dev_'` for `aistudio-dev`.
   - Set `firestoreCollectionPrefix: 'ais_pre_'` for `aistudio-preview`.
   - Set `firestoreCollectionPrefix: 'gh_pre_'` for `github-preview`.
   - Keep `firestoreCollectionPrefix: ''` for `github-deployed`.
2. `src/types/index.ts`:
   - Add `environment?: AppEnvironment` to `UserProfile`.
3. `src/lib/auth.ts`:
   - Attach `environment: detectEnvironment().envCode` in `registerVesselAccount` and `DEMO_PROFILES`.
4. `src/lib/firebase.ts`:
   - Ensure `syncUserToFirestore` and `seedUsersToFirestore` persist the `environment` attribute.
   - Ensure all collections respect `getScopedCollection()`.
5. `src/components/admin/UserAccountsManager.tsx`:
   - Filter `users` list to the current environment and display the partition name.
6. `firebase-blueprint.json`:
   - Update `User` entity to include `environment` property.
7. Verification:
   - Run `compile_applet` and test environment isolation.
