# Streamlined Account Creation & Vessel Portal Onboarding

Restructure the Sign In modal by converting the "Register Vessel" tab into a streamlined "Create Account" screen (focused on user credentials and optional contact info), decoupling vessel registration to the dedicated Vessel Portal, and automatically routing newly registered users to add their vessel specifications.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following design decisions were confirmed via Phase 1 clarification:
> - **Post-Registration Destination**: After creating an account, users are automatically authenticated and directed straight to the **Vessel Portal** so they can register their vessel details and manage electrical specs in their dedicated workspace.
> - **Streamlined Account Creation Fields**: The new Create Account form strictly includes **Full Name**, **Email Address**, **Password**, **Confirm Password**, and an optional **Mobile / VHF Contact** number (for SMS booking and dispatch notifications). All vessel-specific inputs (**Vessel Name**, **Vessel Type / Make**, and **Home Marina / Mooring**) are removed from the authentication modal.
> - **Seamless Sign In to Create Account Flow**: When a user attempts to sign in with an unregistered email, the modal smoothly switches to the "Create Account" tab with their email prefilled, password preserved (if valid), and an informative banner guiding them to complete their quick account registration.

- **Confirmed Decision 1**: Rename "Register Vessel" tab and button to "Create Account" across the navigation, authentication modal, and links.
- **Confirmed Decision 2**: Remove all vessel input fields (`regVesselName`, `regVesselType`, `regMarina`) from `SignInModal.tsx`.
- **Confirmed Decision 3**: Refactor `src/lib/auth.ts` registration helper to `registerUserAccount` (aliasing `registerVesselAccount` for backward compatibility) and initialize default profile fields cleanly.
- **Confirmed Decision 4**: In `App.tsx` and `SignInModal.tsx`, on successful account creation, set the active tab to `'portal'` and trigger the "Add Vessel" workflow if no boat exists yet.

---

## 1. Overview & Core Concept

- **What It Does**:
  - Decouples user account creation from boat registration.
  - Simplifies the authentication modal so visitors can quickly create an account with just their name, email, password, and mobile number.
  - Directs newly registered users directly to the dedicated **Vessel Portal** (`ClientVesselPortal.tsx`) where they can register one or multiple vessels, record battery bank and voltage specs, track diagnostic jobs, and view PDF certificates.
- **Target Audience / Persona**: Boat owners, marine contractors, and Solent sailors signing in or registering with AJW Marine Electrical Services.
- **Key Value**: Drastically reduces registration friction, eliminates redundant duplicate boat registration forms, and establishes a single source of truth for vessel data management in the Vessel Portal.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Direct Account Creation**:
   - User clicks **Sign In** in the top navigation bar.
   - User switches to the **Create Account** tab (or clicks "Create new account →" from the Sign In tab).
   - Form presents 4 clean sections: Full Name, Email Address, Password (with toggleable visibility and strength requirement), and optional Mobile/VHF Contact.
   - User submits form $\rightarrow$ instant feedback message ("Account created for [Name]! Opening Vessel Portal...") $\rightarrow$ automatic sign-in $\rightarrow$ navigation switches to Vessel Portal with an onboarding prompt to register their vessel.

2. **Unregistered Email Redirection Flow**:
   - User enters `newcaptain@solent.co.uk` on the Sign In tab and clicks Sign In.
   - System identifies unregistered email $\rightarrow$ switches active tab to **Create Account** with email transferred into the email field and an informative notification: *"No account found for 'newcaptain@solent.co.uk'. Fill in your name and password below to create your account in 30 seconds."*

3. **Vessel Portal First-Time Experience**:
   - The user arrives in the Vessel Portal as an authenticated client.
   - Because they have no registered vessel yet, the Vessel Portal displays an empty state hero: *"Welcome to your Vessel Portal, [Name]. Register your boat to record 12V/24V electrical specs, request diagnostic bookings, and track jobs."* with a prominent **+ Register Your Vessel** action button that opens the boat registration modal.

### Visual Identity & Theme
- Marine dark slate background (`bg-slate-900`, `border-slate-800`), sky blue accents (`text-sky-400`, `bg-sky-600`), and warm amber highlights for role badges.
- Tab switcher uses standard clean segmented buttons: `[ Key Sign In ]` and `[ UserPlus Create Account ]` along with `[ Zap 1-Click Team Roles ]`.
- Anti-slop compliance: Unboxed metadata, zero decorative pulsing dots on static text, no pill-badge sandwiches, clear input focus rings (`focus:border-sky-500`).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Removal of Vessel Fields from Sign On Modal**:
  - *Chosen Approach*: Strip out `regVesselName`, `regVesselType`, and `regMarina` from `SignInModal.tsx`.
  - *Why*: The dedicated `ClientVesselPortal` already has a complete, multi-boat manager (`VesselSpecManager.tsx` and `AddBoatModal`) supporting multiple vessels, detailed battery types (LiFePO4, AGM, Gel), and system voltages (12V/24V). Having boat inputs in the signup modal was redundant and created confusion about where vessels are managed.
  - *Alternatives Considered*: Keeping vessel name optional in sign-in. Rejected because it blurs the boundary between user identity and vessel assets.
- **Decision 2: Backward Compatibility in `auth.ts`**:
  - *Chosen Approach*: Introduce `registerUserAccount(details)` while preserving `registerVesselAccount(details)` as an exported alias.
  - *Why*: Ensures existing unit tests, Playwright specs, or legacy imports remain 100% operational without breaking changes.
- **Decision 3: Post-Registration Navigation to Vessel Portal**:
  - *Chosen Approach*: On registration success, callback invokes `onSuccessSignIn(profile, { isNewAccount: true })` and `App.tsx` navigates to `setCurrentTab('portal')`.
  - *Why*: Directly satisfies the user's requirement: the user is immediately in the right place to add their vessel.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Sign In & Account Modal                         │
│                     (src/components/auth/SignInModal.tsx)              │
│                                                                        │
│   ┌─────────────────────┐   ┌──────────────────────┐   ┌────────────┐  │
│   │   Tab 1: Sign In    │   │Tab 2: Create Account │   │1-Click Role│  │
│   │ • Email & Password  │   │ • Full Name          │   │Quick Switch│  │
│   │ • Unregistered auto-│   │ • Email Address      │   └────────────┘  │
│   │   transfer to Tab 2 │   │ • Password & Confirm │                   │
│   └──────────┬──────────┘   │ • Mobile/VHF (opt)   │                   │
│              │              └──────────┬───────────┘                   │
└──────────────┼─────────────────────────┼───────────────────────────────┘
               │ (Authenticated)         │ (registerUserAccount)
               ▼                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     Auth Service (src/lib/auth.ts)                     │
│  • Registers user profile in Firestore (users/{uid}) & local storage   │
│  • Sets role to 'client' (or 'admin' for Anthony Wrather)              │
│  • Returns UserProfile                                                 │
└────────────────────────────────────────┬───────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│             App Orchestrator (src/App.tsx) Navigation Router           │
│  • Sets currentUserProfile & currentUserRole                           │
│  • Switches active tab: setCurrentTab('portal')                        │
└────────────────────────────────────────┬───────────────────────────────┘
                                         │
                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│              Dedicated Vessel Portal (ClientVesselPortal.tsx)          │
│  • If no vessels exist: Prompt user to "+ Register First Vessel"       │
│  • Handles full vessel specs (12V/24V, Lithium/AGM, Marina berth, etc) │
│  • Multi-vessel support and PDF technical export                       │
└────────────────────────────────────────────────────────────────────────┘
```

### Component & File Modifications

1. **`src/components/auth/SignInModal.tsx`**:
   - Change Tab 2 label and icon from `Register Vessel` (`Ship`) to `Create Account` (`UserPlus`).
   - Remove inputs for `regVesselName`, `regVesselType`, and `regMarina`.
   - Update submission handler to call `registerUserAccount` with `{ name, email, password, phone }`.
   - Update footer text / link on Tab 1 from `"Create boat account →"` to `"Create account →"`.
   - Update test-id attributes (`data-testid="tab-register"` / `data-testid="tab-create-account"` and input test IDs).
   - Pass an onboarding flag or trigger navigation to the Vessel Portal upon registration completion.

2. **`src/lib/auth.ts`**:
   - Add `registerUserAccount(details: { name: string; email: string; password?: string; phone?: string; })`.
   - Ensure clean default initialization of vessel fields (e.g. `vesselName: ''`, `vesselType: ''`, `marinaBerth: ''`, `vesselIds: []`).
   - Retain `registerVesselAccount` as an alias for complete backward compatibility.

3. **`src/App.tsx`**:
   - Update `handleSuccessSignIn` to accept optional `{ isNewRegistration?: boolean }` parameter.
   - When `isNewRegistration` is true, automatically navigate to `setCurrentTab('portal')`.

4. **`src/components/client/ClientVesselPortal.tsx`**:
   - Ensure empty-state banner when a newly registered user has no vessels yet is inviting, prominent, and has a direct 1-click button to open the Add Vessel modal.

5. **`tests/authentication.spec.ts` & `src/lib/auth.test.ts`**:
   - Add unit tests verifying `registerUserAccount` creates a valid client profile without requiring vessel details.
   - Update any E2E tests checking the register tab to verify the new "Create Account" tab and smooth registration-to-portal flow.

---

## Verification Plan

### Automated Test Suite
- Run `npm run lint` (`tsc --noEmit`) to verify 0 type errors.
- Run `npm run test:unit` (`tsx --test "src/**/*.test.ts"`) to verify all unit tests pass.
- Run `npm run build` to verify production Vite compilation and PWA service worker bundling.

### Manual & E2E Verification
- Open Sign In modal $\rightarrow$ click "Create Account" tab $\rightarrow$ verify only Name, Email, Password, Confirm Password, and Mobile number appear.
- Fill in new user details $\rightarrow$ click "Create Account & Open Vessel Portal" $\rightarrow$ verify account is created and user lands on the Vessel Portal with vessel registration prompt.
- Enter unregistered email on Sign In tab $\rightarrow$ submit $\rightarrow$ verify smooth transition to Create Account tab with email prefilled.
