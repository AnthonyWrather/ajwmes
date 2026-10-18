# AGENTS.md — AJW Marine Electrical Services

Marine electrical diagnostics, lithium/solar sizing, custom switch panels, and postal workshop management PWA.

> **System Architecture Reference:** See [`DESIGN.md`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/DESIGN.md) for full architectural design and technical specifications.
>
> **Supporting Services Setup:** See [`docs/SERVICES_SETUP.md`](docs/SERVICES_SETUP.md) for provisioning Firebase, Firestore, Storage, Stripe, Resend, Gemini and GitHub Actions secrets across dev / preview / production. Update it (and `.env.example`) whenever an environment variable, secret or external integration changes.

---

## Tech Stack & Runtime
- **Runtime**: Node `>=24.12.0` (as defined in `.node-version`, `.nvmrc`, and `package.json`)
- **Frontend Core**: React 19, TypeScript (strict), Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), Motion, `vite-plugin-pwa`
- **Backend / Cloud**: Firebase v13 (Authentication & Cloud Firestore), Google GenAI SDK (`@google/genai`)
- **Reporting & Icons**: `jspdf` (marine certificate rendering), `lucide-react`
- **Testing**: Node.js built-in test runner via `tsx --test "src/**/*.test.ts"`, Playwright (E2E browser automation)

---

## Essential Commands
```bash
npm run dev        # Start Vite dev server on http://localhost:3000
npm run build      # Production build (Vite + PWA service worker)
npm run preview    # Preview production build locally
npm run lint       # Typecheck via `tsc --noEmit` (MUST pass with 0 errors)
npm run test:unit  # Run all unit tests matching src/**/*.test.ts
npm run test       # Alias for test:unit
npm run test:e2e   # Playwright end-to-end tests (boots port 5173 automatically)
npm run validate   # Full pre-flight check: lint + unit tests + build
npm run clean      # Remove dist/ and build artifacts
```

---

## Complete Directory Structure

```
ajwmes/
├── public/                 # Static assets, PWA icons (192px, 512px, SVG), manifest
├── src/
│   ├── assets/             # Bundled images & marine photos
│   ├── components/         # Feature-grouped UI components:
│   │   ├── admin/          # Workshop admin, inventory, zero-stock alerts, expenses, packing slips
│   │   ├── auth/           # Authentication modal, sign-in, sign-off, profile & avatar manager
│   │   ├── brand/          # Marine logo & vector brand marks
│   │   ├── chat/           # Technician-to-client pontoon job messaging thread
│   │   ├── client/         # Boat owner portal, vessel electrical spec manager, PDF summary
│   │   ├── common/         # Image lightbox, offline sync banners
│   │   ├── forms/          # Booking & diagnostic quote request modal
│   │   ├── home/           # Landing hero, services overview, pricing highlights
│   │   ├── modals/         # Environment settings inspector, free hosting guide
│   │   ├── orders/         # Postal order tracker & carrier progress
│   │   ├── panels/         # Custom switch panel CAD designer & photo replica extractor
│   │   ├── postal/         # Postal workshop workstation & dispatch timeline
│   │   ├── pwa/            # PWA installation banner & hook
│   │   ├── rbac/           # Role-based route guard & permission denied feedback
│   │   ├── store/          # Marine electrical hardware storefront
│   │   ├── technician/     # Pontoon diagnostic workstation, stopwatch timer, digital customer sign-off
│   │   └── Navigation.tsx  # Master tab router & navigation bar
│   ├── data/               # Seed data, default catalogs, environment test data
│   │   ├── environmentTestData.ts
│   │   ├── seedData.ts
│   │   └── supplierData.ts
│   ├── lib/                # Core infrastructure services:
│   │   ├── analytics.ts    # GA4 & operational event tracking
│   │   ├── appUpdater.ts   # Service Worker & /version.json single-refresh update controller
│   │   ├── auth.ts         # Firebase auth & developer 1-click profiles
│   │   ├── environment.ts  # Runtime environment detection (dev/preview/prod)
│   │   ├── envStorage.ts   # Environment-scoped LocalStorage manager (ajwmes_<env>_*)
│   │   ├── firebase.ts     # Firebase client initialization & offline Firestore fallback
│   │   ├── firebaseConfig.ts # Extracted client config & dynamic overrides
│   │   ├── offlineSync.ts  # Offline mutation queue & synchronization controller
│   │   ├── rbac.ts         # Role matrix & permission checking functions
│   │   ├── storage.ts      # Cloud Storage upload helpers & fallbacks
│   │   ├── stripeConfig.ts # Stripe runtime environment & scoped key manager
│   │   └── stripeService.ts # Stripe checkout redirect & simulated payment processor
│   ├── types/              # Central type definitions (src/types/index.ts)
│   ├── utils/              # Pure calculation and business logic (ALWAYS accompanied by *.test.ts):
│   │   ├── electricalCalculations.ts  # Stopwatch labor (£25/hr), materials, switch panel CAD pricing
│   │   ├── expenseCalculations.ts     # Job expense rollups, billable vs overhead classification
│   │   ├── formValidation.ts          # UK telephone (023, 01983 Solent area), email, vessel spec validation
│   │   ├── generateVesselPdf.ts       # jsPDF electrical certificate & schematic export
│   │   ├── imageResize.ts             # Client-side photo compression for offline storage
│   │   ├── imageUrl.ts                # Image URL resolution & placeholder fallbacks
│   │   ├── postalTimeline.ts          # Royal Mail / DPD dispatch tracking calculations
│   │   ├── stripeCalculations.ts      # Stripe pence conversion, fee estimation, key validation
│   │   └── versionCheck.ts            # Pure version manifest parsing & rollout comparison logic
│   ├── version.ts          # Semantic versioning (v1.2.0) and release metadata
│   ├── App.tsx             # Root application orchestrator
│   ├── index.css           # Tailwind CSS v4 directives & theme definitions
│   └── main.tsx            # React 19 application mount point
└── tests/                  # Playwright E2E browser specifications (authentication.spec.ts, stripe.spec.ts, app-version-update.spec.ts)
```

---

## Coding & Architectural Guidelines

### 1. TypeScript Strictness
- All domain types reside in `src/types/index.ts` (re-exported via `src/types.ts`).
- Never use `any` without an explicit, documented reason. Use discriminating unions and type guards.
- Always run `npm run lint` (`tsc --noEmit`) to verify zero type errors before concluding tasks.

### 2. Pure Logic Decoupling & Test Discovery
- All calculations (financial, sizing, electrical, time, form validation) **must** remain pure functions in `src/utils/`.
- Every utility file in `src/utils/` must have a corresponding test file `src/utils/<name>.test.ts`.
- Tests use Node.js's built-in test runner (`node:test`, `node:assert/strict`) via `tsx --test "src/**/*.test.ts"`. Any new test file matching this pattern is automatically discovered and executed.

### 3. Multi-Environment Storage Scoping
The app runs across 4 isolated hosting environments:
| Environment | Detected Hostname | Storage Prefix |
| :--- | :--- | :--- |
| **AI Studio Dev** | `ais-dev-*.run.app`, `localhost` | `ajwmes_aistudio_dev_*` |
| **AI Studio Preview** | `ais-pre-*.run.app` | `ajwmes_aistudio_pre_*` |
| **GitHub PR Preview** | `*--*.web.app` | `ajwmes_github_pre_*` |
| **Production Live** | `ajwmes.co.uk`, `*.web.app` | `ajwmes_github_live_*` |

**Rule**: Never write raw keys to `localStorage.setItem('raw_key', ...)`. Always access storage through `src/lib/envStorage.ts` via `getScopedStorageKey()` or the persistence methods in `src/lib/offlineSync.ts`.

### 4. Offline-First & Firestore Resiliency
- Pontoon technicians frequently lose internet connection inside metal hulls and offshore marinas.
- The app must continue to function completely offline.
- When Firestore fails with `Code: 14 UNAVAILABLE: Name resolution failed`, the application **must not crash** or throw unhandled rejections. It must log the failure and smoothly switch to the local cache fallback (`src/lib/offlineSync.ts`).
- High-payload assets (photos, customer signatures) are queued in IndexedDB (`ajw_marine_field_db`).

### 5. Role-Based Access Control (RBAC)
- 5 User Roles: `guest` | `client` | `admin` | `technician` | `postal`.
- Route access is governed by `canAccessRoute(role, route)` in `src/lib/rbac.ts`.
- Action permissions are governed by `canPerformAction(role, action)` in `src/lib/rbac.ts`.
- Never bypass or remove RBAC checks when adding or altering routes/actions.

### 6. Tailwind CSS v4 & Styling Guidelines
- The application uses Tailwind v4 `@tailwindcss/vite` integration (`@import "tailwindcss";` in `src/index.css`).
- **Do not create a `tailwind.config.js` or `postcss.config.js`** file.
- Theme aesthetics: Marine dark slate/navy palette (`#0A192F`, `#0D2040`), warm amber/gold accents (`#F59E0B`, `#D97706`), crisp status badges, and rounded modern cards.

### 7. Playwright E2E Automation Standards
- E2E tests are located in `tests/`.
- All interactive elements must have clear, stable `data-testid` attributes (e.g. `data-testid="auth-modal"`, `data-testid="diagnostic-timer-button"`).
- Playwright automatically spins up the Vite dev server on port `5173` to prevent collision with regular dev on `3000`.

### 8. Secrets & Environment Variables
- Client-side variables must use the `VITE_*` prefix and are public by design.
- True secrets (like `FIREBASE_SERVICE_ACCOUNT` or private server keys) must never be committed to source control or exposed via `VITE_*` variables.

---

## Verification Checklist
Before completing any coding task, verify the following:
- [ ] `npm run lint` passes with 0 errors.
- [ ] `npm run test:unit` passes with all tests green.
- [ ] Any new utility logic includes companion `*.test.ts` tests.
- [ ] Any new interactive UI components include `data-testid` attributes for Playwright.
- [ ] Multi-environment storage scoping and offline fallbacks are preserved.
