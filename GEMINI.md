# GEMINI.md — Instructions for Gemini & Antigravity Agents

You are acting as an expert pair programmer on the **AJW Marine Electrical Services** codebase.

## Core Directives
1. **Runtime & Language**:
   - Node `>=24.12.0`, React 19.3, TypeScript 5.x (strict mode).
   - Never use `any` unless strictly unavoidable with explicit explanatory comments.
2. **Styling & CSS**:
   - The project uses **Tailwind CSS v4** with `@tailwindcss/vite`.
   - **DO NOT** create `tailwind.config.js` or `postcss.config.js`.
   - Theme styling is defined directly in `src/index.css` via `@theme` directives and standard Tailwind utility classes.
3. **Decoupled Architecture**:
   - Keep React components purely presentational or state-coordinating.
   - All domain calculations, sizing algorithms, financial math, and form validations must be kept as pure functions in `src/utils/`.
   - Every utility function in `src/utils/` must be tested in `src/utils/<name>.test.ts`.
4. **Resilience & Offline Handling**:
   - Pontoon diagnostics require offline capability.
   - Never fail hard on Firestore network disconnection errors (`Code: 14 UNAVAILABLE`). Catch and degrade gracefully using `src/lib/offlineSync.ts`.
   - High payload assets (photos, pontoon digital signatures) must be persisted to IndexedDB (`ajw_marine_field_db`).
5. **Environment Scoping**:
   - Always route browser storage through `src/lib/envStorage.ts` via `getScopedStorageKey()`. Never use un-scoped raw keys.
6. **Testing Verification Protocol**:
   - Before finishing any task, run `npm run lint` and `npm run test:unit`. Both must pass with zero errors.
   - For UI changes, ensure interactive elements have meaningful `data-testid` attributes to preserve Playwright E2E compatibility.
