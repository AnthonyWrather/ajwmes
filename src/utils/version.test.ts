import { describe, it } from 'node:test';
import assert from 'node:assert';
import { APP_VERSION, getVersionInfo } from '../version';
import { getEnvironmentBadge } from '../lib/environment';

describe('Version & Release Tag Verification', () => {
  it('should export valid semantic version number', () => {
    assert.strictEqual(APP_VERSION, '1.2.0');
    assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/);
  });

  it('should generate structured release metadata', () => {
    const info = getVersionInfo();
    assert.strictEqual(info.version, '1.2.0');
    assert.strictEqual(info.fullTag, 'v1.2.0');
    assert.strictEqual(info.releaseChannel, 'production');
    assert.ok(info.buildDate);
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
