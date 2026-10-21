# Role Manual: Platform Infrastructure & Site Administrator

The **Site** role maintains the cloud hosting environments, API integrations, and role-based access security for AJWMES.

---

## Key Workflows

### 1. Multi-Environment & Release Management
- **Objective:** Manage deployments across AI Studio Dev, Preview, and Production Live.
- **Procedures:**
  1. Access the **Platform & Environment Settings** modal from the user profile dropdown.
  2. Inspect detected runtime hosting and isolated browser storage prefixes (`ajwmes_aistudio_dev_*` vs `ajwmes_github_live_*`).
  3. Reset or reseed test fixtures with 1-click developer profiles without affecting live Firestore databases.

### 2. Cloud Function Gateway Diagnostics & Secrets
- **Objective:** Monitor server-side integrations (Resend, ShipStation, Stripe).
- **Procedures:**
  1. Verify Cloud Function health probes in `europe-west2`.
  2. Test simulated vs live Stripe payment gateway checkout modes.
  3. Audit registered user accounts, assign user roles (`guest`, `client`, `technician`, `postal`, `admin`, `site`), and verify RBAC route protection.
- **Security Rule:** Secret API keys (`RESEND_API_KEY`, `SHIPSTATION_API_KEY`, Stripe secret keys) reside strictly in Google Secret Manager; never store production secret keys in client-side storage.
