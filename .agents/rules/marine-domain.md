# Marine Electrical Engineering Domain Invariants

## Domain Business Logic Invariants
When developing features or modifying calculations for AJW Marine Electrical Services, adhere to these domain specifications:

### 1. Diagnostic Labor Pricing
- Field diagnostics are charged at a flat **£25.00/hour** rate.
- Stopwatch tracking records elapsed time in integer seconds.
- Calculation function: `calculateDiagnosticLabor(seconds, hourlyRate = 25)` in `src/utils/electricalCalculations.ts`.
- Calculations must support fractional hours with 2 decimal place rounding.

### 2. Custom Switch Panel CAD & Replica Specifications (`src/utils/electricalCalculations.ts`)
- Default switches: Carling Contura II/V rocker switches.
- Base laser cut & setup fee: **£35.00**.
- Standard faceplate materials: Matte black / gloss white acrylic (£0 surcharge), marine birch plywood (**+£15.00** surcharge), or solid oiled marine teak (**+£25.00** surcharge).
- Per-gang base scaling: **+£2.50** per switch gang.
- Cutout surcharges: Digital voltmeter cutout (**+£8.00**), dual USB fast charger cutout (**+£10.00**), 12V heavy-duty marine socket cutout (**+£6.00**).
- Readiness packaging tiers (`calculateSwitchPanelPrice`):
  - `faceplate_only`: `Math.round(base)`
  - `diy_kit`: `Math.round(base + safeGangs * 8 + 12)`
  - `assembled_wired`: `Math.round(base + safeGangs * 12 + 35)`
- Minimum panel width (`calculateMinimumPanelWidth(gangCount, hasVoltmeter)`): strictly **160mm** minimum (`Math.max(160, Math.ceil(count / 2) * 55 + (hasVoltmeter ? 45 : 0))`).
- Weathered Switchboard Photo Replica (`calculateReplicaPanelQuote`):
  - Digitizing labor (1 hr @ Solent rate): **£25.00**
  - Base laser cutout plate: **£35.00**
  - Marine switches hardware: **£8.00** per switch gang
  - Material surcharges: Solid Marine Teak (**+£25.00**), Marine Birch Plywood (**+£15.00**), Marine Acrylic (**£0.00**)
  - Optional cutouts: Voltmeter (**+£8.00**), Dual USB (**+£10.00**)
  - Turnaround commitment: **3–5 business days in Gosport workshop**.

### 3. Postal Carrier Weight & Box Heuristics (`src/utils/shipstationCalculations.ts`)
- Marine hardware items are weighed deterministically using copper conductor and switchgear density heuristics, plus packaging tare weight.
- Standard UK workshop carriers: **Gosport Workshop Collection (£0.00)**, **Royal Mail Tracked 24 / 48**, and **DPD Next Day**.
- Thermal shipping labels follow standard **4x6" (100mm × 150mm)** format with Royal Mail (`GB...RM`) and DPD (`1550...`) tracking barcodes.

### 4. Geographic & Contact Validation
- AJWMES operates primarily in the Solent marine basin: Gosport, Portsmouth, Southampton, Hamble, Cowes, and Chichester.
- Phone validation in `src/utils/formValidation.ts` must validate:
  - Standard UK mobile numbers (`07...`, `+44 7...`).
  - Portsmouth/Southampton landlines (`023...`).
  - Isle of Wight landlines (`01983...`).
- All valid phone numbers are normalized to E.164 standard format.

### 5. Marine Standards (ABYC & ISO)
- DC Systems operate at 12V or 24V nominal voltage.
- Critical circuit voltage drop threshold is 3% (navigation lights, bilge pumps, electronics).
- Non-critical circuit voltage drop threshold is 10% (cabin lighting, domestic entertainment).
- LiFePO4 battery banks are sized with an 80% maximum recommended Depth of Discharge (DoD).
