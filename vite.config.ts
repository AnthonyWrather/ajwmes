import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// Explicitly parse local .env file so that correct project variables
// take precedence over any stale container environment variables
const envPath = path.resolve(import.meta.dirname ?? '.', '.env');
const localEnv = fs.existsSync(envPath) ? dotenv.parse(fs.readFileSync(envPath)) : {};

export default defineConfig(() => {
  return {
    define: {
      'import.meta.env.VITE_FIREBASE_API_KEY': JSON.stringify(localEnv.VITE_FIREBASE_API_KEY || process.env.VITE_FIREBASE_API_KEY || ''),
      'import.meta.env.VITE_FIREBASE_PROJECT_ID': JSON.stringify(localEnv.VITE_FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || 'prime-sign-454323-a1'),
      'import.meta.env.VITE_FIREBASE_APP_ID': JSON.stringify(localEnv.VITE_FIREBASE_APP_ID || process.env.VITE_FIREBASE_APP_ID || '1:586239323703:web:a059280dbd46b59fe419b2'),
      'import.meta.env.VITE_FIREBASE_AUTH_DOMAIN': JSON.stringify(localEnv.VITE_FIREBASE_AUTH_DOMAIN || process.env.VITE_FIREBASE_AUTH_DOMAIN || 'prime-sign-454323-a1.firebaseapp.com'),
      'import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID': JSON.stringify(localEnv.VITE_FIREBASE_FIRESTORE_DATABASE_ID || process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 'ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a'),
      'import.meta.env.VITE_FIREBASE_STORAGE_BUCKET': JSON.stringify(localEnv.VITE_FIREBASE_STORAGE_BUCKET || process.env.VITE_FIREBASE_STORAGE_BUCKET || 'prime-sign-454323-a1.firebasestorage.app'),
      'import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(localEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '586239323703'),
    },
    plugins: [
      react(),
      tailwindcss(),
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
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,woff,woff2}'],
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
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

