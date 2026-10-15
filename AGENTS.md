# AGENTS.md — AJW Marine Electrical Services

Marine electrical diagnostics, lithium/solar sizing, custom Carling switch panels, and postal workshop management PWA.

## Tech Stack & Runtime
- **Runtime**: Node `>=24.12.0`
- **Frontend**: React 19, TypeScript (strict), Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), Motion, `vite-plugin-pwa`
- **Backend / Cloud**: Firebase (Auth, Cloud Firestore), `@google/genai`
- **Testing**: Node built-in test runner via `tsx --test`, Playwright (E2E)

## Essential Commands
```bash
npm run dev        # Start Vite dev server on http://localhost:3000
npm run build      # Production build (Vite + PWA)
npm run lint       # Typecheck via `tsc --noEmit` (MUST pass with 0 errors)
npm run test:unit  # Run unit test suite (tsx --test)
npm run test       # Alias for test:unit
npm run test:e2e   # Playwright end-to-end tests
npm run clean      # Remove dist/ and build artifacts
```

## Directory Structure
- `src/components/`: Feature-grouped UI (`admin/`, `auth/`, `client/`, `forms/`, `home/`, `panels/`, `postal/`, `store/`, `technician/`, `common/`, `rbac/`)
- `src/lib/`: Core services — Firebase (`firebase.ts`, `storage.ts`, `offlineSync.ts`), RBAC (`rbac.ts`), Auth (`auth.ts`), Environment (`environment.ts`)
- `src/utils/`: Pure calculation and business logic (`electricalCalculations.ts`, `formValidation.ts`, `postalTimeline.ts`, `generateVesselPdf.ts`)
- `src/types/`: Central type definitions (`src/types/index.ts`, re-exported in `src/types.ts`)
- `src/data/`: Seed data, defaults, and supplier catalogs (`seedData.ts`, `supplierData.ts`)
- `tests/`: Playwright E2E specs (`authentication.spec.ts`)

## Coding & Architectural Guidelines
1. **TypeScript First**:
   - Keep types centralized in `src/types/index.ts`.
   - Never use `any` without strong justification; preserve strict typings.
   - Run `npm run lint` to verify types before submitting changes.
2. **Offline-First & Firebase Resiliency**:
   - The app must work seamlessly offline or with failed network/DNS connections.
   - Always retain local state/cache fallback when Firestore is unreachable (`offlineSync.ts`).
   - Never fail hard on Firestore error codes (e.g. code 14 `UNAVAILABLE`); log and switch to local state.
3. **Role-Based Access Control (RBAC)**:
   - 5 roles: `guest` | `client` | `admin` | `technician` | `postal`.
   - Guard routes using `canAccessRoute()` and action permissions using `canPerformAction()` from `src/lib/rbac.ts`.
4. **Pure Logic in `src/utils/`**:
   - Keep calculations (electrical, sizing, pricing) and form validations pure and decoupled from React components.
   - Accompany logic modifications with corresponding unit tests in `src/utils/*.test.ts`.
5. **Tailwind CSS v4 & Styling**:
   - Uses Tailwind v4 `@tailwindcss/vite` integration; do not assume legacy Tailwind v3 config files.
   - Maintain the marine theme aesthetic (deep slate/navy `#0A192F`, amber/gold accents, crisp status badges).
6. **Secrets & Environment Variables**:
   - Client variables use `VITE_*` prefix. Never commit `.env` or raw API keys to source control.

## Verification Checklist
Before completing any task:
- [ ] Run `npm run lint` — ensures clean compilation without type errors.
- [ ] Run `npm run test:unit` — all unit tests must pass.
- [ ] Ensure offline fallbacks are preserved for all data mutations.
