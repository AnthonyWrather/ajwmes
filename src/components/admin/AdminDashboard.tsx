import React, { useState, useRef } from 'react';
import { JobRecord, MessageItem, MaterialLineItem, CatalogItem, CatalogSnapshot, PostalOrder, StockAlert } from '../../types';
import { JobDiscussionThread } from '../chat/JobDiscussionThread';
import { DiagnosticTimerModal } from './DiagnosticTimerModal';
import { InventoryManager } from './InventoryManager';
import { PrintLaserAssetStudio } from './PrintLaserAssetStudio';
import { PostalOrdersManager } from './PostalOrdersManager';
import { ImageLightboxModal } from '../common/ImageLightboxModal';
import { 
  Wrench, 
  Clock, 
  Printer, 
  Package, 
  CheckCircle2, 
  ChevronRight, 
  MessageSquare, 
  Plus, 
  DollarSign, 
  ShieldAlert, 
  ShoppingBag, 
  AlertTriangle, 
  Truck, 
  Mail, 
  Cloud, 
  Camera, 
  Eye, 
  Download, 
  ExternalLink, 
  Loader2 
} from 'lucide-react';
import { uploadSwitchPanelImage, isFirebaseStorageUrl, formatFileSize } from '../../lib/storage';

interface AdminDashboardProps {
  jobs: JobRecord[];
  catalog: CatalogItem[];
  snapshots: CatalogSnapshot[];
  postalOrders: PostalOrder[];
  stockAlerts?: StockAlert[];
  onSendMessage: (jobId: string, message: MessageItem) => void;
  onSaveJobSheet: (jobId: string, hours: number, materials: MaterialLineItem[]) => void;
  onUpdateCatalog: (newCatalog: CatalogItem[]) => void;
  onCreateSnapshot: (label: string) => void;
  onRestoreSnapshot: (snapshot: CatalogSnapshot) => void;
  onUpdateOrderStatus: (orderId: string, status: PostalOrder['orderStatus'], trackingNumber?: string, carrier?: string) => void;
  onOpenSupplierReorder?: (item: CatalogItem) => void;
  onViewAlertEmail?: (alert: StockAlert) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  jobs,
  catalog,
  snapshots,
  postalOrders,
  stockAlerts = [],
  onSendMessage,
  onSaveJobSheet,
  onUpdateCatalog,
  onCreateSnapshot,
  onRestoreSnapshot,
  onUpdateOrderStatus,
  onOpenSupplierReorder,
  onViewAlertEmail
}) => {
  const [activeAdminTab, setActiveAdminTab] = useState<'jobs' | 'catalog' | 'orders' | 'print' | 'panels'>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [activeTimerJob, setActiveTimerJob] = useState<JobRecord | null>(null);

  // Lightbox Modal State
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  // Admin upload proof state
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofProgress, setProofProgress] = useState(0);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const selectedJob = jobs.find(j => j.id === selectedJobId) || jobs[0];

  // Top Metrics
  const totalBilled = jobs.reduce((sum, j) => sum + j.totalLabor + j.totalMaterials, 0);
  const totalHours = jobs.reduce((sum, j) => sum + j.diagnosticHours, 0);
  const inProgressCount = jobs.filter(j => j.status === 'in_progress').length;
  const quotePendingCount = jobs.filter(j => j.status === 'quote_requested' || j.status === 'quote_sent').length;
  const pendingOrdersCount = postalOrders.filter(o => o.orderStatus === 'received').length;

  // Inventory level checks
  const zeroStockItems = catalog.filter(item => (item.stockCount ?? 0) === 0 || !item.inStock);
  const zeroStockCount = zeroStockItems.length;

  const lowStockItems = catalog.filter(item => (item.stockCount ?? 0) > 0 && (item.stockCount ?? 0) < 5);
  const lowStockCount = lowStockItems.length;

  // Aggregate all switch panel images across all customer jobs
  const allPanelAssets: Array<{
    jobId: string;
    jobReference: string;
    vesselName: string;
    url: string;
    index: number;
    isCloud: boolean;
  }> = [];

  jobs.forEach(j => {
    if (j.replicaImages && j.replicaImages.length > 0) {
      j.replicaImages.forEach((url, idx) => {
        allPanelAssets.push({
          jobId: j.id,
          jobReference: j.reference,
          vesselName: j.vesselName,
          url,
          index: idx,
          isCloud: isFirebaseStorageUrl(url)
        });
      });
    }
  });

  const handleUploadWorkshopProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

      // Post an update message with the laser proof photo to the discussion thread
      onSendMessage(selectedJob.id, {
        id: `msg-proof-${Date.now()}`,
        sender: 'ajw',
        senderName: 'Anthony (AJW Marine)',
        text: `🔬 [Laser Cut Proof & Test Fitting Photo]\nUploaded to Firebase Cloud Storage (${uploaded.formattedSize}).`,
        timestamp: 'Just now',
        attachments: [uploaded.url]
      });

      alert(`Workshop photo saved to Firebase Cloud Storage and posted to ${selectedJob.vesselName} thread.`);
    } catch (err) {
      console.error('Failed to upload workshop photo:', err);
      alert('Upload failed. Please check network.');
    } finally {
      setIsUploadingProof(false);
      setProofProgress(0);
      if (proofInputRef.current) proofInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full space-y-6 text-slate-100">
      <ImageLightboxModal
        isOpen={!!lightboxUrl}
        imageUrl={lightboxUrl}
        imageTitle={lightboxTitle}
        onClose={() => setLightboxUrl(null)}
      />

      {/* Admin Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AJWMES Field &amp; Workshop Control Center</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 font-mono flex items-center gap-1">
              <Cloud className="w-3.5 h-3.5" />
              <span>Firebase Storage Active</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Anthony's Operations Dashboard
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly diagnostic jobs, replica/custom panel queue, online postal orders &amp; materials inventory.
          </p>
        </div>

        {/* Admin Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl self-start md:self-auto">
          <button
            onClick={() => setActiveAdminTab('jobs')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeAdminTab === 'jobs' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Jobs ({jobs.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('panels')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeAdminTab === 'panels' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Panel Cloud Images ({allPanelAssets.length})</span>
          </button>

          <button
            onClick={() => setActiveAdminTab('orders')}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeAdminTab === 'orders' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Postal Orders ({postalOrders.length})</span>
            {pendingOrdersCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
          </button>

          <button
            onClick={() => setActiveAdminTab('catalog')}
            className={`relative flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeAdminTab === 'catalog' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stock &amp; Catalog</span>
            {zeroStockCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40 animate-pulse">
                <span>🚨 {zeroStockCount} 0-Stock</span>
              </span>
            ) : lowStockCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <AlertTriangle className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                <span>{lowStockCount} Low</span>
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveAdminTab('print')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeAdminTab === 'print' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print &amp; Laser Studio</span>
          </button>
        </div>
      </div>

      {/* Critical Zero-Stock Depletion Warning Banner */}
      {zeroStockCount > 0 && (
        <div className="bg-rose-950/40 border border-rose-500/50 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl shadow-rose-950/40 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 border border-rose-500/40 rounded-xl text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  Critical Zero-Stock Alert
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/30 text-rose-200 border border-rose-500/50">
                  {zeroStockCount} {zeroStockCount === 1 ? 'part depleted' : 'parts depleted'} (0 units)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Automated alert sent to anthonywrather@gmail.com
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Out-of-stock items:{' '}
                <span className="text-white font-medium">
                  {zeroStockItems.map(item => item.name).join(' · ')}
                </span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Total Workload</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 block">
            {jobs.length} Vessels
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{inProgressCount} aboard right now</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Hours Diagnostic Labor</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-sky-400 mt-1 block">
            {totalHours}h Logged
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">@ £25/hr rate</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Gross Recorded</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            £{totalBilled.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Labor &amp; hardware parts</span>
        </div>
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Pending Quotes</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1 block">
            {quotePendingCount} Inquiries
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Replica panels &amp; solar</span>
        </div>
      </div>

      {/* Tab Content: Jobs Queue */}
      {activeAdminTab === 'jobs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Job Queue */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Vessel Job Queue ({jobs.length})
              </span>
              <span className="text-[11px] text-slate-500 font-mono">Gosport + 1hr Travel</span>
            </div>

            <div className="space-y-3">
              {jobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2.5 ${
                    selectedJobId === job.id
                      ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-sky-400 font-bold">{job.reference}</span>
                    <span className={`text-[10px] font-mono capitalize px-2 py-0.5 rounded-full border ${
                      job.status === 'in_progress'
                        ? 'bg-sky-950 text-sky-300 border-sky-500/30'
                        : job.status === 'quote_requested'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                        : 'bg-slate-950 text-slate-300 border-slate-800'
                    }`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm">{job.vesselName}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{job.vesselType} · {job.berthLocation}</p>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                    {job.notes}
                  </p>

                  {/* Panel Photos indicator */}
                  {job.replicaImages && job.replicaImages.length > 0 && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                      <Cloud className="w-3.5 h-3.5" />
                      <span>{job.replicaImages.length} switchboard photos stored in Cloud</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-400">{job.diagnosticHours}h Logged</span>
                      <span>·</span>
                      <span className="font-mono text-sky-400 font-bold">
                        £{(job.totalLabor + job.totalMaterials).toFixed(2)}
                      </span>
                    </div>

                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setActiveTimerJob(job);
                      }}
                      className="px-2.5 py-1 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white border border-sky-500/30 rounded-lg text-[11px] font-semibold transition-colors flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      <span>Log Labor/Parts</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Active Job Thread */}
          <div className="lg:col-span-7 space-y-4">
            {selectedJob ? (
              <>
                <JobDiscussionThread
                  job={selectedJob}
                  currentUserRole="admin"
                  onSendMessage={onSendMessage}
                />

                {/* Anthony's Workshop Proof Upload Box */}
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-white block">Upload Laser Proof / Bench Fitment Photo</span>
                    <span className="text-[11px] text-slate-400">
                      Store high-resolution test cut photos in Firebase Storage to verify with {selectedJob.clientName}.
                    </span>
                  </div>

                  <label className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap">
                    {isUploadingProof ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    <span>{isUploadingProof ? `Uploading (${proofProgress}%)...` : 'Upload Workshop Proof'}</span>
                    <input
                      ref={proofInputRef}
                      type="file"
                      accept="image/*"
                      disabled={isUploadingProof}
                      onChange={handleUploadWorkshopProof}
                      className="hidden"
                    />
                  </label>
                </div>
              </>
            ) : (
              <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                Select a job from the queue to open discussion and billing.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Panel Cloud Images Vault */}
      {activeAdminTab === 'panels' && (
        <div className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
                <Cloud className="w-4 h-4" />
                <span>Firebase Storage · Switchboard Image Repository</span>
              </div>
              <h3 className="text-lg font-bold text-white">
                Customer-Uploaded Panel Photos &amp; Laser CAD Assets
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                All switchboard photos persist permanently in Google Cloud Storage across server restarts and deployments.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs font-mono text-slate-400 block">Total Assets</span>
              <span className="text-xl font-bold font-mono text-emerald-400">
                {allPanelAssets.length} Photos
              </span>
            </div>
          </div>

          {allPanelAssets.length === 0 ? (
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-xs">
              No switch panel images uploaded yet. When users submit replica quotes or design panels, their photos will appear here.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {allPanelAssets.map((asset, idx) => (
                <div
                  key={idx}
                  className="bg-slate-900 border border-slate-800 hover:border-sky-500/60 rounded-2xl overflow-hidden shadow-lg transition-all group flex flex-col justify-between"
                >
                  <div 
                    onClick={() => {
                      setLightboxUrl(asset.url);
                      setLightboxTitle(`${asset.vesselName} - Photo ${asset.index + 1}`);
                    }}
                    className="relative aspect-16/10 bg-slate-950 overflow-hidden cursor-pointer"
                  >
                    <img 
                      src={asset.url} 
                      alt={asset.vesselName} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <span className="px-3 py-1.5 bg-slate-900/90 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-md">
                        <Eye className="w-3.5 h-3.5 text-sky-400" />
                        <span>Inspect in Lightbox</span>
                      </span>
                    </div>

                    <span className="absolute top-2 left-2 text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950/80 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 backdrop-blur-xs">
                      <Cloud className="w-3 h-3" />
                      <span>{asset.isCloud ? 'Firebase Storage' : 'Local Reference'}</span>
                    </span>

                    <span className="absolute bottom-2 left-2 text-[11px] font-bold text-white px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs">
                      {asset.vesselName}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-400 text-[11px]">
                      <span className="font-mono text-sky-400 font-semibold">{asset.jobReference}</span>
                      <span>Photo #{asset.index + 1}</span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 gap-2">
                      <button
                        onClick={() => {
                          setSelectedJobId(asset.jobId);
                          setActiveAdminTab('jobs');
                        }}
                        className="text-[11px] text-sky-400 hover:underline flex items-center gap-1"
                      >
                        <span>Open Job Thread</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>

                      <a
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                        title="Download for LightBurn CAD"
                      >
                        <Download className="w-3 h-3 text-sky-400" />
                        <span>CAD File</span>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab: Online Postal Orders */}
      {activeAdminTab === 'orders' && (
        <PostalOrdersManager
          orders={postalOrders}
          onUpdateOrderStatus={onUpdateOrderStatus}
        />
      )}

      {/* Tab: Catalog & Backups */}
      {activeAdminTab === 'catalog' && (
        <InventoryManager
          catalog={catalog}
          snapshots={snapshots}
          onUpdateCatalog={onUpdateCatalog}
          onCreateSnapshot={onCreateSnapshot}
          onRestoreSnapshot={onRestoreSnapshot}
          onOpenSupplierReorder={onOpenSupplierReorder}
        />
      )}

      {/* Tab: Print & Laser Asset Studio */}
      {activeAdminTab === 'print' && (
        <PrintLaserAssetStudio />
      )}

      {/* Diagnostic Stopwatch & Materials Logger Modal */}
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
