# AJW Marine Electrical Services — App Configuration & Secrets Management Guide

Welcome to the **AJW Marine Electrical Services** codebase. This application is a specialized field-service Progressive Web App (PWA) and workshop management system supporting marine electrical diagnostics, lithium battery bank calculations, solar array sizing, custom Carling switch panel design, and postal repair tracking.

- **Frontend & Build**: React 19, TypeScript, Vite 8, Tailwind CSS v4, Motion, Vite PWA
- **Cloud & Backend**: Google Firebase (Authentication & Cloud Firestore), Google GenAI SDK (`@google/genai`)
- **Hosting & CI/CD**: Firebase Hosting, GitHub Actions, Google AI Studio

---

## Table of Contents
1. [Quick Start (3-Minute Setup)](#quick-start-3-minute-setup)
2. [Master Configuration Reference](#master-configuration-reference)
3. [How to Locate All Configuration Keys & Data](#how-to-locate-all-configuration-keys--data)
   - [Google AI Studio (Gemini AI Key)](#1-google-ai-studio-gemini-ai-key)
   - [Firebase Console (Standard Web App Config)](#2-firebase-console-standard-web-app-config)
   - [Special Firebase & GCP Keys](#3-special-firebase--google-cloud-keys)
   - [Hosting & Application URLs](#4-hosting--application-urls)
   - [CI/CD Deployment Service Account](#5-cicd-deployment-service-account-github-actions)
4. [Secrets Management Strategy & Best Practices](#secrets-management-strategy--best-practices)
   - [Public Client Keys vs. Private Secrets](#1-public-client-keys-vs-private-secrets)
   - [Local Development with `.env` Files](#2-local-development-with-env-files)
   - [Google AI Studio Secrets](#3-google-ai-studio-secrets)
   - [GitHub Secrets & CI/CD Pipelines](#4-github-secrets--cicd-pipelines)
   - [Google Cloud Secret Manager & Production Hardening](#5-google-cloud-secret-manager--production-hardening)
   - [Emergency Key Rotation & Incident Response](#6-emergency-key-rotation--incident-response)
5. [In-App Developer Diagnostics & Multi-Environment Isolation](#in-app-developer-diagnostics--multi-environment-isolation)
6. [Useful npm & Firebase Commands](#useful-npm--firebase-commands)

---

## Quick Start (3-Minute Setup)

### 1. Clone & Install Dependencies
```bash
git clone <your-repository-url>
cd AJW-Marine-Electrical-Services
npm install
```

### 2. Configure Environment Variables
Copy the template `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your `VITE_FIREBASE_API_KEY` and other configuration values described below.

### 3. Start the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Master Configuration Reference

| Environment Variable | Required? | Exposure | Origin Platform | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | Optional / Feature-dependent | **Private** (Server / AI Studio) | Google AI Studio | Authorizes Gemini generative AI API queries via `@google/genai`. Injected automatically in AI Studio sandboxes. |
| `VITE_FIREBASE_API_KEY` | **Required** | **Public** (Client bundle) | Firebase Console / GCP | Authenticates client SDK requests with Firebase (Identity Toolkit & Firestore). |
| `VITE_FIREBASE_PROJECT_ID` | **Required** | **Public** (Client bundle) | Firebase Console | Uniquely identifies your Firebase / Google Cloud project (e.g., `gen-lang-client-0618772940`). |
| `VITE_FIREBASE_APP_ID` | **Required** | **Public** (Client bundle) | Firebase Console | Identifies this specific registered web app instance in Firebase. |
| `VITE_FIREBASE_AUTH_DOMAIN` | **Required** | **Public** (Client bundle) | Firebase Console | Domain where Google OAuth redirects land (e.g., `<project-id>.firebaseapp.com`). |
| `VITE_FIREBASE_STORAGE_BUCKET`| **Required** | **Public** (Client bundle) | Firebase Console | Cloud Storage bucket for panel photos and vessel schematics (e.g., `<project-id>.firebasestorage.app`). |
| `VITE_FIREBASE_FIRESTORE_DATABASE_ID` | Optional | **Public** (Client bundle) | Firebase Console | Firestore database name. Default is `(default)`; set only if using a custom named database. |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Optional | **Public** (Client bundle) | Firebase Console | Numeric Google Cloud project number used for Firebase Cloud Messaging / notifications. |
| `VITE_FIREBASE_MEASUREMENT_ID` | Optional | **Public** (Client bundle) | Firebase Console / GA4 | Google Analytics 4 stream measurement ID (`G-XXXXXXXXXX`). |
| `VITE_FIREBASE_OAUTH_CLIENT_ID` | Optional | **Public** (Client bundle) | Google Cloud Console | OAuth 2.0 Web Client ID for Google Identity sign-in popup / redirect flows. |
| `APP_URL` | Optional | Contextual | Hosting Provider | Base application URL (e.g. `http://localhost:3000` or `https://ajwmes.co.uk`). Injected in AI Studio. |
| `FIREBASE_SERVICE_ACCOUNT` | **CI/CD Only** | **Secret** (GitHub Secrets) | Firebase Console (GCP IAM) | Service account private key JSON string used by GitHub Actions to deploy to Firebase Hosting. |
| `DISABLE_HMR` | Optional | Dev-only | Local environment | Set to `'true'` if running in headless testing containers where WebSocket HMR should be disabled. |

---

## How to Locate All Configuration Keys & Data

### 1. Google AI Studio (Gemini AI Key)

The Gemini API key powers multimodal diagnostics and generative features.

> [!WARNING]
> **Gemini API Key vs. Firebase Web API Key:**
> A Gemini API key created in Google AI Studio is **only** valid for Gemini Generative AI endpoints. It is **not** valid for Firebase Authentication. Using a Gemini API key as `VITE_FIREBASE_API_KEY` will trigger an `auth/api-key-not-valid` error during Google Sign-In. Keep these keys distinct!

1. Go to [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account.
3. Click **Get API key** in the left navigation sidebar or top-right banner.
4. Select your existing Google Cloud project or create a new one.
5. Copy the generated key (starts with `AIzaSy...` or `AQ...`).
6. Store this in your `.env` file as `GEMINI_API_KEY` or in AI Studio's Secrets panel.

---

### 2. Firebase Console (Standard Web App Config)

All client-side variables prefixed with `VITE_FIREBASE_*` come directly from your Firebase Web App configuration snippet:

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select your project (e.g., **gen-lang-client-0618772940**).
3. Click the **Gear icon (⚙️ Project settings)** in the top-left sidebar next to *Project Overview*.
4. On the **General** tab, scroll down to the **Your apps** section.
5. If you have not created a Web App yet:
   - Click the **Web (`</>`)** icon.
   - Enter an app nickname (e.g., `AJW Marine Electrical Web`).
   - Check or uncheck Firebase Hosting as desired, and click **Register app**.
6. Under **SDK setup and configuration**, select the **Config** radio button.
7. You will see a JavaScript snippet formatted like this:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCeLVmFhxzY8Ojh2NFUvuyGax-LVDk5tIg",
  authDomain: "gen-lang-client-0618772940.firebaseapp.com",
  projectId: "gen-lang-client-0618772940",
  storageBucket: "gen-lang-client-0618772940.firebasestorage.app",
  messagingSenderId: "310512231306",
  appId: "1:310512231306:web:1dd846ba5925aae4a39e73",
  measurementId: "G-3S81J5JS3L"
};
```

#### Mapping to `.env` Keys:
- `apiKey` &rarr; `VITE_FIREBASE_API_KEY`
- `projectId` &rarr; `VITE_FIREBASE_PROJECT_ID`
- `appId` &rarr; `VITE_FIREBASE_APP_ID`
- `authDomain` &rarr; `VITE_FIREBASE_AUTH_DOMAIN`
- `storageBucket` &rarr; `VITE_FIREBASE_STORAGE_BUCKET`
- `messagingSenderId` &rarr; `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `measurementId` &rarr; `VITE_FIREBASE_MEASUREMENT_ID` *(only present if Google Analytics is enabled)*

---

### 3. Special Firebase & Google Cloud Keys

Some configuration parameters are not inside the standard Firebase Web snippet:

#### A. Firestore Database ID (`VITE_FIREBASE_FIRESTORE_DATABASE_ID`)
- **Default Database**: If you are using the primary Firestore database, leave this blank or use `(default)`.
- **Named Database**:
  1. In the Firebase Console, navigate to **Build &rarr; Firestore Database**.
  2. Look at the database selector dropdown at the top of the page.
  3. If your database has a custom name (e.g., `ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a`), copy that exact string.

#### B. Google OAuth Client ID (`VITE_FIREBASE_OAUTH_CLIENT_ID`)
Required for Google Identity sign-in and account linking:
1. Open the [Google Cloud Console Credentials Page](https://console.cloud.google.com/apis/credentials) for your project.
2. Under the **OAuth 2.0 Client IDs** table, locate the **Web client (auto created by Google Service)** entry.
3. Click the client entry to view details.
4. Copy the **Client ID** (formatted like `310512231306-ks44mner...apps.googleusercontent.com`).
5. In the same view, confirm your **Authorized JavaScript origins**:
   - `http://localhost:3000`
   - `http://localhost:5173`
   - `https://<YOUR_PROJECT_ID>.web.app`
   - `https://<YOUR_PROJECT_ID>.firebaseapp.com`
   - `https://ajwmes.co.uk` *(and `https://www.ajwmes.co.uk` if using custom domains)*
6. Ensure your **Authorized redirect URIs** includes:
   - `https://<YOUR_PROJECT_ID>.firebaseapp.com/__/auth/handler`

#### C. Enable Google Authentication in Firebase
If Google Sign-In is rejected:
1. In the Firebase Console, go to **Build &rarr; Authentication &rarr; Sign-in method**.
2. Click **Add new provider** (or select **Google** under existing providers).
3. Toggle **Enable**.
4. Set the **Project support email** (e.g., `anthonywrather@gmail.com`) and click **Save**.
5. Go to the **Settings** tab &rarr; **Authorized domains** and verify your domain (`ajwmes.co.uk`, `localhost`, etc.) is added.

---

### 4. Hosting & Application URLs

`APP_URL` defines the base domain where your frontend is reachable. It is used for OAuth redirects, PWA manifest scopes, and email quote verification links.

- **Local Development**: `http://localhost:3000` (or `http://localhost:5173`).
- **Firebase Hosting Default Domains**:
  1. Open Firebase Console &rarr; **Build &rarr; Hosting**.
  2. Under the **Domains** table, locate the default Firebase domains:
     - `https://<project-id>.web.app`
     - `https://<project-id>.firebaseapp.com`
- **Custom Production Domain**:
  - `https://ajwmes.co.uk`
- **Automatic Hosting Config**: When served via Firebase Hosting, the app will automatically attempt to fetch `/__/firebase/init.json` to verify configuration without requiring manual environment injection.

---

### 5. CI/CD Deployment Service Account (GitHub Actions)

To automatically deploy the site on git push via `.github/workflows/firebase-hosting-merge.yml`, GitHub Actions needs a Firebase Service Account credential.

#### Option A: Automatic Setup via Firebase CLI (Recommended)
Run the automated wizard in your terminal:
```bash
firebase init hosting:github
```
1. Authenticate with your GitHub account.
2. Select your repository (e.g. `anthonywrather/AJW-Marine-Electrical-Services`).
3. Accept the prompt to configure a workflow to run a build before deployment (`npm install && npm run build`).
4. Accept automatic deployment on merge to `main`.
5. The CLI automatically generates a dedicated service account with minimal IAM roles and adds the encrypted secret (`FIREBASE_SERVICE_ACCOUNT_...`) to your GitHub repository!

#### Option B: Manual Service Account Key Generation
1. In the Firebase Console, click **Project Settings (⚙️) &rarr; Service accounts**.
2. Click **Generate new private key**, then confirm **Generate key**.
3. A JSON file will download to your computer.
4. Open the JSON file and copy its entire contents.
5. In GitHub, navigate to **Settings &rarr; Secrets and variables &rarr; Actions**.
6. Create or update the secret named `FIREBASE_SERVICE_ACCOUNT` and paste the full JSON string.
7. Safely delete the downloaded JSON file from your local Downloads folder.

---

## Secrets Management Strategy & Best Practices

Managing credentials securely across local development, cloud sandboxes, and automated deployment pipelines is critical for keeping your project safe.

```mermaid
flowchart TD
    subgraph Local["1. Local Machine"]
        Env[".env (gitignored)"]
        EnvEx[".env.example (public)"]
    end

    subgraph AIStudio["2. Google AI Studio"]
        AISSecrets["AI Studio Secrets Panel\n(Runtime injected into container)"]
    end

    subgraph GitHub["3. GitHub Repository"]
        GHSecrets["GitHub Actions Secrets\n(VITE_FIREBASE_API_KEY, FIREBASE_SERVICE_ACCOUNT)"]
        GHWorkflow[".github/workflows/firebase-hosting-merge.yml"]
    end

    subgraph Cloud["4. Google Cloud & Firebase"]
        GCPAuth["Firebase Auth (Identity Toolkit)"]
        GCPStore["Cloud Firestore & Storage"]
        Rules["firestore.rules & API Key Restrictions"]
    end

    Env -->|Vite Build| AppBundle["Client Bundle (dist/)"]
    AISSecrets -->|Environment Injected| AppBundle
    GHSecrets -->|CI Build & Deploy| GHWorkflow
    GHWorkflow -->|Deploy Artifacts| AppBundle
    AppBundle -->|Client API Calls| GCPAuth
    AppBundle -->|Client Queries| GCPStore
    Rules -.->|Enforces Security| GCPStore
```

---

### 1. Public Client Keys vs. Private Secrets

It is vital to understand what Vite does with environment variables:

> [!IMPORTANT]
> Any variable prefixed with `VITE_` (such as `VITE_FIREBASE_API_KEY`) is **embedded directly into the client-side JavaScript code** during `npm run build`. 
> Anyone visiting your website can inspect your network requests or JavaScript bundles and see this key. 

Because `VITE_*` variables are public by design:
1. **Never put true private secrets in `VITE_*` variables.** (e.g., service account private keys, database root passwords, Stripe secret keys, private admin tokens).
2. **Secure Firebase using Firestore Rules & API Key Restrictions:**
   - Client access control is enforced on the server by `firestore.rules`, NOT by keeping the Firebase Web API key secret.
   - Restrict your Firebase API Key in Google Cloud Console (see Section 5 below).

---

### 2. Local Development with `.env` Files

- **`.env.example`**: Committed to Git. Contains all variable keys and safe sample or default placeholder values. Acts as documentation for any developer setting up the app.
- **`.env`**: **Never committed to Git**. Contains your real local development keys.
- **`.env.local`**: Gitignored. Can be used for machine-specific overrides.

#### Git Protection
Verify that your `.gitignore` explicitly prevents environment files from ever being tracked:
```gitignore
.env*
!.env.example
```

#### Vite Configuration Precedence in This Project
In `vite.config.ts`, this project explicitly parses the local `.env` file at build/dev start time:
```typescript
const envPath = path.resolve(import.meta.dirname ?? '.', '.env');
const localEnv = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};
```
This guarantees that values in your local `.env` take immediate precedence over any stale container environment variables.

---

### 3. Google AI Studio Secrets

When developing or running inside Google AI Studio applet workspaces:

1. **Automatic Secret Injection**:
   - Google AI Studio automatically mounts user secrets at container boot time.
   - Keys like `GEMINI_API_KEY` and `APP_URL` are provided directly via process environment variables.
2. **Secrets UI Panel**:
   - In AI Studio, click the **Secrets (Key 🔑)** icon in the navigation or settings bar.
   - Enter your key name (e.g. `GEMINI_API_KEY`) and secret value.
   - This stores the secret in Google's secure user-level secret vault without committing files to the repository.
3. **Avoid Hardcoding in Commits**:
   - When exporting or syncing code from AI Studio to GitHub, make sure no live API keys were accidentally typed directly into source files or non-ignored files.

---

### 4. GitHub Secrets & CI/CD Pipelines

Our automated deployment workflow (`.github/workflows/firebase-hosting-merge.yml`) builds and deploys the project whenever code merges into `main`.

#### Required GitHub Secrets:
Navigate to your GitHub repository &rarr; **Settings &rarr; Secrets and variables &rarr; Actions &rarr; Repository secrets**:

1. **`VITE_FIREBASE_API_KEY`**:
   - Value: `AIzaSyCeLVmFhxzY8Ojh2NFUvuyGax-LVDk5tIg`
   - Passed into `npm run build` during the CI step:
     ```yaml
     - name: Build Production Assets
       env:
         VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
       run: npm run build
     ```
2. **`FIREBASE_SERVICE_ACCOUNT`**:
   - Value: Full JSON string of the Firebase deployment service account.
   - Used by the `FirebaseExtended/action-hosting-deploy` GitHub Action:
     ```yaml
     - name: Deploy to Firebase Hosting
       uses: FirebaseExtended/action-hosting-deploy@v0
       with:
         repoToken: '${{ secrets.GITHUB_TOKEN }}'
         firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
         channelId: live
     ```

#### Using GitHub Environments (Optional for Teams):
For multi-stage rollouts, configure GitHub Environments (`staging` and `production`):
- Assign reviewers and protection rules before deploying to production.
- Store staging Firebase credentials in the `staging` environment and live credentials in `production`.

---

### 5. Google Cloud Secret Manager & Production Hardening

To maximize security for your deployed application:

#### A. Restrict Firebase Web API Key in Google Cloud
Prevent unauthorized sites from borrowing your Firebase API key:
1. Open [Google Cloud Console Credentials](https://console.cloud.google.com/apis/credentials).
2. Select your Firebase Web API key (e.g., `Browser key (auto created by Firebase)`).
3. Under **Application restrictions**, choose **Websites** (HTTP referrers).
4. Add your authorized domains:
   - `http://localhost:*`
   - `https://gen-lang-client-0618772940.web.app/*`
   - `https://gen-lang-client-0618772940.firebaseapp.com/*`
   - `https://ajwmes.co.uk/*`
   - `https://www.ajwmes.co.uk/*`
5. Under **API restrictions**, select **Restrict key** and check only the APIs this app uses:
   - **Identity Toolkit API** *(Required for Firebase Authentication)*
   - **Token Service API** *(Required for token refresh)*
   - **Cloud Firestore API** *(Required for database sync)*
   - **Firebase Storage API** *(Required for asset uploads)*
6. Click **Save**.

#### B. Pre-commit Secret Scanning
Install tools like [`gitleaks`](https://github.com/gitleaks/gitleaks) or enable **GitHub Secret Scanning & Push Protection** in your repository settings (**Settings &rarr; Code security and analysis &rarr; Secret scanning**). This blocks any git push that contains inadvertent secrets.

#### C. Google Cloud Secret Manager (for Backend APIs / Functions)
If you add Node.js backend microservices or Firebase Cloud Functions that call external paid APIs (e.g. marine parts distributor APIs, Stripe, or private AI endpoints):
- Store them in **Google Cloud Secret Manager** (`gcloud secrets create ...`).
- Access secrets dynamically at runtime using `@google-cloud/secret-manager` or Firebase Functions `runWith({ secrets: [...] })`.
- Never bundle backend secrets into Vite's client output!

---

### 6. Emergency Key Rotation & Incident Response

If a secret or service account key is ever accidentally pushed to a public repository:

1. **Step 1: Invalidate the Compromised Key Immediately**:
   - **Firebase Web API Key**: Go to GCP Console &rarr; Credentials &rarr; Delete or regenerate the key.
   - **Gemini API Key**: Go to Google AI Studio &rarr; Get API Key &rarr; Delete the key.
   - **Service Account**: Go to GCP IAM & Admin &rarr; Service Accounts &rarr; Keys &rarr; Delete the compromised key ID.
2. **Step 2: Generate New Credentials**:
   - Create a fresh API key or service account key in the respective console.
3. **Step 3: Update Secrets Vaults**:
   - Update your local `.env`.
   - Update GitHub Repository Secrets (`Settings &rarr; Secrets and variables &rarr; Actions`).
   - Update Google AI Studio Secrets panel.
4. **Step 4: Trigger a Clean Build & Deploy**:
   - Re-run the GitHub Actions deployment workflow or run `npm run build && firebase deploy --only hosting`.
5. **Step 5: Test In-App Access**:
   - Use the built-in diagnostic tools (described below) to verify Google Sign-In and Firestore connectivity.

---

## In-App Developer Diagnostics & Multi-Environment Isolation

This codebase includes built-in developer tools to diagnose credentials and test the app without getting blocked by authentication issues:

### 1. In-App "Fix Firebase API Key" Tool
If Google Sign-In displays an invalid API key warning on your live or staging site:
1. Open the **Sign In** modal in the top navigation.
2. Click **"Fix Firebase API Key"**.
3. Paste the verified Firebase Web API key and click **Save Key**.
4. The key is saved to your browser's `localStorage` and takes immediate effect without requiring a rebuild or redeployment!

### 2. 1-Click Developer Sign-In
Need to test admin features without Google OAuth setup?
- In the **Sign In** modal, click **"1-Click Sign In as Anthony Wrather (Admin)"**.
- Grants immediate full administrative role-based access control (RBAC) to test quotes, switch panel layouts, and customer jobs.

### 3. Multi-Environment Data Scoping
The app automatically detects the current hosting domain and isolates local and Firestore storage so test runs never corrupt live production data:

| Environment | Detected Hostname | Storage Scope | Behavior |
| :--- | :--- | :--- | :--- |
| **AI Studio Dev** | `ais-dev-*.run.app`, `localhost` | `ajwmes_aistudio_dev_*` | Isolated local test sandbox. Clean demo datasets. |
| **AI Studio Preview** | `ais-pre-*.run.app` | `ajwmes_aistudio_pre_*` | Client demo sandbox for reviewing features. |
| **GitHub PR Preview** | `*--*.web.app` | `ajwmes_github_pre_*` | Ephemeral preview channels for Pull Requests. |
| **Production Live** | `ajwmes.co.uk`, `*.web.app` | `ajwmes_github_live_*` | Production database sync with live Firestore collections. |

*You can open the **Environment Inspector** at any time by clicking the environment badge in the top navigation.*

---

## Useful npm & Firebase Commands

```bash
# Start local dev server (port 3000)
npm run dev

# Run TypeScript type check
npm run lint

# Run all unit tests (Auth, Electrical Calculations, Form Validation, Versioning)
npm run test:unit

# Run Playwright end-to-end browser tests
npm run test:e2e

# Build production assets for deployment
npm run build

# Preview production build locally
npm run preview

# Deploy manually to Firebase Hosting
firebase deploy --only hosting

# Deploy to a temporary PR preview channel (valid for 7 days)
firebase hosting:channel:deploy preview-feature-name
```

---

## Support & Contributing

- **Author**: Anthony Wrather (AJW Marine Electrical Services)
- **Primary Domain**: [https://ajwmes.co.uk](https://ajwmes.co.uk)
- **Issues & Contributions**: Please submit Pull Requests with passing unit tests (`npm run test:unit`).
