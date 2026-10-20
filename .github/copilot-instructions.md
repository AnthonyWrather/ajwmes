# GitHub Copilot Instructions for AJW Marine Electrical Services

These instructions guide GitHub Copilot Chat, Pull Request reviewers, and inline completions for this repository.

## Architecture & Code Organization
- **PWA / Offline-First**: This is a marine field-service application. Technicians routinely operate with zero cellular signal. All state updates must be resilient to network failures via `src/lib/offlineSync.ts`, with offline fallbacks for transactional emails (`src/lib/emailService.ts`) and postal carrier labels (`src/lib/shipstationService.ts`).
- **Cloud Functions Gateway**: Server-side integrations (Resend `sendEmail` and ShipStation `getShippingRates`, `generateShippingLabel`, `createShipStationOrder`, `shipstationWebhook`) run on 2nd Gen Firebase Cloud Functions (`functions/` in `europe-west2`) with secrets stored in Google Secret Manager. Never expose `RESEND_API_KEY` or `SHIPSTATION_API_SECRET` in `VITE_*` variables.
- **Pure Logic**: Sizing calculations (lithium batteries, solar arrays, conductor voltage drops), switch panel CAD & replica pricing, carrier package weight/dimensioning, and form validations are pure functions in `src/utils/`.
- **Type Safety**: Maintain strict TypeScript with no `any` types. Central types are in `src/types/index.ts`.
- **Tailwind v4**: Do NOT propose `tailwind.config.js` or `theme()` functions incompatible with `@tailwindcss/vite`.
- **RBAC**: Guard all protected views with `canAccessRoute()`, user capabilities with `canPerformAction()` from `src/lib/rbac.ts`, and callable Cloud Functions with `functions/src/authMiddleware.ts`.

## Marine Domain Specifics
- **Diagnostic Labor**: Flat billing rate is £25/hour, tracked in seconds via `calculateDiagnosticLabor()` in `src/utils/electricalCalculations.ts`.
- **UK Telephone Validation**: Validate standard UK mobile and Solent local area codes (`023` for Portsmouth/Southampton, `01983` for Isle of Wight) via `src/utils/formValidation.ts`.
- **Custom Switch Panels**: Default rocker switches with minimum plate width of 160mm (`calculateMinimumPanelWidth`), base laser cut £35, teak surcharge +£25, birch surcharge +£15, voltmeter cutout +£8, dual USB cutout +£10, and 12V marine socket cutout +£6.

## Automated Testing Requirements
- Unit tests use Node's native test runner executed with `npm run test:unit` (`tsx --test "src/**/*.test.ts"`) and `npm run test:functions` (`functions/src/**/*.test.ts`).
- Always add unit tests in `src/utils/<name>.test.ts` (or `src/lib/<name>.test.ts` / `functions/src/<name>.test.ts`) when adding or modifying logic.
- Ensure new interactive UI components include distinct `data-testid` attributes compatible with Playwright E2E specs (`tests/*.spec.ts`) and Page Object Models (`tests/pages/`).
- Before suggesting or opening pull requests, verify `npm run validate` (`lint + test:unit + build + test:functions + build:functions`) passes with 0 errors.
