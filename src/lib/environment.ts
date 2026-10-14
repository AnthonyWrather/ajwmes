/**
 * Environment Detection & Multi-Environment Configuration
 * 
 * Supports:
 * - AI Studio Development (container/local dev): 'aistudio-dev'
 * - AI Studio Shared Preview: 'aistudio-preview'
 * - GitHub PR / Preview Channel: 'github-preview'
 * - GitHub Live Deployed / Production: 'github-deployed'
 */

import { firebaseConfig } from './firebaseConfig';

export type AppEnvironment = 'aistudio-dev' | 'aistudio-preview' | 'github-preview' | 'github-deployed';

export interface EnvironmentInfo {
  envCode: AppEnvironment;
  envName: string;
  isAiStudio: boolean;
  isPreview: boolean;
  isGitHubDeployed: boolean;
  storageNamespace: string;
  firestoreCollectionPrefix: string;
  dataDescription: string;
  hasApiKey: boolean;
  hostname: string;
  isSimulatedOverride: boolean;
}

const STORAGE_OVERRIDE_KEY = 'ajwmes_env_override';

/**
 * Detects the current execution environment based on window hostname,
 * Vite environment flags, or user-selected simulation override.
 */
export function detectEnvironment(): EnvironmentInfo {
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  const apiKey = (import.meta.env.VITE_FIREBASE_API_KEY as string) || firebaseConfig.apiKey || '';
  const hasApiKey = Boolean(apiKey && apiKey.trim().length > 0);

  // Check for session simulation override (for developer testing)
  let override: AppEnvironment | null = null;
  if (typeof window !== 'undefined') {
    try {
      const savedOverride = sessionStorage.getItem(STORAGE_OVERRIDE_KEY) as AppEnvironment | null;
      if (savedOverride && ['aistudio-dev', 'aistudio-preview', 'github-preview', 'github-deployed'].includes(savedOverride)) {
        override = savedOverride;
      }
    } catch {
      // Ignore storage errors
    }
  }

  let envCode: AppEnvironment = 'aistudio-dev';

  if (override) {
    envCode = override;
  } else if (typeof window !== 'undefined') {
    // Check for AI Studio URLs
    if (hostname.includes('ais-pre-') || hostname.includes('pre-nmrspskacrvnnihre763xn')) {
      envCode = 'aistudio-preview';
    } else if (hostname.includes('ais-dev-') || hostname.includes('dev-nmrspskacrvnnihre763xn') || hostname === 'localhost' || hostname === '127.0.0.1') {
      envCode = 'aistudio-dev';
    } else if (hostname.includes('--') && (hostname.includes('web.app') || hostname.includes('firebaseapp.com'))) {
      // Firebase Hosting preview channel (e.g. pr-12--project.web.app)
      envCode = 'github-preview';
    } else if (hostname.includes('web.app') || hostname.includes('firebaseapp.com') || hostname.includes('ajwmes.co.uk') || !hostname.includes('run.app')) {
      // Production or custom domain deployment through GitHub / live domain
      envCode = 'github-deployed';
    } else {
      // Default to AI Studio dev if in Cloud Run without pre-
      envCode = 'aistudio-dev';
    }
  }

  const isSimulatedOverride = Boolean(override);

  switch (envCode) {
    case 'aistudio-dev':
      return {
        envCode,
        envName: 'AI Studio Dev Workspace',
        isAiStudio: true,
        isPreview: false,
        isGitHubDeployed: false,
        storageNamespace: 'ajwmes_aistudio_dev',
        firestoreCollectionPrefix: 'ais_dev_',
        dataDescription: 'Connected to live Firestore database (ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a) under [ais_dev_*] collections.',
        hasApiKey,
        hostname,
        isSimulatedOverride
      };

    case 'aistudio-preview':
      return {
        envCode,
        envName: 'AI Studio Shared Preview',
        isAiStudio: true,
        isPreview: true,
        isGitHubDeployed: false,
        storageNamespace: 'ajwmes_aistudio_pre',
        firestoreCollectionPrefix: 'ais_pre_',
        dataDescription: 'Connected to live Firestore database (ai-studio-ajwmarineelectri-be2decfb-0082-454a-a2d9-7ac36c33620a) under [ais_pre_*] collections.',
        hasApiKey,
        hostname,
        isSimulatedOverride
      };

    case 'github-preview':
      return {
        envCode,
        envName: 'GitHub Staging / PR Preview',
        isAiStudio: false,
        isPreview: true,
        isGitHubDeployed: true,
        storageNamespace: 'ajwmes_github_pre',
        firestoreCollectionPrefix: 'gh_pre_',
        dataDescription: 'GitHub Actions PR preview channel connected to Firestore database under [gh_pre_*] collections.',
        hasApiKey,
        hostname,
        isSimulatedOverride
      };

    case 'github-deployed':
    default:
      return {
        envCode: 'github-deployed',
        envName: 'Production Live (ajwmes.co.uk)',
        isAiStudio: false,
        isPreview: false,
        isGitHubDeployed: true,
        storageNamespace: 'ajwmes_github_live',
        firestoreCollectionPrefix: '', // Uses root production collections: jobs, catalog, postal_orders, users, etc.
        dataDescription: 'Live production deployment connected to primary Firestore database at ajwmes.co.uk. Checks if database is empty on rollout; only loads 3 staff accounts (admin, technician, postal) when empty, with zero test catalog or demo customers.',
        hasApiKey,
        hostname,
        isSimulatedOverride
      };
  }
}

/**
 * Set an environment override for previewing different modes in the UI
 */
export function setEnvironmentOverride(env: AppEnvironment | 'auto'): void {
  if (typeof window === 'undefined') return;
  try {
    if (env === 'auto') {
      sessionStorage.removeItem(STORAGE_OVERRIDE_KEY);
    } else {
      sessionStorage.setItem(STORAGE_OVERRIDE_KEY, env);
    }
  } catch (e) {
    console.warn('Could not set environment override:', e);
  }
}
