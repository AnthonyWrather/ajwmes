import { describe, it } from 'node:test';
import assert from 'node:assert';
import { 
  APP_VERSION, 
  GIT_COMMIT_SHA, 
  FULL_VERSION_TAG, 
  GITHUB_REPO,
  getVersionInfo, 
  getGitHubCommitUrl, 
  getGitHubRepoUrl, 
  getGitHubReleasesUrl,
  getGitHubCompareUrl
} from '../version';
import { getEnvironmentBadge } from '../lib/environment';

describe('Version & Release Tag Verification', () => {
  it('should export valid semantic version number', () => {
    assert.strictEqual(APP_VERSION, '1.2.0');
    assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/);
  });

  it('should export valid Git commit SHA and full version tag', () => {
    assert.ok(GIT_COMMIT_SHA, 'GIT_COMMIT_SHA must not be empty');
    assert.strictEqual(GIT_COMMIT_SHA.length, 7, 'GIT_COMMIT_SHA should be 7-character short hash');
    assert.match(FULL_VERSION_TAG, /^v\d+\.\d+\.\d+-[a-f0-9]+$/i, 'FULL_VERSION_TAG must format as vX.Y.Z-hash');
    assert.strictEqual(FULL_VERSION_TAG, `v${APP_VERSION}-${GIT_COMMIT_SHA}`);
  });

  it('should generate structured release metadata with Git traceability', () => {
    const info = getVersionInfo();
    assert.strictEqual(info.version, '1.2.0');
    assert.strictEqual(info.commitSha, GIT_COMMIT_SHA);
    assert.strictEqual(info.fullTag, FULL_VERSION_TAG);
    assert.strictEqual(info.githubRepo, 'anthonywrather/ajwmes');
    assert.ok(info.commitMessage, 'commitMessage must be present');
    assert.ok(info.branch, 'branch must be present');
    assert.ok(info.buildDate, 'buildDate must be present');
    assert.strictEqual(info.githubCommitUrl, `https://github.com/anthonywrather/ajwmes/commit/${GIT_COMMIT_SHA}`);
    assert.strictEqual(info.githubRepoUrl, 'https://github.com/anthonywrather/ajwmes');
  });

  it('should generate valid GitHub URLs for commits, repo, and releases', () => {
    const commitUrl = getGitHubCommitUrl('8ba2ee3');
    assert.strictEqual(commitUrl, 'https://github.com/anthonywrather/ajwmes/commit/8ba2ee3');

    const repoUrl = getGitHubRepoUrl();
    assert.strictEqual(repoUrl, 'https://github.com/anthonywrather/ajwmes');

    const releasesUrl = getGitHubReleasesUrl();
    assert.strictEqual(releasesUrl, 'https://github.com/anthonywrather/ajwmes/releases');

    const compareUrl = getGitHubCompareUrl('abc1234', 'def5678');
    assert.strictEqual(compareUrl, 'https://github.com/anthonywrather/ajwmes/compare/abc1234...def5678');
  });

  it('should provide distinct environment badges for each deployment target', () => {
    const devBadge = getEnvironmentBadge('aistudio-dev');
    assert.strictEqual(devBadge.shortLabel, 'Dev');
    assert.ok(devBadge.badgeClass.includes('amber'));

    const previewBadge = getEnvironmentBadge('aistudio-preview');
    assert.strictEqual(previewBadge.shortLabel, 'Preview');
    assert.ok(previewBadge.badgeClass.includes('indigo'));

    const stagingBadge = getEnvironmentBadge('github-preview');
    assert.strictEqual(stagingBadge.shortLabel, 'Staging');
    assert.ok(stagingBadge.badgeClass.includes('purple'));

    const liveBadge = getEnvironmentBadge('github-deployed');
    assert.strictEqual(liveBadge.shortLabel, 'Live');
    assert.ok(liveBadge.badgeClass.includes('emerald'));
  });
});
