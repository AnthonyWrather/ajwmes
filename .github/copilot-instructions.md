# GitHub Copilot Instructions for AJW Marine Electrical Services

These instructions guide GitHub Copilot Chat, Pull Request reviewers, inline completions, and Copilot coding agents for this repository.

## Architecture & Code Organization
- **PWA / Offline-First**: This is a marine field-service application. Technicians routinely operate with zero cellular signal inside metal hulls or offshore pontoons. All state updates must be resilient to network failures via `src/lib/offlineSync.ts`, with offline fallbacks for transactional emails (`src/lib/emailService.ts`) and postal carrier labels (`src/lib/shipstationService.ts`).
- **Cloud Functions Gateway**: Server-side integrations (Resend `sendEmail` and ShipStation `getShippingRates`, `generateShippingLabel`, `createShipStationOrder`, `shipstationWebhook`) run on 2nd Gen Firebase Cloud Functions (`functions/` in `europe-west2` with `firebase-admin ^14.5.0` & `firebase-functions ^7.4.0`) with secrets managed via Google Secret Manager. Never expose `RESEND_API_KEY`, `SHIPSTATION_API_KEY`, or `SHIPSTATION_API_SECRET` in client `VITE_*` variables.
- **Pure Logic Decoupling**: Sizing calculations (lithium batteries, solar arrays, conductor voltage drops), switch panel CAD & replica pricing, carrier package weight/dimensioning, and form validations are pure functions in `src/utils/`.
- **Type Safety**: Maintain strict TypeScript with no `any` types. Central domain models reside in `src/types/index.ts`.
- **Tailwind CSS v4**: Uses `@tailwindcss/vite` (`@import "tailwindcss";` in `src/index.css`). Do NOT propose `tailwind.config.js` or `postcss.config.js`.
- **Multi-Environment Storage Scoping**: Always route browser storage through `src/lib/envStorage.ts` via `getScopedStorageKey()`. Never use un-scoped raw `localStorage.setItem` keys.
- **Role-Based Access Control (RBAC)**: Guard all protected routes with `canAccessRoute(role, route)` and user capabilities with `canPerformAction(role, action)` from `src/lib/rbac.ts` across all 6 roles (`guest`, `client`, `technician`, `postal`, `admin`, `site`), and callable Cloud Functions with `functions/src/authMiddleware.ts`. Role manuals are maintained in `docs/manual/`.

## Marine Domain Specifics
- **Diagnostic Labor**: Flat billing rate is £25/hour, tracked in seconds via `calculateDiagnosticLabor()` in `src/utils/electricalCalculations.ts`.
- **UK Telephone Validation**: Validate standard UK mobile and Solent local area codes (`023` for Portsmouth/Southampton, `01983` for Isle of Wight) via `src/utils/formValidation.ts`.
- **Custom Switch Panels**: Default rocker switches with minimum plate width of 160mm (`calculateMinimumPanelWidth`), base laser cut £35, teak surcharge +£25, birch surcharge +£15, voltmeter cutout +£8, dual USB cutout +£10, and 12V marine socket cutout +£6.

## Automated Testing & CI/CD Requirements
- **Unit & Feature Tests**: Node's native test runner executed via `npm run test:unit` (309 frontend tests across 25 suites via `tsx --test "src/**/*.test.ts"`) and `npm run test:functions` (21 Cloud Functions tests across 2 suites via `functions/src/**/*.test.ts` — 330 unit tests total).
- **Test Companion Rule**: Always add or maintain unit tests in `src/utils/<name>.test.ts` (or `src/lib/<name>.test.ts` / `functions/src/<name>.test.ts`) when adding or modifying logic.
- **Playwright E2E**: End-to-end tests use Page Object Models in `tests/pages/` (16 POMs across 21 E2E spec files + 1 video training suite). Interactive elements must maintain clear, stable `data-testid` attributes.
- **Cross-Browser Verification**: Full browser matrix runs locally with `ALL_BROWSERS=true npm run test:e2e` (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari).
- **Pre-Flight Validation**: Always verify `npm run validate` (`lint + test:unit + build + test:functions + build:functions`) passes with 0 errors before submitting pull requests.
- **CI/CD Workflow Decoupling**: Pull requests execute `playwright.yml` (strict linting, 330 unit tests, and full 5-browser matrix tests). Merges to `main` execute `firebase-hosting-merge.yml` for rapid, reliable production build and deployment to Firebase Hosting.

## Dependency Management & Dependabot PRs
- Automated dependency version and security updates are managed via `.github/dependabot.yml` daily.
- When reviewing Dependabot PRs:
  1. Verify breaking changes in major version upgrades.
  2. Confirm `npm run validate` and `npm run test:e2e` pass cleanly.
  3. Ensure types and lockfiles (`package-lock.json` in root and `functions/`) remain cleanly synchronized.
