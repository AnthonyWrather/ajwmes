# Role Manual: Postal Workshop Fulfillment

The **Postal** role manages mail-in alternator repairs, component rebuilding, ShipStation carrier quoting, and parcel dispatch.

---

## Key Workflows

### 1. Workshop Consignment Intake & Inspection
- **Route:** `/#postal` (`Postal Dispatch` tab)
- **Objective:** Receive customer packages, record visual condition, and verify order manifests.
- **Procedures:**
  1. Select or scan incoming consignment from the intake bench queue.
  2. Log unboxing photos and verify serial numbers against the order manifest.

### 2. Live Carrier Quoting & 4x6" Thermal Shipping Labels
- **Objective:** Dimension parcels and produce courier labels.
- **Procedures:**
  1. Place packaged assembly onto the bench scale and record weight (kg) and box dimensions.
  2. Query ShipStation API for live Royal Mail Tracked 24 and DPD Express shipping rates.
  3. Click **Generate Thermal Label** to render standard 4x6" SVG shipping labels with Royal Mail 2D matrix barcode and packing slip.
  4. Click **Mark Dispatched** to trigger automated transactional notification emails with tracking links to the client.
- **Postal Standard Tip:** Set thermal label printers to 203 DPI (8 dots/mm) for crisp, scannable courier barcodes.
