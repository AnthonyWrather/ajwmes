# AJW Marine Electrical Services — E2E User Journeys & QA Roadmap Specification

> **Classification:** Engineering & QA Automation Architecture Document  
> **Author:** Principal Full Stack Engineer, Cloud Infrastructure Platform Engineer & QA Automation Specialist  
> **Application Version:** `v1.2.0` | **Target Runtime:** Node `>=24.12.0`  
> **Test Framework:** Playwright (`@playwright/test`) with Page Object Models (POM)  
> **Date:** October 2026  

---

## Executive Summary

AJW Marine Electrical Services (AJWMES) operates a mission-critical, offline-first Progressive Web App (PWA) servicing boat owners, pontoon field technicians, postal fulfillment staff, and workshop administration across the Solent marine basin.

To guarantee zero regression in critical business paths, high-stakes electrical calculations, and resilient offline operations, this document:
1. **Audits and details existing end-to-end (E2E) test coverage** currently executed in `tests/`.
2. **Defines and maps all pending user journeys** across the application lifecycle.
3. **Presents a prioritized engineering and QA automation roadmap** with risk and complexity scoring.
4. **Recommends and specifies the next journey** to implement, complete with Page Object Model (POM) design and test assertions.

---

## 1. Existing Covered User Journeys

The Playwright E2E test suite covers five core operational journeys utilizing dedicated Page Object Models (`tests/pages/`):

```mermaid
graph TD
    subgraph ExistingJourneys["Covered E2E Journeys"]
        J1["1. Authentication & RBAC Navigation\n(tests/authentication.spec.ts)"]
        J2["2. Hardware Catalog & Stock Sync\n(tests/inventory-stock-sync.spec.ts)"]
        J3["3. Diagnostic Booking & Email Dispatch\n(tests/resend.spec.ts)"]
        J4["4. Field Technician Diagnostic & Sign-Off\n(tests/technician-diagnostic-flow.spec.ts)"]
        J5["5. Postal Fulfillment & Dispatch\n(tests/postal-fulfillment-dispatch.spec.ts)"]
        J6["6. Consignment Timeline Tracker\n(tests/consignment-tracker.spec.ts)"]
        J7["7. Master Workshop Admin & Expenses (UJ-10)\n(tests/admin-workshop-management.spec.ts)"]
        J8["8. Offline Pontoon Resilience (UJ-11)\n(tests/offline-pontoon-resilience.spec.ts)"]
        J9["9. Custom Switch Panel CAD Configurator (UJ-07)\n(tests/switch-panel-cad.spec.ts)"]
        J10["10. Weathered Switchboard Photo Replica Quoter (UJ-08)\n(tests/switchboard-photo-replica.spec.ts)"]
    end

    J1 -->|"Session Rehydration & Profiles"| POM1["AuthModalPage\nNavigationPage\nVesselPortalPage"]
    J2 -->|"Stock Sync & Cart Interactions"| POM2["StorePage\nCartDrawerPage\nAdmin Dashboard"]
    J3 -->|"Resend Multi-Env Outbox"| POM3["EnvironmentSettingsModal\nBookingQuoteModal"]
    J4 -->|"Stopwatch, Materials & Canvas Signature"| POM4["TechnicianWorkspacePage\nCustomerSignOffModal"]
    J5 -->|"Queue, Cable Cut & Dispatch Modal"| POM5["PostalWorkstationPage\nDispatchModalPage"]
    J6 -->|"Milestones, Checkpoints & Status Simulator"| POM6["ConsignmentTrackerPage"]
    J7 -->|"Expenses, POs, Rollups & Snapshots"| POM7["AdminDashboardPage"]
    J8 -->|"Faraday Blackout, Photo Queue & Auto-Replay"| POM8["TechnicianWorkspacePage\nCustomerSignOffModal\nTechnicianSyncBar"]
    J9 -->|"CAD Layout, SVG Export, Cart & Quote"| POM9["SwitchPanelCADPage\nCartDrawerPage\nBookingQuoteModal"]
    J10 -->|"Presets, Live Surcharges & Lightbox"| POM10["ReplicaPanelUploaderPage\nNavigationPage\nAuthModalPage"]
```

---

### Journey 1: Authentication, Multi-Persona RBAC & Profile Management
- **Test File:** [`tests/authentication.spec.ts`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/tests/authentication.spec.ts)
- **Page Objects Used:** `NavigationPage`, `AuthModalPage`, `StorePage`, `CartDrawerPage`, `VesselPortalPage`
- **Target Personas:** `guest`, `client`, `technician`, `postal`, `admin`

#### Scenarios Verified:
1. **Guest Browsing & Workshop Collection Order**:
   - Unauthenticated guest lands on the responsive landing page, navigates to Parts Store, adds tinned copper marine cable to cart, selects *Gosport Workshop Collection (FREE)*, enters Haslar Pontoon contact details, completes payment, and confirms order creation (`AJW-POST-*`).
2. **Administrator Authentication & Route Access**:
   - Sign in via modal using admin credentials (`anthonywrather@gmail.com`), asserting redirection to Anthony's Operations Dashboard and updating header navigation with the authenticated user profile.
3. **Profile Details & Custom Avatar Selection**:
   - Switching user avatars via system preset graphics (Helm Navigator, Cruiser Captain) and validating direct photo file upload (base64 data URL preview and storage).
4. **Vessel Specification Access Gating**:
   - Role-based visibility of the Vessel Specifications tab: strictly hidden for `technician` and `postal` personas, dynamically restored for `client` and `admin`.
   - Inspection of registered vessels list and transition to full Vessel Portal.
   - Live editing of vessel dimensions (LOA, LWL, Beam, Draft) and Hull Type selection (Monohull Fin Keel, Bilge Keel, Catamaran, RIB, Tender).
5. **Unregistered Boat Owner Onboarding & Checkout**:
   - New boat owner registration omitting vessel specs, landing on the Vessel Portal unregistered state, and flowing seamlessly into workshop parts ordering.
6. **Multi-Environment Configuration & Version Pinning**:
   - Header version badge display linking SemVer to GitHub commit SHA (`v1.2.0-[sha]`).
   - Production mode validation: disabling development-only 1-click test personas and testing hints when running in production live environments.

---

### Journey 2: Marine Hardware Store, Cart Drawer & Live Stock Synchronization
- **Test File:** [`tests/inventory-stock-sync.spec.ts`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/tests/inventory-stock-sync.spec.ts)
- **Page Objects Used:** `StorePage`, `CartDrawerPage`
- **Target Personas:** `client`, `guest`, `admin`

#### Scenarios Verified:
1. **Catalog Browsing & Category Filtering**:
   - Loading marine cables, fuses, busbars, and Victron equipment with live price and stock counts.
   - Zero-stock warning badges and out-of-stock disabled state handling.
2. **Cart Drawer Interactions**:
   - Adding in-stock marine components, incrementing/decrementing quantities, and optimistic real-time price rollups.
   - Dynamic carrier calculation (Gosport Workshop Collection £0.00, Royal Mail Tracked 24/48 £4.50, DPD Next Day £8.50).
3. **Split Catalog Export/Import & Synchronization**:
   - Standalone Export Items and Export Categories to formatted JSON files.
   - Google Sheets/ERP synchronization simulation: importing updated Victron inventory items with merge mode validation.
   - Category management modal: adding new electrical propulsion classifications with JSON syntax validation.

---

### Journey 3: Diagnostic Booking & Email Dispatch Integration
- **Test File:** [`tests/resend.spec.ts`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/tests/resend.spec.ts)
- **Page Objects Used:** `NavigationPage`, `AuthModalPage`
- **Target Personas:** `client`, `guest`, `admin`

#### Scenarios Verified:
1. **Multi-Environment Resend Email Settings**:
   - Verifying Resend Email Integration card in the Environment Manager.
   - Distinguishing between Simulated Outbox mode (safe dev/staging) and Live API mode.
2. **API Key Validation & Security**:
   - Strict format validation of Resend API keys (`re_*` prefix with minimum 24 characters).
   - Key storage, simulated test email dispatch, and key reset fallbacks.
3. **Non-Blocking Welcome & Confirmation Notifications**:
   - Triggering background confirmation notifications during boat owner registration without blocking navigation or UI responsiveness.

---

### Journey 4: Solent Marine Field Technician Diagnostics & Digital Sign-Off
- **Test File:** [`tests/technician-diagnostic-flow.spec.ts`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/tests/technician-diagnostic-flow.spec.ts)
- **Page Objects Used:** `NavigationPage`, `AuthModalPage`, `TechnicianWorkspacePage`
- **Target Personas:** `technician`, `admin`

#### Scenarios Verified:
1. **Technician Authentication & Workspace Gating**:
   - Sign in using Solent marine technician credentials (`jack.tech@ajwmes.co.uk`), verifying instant redirection to `/technician` with user profile name.
2. **Job Queue Inspection, Filtering & Vessel Selection**:
   - Filter jobs by active/scheduled status pills and select assigned vessel jobs.
   - Inspect vessel specifications, berth location, and preliminary fault notes.
3. **Diagnostic Stopwatch Timing & Labor Rate Rollup**:
   - Start and pause live diagnostic stopwatch, verifying £25.00/hour flat rate labor calculations.
4. **Hardware Materials & Consumables Logging**:
   - Add parts from the workshop catalog into the active job sheet, verifying real-time materials summation and total due updates.
5. **Customer Pontoon Sign-Off with HTML5 Canvas Signature**:
   - Review itemized work sheet summary and authority role.
   - Draw handwritten signature aboard vessel using pointer/touch simulation on HTML5 `<canvas>`.
   - Submit sign-off and verify the Pontoon Customer Sign-Off Receipt Card is rendered with customer name and signature image.
6. **Job Completion Progression**:
   - Advance job progress state to Completed (`bg-emerald-600`).

---

### Journey 5: Postal Workshop Order Fulfillment, Cable Cutting & Dispatch
- **Test File:** [`tests/postal-fulfillment-dispatch.spec.ts`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/tests/postal-fulfillment-dispatch.spec.ts)
- **Page Objects Used:** `NavigationPage`, `AuthModalPage`, `PostalWorkstationPage`, `DispatchModalPage`
- **Target Personas:** `postal`, `admin`

#### Scenarios Verified:
1. **Postal Workstation Authentication & RBAC Gating**:
   - Sign in using workshop postal credentials (`sarah.postal@ajwmes.co.uk`), verifying dedicated access to `/postal` with operator identity.
2. **Pending Consignments Queue & Selection**:
   - Filter orders by pending/processing status and inspect customer delivery requirements (marina pontoon berth vs UK residential address).
3. **Custom Marine Cable Cutting & Bench Verification**:
   - Interactive cable cutting workstation: verify spool measurements, mark cut lengths, and confirm custom preparation.
4. **Hardware Picking Checklist & Verification**:
   - Audit individual line items, check off picked hardware components, and track order fulfillment readiness.
5. **Carrier Consignment Code Generation & Dispatch**:
   - Open dispatch modal, select carrier service (Royal Mail Tracked 24/48 or DPD Next Day), generate valid carrier consignment reference, and complete dispatch transition.
6. **Printable Packing Slip & Barcode Generation**:
   - Render printable HTML5 packing slip with order summary, recipient details, item breakdown, and verified dispatch metadata.

---

### Journey 6: Solent Marine Postal Consignment Timeline Tracker
- **Test File:** [`tests/consignment-tracker.spec.ts`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/tests/consignment-tracker.spec.ts)
- **Page Objects Used:** `NavigationPage`, `AuthModalPage`, `ConsignmentTrackerPage`
- **Target Personas:** `guest`, `client`, `admin`

#### Scenarios Verified:
1. **Navigation & Tab Access**:
   - Navigate to landing page and access Postal Order Tracker tab from both desktop navigation header and mobile bottom drawer.
2. **Consignments Queue Inspection & Order Switching**:
   - Inspect active consignment tabs and switch smoothly between multiple seed and customer orders (`AJW-POST-2841`, `AJW-POST-2839`, `AJW-POST-2845`).
3. **Postcode & Order Number Filtering**:
   - Filter consignments using real-time search query by order identifier and UK delivery postcode (e.g. `PO12`, `PO31`), validating instant search clearing.
4. **4-Stage Visual Timeline Milestones**:
   - Audit interactive 4-stage visual progress bar (Order Received, Processing & Cut, Dispatched, Delivered) across desktop and mobile viewports with dynamic percentage completion badges.
5. **Carrier Logistics & Reference Clipboard Interaction**:
   - Inspect carrier details (Royal Mail / DPD), tracking references, and verify single-click clipboard copy action.
6. **Simulated Live Carrier Checkpoints Modal**:
   - Open chronological carrier checkpoints modal, audit milestone logs (Sorted at Hub, Out for Delivery, Signed on Pontoon), and dismiss via close controls.
7. **Destination Specifications (Marina vs Residential)**:
   - Compare delivery metadata between Solent marina berths (vessel name, pontoon berth, gate codes) and UK mainland residential addresses.
8. **Parcel Contents Accordion & BOM Billing Totals**:
   - Toggle expandable parcel contents drawer to audit itemized bill of materials, quantities, unit prices, delivery fee, and total paid.
9. **Admin Session Continuity**:
   - Authenticate as Workshop Admin (`anthonywrather@gmail.com`) and verify active tracker state and profile continuity are preserved.
10. **Dynamic Order Lifecycle Simulation**:
    - Trigger quick status transitions (`processing` -> `dispatched` -> `delivered` -> `pending`) and verify real-time timeline recalculation, stage node styling, and fulfillment percentages.

---

### Journey 7: Master Workshop Administration, Expenses & Restock (UJ-10)
- **Test File:** [`tests/admin-workshop-management.spec.ts`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/tests/admin-workshop-management.spec.ts)
- **Page Objects Used:** `NavigationPage`, `AuthModalPage`, `AdminDashboardPage`
- **Target Personas:** `admin` (`anthonywrather@gmail.com`)

#### Scenarios Verified:
1. **Workshop Admin Authentication & Dashboard Redirection**:
   - Authenticate with administrator credentials (`anthonywrather@gmail.com`), asserting redirection to Anthony's Operations Dashboard (`/admin`) and profile badge rehydration.
2. **Top-Level Operational KPI Metrics Audit**:
   - Verify primary metric cards: Total Workload, Hours Diagnostic Labor, Gross Recorded Revenue (£), Non-Catalog Field Expenses (£), and Pending Replica/Custom Panel Quotes.
3. **Critical Depletion Warning & Supplier Reorder PO Flow**:
   - Inspect zero-stock alert banner for depleted workshop components.
   - Trigger Supplier Purchase Order modal, configure restock quantity, set express Solent courier speed, copy generated PO email to clipboard, dispatch purchase order, and execute instant stock replenishment.
4. **Non-Catalog Job Expenses & Financial KPI Accounting Summary**:
   - Access Non-Catalog Job Expenses tab and verify financial rollup summary: Total Recorded Disbursements, Fuel & Solent Travel, External Sub-Contractor Fees, and Client Billable vs Overhead absorbed.
5. **Field Non-Catalog Expense Recording with Client Billable Classification**:
   - Record a new out-of-pocket field disbursement (e.g. water taxi mooring launch, harbor fees, specialist gear hire) linked to an active vessel job with payee, receipt reference, date, payment method, and billable recharge designation.
6. **Search Filtering, Job Focus & Job Financial Rollup Summary**:
   - Filter disbursements by receipt reference and keyword search query, verifying real-time table filtering and filter reset.
   - Focus on an individual vessel job to audit the comprehensive Job Financial Rollup card: Diagnostic Labor, Catalog Materials, Non-Catalog Expenses, Client Total Billable, and Gross Job Margin (£ and %).
7. **Inline Billable vs Workshop Overhead Dynamic Recalculation**:
   - Toggle expense reimbursement status inline (`Workshop Overhead` <-> `Billable to Client`), verifying instantaneous state toggling and badge restyling.
8. **Expense Editing & Safe Deletion Confirmation**:
   - Open edit modal to modify disbursement amounts, verify optimistic update, and trigger safe deletion confirmation modal to permanently purge test expenses.
9. **Stock & Catalog Point-in-Time Save Points (Snapshots)**:
   - Switch to Stock & Catalog tab, open Save Points drawer, and generate a point-in-time rollback snapshot verifying timestamped catalog preservation.
10. **Accounting CSV Export Trigger**:
    - Trigger CSV export download for workshop accounting and bookkeeping.

---

### Journey 8: Solent Marine Pontoon Field Resilience, Offline Photo Capture & Mutation Replay (UJ-11)
- **Test File:** [`tests/offline-pontoon-resilience.spec.ts`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/tests/offline-pontoon-resilience.spec.ts)
- **Page Objects Used:** `NavigationPage`, `AuthModalPage`, `TechnicianWorkspacePage`
- **Target Personas:** `technician` (`jack.tech@ajwmes.co.uk`), `admin`

#### Scenarios Verified:
1. **Technician Authentication & Pontoon Diagnostics Setup**:
   - Authenticate as marine technician (`jack.tech@ajwmes.co.uk`), verify automatic redirection to `/technician`, assert active vessel job selection and initial "All Synced" connection status.
2. **Offshore Connectivity Drop & Graceful Degradation**:
   - Simulate complete network severance (`context.setOffline(true)`) reflecting pontoon Faraday cage conditions / metal hull signal blackout.
   - Verify status bar transitions dynamically to amber/red offline badge ("Offline - Local Storage Active", `data-testid="sync-status-badge"`).
3. **High-Payload Marine Defect Photo Capture & IndexedDB Queue**:
   - Technician captures high-resolution marine electrical fault photos (bilge wiring corrosion, burnt busbar).
   - Verify client-side canvas compression, preview gallery rendering, and queuing into local storage (`ajw_marine_field_db`), asserting pending queued photos badge increments.
4. **Offline Customer Pontoon Sign-Off with HTML5 Canvas Signature**:
   - Boat owner inspects offline diagnostic sheet and provides handwritten digital consent on HTML5 `<canvas>`.
   - Verify submission succeeds with zero network connectivity; payload is stored safely into mutation queue (`ajwmes_aistudio_dev_signoffs`).
   - Assert Pontoon Customer Sign-Off Receipt Card is rendered with owner name, timestamp, and signature graphic.
5. **Pontoon Reconnection & Automatic Mutation Replay**:
   - Restore marina network connectivity (`context.setOffline(false)`).
   - Assert sync bar updates state to "Syncing Local Changes..." with live progress percentage indicators.
   - Verify transactional mutation queue drains in prioritized order (signatures and job consent before heavy binary work photos).
6. **Queue Draining & Synchronization Completion**:
   - Assert mutation queue drains completely to 0 pending mutations.
   - Verify sync bar returns to emerald green "All Synced" state (`data-testid="sync-status-badge"`).

---

### Journey 9: Custom Switch Panel CAD Configurator (UJ-07)
- **Test File:** [`tests/switch-panel-cad.spec.ts`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/tests/switch-panel-cad.spec.ts)
- **Page Objects Used:** `NavigationPage`, `SwitchPanelCADPage`, `CartDrawerPage`, `BookingQuoteModal`
- **Target Personas:** `guest`, `client`, `admin`

#### Scenarios Verified:
1. **CAD Layout Preview & Default Sizing**:
   - Navigate to `/designer` via desktop tab or mobile menu drawer.
   - Assert default 6-gang initial panel preview, standard dimensions (190mm × 130mm), and baseline price (£175.00) computed by pure sizing logic.
   - Verify default voltmeter aperture and dual USB charging cutout are rendered in the live SVG drawing.
2. **Panel Material Selection & Dynamic Surcharges**:
   - Select Teak Veneer (+£25 surcharge => £200.00), Birch Plywood (+£15 surcharge => £190.00), and Matte Black Acrylic (£175.00 baseline), validating real-time plate re-coloring and price recalculations.
3. **Gang Count Scaling & Minimum Width Clamping**:
   - Scale panel from 6-gang to 8-gang (+£16 => £191.00); verify SVG dynamically adds switch positions and circuit label rows.
   - Test minimum width safety clamping: attempting to reduce width below minimum (180mm) automatically enforces the boundary rule with warning notices.
4. **Circuit Label Laser Engraving & Breaker Ratings**:
   - Customize individual circuit switches (e.g. `RADAR SCANNER` at 15A, `AUTOHELM` at 20A).
   - Verify SVG laser-engraved circuit labels and amperage text elements reflect custom configurations instantly.
5. **Readiness Packaging Tiers & Cutout Toggles**:
   - Toggle auxiliary cutouts (Voltmeter -£8, 12V marine socket cutout +£6), validating SVG rendering updates.
   - Transition through readiness tiers: *Faceplate Only* (£79.00), *DIY Assembly Kit* (£155.00), and *Assembled & Bench-Tested* (£210.00).
6. **Cloud Save & SVG CAD Export Download**:
   - Trigger cloud CAD state save, asserting success feedback badge.
   - Trigger SVG download and verify generated file nomenclature (`ajw_marine_switch_panel_8gang_...svg`).
7. **Direct Workshop Cart Dispatch**:
   - Add custom configured switch panel directly into the workshop cart (`£210.00`).
   - Verify cart drawer opens with custom switch panel line item, specification dimensions, and correct pricing.
8. **Specification Review Modal & Quote Request Flow**:
   - Open technical specification review modal, validating gang count, circuit listings (`RADAR SCANNER (15A)`, `AUTOHELM (20A)`), and price summary.
   - Proceed into Diagnostic Booking & Quote modal with pre-attached CAD configuration banner and pre-selected `custom_panel` service type.
   - Submit quotation request with vessel contact details, verifying generated booking confirmation reference (`AJW-2026-*`).

---

### Journey 10: Weathered Switchboard Photo Replica Quoter (UJ-08)
- **Test File:** [`tests/switchboard-photo-replica.spec.ts`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/tests/switchboard-photo-replica.spec.ts)
- **Page Objects Used:** `NavigationPage`, `ReplicaPanelUploaderPage`, `AuthModalPage`, `AdminDashboardPage`
- **Target Personas:** `guest`, `client`, `admin`

#### Scenarios Verified:
1. **Route Navigation & Cloud Storage Presence**:
   - Access `/replica` via desktop navigation bar and mobile drawer.
   - Assert `ReplicaPanelUploader` layout, cloud storage enabled badge, and turnaround commitment (3–5 Days Turnaround).
2. **Solent Classic Yacht Presets Autocompletion**:
   - Apply Westerly Konsort 29 template: auto-populates make (`Westerly`), model (`Konsort 29`), dimensions (`195mm x 140mm`), 8 switches, and acrylic black.
   - Apply Sadler 32 template: updates to Sadler 32 (`220mm x 150mm`), 10 switches, and solid marine teak.
3. **Dynamic Real-Time Estimation & Material Surcharges**:
   - Verify pure calculation engine `calculateReplicaPanelQuote` evaluates live:
     - Sadler 32 with 10 switches & Teak: £25 digitizing labor + £35 laser cut base + £25 teak surcharge + £80 switches hardware = **£165.00** total.
     - Surcharge badge `+£25.00 Teak Surcharge` dynamically appears.
     - Switching to Matte Black Acrylic removes surcharge, scaling 10 switches to **£140.00**.
     - Scaling switch count (6 switches => **£108.00**, 8 switches => **£124.00**).
4. **Photo Management, Lightbox & Cloud Upload**:
   - Inspect existing reference sample photo in `ImageLightboxModal` (title, cloud asset metadata, zoom controls), then dismiss.
   - Delete reference sample photo and verify photo card removal.
   - Upload new weathered switchboard damage photo with simulated PNG file payload.
   - Assert progress indicator, local/cloud storage persistence, and new photo entry rendering in the grid.
5. **Inquiry Submission & Seamless Vessel Portal Transition**:
   - Input specific boat requirements and mounting hole constraints in notes.
   - Submit inquiry via `Send Replica Panel Inquiry`.
   - Verify seamless transition to Vessel Portal (`ClientVesselPortal`).
   - Verify the new quote is listed with service category `Replica Replacement Switchboard`, status `Quote Requested`, reference (`AJW-REP-*`), and attached switchboard photos.
6. **Master Workshop Admin Inspection**:
   - Authenticate as Anthony Wrather (Admin) via AuthModal.
   - Access Master Workshop Operations Dashboard (`/admin`).
   - Audit operational metrics and verify newly submitted Westerly Konsort replica job is present in the workshop queue.

---

### Journey 11: Boat Owner Vessel Portal & Certificate PDF Export (UJ-09)
- **Test File:** [`tests/vessel-portal-pdf.spec.ts`](file:///Users/anthonywrather/Documents/Projects/ajwmes/ajwmes/tests/vessel-portal-pdf.spec.ts)
- **Page Objects Used:** `NavigationPage`, `AuthModalPage`, `VesselPortalPage`, `StorePage`
- **Target Personas:** `client` (`d.mercer@solent-sail.co.uk`), `admin`

#### Scenarios Verified:
1. **Client Authentication & Vessel Portal Access**:
   - Authenticate as registered Boat Owner client (David Mercer) via AuthModal quick-persona chip.
   - Assert user badge reflects client identity and navigate directly to `/portal` via responsive navigation.
   - Verify active primary vessel (`Windbird III`, Moody 33) renders with technical specs and owner UUID.
2. **Multi-Vessel Switching & Spec Isolation**:
   - Switch between multiple owned vessels in dropdown (`Solent Skiff` catamaran tender vs `Windbird III` cruising yacht).
   - Assert specifications dynamically update and maintain isolation across vessels.
3. **Sub-Tab Navigation (Specs, Jobs & Activity, Postal Orders)**:
   - Navigate to Jobs & Activity sub-tab: verify past rewire jobs (`AJW-2026-088`), diagnostic hours, and total costs.
   - Navigate to Postal Orders sub-tab: verify workshop postal consignments (`AJW-POST-2845`) and real-time carrier status.
   - Return seamlessly to Technical Specs & PDF sub-tab.
4. **Live Specification Category Navigation & Optimistic Editing**:
   - Inspect DC Batteries & Charging category (200Ah LiFePO4, SmartSolar MPPT, Orion DC-DC).
   - Inspect 230V AC Shore Power & Cathodic Galvanic Isolation category.
   - Enter edit mode under Overview category: update beam (`3.55m`) and draft (`1.48m`), save specs, and verify persistence.
5. **Electrical History Audit Log Creation**:
   - Record a new chronological maintenance entry (Victron SmartSolar MPPT 100/30 replacement with 40A MIDI fuse).
   - Verify immediate rendering in timeline with itemized parts chips (`16mm² Oceanflex Cable`).
6. **Additional Boat Portfolio Registration**:
   - Register a third vessel (`Solent Osprey`, Sadler 34) with build year, battery chemistry, marina, and berth.
   - Verify instant activation in portal and switcher dropdown.
7. **On-Board Print Station (PDF) Configuration & Interactive Preview**:
   - Open On-Board Technical Print Station modal.
   - Toggle layout modes (*Single-Page Chart Table Summary* vs *Multi-Page Comprehensive Dossier*).
   - Toggle color themes (*Solent Admiralty Navy* vs *High-Contrast Monochrome Ink Saver*).
   - Set custom skipper note and verify real-time interactive preview canvas (`WINDBIRD III`, `12V DC SYSTEM`, emergency isolation notices).
8. **Client-Side jsPDF Generation & Direct Print Routines**:
   - Trigger client-side jsPDF download, verifying blob creation without server round-trips.
   - Trigger direct print routine and dismiss modal cleanly.
9. **Unregistered Boat Owner Onboarding State & Store Fallback**:
   - Sign off and register a brand new boat owner account without vessels.
   - Verify landing on Vessel Portal displaying empty state card ("No Vessel Registered Yet").
   - Click "Order Parts from Workshop" button and confirm seamless store redirection.

---

## 2. Future User Journeys Requiring Test Coverage

The following table identifies the operational workflows across AJWMES and their automation status:

| Journey ID | Journey Title | Target Route | Primary Persona | Business Impact | Test Complexity | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **UJ-04** | **Solent Field Technician Diagnostics & Sign-off** | `/technician` | `technician`, `admin` | **Critical (P0)** | High (Canvas, Timer, Offline) | **Done (Automated)** |
| **UJ-05** | **Postal Workshop Order Fulfillment & Dispatch** | `/postal` | `postal`, `admin` | **High (P0)** | Medium (Queue, Cable cutting, Packing slip) | **Done (Automated)** |
| **UJ-06** | **Postal Consignment Timeline Tracker** | `/tracker` | `guest`, `client` | **Medium (P1)** | Low-Medium (Carrier links, Search) | **Done (Automated)** |
| **UJ-10** | **Master Workshop Administration, Expenses & Restock** | `/admin` | `admin` | **High (P1)** | Medium-High (Financial rollups, POs) | **Done (Automated)** |
| **UJ-07** | **Custom Switch Panel CAD Configurator** | `/designer` | `guest`, `client`, `admin` | **High (P1)** | High (Grid CAD, BOM pricing, Surcharges) | **Done (Automated)** |
| **UJ-08** | **Weathered Switchboard Photo Replica Quoter** | `/replica` | `guest`, `client`, `admin` | **Medium (P2)** | Medium (Image upload, Dimensions) | **Done (Automated)** |
| **UJ-09** | **Boat Owner Vessel Portal & Certificate PDF Export** | `/portal` | `client`, `admin` | **High (P1)** | Medium (jsPDF verification, Specs) | **Done (Automated)** |
| **UJ-11** | **Offline Pontoon Resilience & Mutation Queue Replay** | Any / `/technician` | `technician` | **Critical (P0)** | High (IndexedDB, Service Worker) | **Done (Automated)** |

---

## 3. Prioritized QA Automation Roadmap

```mermaid
gantt
    title AJWMES QA Automation Implementation Roadmap
    dateFormat  YYYY-MM-DD
    section Phase 1 (Core Operations)
    Technician Diagnostic & Sign-off Flow (UJ-04) :done, 2026-10-16, 1d
    Postal Workshop Order Fulfillment (UJ-05)     :done, 2026-10-16, 1d
    Workshop Admin, Expenses & Restock (UJ-10)    :done, 2026-10-17, 1d
    section Phase 2 (Customer Experience)
    Consignment Tracker Timeline (UJ-06)          :done, 2026-10-17, 1d
    Custom Switch Panel CAD Designer (UJ-07)      :done, 2026-10-18, 1d
    Photo Replica Quoter (UJ-08)                  :done, 2026-10-18, 1d
    Vessel Portal & PDF Certificate Export (UJ-09):done, 2026-10-20, 1d
    section Phase 3 (Admin & Resilience)
    Offline Pontoon Resilience & Mutation Sync (UJ-11):done, 2026-10-17, 1d
```

---

## 4. Recommended Next User Journey & Operational Enhancements

All 8 primary core user journeys across AJWMES are now 100% automated with end-to-end browser specifications and unit test suites. Recommended candidate extensions include:

### Future Candidate: **Technician-to-Client Pontoon Job Discussion & Live Photo Synchronization (UJ-12)**
- **Target Routes:** `/technician` ↔ `/portal`
- **Target Personas:** `technician` (`jack.tech@ajwmes.co.uk`) ↔ `client` (`d.mercer@solent-sail.co.uk`)
- **Focus:** Real-time bi-directional chat threads, quote approvals, deposit checkout, and diagnostic photo attachments shared between the pontoon technician and boat owner.

