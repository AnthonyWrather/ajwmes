# Marine Electrical Engineering Domain Invariants

## Domain Business Logic Invariants
When developing features or modifying calculations for AJW Marine Electrical Services, adhere to these domain specifications:

### 1. Diagnostic Labor Pricing
- Field diagnostics are charged at a flat **£25.00/hour** rate.
- Stopwatch tracking records elapsed time in integer seconds.
- Calculation function: `calculateDiagnosticLabor(seconds, hourlyRate = 25)` in `src/utils/electricalCalculations.ts`.
- Calculations must support fractional hours with 2 decimal place rounding.

### 2. Switch Panel CAD Specifications
- Default switches: Carling Contura II/V rocker switches.
- Standard faceplate materials: Matte black acrylic (base) or marine teak/birch (+£25 surcharge).
- Minimum panel width is strictly **160mm** (`calculateMinimumPanelWidth`).
- Cutout surcharges: Voltmeter cutout (+£12), dual USB socket (+£8), 12V marine socket (+£8).

### 3. Geographic & Contact Validation
- AJWMES operates primarily in the Solent marine basin: Gosport, Portsmouth, Southampton, Hamble, Cowes, and Chichester.
- Phone validation in `src/utils/formValidation.ts` must validate:
  - Standard UK mobile numbers (`07...`, `+44 7...`).
  - Portsmouth/Southampton landlines (`023...`).
  - Isle of Wight landlines (`01983...`).
- All valid phone numbers are normalized to E.164 standard format.

### 4. Marine Standards (ABYC & ISO)
- DC Systems operate at 12V or 24V nominal voltage.
- Critical circuit voltage drop threshold is 3% (navigation lights, bilge pumps, electronics).
- Non-critical circuit voltage drop threshold is 10% (cabin lighting, domestic entertainment).
- LiFePO4 battery banks are sized with an 80% maximum recommended Depth of Discharge (DoD).
