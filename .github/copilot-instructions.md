# GitHub Copilot Instructions for AJW Marine Electrical Services

These instructions guide GitHub Copilot Chat, Pull Request reviewers, and inline completions for this repository.

## Architecture & Code Organization
- **PWA / Offline-First**: This is a marine field-service application. Technicians routinely operate with zero cellular signal. All state updates must be resilient to network failures via `src/lib/offlineSync.ts`.
- **Pure Logic**: Sizing calculations (lithium batteries, solar arrays, conductor voltage drops), switch panel pricing, and form validations are pure functions in `src/utils/`.
- **Type Safety**: Maintain strict TypeScript with no `any` types. Central types are in `src/types/index.ts`.
- **Tailwind v4**: Do NOT propose `tailwind.config.js` or `theme()` functions incompatible with `@tailwindcss/vite`.
- **RBAC**: Guard all protected views with `canAccessRoute()` and user capabilities with `canPerformAction()` from `src/lib/rbac.ts`.

## Marine Domain Specifics
- **Diagnostic Labor**: Flat billing rate is £25/hour, tracked in seconds via `calculateDiagnosticLabor()` in `src/utils/electricalCalculations.ts`.
- **UK Telephone Validation**: Validate standard UK mobile and Solent local area codes (`023` for Portsmouth/Southampton, `01983` for Isle of Wight) via `src/utils/formValidation.ts`.
- **Custom Switch Panels**: Default rocker switches with minimum plate width of 160mm.

## Automated Testing Requirements
- Unit tests use Node's native test runner executed with `tsx --test "src/**/*.test.ts"`.
- Always add unit tests in `src/utils/<name>.test.ts` when adding or modifying pure logic.
- Ensure new interactive UI components include distinct `data-testid` attributes compatible with Playwright E2E specs in `tests/`.
- Before suggesting or opening pull requests, verify `npm run lint` and `npm run test:unit` pass.
