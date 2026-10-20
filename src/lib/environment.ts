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
import { UserRole } from '../types';

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
  const apiKey = (import.meta.env?.VITE_FIREBASE_API_KEY as string) || firebaseConfig.apiKey || '';
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

export interface EnvironmentBadgeConfig {
  label: string;
  shortLabel: string;
  badgeClass: string;
  dotColor: string;
  description: string;
}

/**
 * Returns UI badge styling and human-readable label for environment indicators
 */
export function getEnvironmentBadge(envCode: AppEnvironment): EnvironmentBadgeConfig {
  switch (envCode) {
    case 'aistudio-dev':
      return {
        label: 'Dev Sandbox',
        shortLabel: 'Dev',
        badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-500/40 hover:bg-amber-900/80 hover:border-amber-400/60',
        dotColor: 'bg-amber-400',
        description: 'AI Studio Development Workspace'
      };
    case 'aistudio-preview':
      return {
        label: 'Shared Preview',
        shortLabel: 'Preview',
        badgeClass: 'bg-indigo-950/80 text-indigo-300 border-indigo-500/40 hover:bg-indigo-900/80 hover:border-indigo-400/60',
        dotColor: 'bg-indigo-400',
        description: 'AI Studio Shared Demo Preview'
      };
    case 'github-preview':
      return {
        label: 'PR Staging',
        shortLabel: 'Staging',
        badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-500/40 hover:bg-purple-900/80 hover:border-purple-400/60',
        dotColor: 'bg-purple-400',
        description: 'GitHub PR Preview Channel'
      };
    case 'github-deployed':
    default:
      return {
        label: 'Production Live',
        shortLabel: 'Live',
        badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/80 hover:border-emerald-400/60',
        dotColor: 'bg-emerald-400',
        description: 'Live Production Deployment (ajwmes.co.uk)'
      };
  }
}

/**
 * Returns true if the target environment is Production Live ('github-deployed')
 */
export function isProductionEnvironment(envCode: AppEnvironment): boolean {
  return envCode === 'github-deployed';
}

/**
 * Determines whether the Multi-Environment & Release Manager link is enabled.
 * Restricted strictly to Website Administrators ('site') across all environments
 * (Dev, Preview, Staging, and Production) to enforce least-privilege security.
 */
export function canAccessEnvironmentSettings(envCode: AppEnvironment, userRole: UserRole): boolean {
  return userRole === 'site';
}

export interface AuthModalEnvironmentConfig {
  showTestCredentials: boolean;
  showQuickPersonasTab: boolean;
  signInHeading: string;
  createAccountHeading: string;
}

/**
 * Returns authentication modal UI configuration based on the active environment.
 * Preserves test helpers in AI Studio and preview environments,
 * while removing test credentials/quick roles in Production.
 * Uses 'Sign In' and 'Create Your Account' headings across all environments.
 */
export function getAuthModalEnvironmentConfig(envCode: AppEnvironment): AuthModalEnvironmentConfig {
  const isProd = isProductionEnvironment(envCode);
  return {
    showTestCredentials: !isProd,
    showQuickPersonasTab: !isProd,
    signInHeading: 'Sign In',
    createAccountHeading: 'Create Your Account'
  };
}

