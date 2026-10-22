# GEMINI.md — Instructions for Gemini & Antigravity Agents

You are acting as an expert pair programmer on the **AJW Marine Electrical Services** codebase.

## Core Directives
1. **Runtime & Language**:
   - Node `>=24.12.0`, React 19.3, TypeScript (strict mode), Vite 8, Firebase v13 + 2nd Gen Cloud Functions (`functions/` in `europe-west2`).
   - Never use `any` unless strictly unavoidable with explicit explanatory comments.
2. **Role-Based Access Control (RBAC)**:
   - 6 User Roles: `guest` | `client` | `technician` | `postal` | `admin` | `site`.
   - Route access is governed by `canAccessRoute(role, route)` in `src/lib/rbac.ts`.
   - Action permissions are governed by `canPerformAction(role, action)` and enforced server-side in `functions/src/authMiddleware.ts`.
   - Role operational manuals reside in `docs/manual/` (`01-guest-portal.md` through `06-platform-site-admin.md`), backed by automated 1080p Playwright video recording (`npm run record:manuals`, `npm run process:videos`).
3. **Styling & CSS**:
   - The project uses **Tailwind CSS v4** with `@tailwindcss/vite`.
   - **DO NOT** create `tailwind.config.js` or `postcss.config.js`.
   - Theme styling is defined directly in `src/index.css` via `@theme` directives and standard Tailwind utility classes.
4. **Decoupled Architecture**:
   - Keep React components purely presentational or state-coordinating.
   - All domain calculations, sizing algorithms, financial math, carrier package dimensioning, and form validations must be kept as pure functions in `src/utils/`.
   - Every utility function in `src/utils/` must be tested in `src/utils/<name>.test.ts`. Core infrastructure services in `src/lib/` and `functions/src/` also maintain companion `*.test.ts` suites.
5. **Resilience & Offline Handling**:
   - Pontoon diagnostics require offline capability.
   - Never fail hard on Firestore network disconnection errors (`Code: 14 UNAVAILABLE`) or unreachable Cloud Functions (`sendEmail`, `getShippingRates`, `generateShippingLabel`). Catch and degrade gracefully using `src/lib/offlineSync.ts`, `src/lib/emailService.ts` (simulated outbox), and `src/lib/shipstationService.ts` (deterministic 4x6" SVG thermal label fallback).
   - High payload assets (photos, pontoon digital signatures) must be persisted to IndexedDB (`ajw_marine_field_db`).
6. **Environment Scoping**:
   - Always route browser storage through `src/lib/envStorage.ts` via `getScopedStorageKey()`. Never use un-scoped raw keys.
7. **Testing Verification Protocol**:
   - Before finishing any task, run `npm run lint`, `npm run test:unit` (296 frontend tests), `npm run test:functions` (21 Cloud Functions tests — 317 total unit tests), and `npm run validate`. All must pass with zero errors.
   - For UI changes, ensure interactive elements have meaningful `data-testid` attributes and update/create Page Object Models in `tests/pages/` to preserve Playwright E2E compatibility (21 E2E spec files + 1 video training spec across 16 Page Object Models, documented in `docs/E2E_USER_JOURNEYS.md`).
8. **Supporting Services & Secrets**:
   - Account, key and endpoint provisioning for Firebase, Firestore, Storage, Cloud Functions, Stripe, Resend, ShipStation, Gemini and GitHub Actions is documented in `docs/SERVICES_SETUP.md`. Keep it in sync when adding or changing any environment variable, secret, or external integration (and update `.env.example`).
   - Never place secret keys (Stripe `sk_…`, `RESEND_API_KEY`, `SHIPSTATION_API_KEY`, `SHIPSTATION_API_SECRET`, service accounts, or server-only API keys) in `VITE_*` variables or committed files. Server secrets belong in Google Secret Manager (`defineSecret()` in `functions/src/index.ts`).
