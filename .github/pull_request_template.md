## Description
<!-- Provide a brief description of the changes introduced by this pull request -->

Fixes #(issue)

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Dependency update (Dependabot or manual package upgrade)
- [ ] Architectural / Infrastructure enhancement
- [ ] Documentation update

## Verification Checklist
- [ ] `npm run lint` and `npm run lint:functions` pass with 0 errors
- [ ] `npm run test:unit` (296 frontend tests) and `npm run test:functions` (21 functions tests) pass with all tests green
- [ ] `npm run validate` passes cleanly
- [ ] Playwright E2E tests pass (`ALL_BROWSERS=true npm run test:e2e` for full cross-browser matrix)
- [ ] Storage keys use scoped environment storage (`src/lib/envStorage.ts`)
- [ ] No secrets or sensitive tokens exposed in client code

<!-- Copilot Summary Placeholder -->
<!-- copilot:summary -->
<!-- copilot:walkthrough -->
