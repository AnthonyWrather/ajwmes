# Production Environment Conditional Seeding & Clean Boot

Implement environment-conditional database seeding so that existing automated test data seeding persists uninterrupted in AI Studio Dev, AI Studio Preview, and GitHub Preview, but GitHub Live (`github-deployed`) only seeds minimal operational accounts if and only if all root collections in Firestore are completely empty.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters were confirmed via user clarification:
> - **Production Account Emails**: `admin@ajwmes.co.uk`, `tech@ajwmes.co.uk`, and `postal@ajwmes.co.uk`.
> - **Empty Database Verification Criterion**: Firestore check queries all root collections (`users`, `jobs`, `catalog`, `postal_orders`). Only if **all four** are empty will the initial production accounts be provisioned.
> - **Starter Credentials**: Default password set to `ajwmes2026` (with matching SHA/base64 hash).
> - **Data Isolation**: In production, zero demo customers, zero demo catalog items, and zero demo categories will be seeded if the database is clean. Non-production environments (`aistudio-dev`, `aistudio-preview`, `github-preview`) retain their full rich demo suites.

- **Confirmed Decision 1**: Account set in production is strictly 3 staff accounts (`admin`, `technician`, `postal`) under domain `ajwmes.co.uk`.
- **Confirmed Decision 2**: Database check queries `users`, `jobs`, `catalog`, and `postal_orders`. If any collection has data, seeding is completely bypassed to prevent overwriting production state.
- **Confirmed Decision 3**: Local storage defaults for `github-deployed` in `envStorage.ts` updated to mirror this clean-slate policy.

---

## 1. Overview & Core Concept

- **What It Does**:
  - Differentiates the initial bootstrap process based on detected environment (`github-deployed` vs. preview/dev environments).
  - For non-production (`aistudio-dev`, `aistudio-preview`, `github-preview`), continues existing behavior: auto-seeding sample jobs, catalog items, categories, vessel specs, and demo user accounts on every rollout.
  - For GitHub Live production (`github-deployed` on `ajwmes.co.uk`):
    1. Checks if all primary root collections (`users`, `jobs`, `catalog`, `postal_orders`) are empty.
    2. If any of them contains documents, skips seeding entirely and loads live data.
    3. If all are empty, writes only three essential staff accounts (`admin@ajwmes.co.uk`, `tech@ajwmes.co.uk`, `postal@ajwmes.co.uk`) and creates no dummy products, customers, or jobs.
- **Target Audience**: Marine electrical business administrator Anthony Wrather and workshop technicians running the live production domain.
- **Key Value**: Protects production customer orders and inventory from being overwritten or cluttered with test data, while guaranteeing the app starts with necessary operational staff logins on fresh deployment.

---

## 2. User Experience & Visual Design

- **Bootstrap Notification & Status**:
  - In `FirestoreSyncBanner`, show clear environment tagging: `Production Live (ajwmes.co.uk)`.
  - In Environment Settings Modal (`EnvironmentSettingsModal`), show the distinct status for GitHub Live: "Clean production database check active. Only 3 core staff accounts seeded when empty."
  - When inspecting accounts in Admin Dashboard -> User Accounts Manager:
    - Production displays the 3 official staff accounts without demo clients (`David Mercer`, `Sarah Jenkins`, etc.) or dummy vessels.
- **Quick Sign-In Modal**:
  - Updated quick persona selector displays `admin@ajwmes.co.uk`, `tech@ajwmes.co.uk`, and `postal@ajwmes.co.uk` when running in `github-deployed` mode.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Full Root Empty Check vs. Users-Only Check**:
  - *Chosen Approach*: Query count/existence across `users`, `jobs`, `catalog`, and `postal_orders`. If any collection has docs, the DB is considered initialized.
  - *Why*: Prevents partial overwrite if someone already added catalog items or jobs before users were populated.
  - *Alternatives Considered*: Checking only `users`. Rejected to honor user directive.
- **Decision 2: Scoped Seeding Functions in Firebase Service Layer**:
  - *Chosen Approach*: Add `checkIsDatabaseEmpty()` and `seedProductionStaffAccounts()` in `src/lib/firebase.ts`, and adjust `App.tsx` bootstrap effect.
  - *Why*: Keeps Firestore query logic encapsulated and avoids leaking collection paths or batch writes into UI components.
- **Decision 3: Environment Storage Fallback Sync (`src/lib/envStorage.ts`)**:
  - *Chosen Approach*: Update `getEnvironmentSeedData('github-deployed')` to return empty catalog, empty jobs, empty orders, and only the 3 production staff accounts.
  - *Why*: Ensures that even in offline or local storage fallback modes, the production environment never displays dummy customer data.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Environment Detection                           │
│                detectEnvironment() -> AppEnvironment                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
           ┌────────────────────────┴────────────────────────┐
           ▼                                                 ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│  AI Studio Dev / Preview     │              │    GitHub Live Production    │
│  & GitHub Preview Channels   │              │     ('github-deployed')      │
└──────────────┬───────────────┘              └──────────────┬───────────────┘
               │                                             │
               ▼                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│ Standard Seeding (Always):   │              │ Empty Database Check:        │
│ • Full Demo Catalog          │              │ • Check users, jobs, catalog,│
│ • Full Categories            │              │   postal_orders collections  │
│ • Test Customers & Vessels   │              └──────────────┬───────────────┘
│ • Full Staff Personas        │                             │
└──────────────────────────────┘              ┌──────────────┴───────────────┐
                                              │                              │
                                     Empty == false                 Empty == true
                                              │                              │
                                              ▼                              ▼
                                      ┌───────────────┐        ┌───────────────────────┐
                                      │ Skip Seeding  │        │ Seed 3 Staff Only:    │
                                      │ Load Existing │        │ • admin@ajwmes.co.uk  │
                                      │ Live Records  │        │ • tech@ajwmes.co.uk   │
                                      └───────────────┘        │ • postal@ajwmes.co.uk │
                                                               │ (0 products/clients)  │
                                                               └───────────────────────┘
```

### Production Seed Data Model (`src/data/environmentTestData.ts` & `src/lib/auth.ts`)
```ts
export const GITHUB_LIVE_PROD_USERS: UserProfile[] = [
  {
    id: 'usr-admin-prod-001',
    name: 'Anthony Wrather',
    email: 'admin@ajwmes.co.uk',
    role: 'admin',
    phone: '07700 900551',
    password: 'ajwmes2026',
    passwordHash: 'YWp3bWVzMjAyNg==',
    avatarUrl: '/assets/images/avatar_designer_sarah_1791400201276.jpg',
    vesselName: 'AJW Solent Response',
    vesselType: 'Workboat / Fast Tender',
    marinaBerth: 'Gosport Marina (HQ Workshop)',
    systemVoltage: '12V',
    vesselIds: [],
    environment: 'github-deployed',
    notifyJobUpdates: true,
    notifyDispatchSms: true,
    createdAt: '2026-10-14T10:00:00Z',
    lastLoginAt: '2026-10-14T10:00:00Z'
  },
  {
    id: 'usr-tech-prod-002',
    name: 'Marine Technician',
    email: 'tech@ajwmes.co.uk',
    role: 'technician',
    phone: '07700 900882',
    password: 'ajwmes2026',
    passwordHash: 'YWp3bWVzMjAyNg==',
    avatarUrl: '/assets/images/marine_helm_navigation_1791400844235.jpg',
    vesselName: 'Solent Diagnostic Van 1',
    vesselType: 'Mobile Marine Unit',
    marinaBerth: 'Portsmouth & Gosport',
    systemVoltage: '12V',
    vesselIds: [],
    environment: 'github-deployed',
    notifyJobUpdates: true,
    notifyDispatchSms: false,
    createdAt: '2026-10-14T10:00:00Z',
    lastLoginAt: '2026-10-14T10:00:00Z'
  },
  {
    id: 'usr-postal-prod-003',
    name: 'Postal Dispatch Officer',
    email: 'postal@ajwmes.co.uk',
    role: 'postal',
    phone: '07700 900663',
    password: 'ajwmes2026',
    passwordHash: 'YWp3bWVzMjAyNg==',
    avatarUrl: '/assets/images/avatar_designer_sarah_1791400201276.jpg',
    vesselName: 'Workshop Packing Station',
    vesselType: 'Dispatch Facility',
    marinaBerth: 'Gosport Workshop E-Bay',
    systemVoltage: '12V',
    vesselIds: [],
    environment: 'github-deployed',
    notifyJobUpdates: false,
    notifyDispatchSms: true,
    createdAt: '2026-10-14T10:00:00Z',
    lastLoginAt: '2026-10-14T10:00:00Z'
  }
];
```

### Files to Modify
1. `src/data/environmentTestData.ts`:
   - Export `GITHUB_LIVE_PROD_USERS` containing the 3 accounts on domain `ajwmes.co.uk`.
2. `src/lib/envStorage.ts`:
   - Update `getEnvironmentSeedData()` case for `github-deployed` to supply empty `jobs: []`, `postalOrders: []`, `catalog: []`, `categories: []`, and `users: GITHUB_LIVE_PROD_USERS`.
3. `src/lib/firebase.ts`:
   - Implement `isProductionDatabaseEmpty(): Promise<boolean>` checking `users`, `jobs`, `catalog`, and `postal_orders`.
   - Update `seedInitialEnvironmentData()` to branch: if `github-deployed`, only seed if empty, and seed strictly the 3 staff accounts; else proceed with default test data seeding.
4. `src/App.tsx`:
   - Update `useEffect` startup sequence to call the new environment-aware conditional seeding routine.
   - Adjust persona shortcuts in sign-in modals when environment is `github-deployed`.
5. `src/components/auth/SignInModal.tsx` & `src/lib/auth.ts`:
   - Ensure demo profiles / persona buttons render appropriate defaults based on current environment.
