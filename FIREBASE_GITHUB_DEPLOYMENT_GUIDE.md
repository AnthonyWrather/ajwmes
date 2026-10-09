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
