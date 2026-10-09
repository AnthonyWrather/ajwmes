import React, { useState } from 'react';
import { 
  WifiOff, 
  RefreshCw, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  X, 
  CheckCircle2, 
  Database,
  Radio,
  SlidersHorizontal
} from 'lucide-react';
import { FirestoreConnectionState } from '../../types';

interface FirestoreSyncBannerProps {
  connectionState: FirestoreConnectionState;
  onRetry: () => Promise<boolean | void>;
  onToggleSimulatedOffline?: (forceOffline: boolean) => Promise<boolean | void>;
}

export const FirestoreSyncBanner: React.FC<FirestoreSyncBannerProps> = ({
  connectionState,
  onRetry,
  onToggleSimulatedOffline,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [reconnectSuccessNotice, setReconnectSuccessNotice] = useState(false);

  const { isConnected, isChecking, lastConnectedAt, isSimulatedOffline } = connectionState;

  // Handle manual retry with feedback
  const handleManualRetry = async () => {
    const success = await onRetry();
    if (success) {
      setReconnectSuccessNotice(true);
      setTimeout(() => {
        setReconnectSuccessNotice(false);
        setIsDismissed(false);
      }, 4000);
    }
  };

  // If connected and no temporary reconnect success notice, render nothing (subtle!)
  if (isConnected && !reconnectSuccessNotice) {
    return null;
  }

  // Temporary reconnect success toast ribbon
  if (isConnected && reconnectSuccessNotice) {
    return (
      <aside 
        aria-label="Firestore connection restored"
        className="w-full bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-200 px-4 py-2 text-xs transition-all animate-in slide-in-from-top-2 duration-300"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-semibold text-emerald-100">
              Firestore Reconnected:
            </span>
            <span className="text-emerald-300/90 text-[11px] sm:text-xs">
              Live sync active. Local changes have been synchronized with Anthony's Solent workshop database.
            </span>
          </div>
          <button
            onClick={() => setReconnectSuccessNotice(false)}
            className="text-emerald-400 hover:text-white p-1 rounded transition-colors"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    );
  }

  // Minimized state when user chooses to minimize
  if (isDismissed) {
    return (
      <aside 
        aria-label="Firestore offline status banner"
        className="w-full bg-slate-950/95 border-b border-amber-500/30 px-3 py-1 text-[11px] text-amber-300 flex items-center justify-between shadow-sm transition-all"
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <button
            onClick={() => setIsDismissed(false)}
            className="flex items-center gap-2 hover:text-amber-100 transition-colors cursor-pointer group text-left"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
            </span>
            <span className="font-semibold text-amber-200 group-hover:underline">
              ⚠️ Firestore Offline · Data sync delayed
            </span>
            <span className="text-amber-400/70 text-[10px] hidden sm:inline">
              (Click to expand details)
            </span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualRetry}
              disabled={isChecking}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-[10px] font-semibold transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin text-amber-400' : ''}`} />
              <span>{isChecking ? 'Retrying...' : 'Retry Sync'}</span>
            </button>
            <button
              onClick={() => setIsDismissed(false)}
              className="p-0.5 text-amber-400/80 hover:text-amber-100 transition-colors"
              title="Expand status banner"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    );
  }

  // Full subtle top indicator banner
  return (
    <aside 
      aria-label="Firestore connection warning"
      className="w-full bg-gradient-to-r from-slate-950 via-amber-950/70 to-slate-950 border-b border-amber-500/30 text-amber-100 shadow-md backdrop-blur-md transition-all animate-in slide-in-from-top-1 duration-200 relative z-40"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          {/* Left: Icon, warning badge and primary notice */}
          <div className="flex items-start sm:items-center gap-2.5 min-w-0">
            <div className="p-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 shrink-0 mt-0.5 sm:mt-0 shadow-inner">
              <WifiOff className="w-4 h-4" />
            </div>

            <div className="space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-mono font-bold uppercase tracking-wider text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  Firestore Disconnected
                </span>
                <span className="text-[11px] font-semibold text-amber-100">
                  Data sync is delayed
                </span>
                {lastConnectedAt && (
                  <span className="text-[10px] text-amber-300/60 font-mono hidden lg:inline">
                    · Last sync: {lastConnectedAt}
                  </span>
                )}
                {isSimulatedOffline && (
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-900/60 text-amber-300 border border-amber-600/40">
                    Simulation Active
                  </span>
                )}
              </div>

              <p className="text-[11px] sm:text-xs text-amber-200/80 leading-normal">
                You are currently disconnected from Firestore. Quotes, diagnostic logs, and specs are safely preserved in local storage and will sync automatically once reconnected.
              </p>
            </div>
          </div>

          {/* Right: Actions (Retry, Details toggle, Minimize) */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center pt-1 md:pt-0">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-[11px] font-medium text-amber-300/90 hover:text-white flex items-center gap-1 px-2 py-1 rounded hover:bg-amber-500/10 transition-colors cursor-pointer"
              title="Show sync details and offline behavior"
            >
              <Info className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Sync Details</span>
              {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            {/* Manual Retry Reconnection button */}
            <button
              onClick={handleManualRetry}
              disabled={isChecking}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 text-xs font-bold transition-all shadow-sm shadow-amber-500/20 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
              <span>{isChecking ? 'Reconnecting...' : 'Retry Connection'}</span>
            </button>

            {/* Minimize / Dismiss button */}
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1.5 text-amber-400/80 hover:text-amber-100 hover:bg-amber-500/20 rounded-md transition-colors"
              title="Minimize warning banner"
              aria-label="Minimize warning banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expandable Technical Sync & Offline Details */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-amber-500/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px] text-amber-200/90 animate-in fade-in duration-150">
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-amber-500/20 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <Database className="w-3.5 h-3.5" />
                <span>Local Caching Active</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                All booking submissions, switch panel laser presets, and boat owner vessel specifications continue to function uninterrupted in the browser's persistent cache.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-amber-500/20 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                <Radio className="w-3.5 h-3.5" />
                <span>Auto-Reconnection</span>
              </div>
              <p className="text-[10px] text-slate-300 leading-relaxed">
                The application monitors browser network events and periodic heartbeat pings to resume Firestore bidirectional updates without requiring a page reload.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-amber-500/20 space-y-1 sm:col-span-2 lg:col-span-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Simulation &amp; Testing</span>
                </div>
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  Toggle simulated disconnection to verify how offline warnings and queued sync actions behave.
                </p>
              </div>

              {onToggleSimulatedOffline && (
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => onToggleSimulatedOffline(!isSimulatedOffline)}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-200 border border-amber-500/30 text-[10px] font-medium transition-colors cursor-pointer"
                  >
                    {isSimulatedOffline ? 'Resume Real Network' : 'Simulate Offline Mode'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
