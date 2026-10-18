import React from 'react';
import { RefreshCw, Sparkles, ArrowRight, X } from 'lucide-react';
import { AppUpdateState } from '../../lib/appUpdater';

interface AppUpdateBannerProps {
  updateState: AppUpdateState;
  onApplyUpdate: () => Promise<void>;
  onMinimize: () => void;
}

export const AppUpdateBanner: React.FC<AppUpdateBannerProps> = ({
  updateState,
  onApplyUpdate,
  onMinimize,
}) => {
  const { isUpdateAvailable, isApplyingUpdate, isBannerMinimized, currentTag, remoteManifest } = updateState;

  if (!isUpdateAvailable || !remoteManifest || isBannerMinimized) {
    return null;
  }

  return (
    <section
      role="region"
      aria-label="Application update available"
      data-testid="app-update-banner"
      className="w-full max-w-full overflow-hidden bg-gradient-to-r from-slate-950 via-cyan-950/90 to-slate-950 border-b border-cyan-400/40 text-cyan-50 shadow-lg backdrop-blur-md transition-all animate-in slide-in-from-top-1 duration-200 relative z-50"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 min-w-0">
          {/* Left: Update Beacon, Version Transition & Commit Message */}
          <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-300 shrink-0 mt-0.5 sm:mt-0 shadow-inner">
              <Sparkles className="w-4 h-4" />
            </div>

            <div className="space-y-0.5 min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-500/20 border border-cyan-400/40 text-[10px] font-mono font-bold uppercase tracking-wider text-cyan-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  New Version Available
                </span>

                <div className="inline-flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                  <span
                    data-testid="app-update-current-version"
                    className="px-1.5 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-slate-300"
                  >
                    {currentTag}
                  </span>
                  <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span
                    data-testid="app-update-target-version"
                    className="px-1.5 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 font-bold"
                  >
                    {remoteManifest.fullTag}
                  </span>
                </div>
              </div>

              <p className="text-[11px] sm:text-xs text-cyan-100/90 leading-normal break-words">
                A new release has been deployed ({remoteManifest.commitMessage}). Click{' '}
                <strong className="text-white">Update &amp; Refresh Now</strong> or refresh your browser once to activate immediately.
              </p>
            </div>
          </div>

          {/* Right: 1-Click Update CTA & Minimize */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            <button
              type="button"
              data-testid="app-update-reload-button"
              disabled={isApplyingUpdate}
              onClick={() => void onApplyUpdate()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 text-xs font-extrabold transition-all shadow-sm shadow-cyan-500/30 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isApplyingUpdate ? 'animate-spin' : ''}`} />
              {isApplyingUpdate ? (
                <span data-testid="app-update-deploying-state">Deploying Update...</span>
              ) : (
                <span>Update &amp; Refresh Now</span>
              )}
            </button>

            <button
              type="button"
              data-testid="app-update-dismiss-button"
              onClick={onMinimize}
              className="p-1.5 text-cyan-300/80 hover:text-white hover:bg-cyan-500/20 rounded-md transition-colors cursor-pointer"
              title="Minimize update banner (indicator remains in header)"
              aria-label="Minimize update banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
