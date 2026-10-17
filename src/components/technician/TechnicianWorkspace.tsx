import React, { useState, useRef, useEffect } from 'react';
import { 
  JobRecord, 
  MessageItem, 
  MaterialLineItem, 
  CatalogItem,
  CustomerSignOffRecord,
  OfflineQueuedMedia
} from '../../types';
import { JobDiscussionThread } from '../chat/JobDiscussionThread';
import { DiagnosticTimerModal } from '../admin/DiagnosticTimerModal';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { CustomerSignOffModal } from './CustomerSignOffModal';
import { TechnicianSyncBar } from './TechnicianSyncBar';
import { 
  Wrench, 
  Clock, 
  Package, 
  CheckCircle2, 
  ChevronRight, 
  Plus, 
  Camera, 
  Cloud, 
  Loader2, 
  AlertCircle, 
  MapPin, 
  Anchor, 
  ShieldCheck, 
  Filter,
  Play,
  FileText,
  User,
  Phone,
  Mail,
  Zap,
  Info,
  PenTool,
  WifiOff,
  CloudUpload,
  Check
} from 'lucide-react';
import { 
  enqueueOfflinePhoto, 
  enqueueCustomerSignOff, 
  getPendingPhotos, 
  getPendingSignatures,
  triggerSyncNow,
  registerSyncCallbacks
} from '../../lib/offlineSync';

interface TechnicianWorkspaceProps {
  jobs: JobRecord[];
  catalog: CatalogItem[];
  onSendMessage: (jobId: string, message: MessageItem) => void;
  onSaveJobSheet: (jobId: string, hours: number, materials: MaterialLineItem[]) => void;
  onUpdateJobStatus?: (jobId: string, newStatus: JobRecord['status']) => void;
  onCustomerSignOff?: (jobId: string, signOff: CustomerSignOffRecord) => void;
}

export const TechnicianWorkspace: React.FC<TechnicianWorkspaceProps> = ({
  jobs,
  catalog,
  onSendMessage,
  onSaveJobSheet,
  onUpdateJobStatus,
  onCustomerSignOff
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTimerJob, setActiveTimerJob] = useState<JobRecord | null>(null);

  // Sign-off modal state
  const [isSignOffModalOpen, setIsSignOffModalOpen] = useState(false);
  const [localSignOffs, setLocalSignOffs] = useState<Record<string, CustomerSignOffRecord>>({});

  // Offline queued media state
  const [queuedPhotos, setQueuedPhotos] = useState<OfflineQueuedMedia[]>([]);

  // Lightbox Modal State
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  // Proof upload state
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load pending IndexedDB records on mount
  useEffect(() => {
    const loadPendingData = async () => {
      try {
        const [photos, sigs] = await Promise.all([
          getPendingPhotos(),
          getPendingSignatures()
        ]);
        setQueuedPhotos(photos);

        const sigMap: Record<string, CustomerSignOffRecord> = {};
        sigs.forEach(s => {
          sigMap[s.jobId] = s;
        });
        setLocalSignOffs(sigMap);
      } catch (err) {
        console.warn('Error loading pending offline data:', err);
      }
    };

    loadPendingData();

    // Register sync callbacks so synced items update in-memory jobs & chats
    registerSyncCallbacks({
      onJobUpdated: (jobId, hours, materials, signOff) => {
        if (signOff) {
          setLocalSignOffs(prev => ({ ...prev, [jobId]: signOff }));
          if (onCustomerSignOff) onCustomerSignOff(jobId, signOff);
        }
        if (hours > 0 && materials && materials.length > 0) {
          onSaveJobSheet(jobId, hours, materials);
        }
      },
      onPostMessage: (jobId, text, attachments) => {
        onSendMessage(jobId, {
          id: `msg-sync-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          sender: 'ajw',
          senderName: 'Solent Field Tech (AJWMES)',
          text,
          timestamp: 'Just now',
          attachments
        });
      }
    });
  }, [onSaveJobSheet, onSendMessage, onCustomerSignOff]);

  // Filtered jobs
  const filteredJobs = jobs.filter(job => {
    if (filterStatus === 'all') return true;
    return job.status === filterStatus;
  });

  // Technician Metrics
  const totalJobs = jobs.length;
  const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
  const scheduledCount = jobs.filter(j => j.status === 'scheduled').length;
  const totalHoursLogged = Number(jobs.reduce((sum, j) => sum + j.diagnosticHours, 0).toFixed(1));
  const totalMaterialsUsed = jobs.reduce((sum, j) => sum + (j.materialsUsed?.length || 0), 0);

  // Photos for current selected job
  const selectedJobPhotos = queuedPhotos.filter(p => p.jobId === selectedJob?.id);
  const currentSignOff = selectedJob ? (localSignOffs[selectedJob.id] || selectedJob.customerSignOff) : undefined;

  const handleUploadFitmentPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedJob) return;
    const file = e.target.files[0];
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    setIsProcessingPhoto(true);

    try {
      // 1. Compress image client-side and store in IndexedDB queue
      const queuedMedia = await enqueueOfflinePhoto(selectedJob, file, 'work_fitment');
      setQueuedPhotos(prev => [queuedMedia, ...prev]);

      if (isOnline) {
        showToast(`Photo compressed. Syncing to Cloud & Firestore...`, 'info');
        triggerSyncNow().then(res => {
          if (res.success) {
            showToast(`Work photo successfully uploaded and synchronized with Firestore!`, 'success');
            getPendingPhotos().then(setQueuedPhotos);
          } else {
            showToast(`Photo cached locally in IndexedDB queue.`, 'info');
          }
        }).catch(() => {
          showToast(`Photo stored in local pontoon cache.`, 'info');
        });
      } else {
        showToast(
          `Offline Mode: Photo compressed (${(queuedMedia.fileSizeBytes / 1024).toFixed(0)}KB) & cached in Pontoon IndexedDB queue.`,
          'success'
        );

        // Optimistically record into chat thread locally
        onSendMessage(selectedJob.id, {
          id: `msg-tech-photo-offline-${Date.now()}`,
          sender: 'ajw',
          senderName: 'Solent Field Tech (AJWMES)',
          text: `📷 [Offline Pontoon Fitment Photo]\nCaptured aboard ${selectedJob.vesselName}. Cached in local IndexedDB; will upload when back in cellular coverage.`,
          timestamp: 'Just now',
          attachments: [queuedMedia.previewUrl]
        });
      }
    } catch (err: any) {
      console.error('Failed to process technician photo:', err);
      showToast(`Photo processing error: ${err.message || 'Check storage'}`, 'error');
    } finally {
      setIsProcessingPhoto(false);
      if (proofInputRef.current) proofInputRef.current.value = '';
    }
  };

  const handleCustomerSignOffComplete = async (signOff: CustomerSignOffRecord) => {
    if (!selectedJob) return;
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // 1. Save to local state
    setLocalSignOffs(prev => ({ ...prev, [selectedJob.id]: signOff }));
    if (onCustomerSignOff) {
      onCustomerSignOff(selectedJob.id, signOff);
    }

    // 2. Enqueue into IndexedDB
    try {
      await enqueueCustomerSignOff(signOff);

      // Post in chat thread
      onSendMessage(selectedJob.id, {
        id: `msg-signoff-${Date.now()}`,
        sender: 'ajw',
        senderName: `${signOff.clientName} (${signOff.signerRole.replace('_', ' ')})`,
        text: `✍️ [Pontoon Customer Sign-Off]\nCustomer completed handwritten sign-off aboard vessel. Labor: ${signOff.agreedDiagnosticHours}h. Total Estimate: £${signOff.agreedTotalEstimate.toFixed(2)}. Status: ${isOnline ? 'Synced to Cloud' : 'Queued in Offline Storage'}.`,
        timestamp: 'Just now',
        attachments: [signOff.signatureDataUrl]
      });

      if (isOnline) {
        showToast('Sign-off confirmed and synchronized with Firestore!', 'success');
        triggerSyncNow();
      } else {
        showToast('Sign-off captured offline! Stored in Pontoon cache until reconnected.', 'success');
      }
    } catch (err: any) {
      console.error('Failed to enqueue sign-off:', err);
      showToast('Error saving sign-off locally', 'error');
    }
  };

  const handleQuickStatusChange = (newStatus: JobRecord['status']) => {
    if (!selectedJob) return;
    if (onUpdateJobStatus) {
      onUpdateJobStatus(selectedJob.id, newStatus);
    }
    // Post note in chat
    const statusLabels: Record<JobRecord['status'], string> = {
      quote_requested: 'Quote Requested',
      quote_sent: 'Quote Sent',
      quote_accepted: 'Quote Accepted',
      scheduled: 'Scheduled for Pontoon Visit',
      in_progress: 'Aboard Vessel / Diagnostics In Progress',
      completed: 'Diagnostics & Installation Completed'
    };
    onSendMessage(selectedJob.id, {
      id: `msg-status-${Date.now()}`,
      sender: 'ajw',
      senderName: 'Solent Field Tech (AJWMES)',
      text: `📋 Technician updated job status to: ${statusLabels[newStatus]}.`,
      timestamp: 'Just now'
    });
  };

  return (
    <div data-testid="technician-workspace" className="w-full space-y-6 text-slate-100">
      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={!!lightboxUrl}
        imageUrl={lightboxUrl}
        imageTitle={lightboxTitle}
        onClose={() => setLightboxUrl(null)}
      />

      {/* Customer Sign-Off Modal */}
      {selectedJob && (
        <CustomerSignOffModal
          isOpen={isSignOffModalOpen}
          job={selectedJob}
          onClose={() => setIsSignOffModalOpen(false)}
          onSignOffComplete={handleCustomerSignOffComplete}
        />
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2.5 transition-all animate-in slide-in-from-bottom-3 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950 border border-emerald-500/50 text-emerald-200 shadow-emerald-950/50'
            : toastMessage.type === 'error'
            ? 'bg-rose-950 border border-rose-500/50 text-rose-200 shadow-rose-950/50'
            : 'bg-sky-950 border border-sky-500/50 text-sky-200 shadow-sky-950/50'
        }`}>
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : toastMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Synchronisation Bar */}
      <TechnicianSyncBar 
        onSyncCompleted={() => {
          getPendingPhotos().then(setQueuedPhotos);
        }} 
      />

      {/* Role Banner: Field Technician Workstation */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Field Technician Mode Active</span>
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-medium">
                Offline Capability: <strong className="text-emerald-400">IndexedDB + Touch Sign-Off</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span>Solent Field Technician Workstation</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Conduct on-vessel diagnostics aboard berths, log billable hours (£25/hr flat rate), compress &amp; queue multimeter/wiring photos offline, and collect customer touch signatures without cellular service.
            </p>
          </div>

          {/* Role Boundary Badges */}
          <div className="flex flex-wrap lg:flex-col items-start gap-1.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px]">
            <span className="text-slate-400 font-mono text-[10px] uppercase">Pontoon Offline Features:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Offline Photo Queue: IndexedDB</span>
            </span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Pontoon Touchpad Sign-Off: Ready</span>
            </span>
            <span className="text-sky-400 flex items-center gap-1">
              <CloudUpload className="w-3 h-3" />
              <span>Auto-Sync on Reconnect: Enabled</span>
            </span>
          </div>
        </div>
      </div>

      {/* Technician Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Assigned Workload</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 block">
            {totalJobs} Vessels
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{inProgressCount} aboard right now</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Diagnostic Labor</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1 block">
            {totalHoursLogged}h
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Logged at £25.00/hour</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Parts Used Logged</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-sky-400 mt-1 block">
            {totalMaterialsUsed} Items
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Cables, busbars &amp; fuses</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Upcoming Scheduled</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-purple-400 mt-1 block">
            {scheduledCount} Pontoon Visits
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Haslar &amp; Gosport Marina</span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Job Queue & Filter */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Vessel Job Queue ({filteredJobs.length})
            </span>
            {/* Filter pills */}
            <div className="flex items-center gap-1 text-[11px]">
              <button
                data-testid="filter-jobs-all"
                onClick={() => setFilterStatus('all')}
                className={`px-2 py-0.5 rounded-md font-mono cursor-pointer ${filterStatus === 'all' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              <button
                data-testid="filter-jobs-active"
                onClick={() => setFilterStatus('in_progress')}
                className={`px-2 py-0.5 rounded-md font-mono cursor-pointer ${filterStatus === 'in_progress' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Active
              </button>
              <button
                data-testid="filter-jobs-scheduled"
                onClick={() => setFilterStatus('scheduled')}
                className={`px-2 py-0.5 rounded-md font-mono cursor-pointer ${filterStatus === 'scheduled' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Scheduled
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredJobs.map(job => {
              const jobSignOff = localSignOffs[job.id] || job.customerSignOff;
              const hasQueuedPhotos = queuedPhotos.some(p => p.jobId === job.id);

              return (
                <div
                  key={job.id}
                  data-testid={`job-card-${job.id}`}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2.5 ${
                    selectedJobId === job.id
                      ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-amber-400 font-bold">{job.reference}</span>
                      {hasQueuedPhotos && (
                        <span className="text-[10px] font-mono text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded border border-amber-500/40 flex items-center gap-1">
                          <Camera className="w-2.5 h-2.5" />
                          <span>Photos</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {jobSignOff && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-emerald-950 text-emerald-300 border-emerald-500/40 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 text-emerald-400" />
                          <span>Signed</span>
                        </span>
                      )}

                      <span className={`text-[10px] font-mono capitalize px-2 py-0.5 rounded-full border ${
                        job.status === 'in_progress'
                          ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                          : job.status === 'completed'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-950 text-slate-300 border-slate-800'
                      }`}>
                        {(job.status || 'quote_requested').replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center justify-between">
                      <span>{job.vesselName}</span>
                      <span className="text-[11px] font-normal text-slate-400">{job.clientName}</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{job.vesselType} · {job.berthLocation}</span>
                    </p>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/50 p-2 rounded-lg border border-slate-800/60 font-sans">
                    {job.notes || 'No preliminary notes recorded.'}
                  </p>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-300">{job.diagnosticHours}h Logged</span>
                      <span>·</span>
                      <span className="font-mono text-amber-400 font-semibold">
                        {job.materialsUsed?.length || 0} Parts Used
                      </span>
                    </div>

                    <button
                      data-testid={`open-timer-job-${job.id}`}
                      onClick={e => {
                        e.stopPropagation();
                        setActiveTimerJob(job);
                      }}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm shadow-amber-600/30 cursor-pointer"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Log Labor / Parts</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Job Workstation */}
        <div className="lg:col-span-7 space-y-4">
          {selectedJob ? (
            <>
              {/* Job Specification & Quick Actions Banner */}
              <div data-testid="selected-job-details" className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span data-testid="selected-job-reference" className="font-mono text-xs text-amber-400 font-bold uppercase tracking-wider block">
                      {selectedJob.reference} · {(selectedJob.serviceCategory || '').replace(/_/g, ' ').toUpperCase()}
                    </span>
                    <h3 data-testid="selected-job-vessel" className="text-lg font-bold text-white mt-0.5">
                      {selectedJob.vesselName} ({selectedJob.vesselType})
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Anchor className="w-3.5 h-3.5 text-sky-400" />
                      <span data-testid="selected-job-berth">Berth: {selectedJob.berthLocation}</span>
                      <span>·</span>
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedJob.clientName} ({selectedJob.clientPhone})</span>
                    </p>
                  </div>

                  {/* Actions Header: Diagnostic Stopwatch + Customer Sign-Off */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <button
                      data-testid="open-diagnostic-stopwatch-button"
                      onClick={() => setActiveTimerJob(selectedJob)}
                      className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-600/30 active:scale-95 transition-all cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Stopwatch (£25/h)</span>
                    </button>

                    <button
                      data-testid="open-customer-signoff-button"
                      onClick={() => setIsSignOffModalOpen(true)}
                      className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer"
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      <span>{currentSignOff ? 'View Sign-Off' : 'Customer Sign-Off'}</span>
                    </button>
                  </div>
                </div>

                {/* Status Switcher & Materials Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                    <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">
                      Progress Status
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        data-testid="status-btn-scheduled"
                        onClick={() => handleQuickStatusChange('scheduled')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          selectedJob.status === 'scheduled' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Scheduled
                      </button>
                      <button
                        data-testid="status-btn-in_progress"
                        onClick={() => handleQuickStatusChange('in_progress')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          selectedJob.status === 'in_progress' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        data-testid="status-btn-completed"
                        onClick={() => handleQuickStatusChange('completed')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          selectedJob.status === 'completed' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Completed
                      </button>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-1">
                    <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">
                      Recorded Labor &amp; Hardware
                    </span>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-slate-300 font-mono">{selectedJob.diagnosticHours} Hours Labor:</span>
                      <span data-testid="selected-job-labor-total" className="text-white font-mono font-bold">£{selectedJob.totalLabor.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-mono">{selectedJob.materialsUsed?.length || 0} Hardware Items:</span>
                      <span data-testid="selected-job-materials-total" className="text-white font-mono font-bold">£{selectedJob.totalMaterials.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Customer Pontoon Sign-Off Receipt Card (if signed) */}
                {currentSignOff && (
                  <div data-testid="customer-signoff-card" className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-200">
                          Pontoon Sign-Off Captured
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                        currentSignOff.synced 
                           ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' 
                          : 'bg-amber-950 text-amber-300 border-amber-500/40'
                      }`}>
                        {currentSignOff.synced ? 'Synced to Cloud' : 'Queued in Pontoon Cache'}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-0.5">
                        <span className="text-[11px] text-slate-400 block">Signer:</span>
                        <span data-testid="signoff-signer-name" className="font-bold text-white">
                          {currentSignOff.clientName} ({currentSignOff.signerRole.replace('_', ' ')})
                        </span>
                        <span className="text-[10px] text-slate-400 block font-mono">
                          Captured: {new Date(currentSignOff.signedAtOffline).toLocaleString('en-GB')}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[11px] text-slate-400 block">Signature:</span>
                        <div className="bg-slate-950 p-1.5 rounded-lg border border-slate-800 inline-block">
                          <img 
                            data-testid="signoff-signature-img"
                            src={currentSignOff.signatureDataUrl} 
                            alt="Signature" 
                            className="h-10 object-contain invert brightness-200" 
                          />
                        </div>
                      </div>
                    </div>

                    {currentSignOff.customerFeedback && (
                      <p className="text-xs text-slate-300 italic bg-slate-950/60 p-2 rounded-lg border border-slate-800/60">
                        "{currentSignOff.customerFeedback}"
                      </p>
                    )}
                  </div>
                )}

                {/* Materials Used Table */}
                {selectedJob.materialsUsed && selectedJob.materialsUsed.length > 0 && (
                  <div className="p-3 bg-slate-950/40 rounded-xl border border-slate-800/60 space-y-2">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Hardware &amp; Cables Fitted On This Job:
                    </span>
                    <div className="space-y-1">
                      {selectedJob.materialsUsed.map(mat => (
                        <div key={mat.id} className="flex items-center justify-between text-xs py-1 border-b border-slate-800/40 last:border-0">
                          <span className="text-slate-200">{mat.name} ({mat.quantity} {mat.unit})</span>
                          <span className="font-mono text-slate-300">£{(mat.quantity * mat.unitPrice).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Offline Work Photos Gallery */}
              {selectedJobPhotos.length > 0 && (
                <div data-testid="offline-photos-gallery" className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-amber-400" />
                      <span>Photos Stored Locally in Pontoon Queue ({selectedJobPhotos.length})</span>
                    </span>
                    <span data-testid="queued-photos-badge" className="text-[10px] font-mono text-amber-300 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-full">
                      Awaiting Cloud Upload
                    </span>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {selectedJobPhotos.map(photo => (
                      <div 
                        key={photo.id}
                        data-testid={`queued-photo-${photo.id}`}
                        onClick={() => {
                          setLightboxUrl(photo.previewUrl);
                          setLightboxTitle(`Offline Fitment Photo · ${photo.vesselName}`);
                        }}
                        className="group relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950 cursor-pointer hover:border-amber-500 transition-colors"
                      >
                        <img 
                          data-testid="queued-photo-thumbnail"
                          src={photo.previewUrl} 
                          alt="Queued Fitment" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-x-0 bottom-0 p-1 bg-slate-950/80 backdrop-blur-sm text-[9px] font-mono text-slate-300 truncate">
                          {(photo.fileSizeBytes / 1024).toFixed(0)}KB
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technician Discussion & Client Chat Thread */}
              <JobDiscussionThread
                job={selectedJob}
                currentUserRole="technician"
                onSendMessage={onSendMessage}
              />

              {/* Document On-Vessel Work (Camera / Upload Input with Offline-First Compression) */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white block">Document On-Vessel Work (Offline-First Photo Queue)</span>
                  <span className="text-[11px] text-slate-400">
                    Snaps &amp; uploads are compressed to WebP/JPEG locally, stored safely in IndexedDB even with no signal, and automatically synced to Google Cloud Storage.
                  </span>
                </div>

                <label data-testid="capture-photo-button" className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shadow-sm">
                  {isProcessingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  <span>{isProcessingPhoto ? 'Compressing...' : 'Capture / Upload Photo'}</span>
                  <input
                    ref={proofInputRef}
                    data-testid="technician-photo-input"
                    type="file"
                    accept="image/*"
                    disabled={isProcessingPhoto}
                    onChange={handleUploadFitmentPhoto}
                    className="hidden"
                  />
                </label>
              </div>
            </>
          ) : (
            <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
              Select a job from the queue to start diagnostic labor and client updates.
            </div>
          )}
        </div>
      </div>

      {/* Stopwatch & Materials Sheet Modal */}
      {activeTimerJob && (
        <DiagnosticTimerModal
          job={activeTimerJob}
          catalog={catalog}
          onSaveJobSheet={onSaveJobSheet}
          onClose={() => setActiveTimerJob(null)}
        />
      )}
    </div>
  );
};
