# AJW Marine Electrical Services — Firebase & GitHub Deployment Guide

You have successfully linked your project in Firebase (**AJW Marine Electrical Services**) and uploaded the codebase to GitHub.

Here are the exact next steps to get your app live on the internet with a free SSL certificate, custom domain, and automated GitHub continuous deployment.

---

## What We Have Already Prepared in This Repo
1. `firebase.json` — Pre-configured for Vite single-page application (SPA) routing, caching headers, and service-worker PWA support.
2. `.firebaserc` — Configured with your Firebase project alias.
3. `.github/workflows/firebase-hosting-merge.yml` — Automated CI/CD workflow that builds and deploys your site whenever you push to GitHub.

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
   - *Set up automatic deployment to your site's live channel when a PR is merged?* -> Press **Yes**, branch: `main` (or `master`).
3. Firebase CLI will automatically create the required encrypted secret (`FIREBASE_SERVICE_ACCOUNT_...`) in your GitHub repository settings!
4. From now on, any `git push` to your GitHub repository will build and deploy your website automatically in under 60 seconds.

---

## Connecting a Custom Domain (e.g. ajwmarine.co.uk)

1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Select **AJW Marine Electrical Services**.
3. In the left navigation, click **Build** -> **Hosting**.
4. Click **Add custom domain**.
5. Enter your domain name (e.g. `ajwmarine.co.uk` or `www.ajwmarine.co.uk`).
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

## Resolving GitHub Secret Scanning Error (Publicly Leaked Secret)

If you encountered GitHub Push Protection or Secret Scanning error:
> `Publicly leaked secret (Google API Key) in firebase-applet-config.json`

This has now been completely resolved in the codebase:
1. **Secret Removed from Tracked Files:** The raw `apiKey` has been stripped from `firebase-applet-config.json` (`"apiKey": ""`).
2. **Environment Variable Security:** The real Firebase API Key is now safely stored in your local `.env` file (`VITE_FIREBASE_API_KEY=your_firebase_api_key`), which is listed in `.gitignore` and never committed to GitHub.
3. **Automatic Fallback:** `src/lib/firebaseConfig.ts` automatically merges `import.meta.env.VITE_FIREBASE_API_KEY` into your Firebase app instance.

### To Push Your Code to GitHub Without Error:
If GitHub blocked an existing commit on your local machine:
```bash
# 1. Stage the updated files
git add firebase-applet-config.json src/lib/firebaseConfig.ts src/lib/firebase.ts src/lib/storage.ts .env.example .github/workflows/firebase-hosting-merge.yml FIREBASE_GITHUB_DEPLOYMENT_GUIDE.md

# 2. Amend your previous commit (replaces the commit that contained the key)
git commit --amend --no-edit

# 3. Push to GitHub cleanly
git push origin main --force-with-lease
```

### For GitHub Actions CI/CD (Firebase Hosting):
In your GitHub repository:
1. Go to **Settings** > **Secrets and variables** > **Actions**.
2. Click **New repository secret**.
3. Name: `VITE_FIREBASE_API_KEY`.
4. Value: Paste your Firebase API Key from `.env`.
5. Save. The automated workflow `.github/workflows/firebase-hosting-merge.yml` will automatically inject it during production builds!

---

## Project Configuration: gen-lang-client-0618772940

Your project is configured to use **`gen-lang-client-0618772940`**:
- **Firebase Project ID:** `gen-lang-client-0618772940`
- **Hosting URL:** `https://gen-lang-client-0618772940.web.app`
- **Service Account Secret in GitHub:** `FIREBASE_SERVICE_ACCOUNT` (for `gen-lang-client-0618772940`)
- **API Key Secret in GitHub:** `VITE_FIREBASE_API_KEY`

All workflow configurations and client SDKs are fully aligned with `gen-lang-client-0618772940`. Push cleanly to GitHub without mismatch or permission errors.
