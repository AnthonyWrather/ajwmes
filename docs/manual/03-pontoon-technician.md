# Role Manual: Pontoon Field Technician

The **Technician** role operates on pontoons, boatyards, and offshore moorings across the Solent marine basin.

---

## Key Workflows

### 1. Pontoon Diagnostic Workstation & Stopwatch Billing
- **Route:** `/#technician` (`Tech Jobs` tab)
- **Objective:** Manage field work orders, bill labor transparently at £25/hour, and requisition parts.
- **Procedures:**
  1. Select the scheduled pontoon job from the field queue to view berth location, vessel specs, and reported fault symptoms.
  2. Click **Start Timer** upon stepping aboard the vessel. The system computes billable labor increments continuously.
  3. Requisition marine-grade tinned cables (16mm²–70mm²), busbars, and Victron battery protect modules from mobile van stock.
  4. Hand the tablet to the vessel owner to capture their customer sign-off signature directly onto the HTML5 touch canvas.
- **Marine Safety Tip:** Always verify bilge blower operation, master battery disconnect lockouts, and shore power galvanic isolators before completing handoff.

### 2. Faraday Blackout & Offline Synchronization
- **Objective:** Continue diagnosing inside steel and aluminum hulls without active 4G/WiFi.
- **Procedures:**
  1. The amber **Offline Pontoon Mode** indicator activates automatically when cellular data is lost.
  2. Continue logging stopwatch time, adding parts, and taking photos. All records are persisted to IndexedDB (`ajw_marine_field_db`).
  3. Upon walking to the marina head or re-entering signal range, mutations replay automatically to Cloud Firestore.
