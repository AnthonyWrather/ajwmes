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

### Generating, Processing & Publishing Training Videos

Producing and publishing training videos is a **3-step workflow**:

```bash
# Step 1: Record all training videos sequentially in 1080p
npm run record:manuals

# Step 2: Post-process recordings, copy to /public/videos/, and generate WebVTT captions
npm run process:videos

# Step 3: Stage and commit the web-ready assets to Git for CI/CD deployment
git add public/videos/ .gitignore
git commit -m "feat(manuals): update 1080p role training video captures and captions"
git push origin <branch>
```

---

### CI/CD Deployment & Why Videos Must Be Committed to Git

1. **Automated Firebase Hosting Pipeline**:
   - The production site is deployed automatically by GitHub Actions ([`.github/workflows/firebase-hosting-merge.yml`](../../.github/workflows/firebase-hosting-merge.yml)) when changes are pushed or merged to `main`.
2. **Recording is Excluded from CI**:
   - Automated 1080p browser recording (`npm run record:manuals`) is computationally intensive and is deliberately **not** executed inside GitHub Actions runners.
3. **Vite Serves Production Assets from `/public/`**:
   - During `npm run build`, Vite copies everything inside `public/` into the production `dist/` directory deployed to Firebase Hosting.
   - For the training videos to be accessible to boat owners, technicians, and workshop staff on the live domain, the processed files in `public/videos/` must be committed and pushed to GitHub.

---

### Directory & Asset Structure

| Directory | Purpose | Git Status |
| :--- | :--- | :--- |
| `tests/training/` | Playwright test specs (`role-training-videos.spec.ts`) | Tracked in Git |
| `test-results/` | Temporary Playwright raw browser screen recordings | Ignored (`.gitignore`) |
| `/videos/raw/` | Local backup of raw uncompressed `.webm` files | Ignored (`.gitignore`) |
| `public/videos/` | Final optimized `.webm` clips and `.vtt` caption tracks | **Tracked in Git** |

> [!IMPORTANT]
> The root `.gitignore` file explicitly tracks `!public/videos/` while ignoring local staging directories (`/videos/` and `test-results/`). If new video assets do not appear in `git status`, verify that `.gitignore` maintains the root slash prefix `/videos/` rather than a blanket `videos/`.

---

### Graceful Fallback State: "Playwright Training Vignette"

When accessing the Help Center modal ([`HelpCenterModal.tsx`](../../src/components/common/HelpCenterModal.tsx)), the HTML5 `<video>` element monitors asset availability via `onError`:

- **Active State**: If the corresponding video exists in `/public/videos/`, it automatically plays in high-contrast marine slate with full media controls and synchronized WebVTT captions.
- **Fallback Card (`data-testid="video-fallback-banner"`)**: If a chapter's video is offline, pending generation, or hasn't yet been copied to `public/videos/`, the UI renders a graceful fallback placeholder:
  > **Playwright Training Vignette**  
  > *Full 1080p demonstration video is queued for background streaming or will generate upon running `npm run record:manuals`.*

Running `npm run record:manuals` followed by `npm run process:videos` immediately replaces the fallback with the live interactive video player.

---

### Troubleshooting

- **Playwright Browser Missing**: If `npm run record:manuals` reports missing browser executables, install the Chromium binary with:
  ```bash
  npx playwright install chromium
  ```
- **Port Contention**: The recording config (`playwright.training.config.ts`) expects the local dev server on port `5173`. Playwright will launch Vite automatically if nothing is running on that port.
