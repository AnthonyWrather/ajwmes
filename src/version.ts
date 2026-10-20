/**
 * Application Release & Version Metadata
 * Synchronized with Git commits and GitHub repository metadata.
 */

// Base Semantic Version from package.json or environment
export const APP_VERSION = (import.meta.env?.VITE_APP_VERSION as string) || '0.0.1';

// Git Commit metadata injected at build time
export const GIT_COMMIT_SHA = (
  (import.meta.env?.VITE_GIT_COMMIT_SHA as string) ||
  (import.meta.env?.VITE_GIT_COMMIT_FULL_SHA as string)?.slice(0, 7) ||
  '8ba2ee3'
).slice(0, 7);

export const GIT_COMMIT_FULL_SHA =
  (import.meta.env?.VITE_GIT_COMMIT_FULL_SHA as string) ||
  (import.meta.env?.VITE_GIT_COMMIT_SHA as string) ||
  GIT_COMMIT_SHA;

export const GIT_COMMIT_MESSAGE =
  (import.meta.env?.VITE_GIT_COMMIT_MESSAGE as string) ||
  'feat: synchronize release versioning with github commits';

export const GIT_BRANCH =
  (import.meta.env?.VITE_GIT_BRANCH as string) ||
  'main';

export const GITHUB_REPO =
  (import.meta.env?.VITE_GITHUB_REPO as string) ||
  'anthonywrather/ajwmes';

export const RELEASE_CHANNEL =
  (import.meta.env?.VITE_RELEASE_CHANNEL as string) ||
  'production';

export const RELEASE_BUILD_DATE =
  (import.meta.env?.VITE_BUILD_DATE as string) ||
  '2026-10-15';

// Format confirmed by user: SemVer with short commit hash (e.g. v0.0.1-8ba2ee3)
export const FULL_VERSION_TAG = `v${APP_VERSION}-${GIT_COMMIT_SHA}`;

export interface VersionInfo {
  version: string;
  commitSha: string;
  commitFullSha: string;
  commitMessage: string;
  branch: string;
  githubRepo: string;
  releaseChannel: string;
  buildDate: string;
  fullTag: string;
  githubCommitUrl: string;
  githubRepoUrl: string;
  githubReleasesUrl: string;
}

export function getGitHubCommitUrl(sha: string = GIT_COMMIT_SHA, repo: string = GITHUB_REPO): string {
  return `https://github.com/${repo}/commit/${sha}`;
}

export function getGitHubRepoUrl(repo: string = GITHUB_REPO): string {
  return `https://github.com/${repo}`;
}

export function getGitHubReleasesUrl(repo: string = GITHUB_REPO): string {
  return `https://github.com/${repo}/releases`;
}

export function getGitHubCompareUrl(baseSha: string, targetSha: string, repo: string = GITHUB_REPO): string {
  return `https://github.com/${repo}/compare/${baseSha}...${targetSha}`;
}

export function getVersionInfo(): VersionInfo {
  return {
    version: APP_VERSION,
    commitSha: GIT_COMMIT_SHA,
    commitFullSha: GIT_COMMIT_FULL_SHA,
    commitMessage: GIT_COMMIT_MESSAGE,
    branch: GIT_BRANCH,
    githubRepo: GITHUB_REPO,
    releaseChannel: RELEASE_CHANNEL,
    buildDate: RELEASE_BUILD_DATE,
    fullTag: FULL_VERSION_TAG,
    githubCommitUrl: getGitHubCommitUrl(),
    githubRepoUrl: getGitHubRepoUrl(),
    githubReleasesUrl: getGitHubReleasesUrl()
  };
}
