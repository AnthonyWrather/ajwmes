import React, { useState, useRef } from 'react';
import { JobRecord, MessageItem, MaterialLineItem, CatalogItem } from '../../types';
import { JobDiscussionThread } from '../chat/JobDiscussionThread';
import { DiagnosticTimerModal } from '../admin/DiagnosticTimerModal';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
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
  Info
} from 'lucide-react';
import { uploadSwitchPanelImage, isFirebaseStorageUrl } from '../../lib/storage';

interface TechnicianWorkspaceProps {
  jobs: JobRecord[];
  catalog: CatalogItem[];
  onSendMessage: (jobId: string, message: MessageItem) => void;
  onSaveJobSheet: (jobId: string, hours: number, materials: MaterialLineItem[]) => void;
  onUpdateJobStatus?: (jobId: string, newStatus: JobRecord['status']) => void;
}

export const TechnicianWorkspace: React.FC<TechnicianWorkspaceProps> = ({
  jobs,
  catalog,
  onSendMessage,
  onSaveJobSheet,
  onUpdateJobStatus
}) => {
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [activeTimerJob, setActiveTimerJob] = useState<JobRecord | null>(null);

  // Lightbox Modal State
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  // Proof upload state
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofProgress, setProofProgress] = useState(0);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

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

  const handleUploadFitmentPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !selectedJob) return;
    const file = e.target.files[0];

    setIsUploadingProof(true);
    setProofProgress(0);

    try {
      const uploaded = await uploadSwitchPanelImage(file, {
        jobReference: selectedJob.reference,
        vesselName: selectedJob.vesselName,
        category: 'cad_export',
        onProgress: (info) => setProofProgress(info.progress)
      });

      // Post update to job thread
      onSendMessage(selectedJob.id, {
        id: `msg-tech-photo-${Date.now()}`,
        sender: 'ajw',
        senderName: 'Solent Field Tech (AJW Marine)',
        text: `🔧 [On-Vessel Work & Fitment Photo]\nTechnician uploaded diagnostic test photo (${uploaded.formattedSize}). Verified with Solent multimeter & test rig.`,
        timestamp: 'Just now',
        attachments: [uploaded.url]
      });

      alert(`Work photo saved to Firebase Cloud Storage and added to ${selectedJob.vesselName} thread.`);
    } catch (err) {
      console.error('Failed to upload technician work photo:', err);
      alert('Photo upload failed. Please verify connection.');
    } finally {
      setIsUploadingProof(false);
      setProofProgress(0);
      if (proofInputRef.current) proofInputRef.current.value = '';
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
      senderName: 'Solent Field Tech (AJW Marine)',
      text: `📋 Technician updated job status to: ${statusLabels[newStatus]}.`,
      timestamp: 'Just now'
    });
  };

  return (
    <div className="w-full space-y-6 text-slate-100">
      {/* Lightbox Modal */}
      <ImageLightboxModal
        isOpen={!!lightboxUrl}
        imageUrl={lightboxUrl}
        imageTitle={lightboxTitle}
        onClose={() => setLightboxUrl(null)}
      />

      {/* Role Banner: Explicitly Clarifies Technician Scope */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Technician Role Active</span>
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-medium">
                Scope: <strong className="text-white">Field &amp; Workshop Jobs Only</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span>Solent Field Technician Workstation</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Authorized to conduct on-vessel diagnostics, log billable hours (£25/hr flat rate), record catalog hardware parts used, discuss faults with boat owners, and document bench installations.
            </p>
          </div>

          {/* Role Boundary Badges */}
          <div className="flex flex-wrap lg:flex-col items-start gap-1.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px]">
            <span className="text-slate-400 font-mono text-[10px] uppercase">Permission Bounds:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Jobs &amp; Labor Sheets: Full Access</span>
            </span>
            <span className="text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-500" />
              <span>Stock &amp; Catalog: Read-Only</span>
            </span>
            <span className="text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-500" />
              <span>Postal Fulfillment: Restricted to Postal Role</span>
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
                onClick={() => setFilterStatus('all')}
                className={`px-2 py-0.5 rounded-md font-mono ${filterStatus === 'all' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterStatus('in_progress')}
                className={`px-2 py-0.5 rounded-md font-mono ${filterStatus === 'in_progress' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Active
              </button>
              <button
                onClick={() => setFilterStatus('scheduled')}
                className={`px-2 py-0.5 rounded-md font-mono ${filterStatus === 'scheduled' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Scheduled
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredJobs.map(job => (
              <div
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2.5 ${
                  selectedJobId === job.id
                    ? 'bg-slate-900 border-amber-500/80 shadow-lg shadow-amber-950/40 ring-1 ring-amber-500/30'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-amber-400 font-bold">{job.reference}</span>
                  <span className={`text-[10px] font-mono capitalize px-2 py-0.5 rounded-full border ${
                    job.status === 'in_progress'
                      ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                      : job.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                      : 'bg-slate-950 text-slate-300 border-slate-800'
                  }`}>
                    {job.status.replace('_', ' ')}
                  </span>
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
                    onClick={e => {
                      e.stopPropagation();
                      setActiveTimerJob(job);
                    }}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm shadow-amber-600/30"
                  >
                    <Clock className="w-3 h-3" />
                    <span>Log Labor / Parts</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Selected Job Workstation */}
        <div className="lg:col-span-7 space-y-4">
          {selectedJob ? (
            <>
              {/* Job Specification & Quick Actions Banner */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <span className="font-mono text-xs text-amber-400 font-bold uppercase tracking-wider block">
                      {selectedJob.reference} · {selectedJob.serviceCategory.replace('_', ' ').toUpperCase()}
                    </span>
                    <h3 className="text-lg font-bold text-white mt-0.5">
                      {selectedJob.vesselName} ({selectedJob.vesselType})
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <Anchor className="w-3.5 h-3.5 text-sky-400" />
                      <span>Berth: {selectedJob.berthLocation}</span>
                      <span>·</span>
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{selectedJob.clientName} ({selectedJob.clientPhone})</span>
                    </p>
                  </div>

                  {/* Stopwatch / Sheet Action Button */}
                  <button
                    onClick={() => setActiveTimerJob(selectedJob)}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-600/30 active:scale-95 transition-all self-start sm:self-auto cursor-pointer"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Open Diagnostic Stopwatch (£25/hr)</span>
                  </button>
                </div>

                {/* Status Switcher & Materials Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 space-y-2">
                    <span className="text-[11px] text-slate-400 font-semibold block uppercase tracking-wider">
                      Progress Status
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        onClick={() => handleQuickStatusChange('scheduled')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          selectedJob.status === 'scheduled' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        Scheduled
                      </button>
                      <button
                        onClick={() => handleQuickStatusChange('in_progress')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                          selectedJob.status === 'in_progress' ? 'bg-amber-600 text-white font-bold' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        In Progress
                      </button>
                      <button
                        onClick={() => handleQuickStatusChange('completed')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
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
                      <span className="text-white font-mono font-bold">£{selectedJob.totalLabor.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-mono">{selectedJob.materialsUsed?.length || 0} Hardware Items:</span>
                      <span className="text-white font-mono font-bold">£{selectedJob.totalMaterials.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

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

              {/* Technician Discussion & Client Chat Thread */}
              <JobDiscussionThread
                job={selectedJob}
                currentUserRole="technician"
                onSendMessage={onSendMessage}
              />

              {/* Upload On-Vessel Fitment Photo */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white block">Document On-Vessel Work (Cloud Storage)</span>
                  <span className="text-[11px] text-slate-400">
                    Snap or upload diagnostic photos, multimeter readings, or completed terminal crimps directly to Google Cloud Storage.
                  </span>
                </div>

                <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap">
                  {isUploadingProof ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                  <span>{isUploadingProof ? `Uploading (${proofProgress}%)...` : 'Upload Fitment Photo'}</span>
                  <input
                    ref={proofInputRef}
                    type="file"
                    accept="image/*"
                    disabled={isUploadingProof}
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
