import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPWAInstallState,
  shouldShowPWAInstallButton,
  PWAInstallCapabilities,
} from './pwaInstallCalculations';

describe('pwaInstallCalculations utility suite', () => {
  describe('getPWAInstallState', () => {
    it('returns "hidden" when the application is already installed, regardless of other flags', () => {
      const cases: PWAInstallCapabilities[] = [
        { isInstalled: true, isInstallable: true, isIOS: true },
        { isInstalled: true, isInstallable: true, isIOS: false },
        { isInstalled: true, isInstallable: false, isIOS: true },
        { isInstalled: true, isInstallable: false, isIOS: false },
      ];

      for (const cap of cases) {
        assert.equal(
          getPWAInstallState(cap),
          'hidden',
          `Expected 'hidden' for capabilities: ${JSON.stringify(cap)}`
        );
      }
    });

    it('returns "native_prompt" when beforeinstallprompt is ready on non-installed clients', () => {
      const capNonIOS: PWAInstallCapabilities = {
        isInstalled: false,
        isInstallable: true,
        isIOS: false,
      };
      assert.equal(getPWAInstallState(capNonIOS), 'native_prompt');

      // Even if iOS somehow dispatched beforeinstallprompt (future WebKit), prefer native prompt
      const capIOS: PWAInstallCapabilities = {
        isInstalled: false,
        isInstallable: true,
        isIOS: true,
      };
      assert.equal(getPWAInstallState(capIOS), 'native_prompt');
    });

    it('returns "ios_guide" for iOS mobile devices in standard browser mode without native prompt', () => {
      const cap: PWAInstallCapabilities = {
        isInstalled: false,
        isInstallable: false,
        isIOS: true,
      };
      assert.equal(getPWAInstallState(cap), 'ios_guide');
    });

    it('returns "hidden" for desktop / unsupported browsers when beforeinstallprompt has not fired', () => {
      const cap: PWAInstallCapabilities = {
        isInstalled: false,
        isInstallable: false,
        isIOS: false,
      };
      assert.equal(getPWAInstallState(cap), 'hidden');
    });
  });

  describe('shouldShowPWAInstallButton', () => {
    it('returns false when getPWAInstallState evaluates to "hidden"', () => {
      assert.equal(
        shouldShowPWAInstallButton({ isInstalled: false, isInstallable: false, isIOS: false }),
        false
      );
      assert.equal(
        shouldShowPWAInstallButton({ isInstalled: true, isInstallable: true, isIOS: false }),
        false
      );
      assert.equal(
        shouldShowPWAInstallButton({ isInstalled: true, isInstallable: false, isIOS: true }),
        false
      );
    });

    it('returns true when getPWAInstallState evaluates to "native_prompt" or "ios_guide"', () => {
      assert.equal(
        shouldShowPWAInstallButton({ isInstalled: false, isInstallable: true, isIOS: false }),
        true
      );
      assert.equal(
        shouldShowPWAInstallButton({ isInstalled: false, isInstallable: false, isIOS: true }),
        true
      );
    });
  });
});
