import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseVersionManifest,
  isNewVersionAvailable,
  formatUpdateSummary,
  createSimulatedVersionManifest,
} from './versionCheck';

describe('versionCheck utilities (Issue #18)', () => {
  describe('parseVersionManifest', () => {
    it('parses a valid version manifest object', () => {
      const manifest = parseVersionManifest({
        version: '1.2.0',
        commitSha: '8ba2ee3',
        commitFullSha: '8ba2ee3111111111111111111111111111111111',
        commitMessage: 'feat: add marine switch panel designer',
        branch: 'main',
        buildDate: '2026-10-18',
        fullTag: 'v1.2.0-8ba2ee3',
      });

      assert.ok(manifest);
      assert.equal(manifest.version, '1.2.0');
      assert.equal(manifest.commitSha, '8ba2ee3');
      assert.equal(manifest.fullTag, 'v1.2.0-8ba2ee3');
      assert.equal(manifest.commitMessage, 'feat: add marine switch panel designer');
    });

    it('parses a valid JSON string and synthesizes fullTag when omitted', () => {
      const jsonStr = JSON.stringify({
        version: '1.2.1',
        commitSha: '9cf41a2',
      });
      const manifest = parseVersionManifest(jsonStr);

      assert.ok(manifest);
      assert.equal(manifest.fullTag, 'v1.2.1-9cf41a2');
      assert.equal(manifest.branch, 'main');
    });

    it('returns null for malformed JSON or missing required fields', () => {
      assert.equal(parseVersionManifest('not-json{'), null);
      assert.equal(parseVersionManifest(null), null);
      assert.equal(parseVersionManifest([]), null);
      assert.equal(parseVersionManifest({ version: '1.2.0' }), null);
      assert.equal(parseVersionManifest({ commitSha: '8ba2ee3' }), null);
    });
  });

  describe('isNewVersionAvailable', () => {
    const baseManifest = {
      version: '1.2.0',
      commitSha: '8ba2ee3',
      commitFullSha: '8ba2ee300000',
      commitMessage: 'chore: baseline',
      branch: 'main',
      buildDate: '2026-10-18',
      fullTag: 'v1.2.0-8ba2ee3',
    };

    it('returns false when remote manifest is null or identical to current version', () => {
      assert.equal(isNewVersionAvailable('v1.2.0-8ba2ee3', '8ba2ee3', null), false);
      assert.equal(isNewVersionAvailable('v1.2.0-8ba2ee3', '8ba2ee3', baseManifest), false);
    });

    it('returns true when remote commitSha or fullTag differs from current version', () => {
      const newerManifest = {
        ...baseManifest,
        commitSha: '9cf41a2',
        fullTag: 'v1.2.0-9cf41a2',
      };
      assert.equal(isNewVersionAvailable('v1.2.0-8ba2ee3', '8ba2ee3', newerManifest), true);
    });

    it('returns false if the remote version was already applied on the first refresh', () => {
      const newerManifest = {
        ...baseManifest,
        commitSha: '9cf41a2',
        fullTag: 'v1.2.0-9cf41a2',
      };
      assert.equal(
        isNewVersionAvailable('v1.2.0-8ba2ee3', '8ba2ee3', newerManifest, 'v1.2.0-9cf41a2'),
        false
      );
    });
  });

  describe('formatUpdateSummary & createSimulatedVersionManifest', () => {
    it('formats a readable transition summary with commit message', () => {
      const simulated = createSimulatedVersionManifest('1.2.0', 'main', '9cf41a2');
      assert.equal(simulated.fullTag, 'v1.2.0-9cf41a2');

      const summary = formatUpdateSummary('v1.2.0-8ba2ee3', simulated);
      assert.ok(summary.includes('v1.2.0-8ba2ee3 → v1.2.0-9cf41a2'));
      assert.ok(summary.includes(simulated.commitMessage));
    });
  });
});
