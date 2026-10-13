# Main Navigation Responsive Refactor & Menu Clean-Up

Streamline the top navigation bar by removing the redundant "Services & Solent" link, ensuring the AJWMES brand logo serves as the primary Home navigation anchor, and resolving responsive wrapping glitches by transitioning cleanly to the drawer menu on tablets and narrow screens.

## User Review & Critical Decisions

> [!NOTE]
> **Implementation Complete**:
> - Removed redundant "Services & Solent" text links from both desktop and drawer menus.
> - Established AJWMES logo as the primary Home button with explicit tooltip and cursor affordance.
> - Switched breakpoint to `xl` (1280px) and enforced single-line `whitespace-nowrap shrink-0` to eliminate link wrapping and clipping.

---

## 1. Overview & Core Concept

- **What It Does**: Refactors `src/components/Navigation.tsx` to follow a robust single-row, three-zone Top Bar Contract. It eliminates horizontal link wrapping bugs, prevents item clipping on tablet/laptop viewports, and removes duplicate navigation entries.
- **Target Audience / Persona**: Boat owners, yacht skippers, field marine technicians, and workshop dispatch staff accessing AJWMES across smartphones, iPads/tablets, laptops, and wide workshop displays.
- **Key Value**: Guarantees that every navigation link remains completely accessible and fully operational on all screen sizes, with no awkward multi-line wrapping or hidden broken buttons.

---

## 2. User Experience & Visual Design

### Key User Flows
1. **Returning to Home**: User clicks the prominent AJWMES anchor-bolt logo at any time from any tab to return to the landing overview.
2. **Desktop Navigation (≥ 1280px)**: Clear single-line navigation bar containing:
   - Parts Store (with active indicator & basket counter badge)
   - Track Order (postal tracking)
   - Switch Panels & Replica Panels (panel design tools)
   - Vessel Portal (owner specs and diagnostic logs)
   - Role-specific actions (Tech Jobs, Postal Dispatch, Master Workshop for authenticated staff)
   - Basket button + User profile pill / Sign-in button
3. **Tablet & Mobile Navigation (< 1280px)**:
   - Clean, uncluttered header containing AJWMES logo, basket icon, user sign-in pill, and an accessible hamburger menu toggle.
   - Opening the drawer presents a beautifully organized, scrollable menu grid where every link has generous touch targets (≥ 44px) and clear status indicators.

### Visual Styling & Contract Compliance
- **Zero Wrapping**: All nav link buttons utilize `whitespace-nowrap shrink-0` and unified gap spacing (`gap-4` to `gap-5`).
- **Unified Branding**: Brand logo retains tooltip `title="AJWMES · AJW Marine Electrical Services"` and pointer cursor.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Breakpoint Transition at `xl` (1280px)**
  - *Chosen Approach*: Update desktop nav from `hidden md:flex` to `hidden xl:flex` and drawer toggle from `md:hidden` to `xl:hidden`.
  - *Why*: The AJWMES app features rich role-based navigation (guest, client, tech, postal, admin). When all permissions are loaded, the nav bar contains 6 to 9 items plus profile info. A 768px (`md`) or 1024px (`lg`) cutoff allows links to collide and wrap into the header's fixed height. Shifting to `xl` provides complete safety on iPads, tablets, and small laptops.
  - *Alternatives Considered*: Collapsing excess items into a "More..." popup menu was evaluated, but user confirmed direct transition to the mobile drawer is preferred and provides a cleaner, more consistent experience.

- **Decision 2: Removal of "Services & Solent"**
  - *Chosen Approach*: Remove the dedicated text button from both desktop nav and mobile drawer.
  - *Why*: Clicking the brand wordmark ("AJWMES") already navigates to the Home tab where services, pricing, and Solent coverage are featured directly. Removing the duplicate button frees valuable horizontal real estate.

---

## 4. Technical Architecture & Implementation Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Navigation Header (h-16)                        │
├───────────────────┬─────────────────────────────────┬──────────────────┤
│   Zone 1: Brand   │    Zone 2: Navigation Links     │  Zone 3: Actions │
│  (Always Visible) │    (xl:flex / xl:hidden)        │ (Always Visible) │
│                   │                                 │                  │
│ [Anchor] AJWMES   │ [Desktop ≥ 1280px]              │ [Cart]           │
│ (onClick -> Home) │ • Parts Store                   │ [User / Sign In] │
│                   │ • Track Order                   │ [Hamburger Icon] │
│                   │ • Switch Panels                 │  (< 1280px only) │
│                   │ • Replica Panels                │                  │
│                   │ • Vessel Portal                 │                  │
│                   │ • Role Station (Tech/Post/Admin)│                  │
└───────────────────┴─────────────────────────────────┴──────────────────┘
                                │ (< 1280px toggle open)
                                ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Mobile Drawer (< 1280px)                        │
│ • User Account Card & Role Badge                                       │
│ • Grid Links: Parts Store, Track Order, Switch Panels, Replica, Portal │
│ • Role Stations (Technician Jobs, Postal Dispatch, Master Workshop)    │
└────────────────────────────────────────────────────────────────────────┘
```

### Planned File Modifications
- `src/components/Navigation.tsx`:
  - Remove "Services & Solent" button from desktop nav (lines 95–100).
  - Remove "Services & Solent" button from mobile drawer (lines 439–444).
  - Change desktop nav display from `hidden md:flex` to `hidden xl:flex`.
  - Add `whitespace-nowrap shrink-0` across all horizontal nav link buttons.
  - Change mobile drawer toggle button from `md:hidden` to `xl:hidden`.
  - Change mobile drawer container from `md:hidden` to `xl:hidden`.
  - Add smooth transition and backdrop touch dismiss to the mobile drawer.
