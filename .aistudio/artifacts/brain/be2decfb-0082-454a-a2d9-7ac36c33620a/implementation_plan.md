# Electrical Diagnostic Calculations & Form Validation Test Suite

Create a comprehensive unit test suite and dedicated utility modules for core electrical diagnostic calculations and form validation, and integrate unit test execution into the GitHub Actions CI pipeline alongside existing Playwright E2E tests.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following parameters were confirmed via user clarification:
> - **Electrical Calculations Scope**: Diagnostic labor hours (£25/hr flat rate + stopwatch conversions), materials cost, and custom switch panel pricing (gang counts, teak/birch materials, cutouts, and package tiers).
> - **Validation Architecture**: Dedicated validation utility module (`src/utils/formValidation.ts`) with standalone unit tests (`src/utils/formValidation.test.ts`) ensuring decoupled, reusable, and deterministic data handling across modal forms.
> - **CI / GitHub Actions Workflow**: Expand `.github/workflows/playwright.yml` and `package.json` so all unit tests (`auth.test.ts`, `electricalCalculations.test.ts`, `formValidation.test.ts`) run automatically on every push and pull request before Playwright tests.

- **Confirmed Decision 1**: Diagnostic calculations encapsulated in `src/utils/electricalCalculations.ts` covering stopwatch time conversions, labor rates (£25/hr), itemized materials summation, and panel pricing tiers.
- **Confirmed Decision 2**: Core validation logic structured as a dedicated pure module `src/utils/formValidation.ts` covering email formats, UK phone normalization, booking quotes, and vessel specifications.
- **Confirmed Decision 3**: GitHub Actions `playwright.yml` workflow updated to execute `npm run test:unit` before Playwright browser tests, failing fast if unit tests fail.

---

## 1. Overview & Core Concept

- **What It Does**:
  - Extracts and centralizes diagnostic electrical arithmetic and form validation logic into pure, testable utility modules.
  - Implements rigorous unit test coverage across diagnostic labor rates, materials summation, switch panel CAD pricing, email/phone validation, and vessel spec validation.
  - Configures a unified test runner command and CI automation to guarantee that both unit test suites (auth + electrical calculations + form validation) and E2E Playwright tests run in GitHub Actions.
- **Target Audience / Persona**: Workshop engineers, administrators (Anthony Wrather), vessel owners submitting quotes, and CI/CD maintainers.
- **Key Value**: Prevents billing calculation errors, prevents floating-point inaccuracies, stops invalid customer form submissions, and guards regressions via CI automation.

---

## 2. User Experience & Visual Design

- **Form Validation Feedback**:
  - Real-time or submit-time validation errors displayed cleanly with inline error messages in `BookingQuoteModal`.
  - Ensures clean normalization of UK telephone numbers (e.g. standardizing spaces and prefix handling) and vessel berth inputs.
- **Diagnostic Timer & Panel Designer**:
  - Consistent pricing and stopwatch display across `DiagnosticTimerModal`, `TechnicianWorkspace`, and `SwitchPanelDesigner`.
  - Elimination of rounding discrepancies between frontend display and saved invoice/quote records.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Pure Utility Modules vs. Inline Component Functions**:
  - *Chosen Approach*: Extract `calculateDiagnosticLabor`, `calculateMaterialsCost`, `calculateSwitchPanelPrice`, and form validation helpers into `src/utils/` modules.
  - *Why*: Allows isolated, rapid, deterministic unit testing without needing DOM rendering or React component mounting.
  - *Alternatives Considered*: Testing solely via Playwright E2E. Rejected because unit tests are faster (sub-second), test edge cases comprehensively, and do not suffer from browser flakiness.
- **Decision 2: Node Native Test Runner via `tsx --test`**:
  - *Chosen Approach*: Use `tsx --test` with `node:test` and `node:assert/strict` for all unit test suites (`auth.test.ts`, `electricalCalculations.test.ts`, `formValidation.test.ts`).
  - *Why*: Already proven fast and reliable in the applet environment without adding heavy dependencies like Jest or Vitest.
- **Decision 3: Fail-Fast CI Pipeline in GitHub Actions**:
  - *Chosen Approach*: Run `npm run test:unit` in `.github/workflows/playwright.yml` immediately after dependency installation and before browser provisioning.
  - *Why*: If core math or auth logic fails, CI stops immediately within seconds, saving runner compute minutes.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        GitHub Actions CI Workflow                      │
│                  (.github/workflows/playwright.yml)                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Unit Test Suite (npm run test:unit)               │
│                                                                        │
│  ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────┐ │
│  │ src/lib/auth.test.ts  │ │ electricalCalc.test   │ │ formValid.test│ │
│  │ • enrichUserProfile   │ │ • Labor hours (£25/h) │ │ • Email/Phone │ │
│  │ • canAccessRoute matrix│ │ • Materials summation │ │ • Booking form│ │
│  │ • 5 RBAC roles        │ │ • Panel CAD pricing   │ │ • Vessel spec │ │
│  └───────────────────────┘ └───────────────────────┘ └───────────────┘ │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ (Pass)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                   Playwright E2E Tests (npm run test:e2e)              │
│                Desktop & Mobile Chromium / WebKit Browsers             │
└────────────────────────────────────────────────────────────────────────┘
```

### Module Responsibilities

1. **`src/utils/electricalCalculations.ts`**:
   - `calculateDiagnosticLabor(seconds: number, hourlyRate?: number)`: Computes hours (2 decimal places) and labor cost at flat £25/hr (or custom rate).
   - `calculateMaterialsCost(materials: MaterialLineItem[])`: Sums itemized parts with quantity and unit price, avoiding float rounding glitches.
   - `calculateDiagnosticTotal(seconds: number, hourlyRate: number, materials: MaterialLineItem[])`: Combines labor and materials into accurate totals.
   - `formatStopwatchTime(totalSeconds: number)`: Converts raw seconds to formatted `HH:MM:SS` string.
   - `calculateSwitchPanelPrice(config: SwitchPanelConfig)`: Computes base cost, material adjustments (teak, birch), gang counts, cutout add-ons (voltmeter, USB, 12V), and package options (`faceplate_only`, `diy_kit`, `fully_assembled_wired`).
   - `calculateMinimumPanelWidth(gangCount: number, hasVoltmeter: boolean)`: Enforces spatial safety constraints.

2. **`src/utils/formValidation.ts`**:
   - `validateEmail(email: string)`: Validates email format, rejects empty or malformed strings.
   - `validateUkPhone(phone: string)`: Validates UK phone numbers (07xxx mobile, landlines, +44 international formats).
   - `validateBookingQuoteForm(data)`: Validates required client details, email, phone, and vessel reference.
   - `validateVesselSpecForm(spec)`: Validates vessel name, electrical voltage (`12V` or `24V`), battery capacity bounds, and safety fields.
   - `validateSwitchConfig(switches, gangCount)`: Validates breaker ratings (5A to 30A), switch count alignment, and circuit labels.

3. **`src/utils/electricalCalculations.test.ts` & `src/utils/formValidation.test.ts`**:
   - Comprehensive test suites validating typical inputs, boundary conditions (zero seconds, zero materials, single switch, max switches), invalid inputs, and float precision.

4. **Integration & CI**:
   - `package.json`: Configure `"test:unit": "tsx --test src/lib/auth.test.ts src/utils/electricalCalculations.test.ts src/utils/formValidation.test.ts"` and `"test": "npm run test:unit"`.
   - `.github/workflows/playwright.yml`: Insert `Run Unit Tests` step before Playwright test execution.
   - Refactor `DiagnosticTimerModal.tsx`, `SwitchPanelDesigner.tsx`, and `BookingQuoteModal.tsx` to utilize the shared utility modules.
