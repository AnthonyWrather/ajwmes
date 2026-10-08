import React, { useState } from 'react';
import { JobRecord, MessageItem, MaterialLineItem, CatalogItem, CatalogSnapshot, PostalOrder, StockAlert } from '../../types';
import { JobDiscussionThread } from '../chat/JobDiscussionThread';
import { DiagnosticTimerModal } from './DiagnosticTimerModal';
import { InventoryManager } from './InventoryManager';
import { PrintLaserAssetStudio } from './PrintLaserAssetStudio';
import { PostalOrdersManager } from './PostalOrdersManager';
import { Wrench, Clock, Printer, Package, CheckCircle2, ChevronRight, MessageSquare, Plus, DollarSign, ShieldAlert, ShoppingBag, AlertTriangle, Truck, Mail } from 'lucide-react';

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
  const [activeAdminTab, setActiveAdminTab] = useState<'jobs' | 'catalog' | 'orders' | 'print'>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<string>(jobs[0]?.id || '');
  const [activeTimerJob, setActiveTimerJob] = useState<JobRecord | null>(null);

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


  return (
    <div className="w-full space-y-6 text-slate-100">
      {/* Admin Control Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AJWMES Field &amp; Workshop Control Center</span>
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

          <div className="flex flex-wrap items-center gap-2 self-start md:self-center shrink-0">
            {zeroStockItems[0] && onOpenSupplierReorder && (
              <button
                onClick={() => onOpenSupplierReorder(zeroStockItems[0])}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-900/40 transition-colors"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Reorder from Supplier ({zeroStockItems[0].name.slice(0, 16)}...)</span>
              </button>
            )}

            {stockAlerts.length > 0 && onViewAlertEmail && (
              <button
                onClick={() => onViewAlertEmail(stockAlerts[0])}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="View recent automated stock alert email"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>View Alert Email</span>
              </button>
            )}

            <button
              onClick={() => setActiveAdminTab('catalog')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
            >
              <span>Manage Catalog</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Proactive Low Inventory Warning Banner */}
      {lowStockCount > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-lg shadow-amber-950/30">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                  Proactive Inventory Warning
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-500/25 text-amber-200 border border-amber-500/40">
                  {lowStockCount} {lowStockCount === 1 ? 'item' : 'items'} under 5 units
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Low hardware reserves detected:{' '}
                <span className="text-white font-medium">
                  {lowStockItems.slice(0, 3).map(item => `${item.name} (${item.stockCount} left)`).join(' · ')}
                  {lowStockItems.length > 3 ? ` +${lowStockItems.length - 3} more` : ''}
                </span>
                . Reorder soon to maintain fast vessel turnarounds.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveAdminTab('catalog')}
            className="self-start md:self-center px-3.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
          >
            <span>Manage Inventory &amp; Restock</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
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

      {/* Tab Content */}
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
          <div className="lg:col-span-7">
            {selectedJob ? (
              <JobDiscussionThread
                job={selectedJob}
                currentUserRole="admin"
                onSendMessage={onSendMessage}
              />
            ) : (
              <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
                Select a job from the queue to open discussion and billing.
              </div>
            )}
          </div>
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
