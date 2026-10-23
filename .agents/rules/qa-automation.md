# QA Automation & Testing Standards

## Testing Philosophy & Structure
This codebase follows a rigorous multi-tier testing methodology:
1. **Frontend Unit Test Suite (`src/**/*.test.ts`)**:
   - Built with Node.js built-in test runner (`import { describe, it } from 'node:test'`) and strict assertions (`import assert from 'node:assert/strict'`).
   - Run via `npm run test:unit`, which delegates to `tsx --test "src/**/*.test.ts"` (309 passing tests across 25 suites in `src/utils/*.test.ts`, `src/lib/*.test.ts`, `src/data/*.test.ts`, and `src/components/icons/*.test.ts`).
   - All pure utility functions (electrical calculations, pricing, expenses, carrier weight/dimensions, phone/email validation, Stripe math, semantic versioning, inventory sync, offline queue ordering, role manuals) must have comprehensive unit test coverage.
   - Any new calculation or service function requires an accompanying unit test file before being considered complete.

2. **Cloud Functions Unit Test Suite (`functions/src/**/*.test.ts`)**:
   - Run via `npm run test:functions` (21 passing tests covering Resend email gateway, ShipStation Basic Auth / rate & label mapping, and RBAC caller middleware — 330 total unit tests).

3. **End-to-End Test Suite (`tests/*.spec.ts` & `tests/pages/*.ts`)**:
   - Built on Playwright (`@playwright/test`) using the Page Object Model (POM) pattern in `tests/pages/`.
   - Run via `npm run test:e2e` (Desktop Chrome & Mobile Chrome) or `npm run test:e2e:all` (full 5-browser matrix: Chromium, Firefox, WebKit, Mobile Chrome Pixel 5, Mobile Safari iPhone 12).
   - Training video generation suite runs via `npm run record:manuals` (`playwright.training.config.ts`) and `npm run process:videos`.
   - Operates against an isolated server on port `5173` (`127.0.0.1:5173`) to prevent collision with local development on port `3000`.
   - All interactive UI selectors must use deterministic `data-testid` attributes (e.g. `page.getByTestId('auth-modal')`). Never rely on unstable CSS classes or XPath.
   - Documented in `docs/E2E_USER_JOURNEYS.md` (21 automated E2E specification suites + 1 video training suite and 16 Page Object Models).

## Pre-Completion Verification
Before concluding any task:
- Run `npm run lint` and `npm run lint:functions` (`tsc --noEmit`) to verify 0 type errors.
- Run `npm run test:unit` and `npm run test:functions` to verify that all 330 unit tests (309 frontend + 21 Cloud Functions) pass cleanly.
- Run `npm run validate` to verify the full lint, unit test, frontend production build, and Cloud Functions build pipeline passes.
