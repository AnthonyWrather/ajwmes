# Multi-Vessel Identity & Scoped Activity Architecture

A unified UUID-based identity model enabling users to manage multiple boats, link jobs and postal orders to specific boats or direct user accounts, and strictly isolate user portal records.

## User Review & Critical Decisions

> [!IMPORTANT]
> **Key Architecture Decisions for Review:**
> - **UUID User Identity**: Every user profile receives a persistent, unique UUID (`userId`), synchronized across Firebase Auth, local accounts, and session profiles.
> - **Multi-Boat Support**: Users can register zero, one, or multiple vessels (`VesselRecord`). A clean boat switcher in the portal allows filtering activity by boat or viewing the consolidated fleet.
> - **Order Association Flexibility**: Postal orders and diagnostic jobs store `userId` and an optional `vesselId`. Users without boats can seamlessly place and track orders with standard delivery.
> - **Strict Isolation**: Eliminates hardcoded filters (such as `clientEmail.includes('mercer')` and `jobs.slice(0, 2)` fallbacks) so Boat Owners see only their own jobs and postal orders.

---

## 1. Overview & Core Concept

- **What It Does**: Upgrades AJW Marine's user architecture from a flat single-vessel model to a relational UUID model. Each user has a unique ID, can own multiple boats (or zero boats), and can associate service jobs and postal parts orders to either a specific boat or their direct account.
- **Target Audience**: Boat owners with one or multiple yachts/cruisers, marine DIYers without vessels ordering workshop supplies, and Gosport workshop technicians/dispatchers managing jobs and deliveries.
- **Key Value**: Guarantees total data privacy and isolation in the Boat Owner Vessel Portal while enabling fleet management and seamless checkout for boatless customers.

---

## 2. User Experience & Visual Design

- **Vessel Selector & Fleet Header**:
  - In the Vessel Portal header, a segmented dropdown/switcher allows the owner to toggle between registered vessels (e.g., *Windbird III*, *Solent Skiff*) or select "All Vessels (Fleet View)".
  - An "Add Another Vessel" action opens an inline modal to register additional boats with custom electrical specs.
  - For users with zero registered boats, the header displays an informative zero-vessel banner with quick actions: "Register a Vessel" or "Order Marine Cables & Hardware".
- **Jobs & Activity Feed Tab**:
  - Displays exclusively jobs matching the signed-in user's `userId` (with fallback to verified email).
  - When a specific vessel is selected, jobs filter to that vessel; in Fleet View, jobs show a subtle vessel badge.
  - Zero-job state: Displays an invitation to book diagnostic services or request a switchboard quote, with zero leakage of other users' jobs.
- **Postal Orders Tab**:
  - Displays exclusively postal orders matching the signed-in user's `userId` (or customer email).
  - Highlights whether an order was placed for a specific boat (marina pontoon delivery) or as a personal home order.
  - Zero-order state: Displays a direct shortcut to the online parts catalog.
- **Checkout Experience**:
  - During checkout in the online store, logged-in users can choose:
    - *Associate with a vessel*: Auto-populates marina berth and delivery notes from their registered boats.
    - *No vessel (Direct delivery)*: Enters standard residential/commercial postal delivery.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Relational Linkage via `userId` and optional `vesselId`**
  - *Chosen Approach*: Every `JobRecord` and `PostalOrder` stores mandatory `userId` and optional `vesselId`. Legacy records without `userId` are automatically linked during data bootstrap by matching client/customer email to known UUIDs.
  - *Why*: Supports users with zero boats while allowing rich vessel-specific maintenance logs and expense histories.
  - *Alternatives Considered*: Subcollections under vessels (would make boatless orders impossible and prevent multi-boat consolidated billing).
- **Decision 2: Migration & Backward Compatibility**
  - *Chosen Approach*: Seed data and existing local storage will be automatically migrated to assign deterministic UUIDs to test accounts (`usr-mercer-uuid`, `usr-jenkins-uuid`, `usr-bennett-uuid`, etc.), and existing jobs/orders are backfilled with appropriate `userId` and `vesselId` references.
  - *Why*: Prevents breaking existing demo sessions or wiping offline environment storage.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                      UserProfile (UUID)                     │
│               userId: "usr-8a21-99c0-..."                   │
└──────────────┬──────────────────────────────┬───────────────┘
               │ 1:N                          │ 1:N
               ▼                              │
┌──────────────────────────────┐              │
│      VesselRecord (UUID)     │              │
│  id: "ves-b421-..."          │              │
│  userId: "usr-8a21-..."      │              │
│  vesselName: "Windbird III"  │              │
└──────────────┬───────────────┘              │
               │ 1:N (Optional)               │
               ▼                              ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│          JobRecord           │ │         PostalOrder          │
│  id: "job-101"               │ │  id: "ord-103"               │
│  userId: "usr-8a21-..."      │ │  userId: "usr-8a21-..."      │
│  vesselId: "ves-b421-..."    │ │  vesselId?: "ves-b421-..."   │
│  serviceCategory: "lithium"  │ │  items: [cable, fuses]       │
└──────────────────────────────┘ └──────────────────────────────┘
```

### Data Model Additions & Updates

1. **`VesselRecord` Interface & Store**:
   - `id`: string (UUID)
   - `userId`: string (owner's UUID)
   - `vesselName`: string
   - `makeModel`: string
   - `year`: number
   - `systemVoltage`: '12V' | '24V'
   - `homeMarina`: string
   - `berthPontoon`: string
   - `houseBatteryType`: string
   - `houseCapacityAh`: number
   - `createdAt`: string
2. **`JobRecord` Updates**:
   - Add `userId`: string
   - Add `vesselId?`: string
3. **`PostalOrder` Updates**:
   - Add `userId?`: string
   - Add `vesselId?`: string
4. **`UserProfile` Updates**:
   - Ensure `id` / `uid` represents a persistent UUID
   - Support `vesselIds?: string[]` or query vessels by `userId`
5. **`firebase-blueprint.json` & `firestore.rules`**:
   - Add `userId` and `vesselId` optional properties to `Job`, `PostalOrder`, and `VesselSpec` entities.

### Interactive Component & State Mapping

- **`ClientVesselPortal.tsx`**:
  - Filter jobs: `jobs.filter(j => (j.userId && j.userId === currentUser.id) || j.clientEmail.toLowerCase() === clientEmail.toLowerCase())`
  - Filter postal orders: `postalOrders.filter(o => (o.userId && o.userId === currentUser.id) || o.customerEmail.toLowerCase() === clientEmail.toLowerCase())`
  - When active vessel is selected, optionally refine by `vesselId`.
- **`StoreFront.tsx` Checkout**:
  - Auto-assign current `userId` to created postal orders; if user has vessels, provide a quick selector to attach order to a boat.
- **`BookingQuoteModal.tsx`**:
  - Attaches current `userId` and selected `vesselId` to submitted diagnostic and switchboard quotes.
