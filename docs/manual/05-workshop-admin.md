# Role Manual: Master Workshop Administrator

The **Admin** role oversees workshop financial performance, inventory re-ordering, technician labor margins, and laser studio production.

---

## Key Workflows

### 1. Workshop Financial Rollups & Expense Management
- **Route:** `/#admin` (`Master Workshop` tab)
- **Objective:** Track gross workshop billings, technician hours, and expense classifications.
- **Procedures:**
  1. Review top-line revenue KPIs, active technician hours billed, and pending postal orders.
  2. Log supplier material receipts, classifying each line item as either **Billable Client Materials** or **Workshop Overhead**.
  3. Export structured snapshots for HMRC tax preparation and workshop profit/loss analysis.

### 2. Hardware Inventory & Zero-Stock Depletion Triggers
- **Objective:** Maintain parts stock levels and prevent field shortages.
- **Procedures:**
  1. Monitor live component counts across cables, breakers, relays, and solar charge controllers.
  2. When an item reaches 0 units, automated zero-stock alert emails are dispatched to suppliers with pre-filled re-order quantities.
  3. Review and approve client-submitted switch panel CAD vector toolpaths in the Laser Cut Studio before CNC acrylic cutting.
