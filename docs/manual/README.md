# AJW Marine Electrical Services — Role Manual Hub & Video Training Guides

Welcome to the **AJWMES Role-Based Operations Manual**.

This documentation suite covers operational standards, step-by-step procedures, electrical safety protocols, and automated Playwright video training guides for all **6 system roles** across the Solent marine basin.

---

## Role Manual Index

| Role | Operational Scope | Manual Link | Video Vignette |
| :--- | :--- | :--- | :--- |
| **`guest`** | Public Storefront, Switch Panel CAD, Photo Replicas, Tracking | [`01-guest-portal.md`](01-guest-portal.md) | `guest-cad-configurator.webm` |
| **`client`** | Boat Owner Portal, Battery Chemistry, Job Approvals, jsPDF Export | [`02-boat-owner-client.md`](02-boat-owner-client.md) | `client-vessel-management.webm` |
| **`technician`** | Pontoon Workstation, £25/hr Stopwatch, Offline Faraday Queue | [`03-pontoon-technician.md`](03-pontoon-technician.md) | `tech-diagnostic-workstation.webm` |
| **`postal`** | Consignment Intake, ShipStation Carrier Rates, 4x6" Labels | [`04-postal-fulfillment.md`](04-postal-fulfillment.md) | `postal-fulfillment-dispatch.webm` |
| **`admin`** | Master Workshop, Financial Rollups, Expenses, Laser Cut Studio | [`05-workshop-admin.md`](05-workshop-admin.md) | `admin-workshop-financials.webm` |
| **`site`** | Multi-Environment Deployments, Cloud Gateways, User RBAC | [`06-platform-site-admin.md`](06-platform-site-admin.md) | `site-environment-admin.webm` |

---

## Playwright Automated Training Video Engine

All demonstration clips are programmatically produced using Playwright in high-definition (1080p, 60fps) with:
1. **Amber Virtual Cursor**: Visual cursor trails and pulsating click ripples.
2. **Lower-Third HUD Banners**: Real-time chapter titles, step numbering, and instructions.
3. **Synchronized WebVTT Captions**: Standard `.vtt` subtitles for noise-tolerant marina environments.

### Generating / Updating Training Videos
```bash
# Record all training videos sequentially in 1080p
npm run record:manuals

# Post-process recordings, copy to /public/videos/ and generate caption tracks
npm run process:videos
```
