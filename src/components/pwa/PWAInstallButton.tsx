import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-all shadow-sm"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-all"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install on iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl text-slate-100">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span>Install AJWMES App</span>
                </h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                Add AJW Marine Electrical to your home screen for offline access and quick booking:
              </p>
              <div className="mt-3 space-y-2 bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                <p>1. Tap the <strong className="text-sky-400">Share</strong> icon at the bottom of Safari.</p>
                <p>2. Scroll down and tap <strong className="text-sky-400">Add to Home Screen</strong>.</p>
                <p>3. Tap <strong className="text-white">Add</strong> in the top right corner.</p>
              </div>
              <button
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

  // Fallback desktop/general install link
  return (
    <button
      onClick={() => {
        alert("To install AJWMES on your mobile device or computer, open this page in Chrome, Edge, or Safari and select 'Install' or 'Add to Home Screen'!");
      }}
      className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-semibold transition-all"
    >
      <Download className="w-3.5 h-3.5" />
      <span>Install PWA</span>
    </button>
  );
};
