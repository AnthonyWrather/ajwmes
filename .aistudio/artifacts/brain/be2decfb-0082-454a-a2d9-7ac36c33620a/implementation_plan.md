# GitHub Commit-Linked Versioning & Release Manager Integration

Automate application versioning by injecting Git commit metadata at build time, displaying SemVer tags with short commit hashes (e.g. `v1.2.0-8ba2ee3`) in the header, and establishing direct GitHub commit links and metadata inside the Multi-Environment & Release Manager.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following decisions were confirmed via Phase 1 clarification:
> - **Version Format**: Semantic versioning combined with the Git short commit hash (e.g., `v1.2.0-8ba2ee3`).
> - **GitHub Repository**: `anthonywrather/ajwmes` used as the canonical target for commit URLs (`https://github.com/anthonywrather/ajwmes/commit/<sha>`).
> - **Multi-Environment & Release Manager Details**: Prominently features the short commit SHA badge with 1-click copy, commit message display, and direct GitHub links to inspect the commit and diff.

- **Confirmed Decision 1**: Update `src/version.ts` and `vite.config.ts` to dynamically resolve commit SHA, commit message, branch name, and repository URL from CI environment variables (`GITHUB_SHA`, `VITE_GIT_COMMIT_SHA`) with seamless local Git CLI / container fallbacks.
- **Confirmed Decision 2**: Display the combined version badge `v1.2.0-8ba2ee3` in the navigation header with interactive feedback and a direct tooltip linking to the environment manager.
- **Confirmed Decision 3**: Upgrade `src/components/modals/EnvironmentSettingsModal.tsx` with a dedicated **Git Release & Commit Verification Card** displaying the active commit SHA, commit subject, branch, and external link buttons to GitHub.
- **Confirmed Decision 4**: Update GitHub Actions workflow (`.github/workflows/firebase-hosting-merge.yml`) to inject `GITHUB_SHA`, `GITHUB_REF_NAME`, and commit messages into the Vite production build.

---

## 1. Overview & Core Concept

- **What It Does**:
  - Eliminates stale, hardcoded version strings that fall out of sync with GitHub commits.
  - Automatically captures the latest Git commit hash (`git rev-parse --short HEAD` or CI environment variables) and commit title during build time.
  - Formats version output as `v<SemVer>-<ShortSHA>` (e.g. `v1.2.0-8ba2ee3`).
  - Provides a 1-click pathway from the application header directly to the specific commit and diff in GitHub via the Multi-Environment & Release Manager.
- **Target Audience / Persona**: Lead engineer, QA automation testers, and stakeholders reviewing deployments across AI Studio Dev, Preview, and Firebase Production.
- **Key Value**: Guarantees traceability between any deployed app instance and the exact Git commit that produced it, preventing uncertainty about whether a patch or fix has been deployed.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Header Version Visibility**:
   - The user looks at the top-left navigation header next to the AJWMES logo.
   - The version tag displays `v1.2.0-8ba2ee3 | DEV` (or `PREVIEW`, `LIVE` based on environment).
   - Hovering displays a tooltip: *"Release v1.2.0-8ba2ee3 · Commit: 8ba2ee3 · Click to inspect environment & GitHub commit"*.
   - Clicking the badge opens the Multi-Environment & Release Manager modal.

2. **Multi-Environment & Release Manager Verification**:
   - The modal header clearly presents `v1.2.0-8ba2ee3` alongside the channel badge.
   - Inside the **Active Environment & Storage** tab, a dedicated **GitHub Release & Commit Verification** card provides:
     - **Commit SHA**: Monospace badge `8ba2ee3` with a 1-click **Copy SHA** button (with clipboard check feedback).
     - **Commit Summary**: The Git commit subject/message associated with this build.
     - **Branch & Target**: Target branch (e.g., `main`) and target repository (`anthonywrather/ajwmes`).
     - **Direct Action Button**: `View on GitHub ↗` linking to `https://github.com/anthonywrather/ajwmes/commit/<sha>`.
     - **Compare & Releases Links**: Quick links to view recent releases or compare commits on GitHub.

3. **Fallback & Graceful Degradation**:
   - If running in an environment without Git or CI variables (e.g. initial scratch container), the app falls back to the package version with a descriptive `-dev` or clean fallback hash, ensuring zero build breaks or console errors.

### Visual Identity & Theme
- Dark marine slate theme (`#0A192F`, `#0F172A`) with sky blue interactive accents (`#38BDF8`) and amber highlights.
- Zero-pill compliance: Clean monospace typography with tabular figures (`font-mono tabular-nums text-sky-300`).
- Micro-interactions: Instant copy-to-clipboard state change (Checkmark icon $\le 200\text{ms}$), smooth tooltip reveals.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Vite Compile-Time `define` Injection vs Runtime Git Query**:
  - *Chosen Approach*: Inject Git metadata via `define` in `vite.config.ts` combining CI environment variables (`GITHUB_SHA`, `GITHUB_REF_NAME`) with local `child_process.execSync` fallbacks.
  - *Why*: Browsers running client-side React cannot execute Git commands. Embedding metadata at build time ensures instantaneous zero-latency client availability and complete offline compatibility.
  - *Alternatives Considered*: Fetching GitHub API at runtime. Rejected because it requires internet connectivity, consumes API rate limits, fails in offline pontoon environments, and introduces network latency.
- **Decision 2: SemVer + Short SHA Tag Format (`v1.2.0-8ba2ee3`)**:
  - *Chosen Approach*: Standard `v<package.json version>-<7-char SHA>`.
  - *Why*: Directly fulfills user preference, conforms to SemVer prerelease/build metadata standards, and is immediately recognizable.
- **Decision 3: Direct Linkage to `anthonywrather/ajwmes`**:
  - *Chosen Approach*: Configure `anthonywrather/ajwmes` as the primary repository constant with an override via `VITE_GITHUB_REPO`.
  - *Why*: Ensures out-of-the-box working GitHub links while remaining flexible if repository naming changes.

---

## 4. Technical Architecture & Data Strategy

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Build Time (Vite / CI)                          │
│                                                                        │
│   GitHub Actions (CI)           Local / Container (Dev)                │
│   • GITHUB_SHA                  • child_process: git rev-parse --short │
│   • GITHUB_REF_NAME             • child_process: git log -1            │
│   • head_commit.message         • package.json: version "1.2.0"        │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     vite.config.ts (Build Injection)                   │
│  • Defines import.meta.env.VITE_GIT_COMMIT_SHA                         │
│  • Defines import.meta.env.VITE_GIT_COMMIT_MESSAGE                     │
│  • Defines import.meta.env.VITE_GIT_BRANCH                             │
│  • Defines import.meta.env.VITE_GITHUB_REPO                            │
│  • Defines import.meta.env.VITE_BUILD_TIME                             │
└─────────────────────────────────┬──────────────────────────────────────┘
                                  │
                                  ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        src/version.ts (Metadata)                       │
│  • APP_VERSION = '1.2.0' (from package.json)                           │
│  • GIT_COMMIT_SHA = '8ba2ee3'                                          │
│  • FULL_VERSION_TAG = 'v1.2.0-8ba2ee3'                                 │
│  • getGitHubCommitUrl() -> https://github.com/anthonywrather/...       │
│  • getVersionInfo() -> structured metadata                             │
└─────────────────┬──────────────────────────────────────┬───────────────┘
                  │                                      │
                  ▼                                      ▼
┌───────────────────────────────────┐  ┌─────────────────────────────────┐
│       src/components/Navigation   │  │   src/components/modals/        │
│             (Header)              │  │      EnvironmentSettingsModal   │
│                                   │  │                                 │
│  • Renders v1.2.0-8ba2ee3         │  │  • Release Manager Header       │
│  • Environment indicator          │  │  • Git Commit SHA & 1-click copy│
│  • Click opens Release Manager    │  │  • Commit Message & Branch Tag  │
│                                   │  │  • Direct "View on GitHub ↗"   │
└───────────────────────────────────┘  └─────────────────────────────────┘
```

### Component & File Changes

1. **`vite.config.ts`**:
   - Extract Git metadata using `child_process.execSync` safely wrapped in `try/catch`.
   - Read CI variables (`GITHUB_SHA`, `GITHUB_REF_NAME`, `VITE_GIT_COMMIT_SHA`, `VITE_GIT_COMMIT_MESSAGE`).
   - Define variables via Vite's `define` config.
2. **`src/version.ts`**:
   - Export `APP_VERSION`, `GIT_COMMIT_SHA`, `GIT_COMMIT_MESSAGE`, `GIT_BRANCH`, `GITHUB_REPO`, `FULL_VERSION_TAG`.
   - Export helper functions: `getVersionInfo()`, `getGitHubCommitUrl()`, `getGitHubRepoUrl()`.
3. **`src/components/Navigation.tsx`**:
   - Update header version badge to display `FULL_VERSION_TAG` (`v1.2.0-8ba2ee3`).
   - Update tooltip and accessibility label.
4. **`src/components/modals/EnvironmentSettingsModal.tsx`**:
   - Display `FULL_VERSION_TAG` in modal header.
   - Add new **GitHub Release & Commit Verification Card** in the Overview tab:
     - Short SHA badge with Copy button.
     - Commit message.
     - Branch name and repository tag.
     - Direct button to GitHub commit (`https://github.com/anthonywrather/ajwmes/commit/<sha>`).
5. **`.github/workflows/firebase-hosting-merge.yml`**:
   - Pass `VITE_GIT_COMMIT_SHA: ${{ github.sha }}`, `VITE_GIT_COMMIT_MESSAGE: ${{ github.event.head_commit.message }}`, `VITE_GIT_BRANCH: ${{ github.ref_name }}`, and `VITE_GITHUB_REPO: 'anthonywrather/ajwmes'` into the build step.
6. **`src/utils/version.test.ts`**:
   - Update tests to validate semantic version formatting, short SHA handling, and GitHub URL generation.

---

## Verification Plan

### Automated Test Suite
- Run `npm run lint` (`tsc --noEmit`) to ensure 0 type errors.
- Run `npm run test:unit` (`tsx --test "src/**/*.test.ts"`) to verify all unit tests pass including updated `src/utils/version.test.ts`.
- Run `npm run build` to verify Vite bundle compilation and PWA service worker generation.

### Manual & UI Verification
- Verify header version badge displays `v1.2.0-<sha>` with environment indicator.
- Click header badge to open Multi-Environment & Release Manager.
- Inspect the new GitHub Release & Commit Verification card:
  - Verify commit SHA and commit message are displayed.
  - Click "Copy SHA" and verify clipboard confirmation.
  - Verify "View on GitHub ↗" link targets `https://github.com/anthonywrather/ajwmes/commit/<sha>`.
