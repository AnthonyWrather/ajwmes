import React, { useState } from 'react';
import { JobRecord, MessageItem, VesselSpec, PostalOrder } from '../../types';
import { JobDiscussionThread } from '../chat/JobDiscussionThread';
import { VesselSpecManager } from './VesselSpecManager';
import { PostalOrderTracker } from '../orders/PostalOrderTracker';
import { OrderTrackingProgress } from './OrderTrackingProgress';
import { VesselPdfSummaryModal } from './VesselPdfSummaryModal';
import { Anchor, Clock, Wrench, ShieldCheck, ChevronRight, Plus, AlertCircle, FileText, MessageSquare, ShoppingBag, Truck, Package, CheckCircle2, Printer, Download } from 'lucide-react';

interface ClientVesselPortalProps {
  jobs: JobRecord[];
  clientEmail: string;
  vesselSpec: VesselSpec;
  postalOrders?: PostalOrder[];
  activeSubTab?: 'specs' | 'jobs' | 'orders';
  onSubTabChange?: (tab: 'specs' | 'jobs' | 'orders') => void;
  onUpdateVesselSpec: (updated: VesselSpec) => void;
  onSendMessage: (jobId: string, message: MessageItem) => void;
  onApproveQuote: (jobId: string) => void;
  onPayDeposit: (jobId: string, amount: number) => void;
  onRequestNewService: () => void;
  onNavigateToStore?: () => void;
  onNavigateToTracker?: (orderId?: string) => void;
}

export const ClientVesselPortal: React.FC<ClientVesselPortalProps> = ({
  jobs,
  clientEmail,
  vesselSpec,
  postalOrders = [],
  activeSubTab,
  onSubTabChange,
  onUpdateVesselSpec,
  onSendMessage,
  onApproveQuote,
  onPayDeposit,
  onRequestNewService,
  onNavigateToStore,
  onNavigateToTracker
}) => {
  const [internalTab, setInternalTab] = useState<'specs' | 'jobs' | 'orders'>('specs');
  const [showPdfSummaryModal, setShowPdfSummaryModal] = useState(false);
  const portalTab = activeSubTab || internalTab;

  const handleTabChange = (tab: 'specs' | 'jobs' | 'orders') => {
    setInternalTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  // Filter jobs for this client (or show sample client jobs)
  const clientJobs = jobs.filter(j => j.clientEmail.toLowerCase() === clientEmail.toLowerCase() || clientEmail.includes('mercer') || clientEmail === 'demo');
  const activeJobs = clientJobs.length > 0 ? clientJobs : jobs.slice(0, 2);

  const [selectedJobId, setSelectedJobId] = useState<string>(activeJobs[0]?.id || '');
  const activeJob = activeJobs.find(j => j.id === selectedJobId) || activeJobs[0];

  // Active postal orders in fulfillment/transit
  const activePostalOrders = postalOrders.filter(o => 
    o.orderStatus === 'received' || 
    o.orderStatus === 'packed' || 
    o.orderStatus === 'dispatched' ||
    o.orderStatus === 'ready_for_pickup'
  );

  return (
    <div className="w-full space-y-6 text-slate-100">
      {/* Portal Top Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
            <Anchor className="w-4 h-4" />
            <span>Boat Owner Vessel Portal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            {vesselSpec.vesselName || (activeJob ? activeJob.vesselName : 'My Vessel')}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {vesselSpec.makeModel} · {vesselSpec.homeMarina} ({vesselSpec.berthPontoon})
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-tab Navigation */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => handleTabChange('specs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                portalTab === 'specs' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Technical Specs &amp; PDF</span>
            </button>
            <button
              onClick={() => handleTabChange('jobs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors relative ${
                portalTab === 'jobs' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Jobs &amp; Activity Feed ({activeJobs.length})</span>
              {activeJobs.some(j => j.messages.some(m => m.senderName.includes('Postal Dispatch') || m.text.includes('Postal Order'))) && (
                <span className="flex h-2 w-2 relative ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-400"></span>
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                portalTab === 'orders' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Postal Orders ({postalOrders.length})</span>
              {activePostalOrders.length > 0 && (
                <span className="flex h-2 w-2 relative ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>
          </div>

          {/* Direct Option to Generate Visual On-Board Spec Summary PDF */}
          <button
            onClick={() => setShowPdfSummaryModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-sky-300 hover:text-white border border-sky-500/30 hover:border-sky-400 rounded-xl text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
            title="Generate a visual PDF summary of vessel electrical specifications suitable for on-board printing"
          >
            <Printer className="w-3.5 h-3.5 text-sky-400" />
            <span>Print On-Board Spec (PDF)</span>
          </button>

          <button
            onClick={onRequestNewService}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/30 transition-all whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Book Service</span>
          </button>
        </div>
      </div>

      {/* Active Order Alert Banner if not already on the orders tab */}
      {activePostalOrders.length > 0 && portalTab !== 'orders' && (
        <div className="bg-gradient-to-r from-sky-950/90 via-slate-900 to-slate-900 border border-sky-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-sky-950/30 animate-fadeIn">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-900/40 border border-sky-500/30 rounded-xl text-sky-400">
              <Truck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-sky-300">
                  ACTIVE POSTAL DISPATCH: {activePostalOrders[0].orderNumber}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30 uppercase">
                  {activePostalOrders[0].orderStatus.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {activePostalOrders[0].orderStatus === 'dispatched' 
                  ? `In transit with ${activePostalOrders[0].trackingCarrier || 'Royal Mail'} · Destination: ${activePostalOrders[0].shippingAddress.isMarinaDelivery ? activePostalOrders[0].shippingAddress.marinaName : activePostalOrders[0].shippingAddress.postcode}`
                  : `Assembly & packing underway at Gosport workshop for ${activePostalOrders[0].customerName}`}
              </p>
            </div>
          </div>
          <button
            onClick={() => handleTabChange('orders')}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-sky-600/20 whitespace-nowrap"
          >
            <span>View Real-Time Tracking Progress</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tab 1: Vessel Technical Specifications & Electrical History */}
      {portalTab === 'specs' && (
        <div className="space-y-6">
          {/* On-Board Print Callout Card */}
          <div className="bg-gradient-to-r from-sky-950/80 via-slate-900 to-slate-900 border border-sky-500/30 rounded-3xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl shadow-sky-950/20">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-2xl text-sky-400 shrink-0 mt-0.5 md:mt-0">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-sky-300 uppercase tracking-wide">
                    On-Board Technical Print Station
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                    A4 Single-Page or Dossier
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white mt-0.5">
                  Visual Vessel Electrical Specification Summary (PDF)
                </h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Generate a high-contrast visual PDF summary of {vesselSpec.vesselName}'s {vesselSpec.systemVoltage} DC system, domestic battery capacity ({vesselSpec.houseCapacityAh}Ah {vesselSpec.houseBatteryType}), solar &amp; shore charging, emergency isolation checklist, and critical fuse amperages — formatted for local printing on board, helm laminating, and insurance surveys.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
              <button
                onClick={() => setShowPdfSummaryModal(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 transition-all whitespace-nowrap"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Open Print &amp; PDF Station</span>
              </button>
            </div>
          </div>

          <VesselSpecManager
            vesselSpec={vesselSpec}
            onUpdateVesselSpec={onUpdateVesselSpec}
            onOpenPdfModal={() => setShowPdfSummaryModal(true)}
          />
        </div>
      )}

      {/* Tab 2: Postal Orders & Deliveries */}
      {portalTab === 'orders' && (
        <div className="space-y-6">
          {/* Main Visual Tracking Timeline Component */}
          <PostalOrderTracker
            orders={postalOrders}
            onNavigateToStore={onNavigateToStore}
          />

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              All Orders &amp; Dispatches ({postalOrders.length})
            </span>
            {onNavigateToStore && (
              <button
                onClick={onNavigateToStore}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
              >
                <span>Order Cables &amp; Parts from Workshop</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {postalOrders.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Postal Orders Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Need marine-grade tinned wire, blade fuses, Carling switches, or Victron monitors for your boat? Order directly online from Anthony's workshop stock.
              </p>
              {onNavigateToStore && (
                <button
                  onClick={onNavigateToStore}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20"
                >
                  Browse Workshop Stock
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {postalOrders.map(order => {
                const stagePercent = 
                  order.orderStatus === 'received' ? 25 :
                  order.orderStatus === 'packed' ? 55 :
                  order.orderStatus === 'ready_for_pickup' ? 75 :
                  order.orderStatus === 'dispatched' ? 85 : 100;

                return (
                  <div
                    key={order.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 hover:border-slate-700 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-mono text-sm font-bold text-sky-400">{order.orderNumber}</span>
                        <span className="text-[11px] text-slate-500 block">{order.createdAt}</span>
                      </div>
                      <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                        order.orderStatus === 'dispatched'
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                          : order.orderStatus === 'packed'
                          ? 'bg-sky-950 text-sky-300 border-sky-500/30'
                          : 'bg-amber-950 text-amber-300 border-amber-500/30'
                      }`}>
                        {order.orderStatus === 'received' ? 'Order Received (Packing)' : order.orderStatus.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Progress Bar within Card */}
                    <div className="space-y-1.5 py-1 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                      <div className="flex justify-between items-center text-[10px] font-mono">
                        <span className="text-slate-400 uppercase font-semibold">Live Fulfillment Progress</span>
                        <span className="text-sky-300 font-bold">{stagePercent}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div 
                          className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${stagePercent}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[9px] font-mono text-slate-500 pt-0.5">
                        <span className={order.orderStatus !== 'received' ? 'text-emerald-400' : 'text-sky-400 font-bold'}>Received</span>
                        <span className={order.orderStatus === 'packed' ? 'text-sky-400 font-bold' : order.orderStatus === 'dispatched' ? 'text-emerald-400' : 'text-slate-600'}>Packed</span>
                        <span className={order.orderStatus === 'dispatched' ? 'text-emerald-400 font-bold' : 'text-slate-600'}>Dispatched</span>
                        <span className="text-slate-600">Delivered</span>
                      </div>
                    </div>

                    {/* Tracking info if dispatched */}
                    {order.trackingNumber && (
                      <div className="p-3 bg-sky-950/40 border border-sky-500/30 rounded-xl text-xs space-y-1">
                        <div className="text-sky-300 font-bold flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" />
                          <span>Dispatched via {order.trackingCarrier}</span>
                        </div>
                        <div className="text-slate-300 font-mono text-[11px]">
                          Tracking: <span className="text-white font-bold">{order.trackingNumber}</span>
                        </div>
                      </div>
                    )}

                    {/* Delivery Location */}
                    <div className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-xl border border-slate-800 space-y-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Delivery Destination</span>
                      {order.shippingAddress.isMarinaDelivery ? (
                        <div>
                          <span className="text-sky-400 font-bold">{order.shippingAddress.marinaName}</span> ({order.shippingAddress.berthNumber})
                        </div>
                      ) : (
                        <div>{order.shippingAddress.addressLine1}, {order.shippingAddress.postcode}</div>
                      )}
                    </div>

                    {/* Items */}
                    <div className="text-xs space-y-1 pt-1">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Items ({order.items.length})</span>
                      {order.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between text-slate-300">
                          <span>{i.quantity}x {i.name}</span>
                          <span className="font-mono text-white">£{i.lineTotal.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between font-bold text-xs">
                      <span className="text-slate-400">Total Paid:</span>
                      <span className="text-emerald-400 text-sm font-mono">£{order.total.toFixed(2)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Active Jobs, Quotes & Discussion Threads */}
      {portalTab === 'jobs' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Job Selector */}
          <div className="lg:col-span-4 space-y-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Your Service History &amp; Orders ({activeJobs.length})
            </span>

            <div className="space-y-2.5">
              {activeJobs.map(job => (
                <div
                  key={job.id}
                  onClick={() => setSelectedJobId(job.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedJobId === job.id
                      ? 'bg-slate-900 border-sky-500 shadow-md shadow-sky-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-mono text-sky-400 font-bold">{job.reference}</span>
                    <span className="text-[10px] font-mono capitalize px-2 py-0.5 rounded-full bg-slate-950 border border-slate-800 text-slate-300">
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs font-bold text-white line-clamp-1">{job.notes}</p>
                  
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{job.diagnosticHours}h Labor</span>
                    </div>
                    <span className="font-mono font-bold text-white tabular-nums">
                      £{(job.totalLabor + job.totalMaterials).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Discussion Thread & Billing */}
          <div className="lg:col-span-8">
            {activeJob ? (
              <JobDiscussionThread
                job={activeJob}
                currentUserRole="client"
                onSendMessage={onSendMessage}
                onApproveQuote={onApproveQuote}
                onPayDeposit={onPayDeposit}
                onNavigateToTracker={onNavigateToTracker}
              />
            ) : (
              <div className="h-64 bg-slate-900/60 border border-slate-800 rounded-2xl flex flex-col items-center justify-center text-center p-6 text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-500 mb-2" />
                <p className="text-sm font-semibold text-white">No active job selected</p>
                <p className="text-xs text-slate-500 mt-1">Book a service or request a quote to open your discussion thread.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual PDF Summary Modal for On-Board Printing */}
      <VesselPdfSummaryModal
        isOpen={showPdfSummaryModal}
        onClose={() => setShowPdfSummaryModal(false)}
        vesselSpec={vesselSpec}
      />
    </div>
  );
};
