/**
 * Application Release & Version Metadata
 * Used across the navigation header, environment inspector, and deployment manifests.
 */
export const APP_VERSION = '1.2.0';
export const RELEASE_CHANNEL = 'production';
export const RELEASE_BUILD_DATE = '2026-10-14';

export interface VersionInfo {
  version: string;
  releaseChannel: string;
  buildDate: string;
  fullTag: string;
}

export function getVersionInfo(): VersionInfo {
  return {
    version: APP_VERSION,
    releaseChannel: RELEASE_CHANNEL,
    buildDate: RELEASE_BUILD_DATE,
    fullTag: `v${APP_VERSION}`
  };
}
