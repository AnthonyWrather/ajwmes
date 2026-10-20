/**
 * Pure PWA Installation State and Visibility Calculations
 * Determines whether the in-app PWA install trigger should be rendered
 * based on current browser capabilities and installation state.
 */

export type PWAInstallState = 'hidden' | 'native_prompt' | 'ios_guide';

export interface PWAInstallCapabilities {
  /** True when running inside a standalone PWA display window or homescreen container */
  isInstalled: boolean;
  /** True when a valid beforeinstallprompt event has been captured and is ready to trigger */
  isInstallable: boolean;
  /** True when the client environment is an Apple iOS mobile device (iPhone/iPad/iPod) */
  isIOS: boolean;
}

/**
 * Calculates the appropriate display mode for the PWA install UI.
 *
 * Rules:
 * 1. If already installed in standalone mode: 'hidden' (no action needed).
 * 2. If the browser fired a native beforeinstallprompt event: 'native_prompt'.
 * 3. If running on iOS Safari in browser mode: 'ios_guide' (manual Add to Home Screen instructions).
 * 4. In all other scenarios (unsupported desktop browser, before prompt fires, dismissed prompt): 'hidden'.
 */
export function getPWAInstallState(capabilities: PWAInstallCapabilities): PWAInstallState {
  if (capabilities.isInstalled) {
    return 'hidden';
  }

  if (capabilities.isInstallable) {
    return 'native_prompt';
  }

  if (capabilities.isIOS) {
    return 'ios_guide';
  }

  return 'hidden';
}

/**
 * Boolean helper indicating whether any install button should be visible in the UI.
 */
export function shouldShowPWAInstallButton(capabilities: PWAInstallCapabilities): boolean {
  return getPWAInstallState(capabilities) !== 'hidden';
}
