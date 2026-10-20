# AGENTS.md — AJW Marine Electrical Services

Marine electrical diagnostics, lithium/solar sizing, custom switch panels, and postal workshop management PWA.

> **System Architecture Reference:** See [`DESIGN.md`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/DESIGN.md) for full architectural design and technical specifications.
>
> **E2E User Journeys & QA Roadmap:** See [`docs/E2E_USER_JOURNEYS.md`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/docs/E2E_USER_JOURNEYS.md) for covered E2E specs, Page Object Models, and upcoming user journey specifications.
>
> **Supporting Services Setup:** See [`docs/SERVICES_SETUP.md`](docs/SERVICES_SETUP.md) for provisioning Firebase, Firestore, Storage, Cloud Functions, Stripe, Resend, ShipStation, Gemini and GitHub Actions secrets across dev / preview / production. Update it (and `.env.example`) whenever an environment variable, secret or external integration changes.

---

## Tech Stack & Runtime
- **Runtime**: Node `>=24.12.0` (as defined in `.node-version`, `.nvmrc`, and `package.json`)
- **Frontend Core**: React 19, TypeScript (strict), Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), Motion, `vite-plugin-pwa`
- **Backend / Cloud**: Firebase v13 (Authentication, Cloud Firestore, Cloud Storage, Hosting), Firebase Cloud Functions 2nd Gen (`functions/` in `europe-west2` using `firebase-functions` v6 & `firebase-admin` v13 with Google Secret Manager for `RESEND_API_KEY`, `SHIPSTATION_API_KEY`, `SHIPSTATION_API_SECRET`), Google GenAI SDK (`@google/genai`)
- **Reporting & Icons**: `jspdf` (marine certificate rendering), `lucide-react`
- **Testing**: Node.js built-in test runner via `tsx --test "src/**/*.test.ts"` (281 frontend unit tests) and `npm run test:functions` (21 Cloud Functions unit tests), Playwright (`@playwright/test` across 15 E2E browser specs & 11 Page Object Models)

---

## Essential Commands
```bash
npm run dev             # Start Vite dev server on http://localhost:3000
npm run build           # Production build (Vite + PWA service worker + /version.json)
npm run preview         # Preview production build locally
npm run lint            # Typecheck frontend via `tsc --noEmit` (MUST pass with 0 errors)
npm run lint:functions  # Typecheck Cloud Functions (`functions/`) via `tsc --noEmit`
npm run test:unit       # Run all frontend unit tests matching src/**/*.test.ts (281 tests)
npm run test:functions  # Run Cloud Functions unit tests matching functions/src/**/*.test.ts (21 tests)
npm run build:functions # Compile Cloud Functions TypeScript to functions/lib/
npm run test            # Alias for test:unit
npm run test:e2e        # Playwright end-to-end tests (Desktop Chrome & Mobile Chrome on port 5173)
npm run test:e2e:all    # Playwright full 5-browser matrix (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari)
npm run validate        # Full pre-flight check: lint + test:unit + build + test:functions + build:functions
npm run clean           # Remove dist/ and build artifacts
```

---

## Complete Directory Structure

```
ajwmes/
├── public/                 # Static assets, PWA icons (192px, 512px, SVG), manifest
├── docs/                   # Engineering & operational documentation:
│   ├── E2E_USER_JOURNEYS.md  # E2E user journey catalog, POM architecture & QA roadmap
│   └── SERVICES_SETUP.md     # End-to-end cloud services & secrets provisioning guide
├── functions/              # 2nd Gen Firebase Cloud Functions (`europe-west2`):
│   ├── src/
│   │   ├── authMiddleware.ts         # RBAC & caller verification for callable functions
│   │   ├── index.ts                  # Callable & webhook exports (sendEmail, ShipStation)
│   │   ├── resendClient.ts           # Server-side Resend transactional email dispatcher
│   │   ├── resendClient.test.ts      # Unit tests for Resend payload & auth validation
│   │   ├── shipstationClient.ts      # Live ShipStation rates, 4x6" labels & order sync
│   │   ├── shipstationClient.test.ts # Unit tests for ShipStation Basic Auth & API mapping
│   │   └── types.ts                  # Shared Cloud Function request/response contracts
│   ├── package.json
│   └── tsconfig.json
├── src/
│   ├── assets/             # Bundled images & marine photos
│   ├── components/         # Feature-grouped UI components:
│   │   ├── admin/          # Workshop admin, inventory, zero-stock alerts, expenses, packing slips, thermal labels, user accounts, laser studio
│   │   ├── auth/           # Authentication modal, sign-in, sign-off, profile & avatar manager
│   │   ├── brand/          # Marine logo & vector brand marks
│   │   ├── chat/           # Technician-to-client pontoon job messaging thread & photo proofs
│   │   ├── client/         # Boat owner portal, vessel electrical spec manager, PDF summary
│   │   ├── common/         # AppUpdateBanner, FirestoreSyncBanner, ImageLightboxModal
│   │   ├── forms/          # Booking & diagnostic quote request modal
│   │   ├── home/           # Landing hero, services overview, pricing highlights
│   │   ├── modals/         # Environment settings inspector, free hosting guide
│   │   ├── orders/         # Postal order tracker & carrier progress
│   │   ├── panels/         # Custom switch panel CAD designer & photo replica extractor
│   │   ├── postal/         # Postal workshop workstation, ShipStation rates & dispatch timeline
│   │   ├── pwa/            # PWA installation banner & hook
│   │   ├── rbac/           # Role-based route guard, permission matrix modal & action denied toast
│   │   ├── store/          # Marine electrical hardware storefront
│   │   ├── technician/     # Pontoon diagnostic workstation, stopwatch timer, digital customer sign-off
│   │   └── Navigation.tsx  # Master tab router & responsive 2-row pill navigation bar
│   ├── data/               # Seed data, default catalogs, environment test data
│   │   ├── environmentTestData.ts
│   │   ├── seedData.ts
│   │   └── supplierData.ts
│   ├── lib/                # Core infrastructure services (accompanied by *.test.ts):
│   │   ├── analytics.ts          # GA4 & operational event tracking
│   │   ├── appUpdater.ts         # Service Worker & /version.json single-refresh update controller
│   │   ├── auth.ts               # Firebase auth & developer 1-click profiles (+ auth.test.ts)
│   │   ├── emailService.ts       # Transactional email client & simulated outbox (+ emailService.test.ts)
│   │   ├── environment.ts        # Runtime environment detection (dev/preview/prod)
│   │   ├── envStorage.ts         # Environment-scoped LocalStorage manager (ajwmes_<env>_*)
│   │   ├── firebase.ts           # Firebase client initialization & offline Firestore fallback
│   │   ├── firebaseConfig.ts     # Extracted client config & dynamic overrides
│   │   ├── incomingEmail.ts      # Inbound Resend webhook parser & simulator (+ incomingEmail.test.ts)
│   │   ├── offlineSync.ts        # Offline mutation queue & synchronization controller
│   │   ├── rbac.ts               # Role matrix & permission checking functions (+ rbac.test.ts)
│   │   ├── resendConfig.ts       # Resend sender & Cloud Function gateway config (+ resendConfig.test.ts)
│   │   ├── shipstationConfig.ts  # ShipStation runtime configuration & carrier codes
│   │   ├── shipstationService.ts # Carrier rate lookup & 4x6" SVG thermal label generator (+ shipstationService.test.ts)
│   │   ├── storage.ts            # Cloud Storage upload helpers & fallbacks
│   │   ├── stripeConfig.ts       # Stripe runtime environment & scoped key manager (+ stripeConfig.test.ts)
│   │   └── stripeService.ts      # Stripe checkout redirect & simulated payment processor
│   ├── types/              # Central type definitions (src/types/index.ts)
│   ├── utils/              # Pure calculation and business logic (ALWAYS accompanied by *.test.ts):
│   │   ├── electricalCalculations.ts    # Stopwatch labor (£25/hr), materials, switch panel CAD & replica pricing
│   │   ├── emailTemplates.ts            # HTML/text transactional marine email builders
│   │   ├── expenseCalculations.ts       # Job expense rollups, billable vs overhead classification
│   │   ├── formValidation.ts            # UK telephone (023, 01983 Solent area), email, vessel spec validation
│   │   ├── generateVesselPdf.ts         # jsPDF electrical certificate & schematic export
│   │   ├── imageResize.ts               # Client-side photo compression for offline storage
│   │   ├── imageUrl.ts                  # Image URL resolution & placeholder fallbacks
│   │   ├── inventorySync.ts             # Split catalog/category JSON import, export & reconciliation
│   │   ├── offlineQueueCalculations.ts  # Mutation priority ordering & sync progress calculations
│   │   ├── postalTimeline.ts            # Royal Mail / DPD dispatch tracking calculations
│   │   ├── resendValidation.ts          # Resend API key & email payload validation
│   │   ├── shipstationCalculations.ts   # Marine package weight heuristics & box dimensioning
│   │   ├── stripeCalculations.ts        # Stripe pence conversion, fee estimation, key validation
│   │   └── versionCheck.ts              # Pure version manifest parsing & rollout comparison (+ version.test.ts)
│   ├── version.ts          # Semantic versioning (v1.2.0) and release metadata
│   ├── App.tsx             # Root application orchestrator
│   ├── index.css           # Tailwind CSS v4 directives & theme definitions
│   └── main.tsx            # React 19 application mount point
└── tests/                  # Playwright E2E browser specifications (15 spec files + 11 Page Object Models in tests/pages/):
    ├── pages/              # Page Object Models (AdminDashboardPage, AuthModalPage, CartDrawerPage, ConsignmentTrackerPage, NavigationPage, PostalWorkspacePage, ReplicaPanelUploaderPage, StorePage, SwitchPanelCADPage, TechnicianWorkspacePage, VesselPortalPage)
    ├── admin-workshop-management.spec.ts
    ├── app-version-update.spec.ts
    ├── authentication.spec.ts
    ├── consignment-tracker.spec.ts
    ├── inventory-stock-sync.spec.ts
    ├── navigation-responsive-menu.spec.ts
    ├── offline-pontoon-resilience.spec.ts
    ├── performance-architecture-optimization.spec.ts
    ├── postal-fulfillment-dispatch.spec.ts
    ├── resend.spec.ts
    ├── stripe.spec.ts
    ├── switch-panel-cad.spec.ts
    ├── switchboard-photo-replica.spec.ts
    ├── technician-diagnostic-flow.spec.ts
    └── vessel-portal-pdf.spec.ts
```

---

## Coding & Architectural Guidelines

### 1. TypeScript Strictness
- All domain types reside in `src/types/index.ts` (re-exported via `src/types.ts`).
- Never use `any` without an explicit, documented reason. Use discriminating unions and type guards.
- Always run `npm run lint` (`tsc --noEmit`) and `npm run lint:functions` to verify zero type errors before concluding tasks.

### 2. Pure Logic Decoupling & Test Discovery
- All calculations (financial, sizing, electrical, time, carrier weight/dimensions, form validation) **must** remain pure functions in `src/utils/`.
- Every utility file in `src/utils/` must have a corresponding test file `src/utils/<name>.test.ts`. Core service modules in `src/lib/` and `functions/src/` also maintain companion `*.test.ts` suites.
- Tests use Node.js's built-in test runner (`node:test`, `node:assert/strict`) via `tsx --test "src/**/*.test.ts"` (`npm run test:unit`) and `npm run test:functions`. Any new test file matching this pattern is automatically discovered and executed.

### 3. Multi-Environment Storage Scoping
The app runs across 4 isolated hosting environments:
| Environment | Detected Hostname | Storage Prefix | Firestore Prefix |
| :--- | :--- | :--- | :--- |
| **AI Studio Dev** | `ais-dev-*.run.app`, `localhost` | `ajwmes_aistudio_dev_*` | `ais_dev_*` |
| **AI Studio Preview** | `ais-pre-*.run.app` | `ajwmes_aistudio_pre_*` | `ais_pre_*` |
| **GitHub PR Preview** | `*--*.web.app` | `ajwmes_github_pre_*` | `gh_pre_*` |
| **Production Live** | `ajwmes.co.uk`, `*.web.app` | `ajwmes_github_live_*` | Root collections |

**Rule**: Never write raw keys to `localStorage.setItem('raw_key', ...)`. Always access storage through `src/lib/envStorage.ts` via `getScopedStorageKey()` or the persistence methods in `src/lib/offlineSync.ts`.

### 4. Offline-First & Firestore / Cloud Functions Resiliency
- Pontoon technicians frequently lose internet connection inside metal hulls and offshore marinas.
- The app must continue to function completely offline.
- When Firestore fails with `Code: 14 UNAVAILABLE: Name resolution failed`, or when 2nd Gen Cloud Functions (`sendEmail`, `getShippingRates`, `generateShippingLabel`) are unreachable, the application **must not crash** or throw unhandled rejections. It must log the failure and smoothly switch to the local cache / simulated fallback (`src/lib/offlineSync.ts`, `src/lib/emailService.ts`, `src/lib/shipstationService.ts`).
- High-payload assets (photos, customer signatures) are queued in IndexedDB (`ajw_marine_field_db`).

### 5. Role-Based Access Control (RBAC)
- 5 User Roles: `guest` | `client` | `admin` | `technician` | `postal`.
- Route access is governed by `canAccessRoute(role, route)` in `src/lib/rbac.ts`.
- Action permissions are governed by `canPerformAction(role, action)` in `src/lib/rbac.ts` and enforced server-side in `functions/src/authMiddleware.ts`.
- Never bypass or remove RBAC checks when adding or altering routes/actions.

### 6. Tailwind CSS v4 & Styling Guidelines
- The application uses Tailwind v4 `@tailwindcss/vite` integration (`@import "tailwindcss";` in `src/index.css`).
- **Do not create a `tailwind.config.js` or `postcss.config.js`** file.
- Theme aesthetics: Marine dark slate/navy palette (`#0A192F`, `#0D2040`), warm amber/gold accents (`#F59E0B`, `#D97706`), crisp status badges, and rounded modern cards.

### 7. Playwright E2E Automation Standards
- E2E tests are located in `tests/` and use Page Object Models in `tests/pages/`.
- All interactive elements must have clear, stable `data-testid` attributes (e.g. `data-testid="auth-modal"`, `data-testid="diagnostic-timer-button"`).
- Playwright automatically spins up the Vite server on port `5173` (serving pre-built production assets via `vite preview` in CI, and `vite` dev server locally).
- CI/CD optimizations include OS-aware Playwright caching (macOS `~/Library/Caches/ms-playwright`, Linux `~/.cache/ms-playwright`), global npm caching (`setup-node@v4`), validation gating (`needs: validate`), and shared `dist/` build artifacts for Firebase deployments.

### 8. Secrets & Environment Variables
- Client-side variables must use the `VITE_*` prefix and are public by design.
- True secrets (`FIREBASE_SERVICE_ACCOUNT`, `RESEND_API_KEY`, `SHIPSTATION_API_KEY`, `SHIPSTATION_API_SECRET`, or private server keys) must never be committed to source control or exposed via `VITE_*` variables; server runtime secrets reside in Google Secret Manager (`functions/src/index.ts`).

---

## Verification Checklist
Before completing any coding task, verify the following:
- [ ] `npm run lint` and `npm run lint:functions` pass with 0 errors.
- [ ] `npm run test:unit` (281+ tests) and `npm run test:functions` (21+ tests) pass with all tests green.
- [ ] `npm run validate` passes cleanly.
- [ ] Any new utility or service logic includes companion `*.test.ts` tests.
- [ ] Any new interactive UI components include `data-testid` attributes for Playwright.
- [ ] Multi-environment storage scoping and offline fallbacks are preserved.
