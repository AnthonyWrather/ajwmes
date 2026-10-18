import { APP_VERSION, FULL_VERSION_TAG, GIT_BRANCH, GIT_COMMIT_SHA } from '../version';
import { getEnvKey } from './envStorage';
import {
  RemoteVersionManifest,
  parseVersionManifest,
  isNewVersionAvailable,
  createSimulatedVersionManifest,
} from '../utils/versionCheck';

export interface AppUpdateState {
  isUpdateAvailable: boolean;
  isChecking: boolean;
  isApplyingUpdate: boolean;
  isBannerMinimized: boolean;
  currentTag: string;
  remoteManifest: RemoteVersionManifest | null;
  lastCheckedAt: string | null;
  statusMessage: string | null;
}

type UpdateListener = (state: AppUpdateState) => void;

const STORAGE_KEY_APPLIED_TAG = 'applied_version_tag';
const STORAGE_KEY_PENDING_MANIFEST = 'pending_update_manifest';

let currentState: AppUpdateState = {
  isUpdateAvailable: false,
  isChecking: false,
  isApplyingUpdate: false,
  isBannerMinimized: false,
  currentTag: FULL_VERSION_TAG,
  remoteManifest: null,
  lastCheckedAt: null,
  statusMessage: null,
};

const listeners = new Set<UpdateListener>();
let waitingServiceWorker: ServiceWorker | null = null;
let isInitialized = false;

function readScopedString(key: string): string | null {
  try {
    return window.localStorage.getItem(getEnvKey(key));
  } catch {
    return null;
  }
}

function writeScopedString(key: string, value: string | null): void {
  try {
    const scopedKey = getEnvKey(key);
    if (value === null) {
      window.localStorage.removeItem(scopedKey);
    } else {
      window.localStorage.setItem(scopedKey, value);
    }
  } catch {
    // Ignore storage quota / private browsing errors
  }
}

function notifyListeners(): void {
  const snapshot = { ...currentState };
  listeners.forEach((listener) => listener(snapshot));
}

function updateState(partial: Partial<AppUpdateState>): void {
  currentState = {
    ...currentState,
    ...partial,
  };
  notifyListeners();
}

export function getAppUpdateState(): AppUpdateState {
  const appliedTag = typeof window !== 'undefined' ? readScopedString(STORAGE_KEY_APPLIED_TAG) : null;
  if (appliedTag && appliedTag !== currentState.currentTag && !currentState.isUpdateAvailable) {
    currentState = {
      ...currentState,
      currentTag: appliedTag,
    };
  }
  return { ...currentState };
}

export function subscribeAppUpdateState(listener: UpdateListener): () => void {
  listeners.add(listener);
  listener(getAppUpdateState());
  return () => {
    listeners.delete(listener);
  };
}

export function setUpdateBannerMinimized(minimized: boolean): void {
  updateState({ isBannerMinimized: minimized });
}

/**
 * Purges all Service Worker Cache Storage entries so the next navigation
 * fetches fresh HTML and asset bundles directly from the network.
 */
async function purgeStaleServiceWorkerCaches(): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) {
    return;
  }
  try {
    const cacheNames = await window.caches.keys();
    await Promise.all(cacheNames.map((name) => window.caches.delete(name)));
  } catch {
    // Ignore cache API failures in restricted contexts
  }
}

/**
 * Queries `/version.json` (bypassing browser & SW caches) and checks Service Worker registration
 * to detect newly rolled-out releases immediately.
 */
export async function checkForAppUpdate(options?: { manual?: boolean }): Promise<boolean> {
  if (typeof window === 'undefined') {
    return false;
  }

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    if (options?.manual) {
      updateState({
        isChecking: false,
        statusMessage: 'Offline — using cached release',
      });
    }
    return false;
  }

  updateState({
    isChecking: true,
    statusMessage: options?.manual ? 'Checking for newly deployed release...' : currentState.statusMessage,
  });

  // Trigger Service Worker script update check in parallel if supported
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        await registration.update().catch(() => {});
        if (registration.waiting) {
          waitingServiceWorker = registration.waiting;
        }
      }
    } catch {
      // Service worker unavailable in current context
    }
  }

  try {
    const response = await fetch(`/version.json?t=${Date.now()}`, {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
    });

    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    if (!response.ok) {
      updateState({
        isChecking: false,
        lastCheckedAt: nowTime,
        statusMessage: options?.manual ? `Release check completed (${ currentState.currentTag } is active)` : currentState.statusMessage,
      });
      return false;
    }

    const rawJson: unknown = await response.json();
    const remoteManifest = parseVersionManifest(rawJson);
    const appliedTag = readScopedString(STORAGE_KEY_APPLIED_TAG);
    const activeCurrentTag = appliedTag || FULL_VERSION_TAG;

    // If a simulated rollout was just applied (appliedTag !== FULL_VERSION_TAG) and the local server
    // still serves the baseline FULL_VERSION_TAG, keep the applied version active without re-triggering.
    if (remoteManifest && appliedTag && remoteManifest.fullTag === FULL_VERSION_TAG) {
      updateState({
        isChecking: false,
        currentTag: activeCurrentTag,
        lastCheckedAt: nowTime,
        statusMessage: options?.manual
          ? `Up to date — running latest release (${activeCurrentTag})`
          : currentState.statusMessage,
      });
      return false;
    }

    if (isNewVersionAvailable(activeCurrentTag, GIT_COMMIT_SHA, remoteManifest, appliedTag) && remoteManifest) {
      writeScopedString(STORAGE_KEY_PENDING_MANIFEST, JSON.stringify(remoteManifest));
      updateState({
        isChecking: false,
        isUpdateAvailable: true,
        currentTag: activeCurrentTag,
        remoteManifest,
        lastCheckedAt: nowTime,
        statusMessage: `New release ${remoteManifest.fullTag} is available for immediate deployment.`,
      });
      return true;
    }

    updateState({
      isChecking: false,
      currentTag: activeCurrentTag,
      lastCheckedAt: nowTime,
      statusMessage: options?.manual
        ? `Up to date — running latest release (${activeCurrentTag})`
        : currentState.statusMessage,
    });
    return false;
  } catch {
    updateState({
      isChecking: false,
      statusMessage: options?.manual ? 'Offline — using cached release' : currentState.statusMessage,
    });
    return false;
  }
}

/**
 * Simulates a new version deployment rollout in the browser for Admin / QA verification.
 */
export function simulateNewVersionRollout(customSha?: string): RemoteVersionManifest {
  const simulated = createSimulatedVersionManifest(APP_VERSION, GIT_BRANCH, customSha || '9cf41a2');
  writeScopedString(STORAGE_KEY_APPLIED_TAG, null);
  writeScopedString(STORAGE_KEY_PENDING_MANIFEST, JSON.stringify(simulated));
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  updateState({
    isUpdateAvailable: true,
    isBannerMinimized: false,
    isChecking: false,
    currentTag: FULL_VERSION_TAG,
    remoteManifest: simulated,
    lastCheckedAt: nowTime,
    statusMessage: `Simulated rollout ${simulated.fullTag} detected and ready to deploy.`,
  });
  return simulated;
}

/**
 * Activates the new release immediately on the first refresh:
 * 1. Sends SKIP_WAITING to any waiting Service Worker
 * 2. Purges stale Workbox/runtime caches
 * 3. Records the target version tag in environment-scoped storage
 * 4. Reloads the browser once into the updated build
 */
export async function applyAppUpdate(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const targetTag = currentState.remoteManifest?.fullTag || FULL_VERSION_TAG;
  updateState({
    isApplyingUpdate: true,
    statusMessage: `Deploying ${targetTag}...`,
  });

  writeScopedString(STORAGE_KEY_APPLIED_TAG, targetTag);
  writeScopedString(STORAGE_KEY_PENDING_MANIFEST, null);

  if (waitingServiceWorker) {
    try {
      waitingServiceWorker.postMessage({ type: 'SKIP_WAITING' });
    } catch {
      // Ignore postMessage failure
    }
  }

  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    } catch {
      // Ignore SW lookup error
    }
  }

  await purgeStaleServiceWorkerCaches();

  updateState({
    isUpdateAvailable: false,
    isApplyingUpdate: false,
    isBannerMinimized: false,
    currentTag: targetTag,
    remoteManifest: null,
    statusMessage: `Updated to ${targetTag}`,
  });

  window.location.reload();
}

/**
 * Initializes the browser update monitor & first-refresh lifecycle coordinator.
 */
export function initAppUpdater(): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }

  // If the user refreshed the browser manually while a pending update was queued,
  // finalize the pending update immediately so the very first refresh deploys it.
  const pendingRaw = readScopedString(STORAGE_KEY_PENDING_MANIFEST);
  if (pendingRaw) {
    const pendingManifest = parseVersionManifest(pendingRaw);
    writeScopedString(STORAGE_KEY_PENDING_MANIFEST, null);
    if (pendingManifest) {
      writeScopedString(STORAGE_KEY_APPLIED_TAG, pendingManifest.fullTag);
      void purgeStaleServiceWorkerCaches();
      currentState = {
        ...currentState,
        isUpdateAvailable: false,
        currentTag: pendingManifest.fullTag,
        remoteManifest: null,
        statusMessage: `Deployed ${pendingManifest.fullTag} on first refresh.`,
      };
    }
  } else {
    const appliedTag = readScopedString(STORAGE_KEY_APPLIED_TAG);
    if (appliedTag) {
      currentState = {
        ...currentState,
        currentTag: appliedTag,
      };
    }
  }

  if (isInitialized) {
    notifyListeners();
    return () => {};
  }
  isInitialized = true;

  // Monitor Service Worker registration lifecycle
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .getRegistration()
      .then((registration) => {
        if (!registration) return;

        if (registration.waiting) {
          waitingServiceWorker = registration.waiting;
          void checkForAppUpdate();
        }

        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              waitingServiceWorker = installingWorker;
              void checkForAppUpdate();
            }
          });
        });
      })
      .catch(() => {});
  }

  // Initial check on startup
  void checkForAppUpdate();

  // Re-check whenever the tab regains visibility or window focus, or comes back online
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      void checkForAppUpdate();
    }
  };
  const handleWindowFocus = () => {
    void checkForAppUpdate();
  };
  const handleOnline = () => {
    void checkForAppUpdate();
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);
  window.addEventListener('focus', handleWindowFocus);
  window.addEventListener('online', handleOnline);

  // Periodic background check every 60 seconds when tab is visible
  const intervalId = window.setInterval(() => {
    if (document.visibilityState === 'visible') {
      void checkForAppUpdate();
    }
  }, 60_000);

  return () => {
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    window.removeEventListener('focus', handleWindowFocus);
    window.removeEventListener('online', handleOnline);
    window.clearInterval(intervalId);
    isInitialized = false;
  };
}
