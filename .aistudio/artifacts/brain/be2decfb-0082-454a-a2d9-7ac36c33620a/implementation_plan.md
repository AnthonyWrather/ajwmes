# Mobile Navigation Profile Display & E2E Test Stabilization

Fixes the Mobile Chrome and Mobile Safari Playwright test failures by making the authenticated user profile name element visible across all screen sizes with responsive truncation, preserving top navigation layout integrity on compact mobile devices.

### User Review & Critical Decisions

> [!IMPORTANT]
> The following design decisions were confirmed:
> - **Navbar Presentation**: Display the authenticated user profile name directly in the top navigation bar across all screen viewports (including `< 640px`).
> - **Space Management**: Apply responsive truncation (`max-w-[65px] xs:max-w-[90px] sm:max-w-[120px]`) alongside compact badge padding so mobile actions (cart, booking button, hamburger menu) remain properly aligned without overflow.

---

### 1. Overview & Core Concept

- **Fault Analysis**: `tests/authentication.spec.ts` executes `await expect(page.getByTestId('user-profile-name')).toBeVisible()` after signing in. In `src/components/Navigation.tsx`, `data-testid="user-profile-name"` is housed inside `<div className="hidden sm:flex flex-col text-left leading-none">`. On Mobile Chrome (Pixel 5, 393px) and Mobile Safari (iPhone 12, 390px), the `hidden` class causes `display: none`, triggering a 10-second assertion timeout.
- **Solution**: Replace the `hidden sm:flex` hiding rule with an adaptive flex container (`flex flex-col text-left leading-none min-w-0 max-w-[65px] xs:max-w-[90px] sm:max-w-[120px]`) so that the name is visible on mobile viewports while preventing horizontal overflow.

---

### 2. User Experience & Visual Design

#### Key User Flows
1. **User Authentication (Mobile & Desktop)**:
   - User clicks `nav-signin-button` in navigation bar.
   - User inputs credentials (`anthonywrather@gmail.com` / `ajwmes2026`) and submits.
   - Modal closes, routing the user to the admin operations dashboard.
   - The top navigation bar updates immediately to display the user avatar and `user-profile-name`.
2. **Mobile Viewport Optimization**:
   - On screens $\le 390\text{px}$, the profile name renders in 11px bold text with graceful text truncation (`truncate`).
   - The role label renders in 9px muted monospace below the name.
   - Booking button (`Book (£25/hr)`), cart icon, and hamburger menu maintain standard touch targets ($\ge 40\text{px}$) without horizontal wrapping.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Persistent Navbar Profile Pill vs. Drawer-Only Name**:
  - *Chosen Approach*: Show compact profile name directly in the persistent top bar across all viewports.
  - *Why*: Satisfies E2E assertion expectations, provides immediate confirmation of signed-in identity without requiring drawer toggle, and maintains consistency between mobile and desktop.
- **Decision 2: Responsive Max-Width Clamping**:
  - *Chosen Approach*: Clamp name width between 65px and 120px depending on screen width.
  - *Why*: Avoids pushing out the logo or actions on narrow devices (e.g. 360px Android devices).

---

### 4. Technical Architecture & Component Layout

```
┌────────────────────────────────────────────────────────────────────────┐
│               Top Navigation Bar (Mobile & Desktop View)               │
└────────────────────────────────────────────────────────────────────────┘

  [Zone 1: Brand]             [Zone 2: Desktop Nav]     [Zone 3: Controls]
  ┌───────────────┐           ┌───────────────────┐     ┌──────────────────────────────────────────────┐
  │  AJW Marine   │           │ Parts Store       │     │ [Cart] [User Account Badge] [Book] [Menu ☰] │
  │  Electrical   │           │ Track Order       │     └──────────────────────┬───────────────────────┘
  └───────────────┘           │ (Hidden on <1280) │                            │
                              └───────────────────┘                            ▼
                                                        ┌──────────────────────────────────────────────┐
                                                        │ User Account Badge (data-testid)             │
                                                        │ ┌──────────┐ ┌─────────────────────────────┐ │
                                                        │ │  Avatar  │ │ user-profile-name (Visible) │ │
                                                        │ │  (28px)  │ │ Role tag (admin/client)     │ │
                                                        │ └──────────┘ └─────────────────────────────┘ │
                                                        └──────────────────────────────────────────────┘
```

#### Files to Modify
- **`src/components/Navigation.tsx`**: Update the user account badge wrapper from `hidden sm:flex` to an always-visible responsive container (`flex flex-col text-left leading-none min-w-0 max-w-[65px] xs:max-w-[90px] sm:max-w-[120px]`). Ensure touch padding and child truncation work smoothly across mobile and tablet viewports.
