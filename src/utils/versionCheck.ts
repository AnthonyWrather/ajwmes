/**
 * Pure Version Manifest & Deployment Rollout Comparison Utilities
 * Used by the in-browser update detector and Service Worker lifecycle controller.
 */

export interface RemoteVersionManifest {
  version: string;
  commitSha: string;
  commitFullSha: string;
  commitMessage: string;
  branch: string;
  buildDate: string;
  fullTag: string;
}

/**
 * Safely parses and validates a raw payload (object or JSON string) from `/version.json`.
 */
export function parseVersionManifest(payload: unknown): RemoteVersionManifest | null {
  let obj: unknown = payload;
  if (typeof payload === 'string') {
    try {
      obj = JSON.parse(payload);
    } catch {
      return null;
    }
  }

  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
    return null;
  }

  const record = obj as Record<string, unknown>;
  const version = typeof record.version === 'string' ? record.version.trim() : '';
  const commitSha = typeof record.commitSha === 'string' ? record.commitSha.trim() : '';
  const fullTag =
    typeof record.fullTag === 'string' && record.fullTag.trim().length > 0
      ? record.fullTag.trim()
      : version && commitSha
      ? `v${version}-${commitSha}`
      : '';

  if (!version || !commitSha || !fullTag) {
    return null;
  }

  return {
    version,
    commitSha,
    commitFullSha:
      typeof record.commitFullSha === 'string' && record.commitFullSha.trim().length > 0
        ? record.commitFullSha.trim()
        : commitSha,
    commitMessage:
      typeof record.commitMessage === 'string' && record.commitMessage.trim().length > 0
        ? record.commitMessage.trim()
        : 'New marine electrical release deployed',
    branch:
      typeof record.branch === 'string' && record.branch.trim().length > 0
        ? record.branch.trim()
        : 'main',
    buildDate:
      typeof record.buildDate === 'string' && record.buildDate.trim().length > 0
        ? record.buildDate.trim()
        : new Date().toISOString().split('T')[0],
    fullTag,
  };
}

/**
 * Determines whether a remote version manifest represents a newly deployed build
 * compared to the currently running application bundle.
 */
export function isNewVersionAvailable(
  currentTag: string,
  currentSha: string,
  remote: RemoteVersionManifest | null,
  alreadyAppliedTag?: string | null
): boolean {
  if (!remote) {
    return false;
  }

  const normalizedCurrentTag = currentTag.trim();
  const normalizedCurrentSha = currentSha.trim();
  const normalizedRemoteTag = remote.fullTag.trim();
  const normalizedRemoteSha = remote.commitSha.trim();

  if (!normalizedRemoteTag || !normalizedRemoteSha) {
    return false;
  }

  // If this exact remote version was already applied on the current session's refresh, do not re-trigger
  if (alreadyAppliedTag && alreadyAppliedTag.trim() === normalizedRemoteTag) {
    return false;
  }

  return (
    normalizedRemoteTag !== normalizedCurrentTag ||
    normalizedRemoteSha !== normalizedCurrentSha
  );
}

/**
 * Formats a concise human-readable summary of the version transition.
 */
export function formatUpdateSummary(
  currentTag: string,
  remote: RemoteVersionManifest
): string {
  const transition = `${currentTag.trim()} → ${remote.fullTag.trim()}`;
  const msg = remote.commitMessage.trim();
  if (!msg) {
    return transition;
  }
  return `${transition} · ${msg}`;
}

/**
 * Builds a deterministic simulated release manifest for admin & E2E verification.
 */
export function createSimulatedVersionManifest(
  currentVersion: string,
  currentBranch: string = 'main',
  simulatedSha: string = '9cf41a2'
): RemoteVersionManifest {
  const cleanVersion = currentVersion.replace(/^v/, '').trim() || '0.0.1';
  const cleanSha = simulatedSha.trim().slice(0, 7) || '9cf41a2';
  return {
    version: cleanVersion,
    commitSha: cleanSha,
    commitFullSha: `${cleanSha}000000000000000000000000000000000`,
    commitMessage: 'feat: deploy instant single-refresh marine release update',
    branch: currentBranch.trim() || 'main',
    buildDate: new Date().toISOString().split('T')[0],
    fullTag: `v${cleanVersion}-${cleanSha}`,
  };
}
