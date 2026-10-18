import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import { execSync } from 'child_process';

// Explicitly parse local .env file so that correct project variables
// take precedence over any stale container environment variables
const envPath = path.resolve(import.meta.dirname ?? '.', '.env');
const localEnv = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};

// Extract Git commit metadata with CI env variable precedence and local CLI fallbacks
function getGitMetadata() {
  let commitSha = (process.env.VITE_GIT_COMMIT_SHA || process.env.GITHUB_SHA || localEnv.VITE_GIT_COMMIT_SHA || '').trim();
  let commitMessage = (process.env.VITE_GIT_COMMIT_MESSAGE || localEnv.VITE_GIT_COMMIT_MESSAGE || '').trim();
  let branch = (process.env.VITE_GIT_BRANCH || process.env.GITHUB_REF_NAME || localEnv.VITE_GIT_BRANCH || '').trim();

  try {
    if (!commitSha) {
      commitSha = execSync('git rev-parse HEAD', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 }).toString().trim();
    }
  } catch {
    // Git unavailable or container without git history
  }

  try {
    if (!commitMessage) {
      commitMessage = execSync('git log -1 --pretty=%s', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 }).toString().trim();
    }
  } catch {
    // fallback
  }

  try {
    if (!branch) {
      branch = execSync('git rev-parse --abbrev-ref HEAD', { stdio: ['ignore', 'pipe', 'ignore'], timeout: 2000 }).toString().trim();
    }
  } catch {
    // fallback
  }

  const shortSha = commitSha ? (commitSha.length > 7 ? commitSha.slice(0, 7) : commitSha) : '8ba2ee3';

  return {
    commitSha: shortSha,
    fullSha: commitSha || shortSha,
    commitMessage: commitMessage || 'feat: synchronize release versioning with github commits',
    branch: branch && branch !== 'HEAD' ? branch : 'main',
    repo: process.env.VITE_GITHUB_REPO || localEnv.VITE_GITHUB_REPO || 'anthonywrather/ajwmes',
    buildDate: new Date().toISOString().split('T')[0]
  };
}

let appVersion = '1.2.0';
try {
  const pkgPath = path.resolve(import.meta.dirname ?? '.', 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    if (pkg.version) appVersion = pkg.version;
  }
} catch {
  // fallback
}

const gitMeta = getGitMetadata();
const versionManifestJson = JSON.stringify(
  {
    version: appVersion,
    commitSha: gitMeta.commitSha,
    commitFullSha: gitMeta.fullSha,
    commitMessage: gitMeta.commitMessage,
    branch: gitMeta.branch,
    buildDate: gitMeta.buildDate,
    fullTag: `v${appVersion}-${gitMeta.commitSha}`,
  },
  null,
  2
);

function ajwmesVersionManifestPlugin() {
  return {
    name: 'ajwmes-version-manifest',
    configureServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: { setHeader: (k: string, v: string) => void; end: (b: string) => void }, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.split('?')[0] === '/version.json') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.end(versionManifestJson);
          return;
        }
        next();
      });
    },
    configurePreviewServer(server: { middlewares: { use: (fn: (req: { url?: string }, res: { setHeader: (k: string, v: string) => void; end: (b: string) => void }, next: () => void) => void) => void } }) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.split('?')[0] === '/version.json') {
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          res.end(versionManifestJson);
          return;
        }
        next();
      });
    },
    generateBundle(this: { emitFile: (file: { type: 'asset'; fileName: string; source: string }) => void }) {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: versionManifestJson,
      });
    },
  };
}

export default defineConfig(() => {
  return {
    define: {
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(appVersion),
      'import.meta.env.VITE_GIT_COMMIT_SHA': JSON.stringify(gitMeta.commitSha),
      'import.meta.env.VITE_GIT_COMMIT_FULL_SHA': JSON.stringify(gitMeta.fullSha),
      'import.meta.env.VITE_GIT_COMMIT_MESSAGE': JSON.stringify(gitMeta.commitMessage),
      'import.meta.env.VITE_GIT_BRANCH': JSON.stringify(gitMeta.branch),
      'import.meta.env.VITE_GITHUB_REPO': JSON.stringify(gitMeta.repo),
      'import.meta.env.VITE_BUILD_DATE': JSON.stringify(gitMeta.buildDate),
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(localEnv.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || ''),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(localEnv.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'gen-lang-client-0618772940'),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(localEnv.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || '1:310512231306:web:35ac83e7f7f56d49a39e73'),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(localEnv.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || 'gen-lang-client-0618772940.firebaseapp.com'),
      'import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID': JSON.stringify(localEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 'ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a'),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(localEnv.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || 'gen-lang-client-0618772940.firebasestorage.app'),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(localEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '310512231306'),
    },
    plugins: [
      react(),
      tailwindcss(),
      ajwmesVersionManifestPlugin(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'icon.svg', 'icon-192.png', 'icon-512.png'],
        manifest: {
          id: '/',
          name: 'AJW Marine Electrical Services',
          short_name: 'AJWMES',
          description: 'Marine electrical diagnostics, lithium, solar, navigation and custom laser switch panels in Gosport & Solent.',
          theme_color: '#0A192F',
          background_color: '#0A192F',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          icons: [
            {
              src: '/icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: '/icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2}'],
          globIgnores: ['**/version.json'],
          navigateFallbackDenylist: [/^\/version\.json$/],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname ?? '.', '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/firebase/')) {
              return 'vendor-firebase';
            }
            if (id.includes('node_modules/lucide-react/')) {
              return 'vendor-lucide';
            }
            if (id.includes('node_modules/motion/')) {
              return 'vendor-motion';
            }
            if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
              return 'vendor-jspdf';
            }
            if (id.includes('node_modules/@google/genai')) {
              return 'vendor-genai';
            }
            if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
              return 'vendor-react';
            }
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

