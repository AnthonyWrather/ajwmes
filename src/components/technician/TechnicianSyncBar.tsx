import React, { useEffect, useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  CheckCircle2, 
  Camera, 
  PenTool, 
  FileText, 
  CloudUpload
} from 'lucide-react';
import { 
  subscribeToQueueStatus, 
  triggerSyncNow 
} from '../../lib/offlineSync';
import { OfflineSyncQueueStatus } from '../../types';
import { getPontoonConnectionStatus } from '../../utils/offlineQueueCalculations';

interface TechnicianSyncBarProps {
  onSyncCompleted?: () => void;
}

export const TechnicianSyncBar: React.FC<TechnicianSyncBarProps> = ({ onSyncCompleted }) => {
  const [queueStatus, setQueueStatus] = useState<OfflineSyncQueueStatus>({
    totalPending: 0,
    pendingJobs: 0,
    pendingPhotos: 0,
    pendingSignatures: 0,
    isSyncing: false,
    syncProgressPercent: 0,
    lastSyncedAt: null
  });

  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    let prevPending = 0;
    const unsubscribe = subscribeToQueueStatus((status) => {
      if (prevPending > 0 && status.totalPending === 0 && !status.isSyncing && status.lastSyncedAt) {
        setFeedbackNotice(`Successfully synced ${prevPending} queued items!`);
        if (onSyncCompleted) onSyncCompleted();
        setTimeout(() => setFeedbackNotice(null), 15000);
      }
      prevPending = status.totalPending;
      setQueueStatus(status);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, [onSyncCompleted]);

  const handleManualSync = async () => {
    if (queueStatus.totalPending === 0) {
      setFeedbackNotice('All pontoon items already synchronized!');
      setTimeout(() => setFeedbackNotice(null), 15000);
      return;
    }
    const res = await triggerSyncNow();
    if (res.success && res.syncedCount > 0) {
      setFeedbackNotice(`Successfully synced ${res.syncedCount} queued items!`);
      if (onSyncCompleted) onSyncCompleted();
    } else if (!res.success) {
      setFeedbackNotice(`Sync notice: ${res.errors.join(', ') || 'Offline'}`);
    }
    setTimeout(() => setFeedbackNotice(null), 15000);
  };

  const { totalPending, pendingPhotos, pendingSignatures, pendingJobs, isSyncing, syncProgressPercent, lastSyncedAt } = queueStatus;
  const statusInfo = getPontoonConnectionStatus(isOnline, totalPending, lastSyncedAt);

  return (
    <div 
      data-testid="technician-sync-bar" 
      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status indicator */}
        <div className="flex items-center gap-3">
          <div 
            data-testid="sync-status-indicator"
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
              !isOnline
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-400'
                : totalPending > 0
                ? 'bg-sky-950/60 border-sky-500/40 text-sky-400'
                : 'bg-emerald-950/60 border-emerald-500/40 text-emerald-400'
            }`}
          >
            {!isOnline ? (
              <WifiOff className="w-4 h-4" />
            ) : totalPending > 0 ? (
              <CloudUpload className="w-4 h-4" />
            ) : (
              <Wifi className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span 
                data-testid="sync-status-text" 
                className="text-xs font-bold text-white"
              >
                {statusInfo.title}
              </span>
              <span className="text-slate-600">·</span>
              <span 
                data-testid="sync-online-status" 
                className="text-[11px] text-slate-400 font-mono"
              >
                {statusInfo.statusBadge}
              </span>
            </div>
            <p 
              data-testid="sync-status-description" 
              className="text-[11px] text-slate-400 mt-0.5"
            >
              {statusInfo.description}
            </p>
          </div>
        </div>

        {/* Action Controls & Queue Badges */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {totalPending > 0 && (
            <div 
              data-testid="sync-queue-badge" 
              className="flex items-center gap-2 text-[11px] font-mono text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800"
            >
              {pendingPhotos > 0 && (
                <span 
                  data-testid="pending-photos-count" 
                  className="flex items-center gap-1 text-amber-400"
                >
                  <Camera className="w-3 h-3" />
                  <span>{pendingPhotos} Photos</span>
                </span>
              )}
              {pendingSignatures > 0 && (
                <span 
                  data-testid="pending-signatures-count" 
                  className="flex items-center gap-1 text-emerald-400"
                >
                  <PenTool className="w-3 h-3" />
                  <span>{pendingSignatures} Signatures</span>
                </span>
              )}
              {pendingJobs > 0 && (
                <span 
                  data-testid="pending-jobs-count" 
                  className="flex items-center gap-1 text-sky-400"
                >
                  <FileText className="w-3 h-3" />
                  <span>{pendingJobs} Sheets</span>
                </span>
              )}
            </div>
          )}

          <button
            data-testid="manual-sync-button"
            onClick={handleManualSync}
            disabled={isSyncing || (!isOnline && totalPending === 0)}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar when syncing */}
      {isSyncing && (
        <div data-testid="sync-progress-bar" className="space-y-1 pt-1">
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>Uploading to Firebase Cloud Storage &amp; Firestore...</span>
            <span className="text-amber-400 font-bold">{syncProgressPercent}%</span>
          </div>
          <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-amber-500 to-emerald-400 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${syncProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      {feedbackNotice && (
        <div 
          data-testid="sync-feedback-notice" 
          className="text-[11px] text-emerald-300 font-medium bg-emerald-950/40 border border-emerald-500/30 px-3 py-1.5 rounded-lg flex items-center gap-2"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{feedbackNotice}</span>
        </div>
      )}
    </div>
  );
};
