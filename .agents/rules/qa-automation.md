# QA Automation & Testing Standards

## Testing Philosophy & Structure
This codebase follows a rigorous two-tier testing methodology:
1. **Unit Test Suite (`src/**/*.test.ts`)**:
   - Built with Node.js built-in test runner (`import { describe, it } from 'node:test'`) and strict assertions (`import assert from 'node:assert/strict'`).
   - Run via `npm run test:unit`, which delegates to `tsx --test "src/**/*.test.ts"`.
   - All pure utility functions (electrical calculations, pricing, expenses, phone/email validation, semantic versioning) must have comprehensive unit test coverage.
   - Any new calculation function requires an accompanying unit test file before being considered complete.

2. **End-to-End Test Suite (`tests/*.spec.ts`)**:
   - Built on Playwright (`@playwright/test`).
   - Run via `npm run test:e2e`.
   - Operates against an isolated dev server on port `5173` to prevent collision with local development on port `3000`.
   - Tests run across Desktop Chrome and Mobile viewports (Pixel 5, iPhone 12).
   - All interactive UI selectors must use deterministic `data-testid` attributes (e.g. `page.getByTestId('auth-modal')`). Never rely on unstable CSS classes or XPath.

## Pre-Completion Verification
Before concluding any task:
- Run `npm run lint` (`tsc --noEmit`) to verify 0 type errors.
- Run `npm run test:unit` to verify that all unit tests pass cleanly.
- Run `npm run validate` to verify the full build passes.
