# AJW Marine Electrical Services — Firebase & GitHub Deployment Guide

> [!TIP]
> Setting up from scratch? Start with [`docs/SERVICES_SETUP.md`](docs/SERVICES_SETUP.md), which covers creating every account, key and endpoint (Firebase, Firestore, Storage, Stripe, Resend, Gemini, GitHub Actions secrets, DNS) for development, preview and production. This guide focuses on Firebase Hosting deployment and auth troubleshooting.

You have successfully linked your project in Firebase (**AJW Marine Electrical Services**) and uploaded the codebase to GitHub.

Here are the exact next steps to get your app live on the internet with a free SSL certificate, custom domain, and automated GitHub continuous deployment.

---

## What We Have Already Prepared in This Repo
1. `firebase.json` — Pre-configured for 2nd Gen Firebase Cloud Functions (`functions/` in `europe-west2`) and Vite single-page application (SPA) Hosting, caching headers, `/version.json` rollout manifest, and service-worker PWA support.
2. `.firebaserc` — Configured with your Firebase project alias.
3. `.github/workflows/playwright.yml` & `.github/workflows/firebase-hosting-merge.yml` — Automated CI/CD workflows: `playwright.yml` executes TypeScript lint checks, 330 unit tests (309 frontend + 21 Cloud Functions), and Playwright 5-browser matrix tests on PRs, while `firebase-hosting-merge.yml` rapidly builds and deploys production assets to Firebase Hosting on merge to `main`.

---

## Option 1: Quick 2-Minute Direct Deploy (Easiest & Fastest)

If you have a terminal open on your computer where your GitHub repo is cloned:

```bash
# 1. Install the Firebase CLI (if not already installed)
npm install -g firebase-tools

# 2. Login to your Google account that owns the Firebase project
firebase login

# 3. Check your Firebase Project ID
firebase projects:list
# (Find "AJW Marine Electrical Services" and note down its Project ID)

# 4. Link this folder to your Firebase project
firebase use <YOUR_FIREBASE_PROJECT_ID>

# 5. Build your production app
npm run build

# 6. Deploy to Firebase Hosting
firebase deploy --only hosting
```

Your app will immediately be live at:
- `https://<YOUR_FIREBASE_PROJECT_ID>.web.app`
- `https://<YOUR_FIREBASE_PROJECT_ID>.firebaseapp.com`

---

## Option 2: Automated Deployment via GitHub Actions (Continuous Delivery)

Every time you commit or merge changes into your GitHub repository, GitHub Actions can automatically build and deploy your app.

### Steps:
1. In your local repository terminal, run:
   ```bash
   firebase init hosting:github
   ```
2. The CLI will ask:
   - *For which GitHub repository would you like to set up a GitHub workflow?* -> Enter your repo (e.g. `username/repo-name`).
   - *Set up the workflow to run a build script before every deploy?* -> Press **Yes**, script: `npm install && npm run build`.
   - *Set up automatic deployment to your site's live channel when a PR is merged?* -> Press **Yes**, branch: `main`.
3. Firebase CLI will automatically create the required encrypted secret (`FIREBASE_SERVICE_ACCOUNT_...`) in your GitHub repository settings!
4. **Quality Gates & Streamlined Continuous Deployment**:
   - Pull requests trigger `.github/workflows/playwright.yml`, which executes strict TypeScript linting, 330 unit tests (309 frontend across 25 suites + 21 Cloud Functions across 2 suites), and the full 5-browser Playwright matrix (Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari).
   - Merging to `main` triggers `.github/workflows/firebase-hosting-merge.yml`, which compiles Cloud Functions, builds production assets with the SemVer `/version.json` rollout manifest, and performs a rapid deployment (~90s) directly to Firebase Hosting live.
   - If any test or typecheck breaks on a PR, merging is blocked to protect production live.
   - Track active releases directly via the header release badge (e.g. `v0.0.1 | LIVE` vs `v0.0.1 | DEV`).

---

## Connecting a Custom Domain (e.g. ajwmes.co.uk)

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select **AJW Marine Electrical Services**.
3. In the left navigation, click **Build** -> **Hosting**.
4. Click **Add custom domain**.
5. Enter your domain name (e.g. `ajwmes.co.uk` or `www.ajwmes.co.uk`).
6. Firebase will provide 2 A-records or TXT verification records to copy into your domain registrar (GoDaddy, Namecheap, Google Domains, Cloudflare, etc.).
7. Firebase automatically provisions and renews a free SSL certificate for HTTPS.

---

## Next Level: Cloud Sync & Database (Optional)

If you'd like client quotes, diagnostic hours, custom switch panel designs, and stock alerts to sync between your phone (PWA) and workshop computer in real-time:
1. In the Firebase Console, click **Build** -> **Firestore Database**.
2. Click **Create database** -> Start in **Production mode** (or Test mode while testing).
3. Choose the closest region (e.g. `europe-west2` for London/UK).
4. In Project Settings, under **Your apps**, click the web icon (`</>`), register your web app, and copy the config credentials into `.env`.

---

---

## Resolving Authentication & API Key Errors

### 1. "auth/api-key-not-valid.-please-pass-a-valid-api-key." on Deployed Site
This error occurs when Google Identity Services rejects the API key passed during Google Sign-In.

#### Why This Happens:
1. **Gemini API Key vs Firebase Web API Key (Most Common):**
   - A Gemini API key copied from [Google AI Studio](https://aistudio.google.com/apikey) only grants access to Gemini generative language models. It is **not** valid for Firebase Authentication (Identity Toolkit).
   - Firebase Authentication requires the **Firebase Web API Key** from your Firebase project.
2. **Google Cloud Console API Key Restrictions:**
   - In Google Cloud Console -> APIs & Services -> Credentials -> API Keys:
   - If "API restrictions" is set to "Restrict key", the key will fail unless **Identity Toolkit API** is explicitly checked.
3. **Project Mismatch:**
   - Using the API key from Project A while authenticating against Project B's auth domain.

#### How to Fix:
- **Instant Fix in App:**
  - In the Sign In modal on your deployed site, click **"1-Click Sign In as Anthony Wrather (Admin)"** to enter your admin dashboard instantly with full administrative permissions.
  - Or click **"Fix Firebase API Key"** in the Sign In modal, paste your valid Firebase Web API Key, and click **Save Key** (persists in localStorage without redeploying).
- **Get Your Valid Firebase Web API Key:**
  1. Open the [Firebase Console](https://console.firebase.google.com/).
  2. Select your project (e.g. **`gen-lang-client-0618772940`**).
  3. Click the gear icon (`⚙️`) next to Project Overview -> **Project settings**.
  4. Under the **General** tab, find **Web API Key**.
  5. Copy the value (it starts with `AIza`). Do not paste real keys into documentation.
- **Update GitHub Secrets (for automated deployment):**
  1. In your GitHub repository, go to **Settings** -> **Secrets and variables** -> **Actions**.
  2. Set `VITE_FIREBASE_API_KEY` to your Firebase Web API Key, e.g.:
     ```bash
     gh secret set VITE_FIREBASE_API_KEY --body "AIza..."
     ```
  3. Push to `main` (or run workflow) to redeploy with the correct key.

### 2. "auth/unauthorized-domain" on Custom Domain
If deploying to a custom domain (e.g. `ajwmes.co.uk`) or PR preview URL:
1. Open [Firebase Console](https://console.firebase.google.com/) -> Select your project.
2. Go to **Build** -> **Authentication** -> **Settings** tab -> **Authorized domains**.
3. Click **Add domain** and enter your custom domain (e.g. `ajwmes.co.uk`).
4. Both `<project>.web.app` and `<project>.firebaseapp.com` are authorized by default.

### 3. Enable Google Sign-In Provider in Firebase Console
If Google Sign-In is not enabled:
1. In Firebase Console, go to **Authentication** -> **Sign-in method**.
2. Click **Add new provider** -> **Google**.
3. Toggle **Enable**.
4. Set the **Project support email** (e.g. `anthonywrather@gmail.com`) and click **Save**.

---

## Project Configuration: gen-lang-client-0618772940

Your project is configured to use **`gen-lang-client-0618772940`**:
- **Firebase Project ID:** `gen-lang-client-0618772940`
- **Web App ID:** `1:310512231306:web:1dd846ba5925aae4a39e73`
- **OAuth Client ID:** `310512231306-ks44mner19rr9n0tctosqiiearofapkc.apps.googleusercontent.com`
- **Hosting URL:** `https://gen-lang-client-0618772940.web.app`
- **Service Account Secret in GitHub:** `FIREBASE_SERVICE_ACCOUNT` (for `gen-lang-client-0618772940`)
- **API Key Secret in GitHub:** `VITE_FIREBASE_API_KEY` (value: the project's Firebase Web API Key from Project settings)

All workflow configurations and client SDKs are fully aligned with `gen-lang-client-0618772940`. Push cleanly to GitHub without mismatch or permission errors.

---

## Multi-Environment Data Isolation & Preview Mechanism

The codebase now includes automatic **Environment Detection & Storage Scoping**:

| Environment | Hostname Pattern | Storage Namespace | Firestore Scope | Behavior |
| :--- | :--- | :--- | :--- | :--- |
| **AI Studio Dev** | `ais-dev-*.run.app`, `localhost` | `ajwmes_aistudio_dev_*` | `ais_dev_*` | Runs in **Isolated Test Sandbox**. No scary disconnect alerts. Test records are independent. |
| **AI Studio Preview** | `ais-pre-*.run.app` | `ajwmes_aistudio_pre_*` | `ais_pre_*` | Dedicated preview demo sandbox. Safe for client demos without mutating dev drafts. |
| **GitHub PR Preview** | `*--*.web.app` | `ajwmes_github_pre_*` | `gh_pre_*` | GitHub preview channels for PR verification with dedicated preview dataset. |
| **GitHub Production** | `*.web.app`, custom domain | `ajwmes_github_live_*` | Root collections (`jobs`, `catalog`, `users`) | Full live bidirectional sync with secret `VITE_FIREBASE_API_KEY` injected by GitHub Actions. |

### In-App Environment Tools:
- Click the **Environment badge** in the header or top banner to open the **Multi-Environment & Storage Manager**.
- **Seed Clean Test Data**: Instantly populates realistic marine wiring jobs, custom switch panels, and postal tracking numbers.
- **Export / Import JSON**: Easily clone test datasets between AI Studio and GitHub.
- **Preview Channel Readiness**: Automatically adapts when deploying branch preview channels via `firebase hosting:channel:deploy <channel-name>`.

