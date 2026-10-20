import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';
import { getPWAInstallState } from '../../utils/pwaInstallCalculations';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const installState = getPWAInstallState({ isInstalled, isInstallable, isIOS });

  // If installed or cannot be installed in current browser environment, hide completely
  if (installState === 'hidden') {
    return null;
  }

  // Chromium / Android / Desktop flow (native prompt available)
  if (installState === 'native_prompt') {
    return (
      <button
        data-testid="pwa-install-button"
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-all shadow-sm"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow (manual Add to Home Screen guide)
  if (installState === 'ios_guide') {
    return (
      <>
        <button
          data-testid="pwa-ios-install-button"
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-all"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install on iPhone</span>
        </button>

        {showIOSGuide && (
          <div
            data-testid="pwa-ios-guide-modal"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          >
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>Install AJWMES App</span>
                </h3>
                <button
                  data-testid="pwa-ios-guide-close-icon"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                  aria-label="Close guide"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Add AJWMES to your home screen for offline access and quick booking:
              </p>
              <div className="mt-3 space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                <p>1. Tap the <strong className="text-sky-400">Share</strong> icon at the bottom of Safari.</p>
                <p>2. Scroll down and tap <strong className="text-sky-400">Add to Home Screen</strong>.</p>
                <p>3. Tap <strong className="text-white">Add</strong> in the top right corner.</p>
              </div>
              <button
                data-testid="pwa-ios-guide-close"
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-sky-600 py-2.5 text-xs font-semibold text-white hover:bg-sky-500 transition-colors shadow-sm"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
