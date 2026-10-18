import React, { useState } from 'react';
import { JobRecord, MessageItem, VesselSpec, PostalOrder, HULL_TYPES, HullType } from '../../types';
import { JobDiscussionThread } from '../chat/JobDiscussionThread';
import { VesselSpecManager } from './VesselSpecManager';
import { PostalOrderTracker } from '../orders/PostalOrderTracker';
import { VesselPdfSummaryModal } from './VesselPdfSummaryModal';
import { 
  Anchor, 
  Clock, 
  Wrench, 
  ChevronRight, 
  Plus, 
  AlertCircle, 
  FileText, 
  MessageSquare, 
  ShoppingBag, 
  Truck, 
  Package, 
  Printer, 
  User, 
  X, 
  Ship, 
  CheckCircle2,
  Layers,
  Compass
} from 'lucide-react';

interface ClientVesselPortalProps {
  jobs: JobRecord[];
  clientEmail: string;
  clientUserId?: string;
  clientName?: string;
  vessels?: VesselSpec[];
  activeVesselId?: string;
  onSelectVesselId?: (vesselId: string) => void;
  onAddVessel?: (newVessel: VesselSpec) => void;
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
  onOpenAccountModal?: () => void;
}

export const ClientVesselPortal: React.FC<ClientVesselPortalProps> = ({
  jobs,
  clientEmail,
  clientUserId,
  clientName,
  vessels = [],
  activeVesselId,
  onSelectVesselId,
  onAddVessel,
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
  onNavigateToTracker,
  onOpenAccountModal
}) => {
  const [internalTab, setInternalTab] = useState<'specs' | 'jobs' | 'orders'>('specs');
  const [showPdfSummaryModal, setShowPdfSummaryModal] = useState(false);
  const [showAddBoatModal, setShowAddBoatModal] = useState(false);
  const [vesselFilterId, setVesselFilterId] = useState<string>(activeVesselId || 'all');

  // Add Boat Form State
  const [boatForm, setBoatForm] = useState({
    vesselName: '',
    makeModel: '',
    year: new Date().getFullYear() - 10,
    hullType: 'Monohull Fin Keel' as HullType,
    lengthOverall: '',
    lengthWaterline: '',
    beam: '',
    draft: '',
    displacement: '',
    systemVoltage: '12V' as '12V' | '24V',
    homeMarina: 'Haslar Marina, Gosport',
    berthPontoon: 'Berth 12',
    houseBatteryType: 'LiFePO4 Lithium' as 'LiFePO4 Lithium' | 'AGM Deep Cycle' | 'Gel' | 'Flooded Lead-Acid',
    houseCapacityAh: 200,
    generalNotes: ''
  });

  const portalTab = activeSubTab || internalTab;

  const handleTabChange = (tab: 'specs' | 'jobs' | 'orders') => {
    setInternalTab(tab);
    if (onSubTabChange) {
      onSubTabChange(tab);
    }
  };

  // 1. Resolve all vessels belonging to this user
  const userVessels = vessels.filter(v => {
    if (clientUserId && v.userId && v.userId === clientUserId) return true;
    if (clientEmail && v.userId && v.userId.toLowerCase() === clientEmail.toLowerCase()) return true;
    return false;
  });

  // Include current vesselSpec ONLY if owned by this user and not yet in userVessels
  const allUserVessels = [...userVessels];
  if (
    vesselSpec && 
    vesselSpec.vesselName && 
    (vesselSpec.userId === clientUserId || (clientEmail && vesselSpec.userId && vesselSpec.userId.toLowerCase() === clientEmail.toLowerCase())) &&
    !allUserVessels.some(v => v.id === vesselSpec.id || v.vesselName.toLowerCase() === vesselSpec.vesselName.toLowerCase())
  ) {
    allUserVessels.unshift(vesselSpec);
  }

  // Synchronize vesselFilterId when active vessel or signed-in user changes
  React.useEffect(() => {
    if (activeVesselId && allUserVessels.some(v => v.id === activeVesselId)) {
      setVesselFilterId(activeVesselId);
    } else {
      setVesselFilterId('all');
    }
  }, [activeVesselId, clientUserId]);

  // Active vessel to inspect in Technical Specs
  const activeVessel = allUserVessels.find(v => v.id === (activeVesselId || vesselFilterId))
    || allUserVessels[0]
    || null;

  const hasBoats = allUserVessels.length > 0 && Boolean(allUserVessels[0]?.vesselName?.trim());

  // 2. Strict filtering for jobs belonging to signed-in user
  const clientJobs = jobs.filter(j => {
    if (clientUserId && j.userId && j.userId === clientUserId) return true;
    if (clientEmail && j.clientEmail && j.clientEmail.toLowerCase() === clientEmail.toLowerCase()) return true;
    return false;
  });

  // Filter jobs by selected vessel if a specific vessel is chosen (and not 'all')
  const displayedJobs = vesselFilterId !== 'all'
    ? clientJobs.filter(j => 
        j.vesselId === vesselFilterId || 
        (!j.vesselId && activeVessel && j.vesselName && j.vesselName.toLowerCase() === activeVessel.vesselName.toLowerCase())
      )
    : clientJobs;

  const [selectedJobId, setSelectedJobId] = useState<string>(displayedJobs[0]?.id || '');
  
  React.useEffect(() => {
    if (displayedJobs.length > 0 && !displayedJobs.some(j => j.id === selectedJobId)) {
      setSelectedJobId(displayedJobs[0].id);
    }
  }, [displayedJobs, selectedJobId]);

  const activeJob = displayedJobs.find(j => j.id === selectedJobId) || displayedJobs[0];

  // 3. Strict filtering for postal orders belonging to signed-in user
  const clientPostalOrders = postalOrders.filter(o => {
    if (clientUserId && o.userId && o.userId === clientUserId) return true;
    if (clientEmail && o.customerEmail && o.customerEmail.toLowerCase() === clientEmail.toLowerCase()) return true;
    return false;
  });

  // Filter postal orders by selected vessel if chosen (and not 'all')
  const displayedPostalOrders = vesselFilterId !== 'all'
    ? clientPostalOrders.filter(o => 
        o.vesselId === vesselFilterId || 
        (!o.vesselId && activeVessel && o.shippingAddress?.berthNumber && o.shippingAddress.berthNumber.toLowerCase().includes(activeVessel.vesselName.toLowerCase()))
      )
    : clientPostalOrders;

  // Active postal orders in fulfillment/transit for this user
  const activePostalOrders = clientPostalOrders.filter(o => 
    o.orderStatus === 'received' || 
    o.orderStatus === 'packed' || 
    o.orderStatus === 'dispatched' || 
    o.orderStatus === 'ready_for_pickup'
  );

  const handleCreateVessel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!boatForm.vesselName.trim()) return;

    const newVessel: VesselSpec = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? `vessel-${crypto.randomUUID()}` : `vessel-${Date.now()}`,
      userId: clientUserId || clientEmail,
      vesselName: boatForm.vesselName.trim(),
      makeModel: boatForm.makeModel.trim() || 'Cruising Yacht',
      year: Number(boatForm.year) || 2015,
      hullType: boatForm.hullType,
      lengthOverall: boatForm.lengthOverall.trim() || undefined,
      lengthWaterline: boatForm.lengthWaterline.trim() || undefined,
      beam: boatForm.beam.trim() || undefined,
      draft: boatForm.draft.trim() || undefined,
      displacement: boatForm.displacement.trim() || undefined,
      hinNumber: `GB-AJW-${Math.floor(1000 + Math.random() * 9000)}`,
      sailNumber: `GBR-${Math.floor(1000 + Math.random() * 9000)}K`,
      homeMarina: boatForm.homeMarina.trim() || 'Solent Marina',
      berthPontoon: boatForm.berthPontoon.trim() || 'Pontoon A',
      systemVoltage: boatForm.systemVoltage,
      houseBatteryType: boatForm.houseBatteryType,
      houseCapacityAh: Number(boatForm.houseCapacityAh) || 200,
      houseBankInstalled: '2026',
      starterBatteryType: 'Heavy Duty Marine AGM',
      starterCapacityAh: 85,
      starterCca: 800,
      alternatorRating: 'Standard Marine Engine Alternator',
      dcDcCharger: 'Victron Orion-Tr Smart (Bluetooth)',
      solarWatts: 200,
      solarType: 'Rigid Monocrystalline Panels',
      solarController: 'Victron SmartSolar MPPT',
      batteryMonitor: 'Victron SmartShunt 500A',
      shorePowerRating: '230V 16A Shore Connection',
      hasGalvanicIsolator: true,
      inverterModel: 'Victron Phoenix Pure Sine',
      navigationNetwork: 'NMEA 2000 Micro-C',
      chartplotterModel: 'Touch Screen MFD',
      vhfAisDetails: 'DSC VHF with NMEA AIS',
      bilgePumpConfig: 'Automatic Submersible with Float Switch',
      switchPanelModel: 'AJWMES Custom Switchboard',
      generalNotes: boatForm.generalNotes.trim() || 'Registered via Boat Owner Portal.',
      lastInspectionDate: new Date().toISOString().slice(0, 10),
      historyLog: []
    };

    if (onAddVessel) {
      onAddVessel(newVessel);
    }
    if (onSelectVesselId) {
      onSelectVesselId(newVessel.id);
    }
    setVesselFilterId(newVessel.id);
    setShowAddBoatModal(false);
    setBoatForm({
      vesselName: '',
      makeModel: '',
      year: new Date().getFullYear() - 10,
      hullType: 'Monohull Fin Keel',
      lengthOverall: '',
      lengthWaterline: '',
      beam: '',
      draft: '',
      displacement: '',
      systemVoltage: '12V',
      homeMarina: 'Haslar Marina, Gosport',
      berthPontoon: 'Berth 12',
      houseBatteryType: 'LiFePO4 Lithium',
      houseCapacityAh: 200,
      generalNotes: ''
    });
  };

  return (
    <div data-testid="client-vessel-portal" className="w-full space-y-6 text-slate-100">
      {/* Portal Top Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400">
            <Anchor className="w-4 h-4" />
            <span>Boat Owner Vessel Portal</span>
            {clientUserId && (
              <span className="font-mono text-[10px] text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                UUID: {clientUserId.length > 18 ? `${clientUserId.slice(0, 14)}...` : clientUserId}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h2 data-testid="portal-vessel-title" className="text-xl sm:text-2xl font-bold text-white">
              {hasBoats ? (activeVessel?.vesselName || 'My Vessel') : (clientName ? `${clientName}'s Account` : 'Boat Owner Portal')}
            </h2>

            {/* Vessel Switcher Dropdown */}
            {allUserVessels.length > 1 && (
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                <select
                  data-testid="vessel-switcher-select"
                  value={vesselFilterId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setVesselFilterId(id);
                    if (id !== 'all' && onSelectVesselId) {
                      onSelectVesselId(id);
                    }
                  }}
                  className="bg-slate-950 border border-slate-700 hover:border-sky-500 text-sky-300 font-semibold text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-sky-400 transition-colors cursor-pointer"
                >
                  <option value="all">🌐 All Boats ({allUserVessels.length} Registered)</option>
                  {allUserVessels.map(v => (
                    <option key={v.id} value={v.id}>
                      ⛵ {v.vesselName} ({v.makeModel || 'Vessel'})
                    </option>
                  ))}
                </select>

                <button
                  data-testid="portal-add-boat-button"
                  onClick={() => setShowAddBoatModal(true)}
                  className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-800 hover:border-sky-500/40 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                  title="Register another boat to your account"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Boat</span>
                </button>
              </div>
            )}

            {allUserVessels.length === 1 && (
              <button
                data-testid="portal-add-boat-button"
                onClick={() => setShowAddBoatModal(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-950 hover:bg-slate-800 text-sky-400 border border-slate-800 hover:border-sky-500/40 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Register another boat to your account"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Boat</span>
              </button>
            )}

            {!hasBoats && (
              <button
                data-testid="portal-add-boat-button"
                onClick={() => setShowAddBoatModal(true)}
                className="flex items-center gap-1.5 px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Register a Boat</span>
              </button>
            )}
          </div>

          <p className="text-xs text-slate-400">
            {hasBoats && activeVessel
              ? `${activeVessel.makeModel || 'Vessel'}${activeVessel.hullType ? ` · ${activeVessel.hullType}` : ''}${activeVessel.lengthOverall ? ` · LOA: ${activeVessel.lengthOverall}` : ''} · ${activeVessel.homeMarina} (${activeVessel.berthPontoon}) · ${activeVessel.systemVoltage} DC System`
              : `${clientEmail} · Direct customer account (Boatless orders supported)`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub-tab Navigation */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              data-testid="portal-subtab-specs"
              onClick={() => handleTabChange('specs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                portalTab === 'specs' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Technical Specs &amp; PDF</span>
            </button>
            <button
              data-testid="portal-subtab-jobs"
              onClick={() => handleTabChange('jobs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors relative ${
                portalTab === 'jobs' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Jobs &amp; Activity ({displayedJobs.length})</span>
            </button>
            <button
              data-testid="portal-subtab-orders"
              onClick={() => handleTabChange('orders')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors relative ${
                portalTab === 'orders' ? 'bg-sky-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Postal Orders ({displayedPostalOrders.length})</span>
              {activePostalOrders.length > 0 && (
                <span className="flex h-2 w-2 relative ml-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>
          </div>

          {/* Direct Option to Generate Visual On-Board Spec Summary PDF */}
          {hasBoats && (
            <button
              data-testid="portal-open-pdf-station-button"
              onClick={() => setShowPdfSummaryModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-sky-300 hover:text-white border border-sky-500/30 hover:border-sky-400 rounded-xl text-xs font-semibold shadow-sm transition-all whitespace-nowrap cursor-pointer"
              title="Generate a visual PDF summary of vessel electrical specifications suitable for on-board printing"
            >
              <Printer className="w-3.5 h-3.5 text-sky-400" />
              <span>Print On-Board Spec (PDF)</span>
            </button>
          )}

          {onOpenAccountModal && (
            <button
              onClick={onOpenAccountModal}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-semibold shadow-sm transition-all whitespace-nowrap cursor-pointer"
              title="Edit captain contact info, phone, and vessel preferences"
            >
              <User className="w-3.5 h-3.5 text-sky-400" />
              <span>Owner Account</span>
            </button>
          )}

          <button
            onClick={onRequestNewService}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/30 transition-all whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Book Service</span>
          </button>
        </div>
      </div>

      {/* Active Order Alert Banner if not already on the orders tab */}
      {activePostalOrders.length > 0 && portalTab !== 'orders' && (
        <div className="bg-gradient-to-r from-sky-950/90 via-slate-900 to-slate-900 border border-sky-500/40 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-sky-950/30">
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
                  {(activePostalOrders[0].orderStatus || '').replace(/_/g, ' ')}
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
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-sky-600/20 whitespace-nowrap cursor-pointer"
          >
            <span>View Real-Time Tracking Progress</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Tab 1: Vessel Technical Specifications & Electrical History */}
      {portalTab === 'specs' && (
        hasBoats && activeVessel ? (
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
                    Generate a high-contrast visual PDF summary of {activeVessel.vesselName}'s {activeVessel.systemVoltage} DC system, domestic battery capacity ({activeVessel.houseCapacityAh}Ah {activeVessel.houseBatteryType}), solar &amp; shore charging, emergency isolation checklist, and critical fuse amperages — formatted for local printing on board, helm laminating, and insurance surveys.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto shrink-0">
                <button
                  data-testid="portal-callout-pdf-button"
                  onClick={() => setShowPdfSummaryModal(true)}
                  className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-600/30 transition-all whitespace-nowrap cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Open Print &amp; PDF Station</span>
                </button>
              </div>
            </div>

            <VesselSpecManager
              vesselSpec={activeVessel}
              onUpdateVesselSpec={onUpdateVesselSpec}
              onOpenPdfModal={() => setShowPdfSummaryModal(true)}
            />
          </div>
        ) : (
          <div data-testid="no-vessel-registered-card" className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-950/80 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
              <Ship className="w-7 h-7" />
            </div>
            <h3 data-testid="no-vessel-registered-heading" className="text-lg font-bold text-white">No Vessel Registered Yet</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              You are signed in with account UUID <span className="font-mono text-slate-300">{clientUserId || clientEmail}</span>. You can register your boat details (battery capacity, DC voltage, solar hardware) to maintain electrical audit records and print on-board PDF dossiers, or proceed directly to order cables and parts.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                data-testid="portal-register-boat-button"
                onClick={() => setShowAddBoatModal(true)}
                className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/30 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Register Your First Boat</span>
              </button>
              {onNavigateToStore && (
                <button
                  data-testid="portal-order-parts-button"
                  onClick={onNavigateToStore}
                  className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ShoppingBag className="w-4 h-4 text-sky-400" />
                  <span>Order Parts from Workshop</span>
                </button>
              )}
            </div>
          </div>
        )
      )}

      {/* Tab 2: Postal Orders & Deliveries */}
      {portalTab === 'orders' && (
        <div className="space-y-6">
          {/* Main Visual Tracking Timeline Component */}
          <PostalOrderTracker
            orders={displayedPostalOrders}
            onNavigateToStore={onNavigateToStore}
          />

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Your Postal Orders &amp; Dispatches ({displayedPostalOrders.length})
            </span>
            {onNavigateToStore && (
              <button
                onClick={onNavigateToStore}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Order Cables &amp; Parts from Workshop</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {displayedPostalOrders.length === 0 ? (
            <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No Postal Orders Placed Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Need marine-grade tinned Oceanflex wire, blade fuse blocks, Carling switches, or Victron SmartShunts? Order online from Anthony's workshop stock with Royal Mail Tracked 24 delivery or Solent marina pickup.
              </p>
              {onNavigateToStore && (
                <button
                  onClick={onNavigateToStore}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/20 cursor-pointer"
                >
                  Browse Workshop Stock
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedPostalOrders.map(order => {
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
                        {order.orderStatus === 'received' ? 'Order Received (Packing)' : (order.orderStatus || '').replace(/_/g, ' ')}
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
        displayedJobs.length === 0 ? (
          <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-950/80 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">No Service Jobs or Quotes Recorded</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              No active diagnostic jobs or custom switch panel quotes are registered for this account. Book an on-board electrical diagnostic (£25/hr flat rate) or request a laser-engraved replacement panel quote.
            </p>
            <button
              onClick={onRequestNewService}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Book Service or Request Quote</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Job Selector */}
            <div className="lg:col-span-4 space-y-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                Your Service History &amp; Orders ({displayedJobs.length})
              </span>

              <div className="space-y-2.5">
                {displayedJobs.map(job => (
                  <div
                    key={job.id}
                    data-testid="job-list-card"
                    data-job-id={job.id}
                    data-job-status={job.status}
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
                        {(job.status || 'quote_requested').replace(/_/g, ' ')}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-white line-clamp-1">{job.notes}</p>
                    
                    <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
                      <span className="text-sky-300 font-medium">⛵ {job.vesselName}</span>
                      <span className="text-slate-500">{job.berthLocation?.split('(')[0]?.trim()}</span>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{job.diagnosticHours ?? 0}h Labor</span>
                      </div>
                      <span className="font-mono font-bold text-white tabular-nums">
                        £{((job.totalLabor ?? 0) + (job.totalMaterials ?? 0)).toFixed(2)}
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
                  <p className="text-xs text-slate-500 mt-1">Select a job from the left or book a new service.</p>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {/* Visual PDF Summary Modal for On-Board Printing */}
      {hasBoats && activeVessel && (
        <VesselPdfSummaryModal
          isOpen={showPdfSummaryModal}
          onClose={() => setShowPdfSummaryModal(false)}
          vesselSpec={activeVessel}
        />
      )}

      {/* Register New Boat Modal */}
      {showAddBoatModal && (
        <div data-testid="add-boat-modal" className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-950 border border-sky-500/30 rounded-xl text-sky-400">
                  <Ship className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Register a Vessel</h3>
                  <p className="text-xs text-slate-400">Linked to UUID: {clientUserId || clientEmail}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddBoatModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVessel} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Vessel Name *
                </label>
                <input
                  data-testid="boat-name-input"
                  type="text"
                  required
                  placeholder="e.g. Windbird III, Sea Sprite, Solent Skiff"
                  value={boatForm.vesselName}
                  onChange={e => setBoatForm(prev => ({ ...prev, vesselName: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Make &amp; Model
                  </label>
                  <input
                    data-testid="boat-make-model-input"
                    type="text"
                    placeholder="e.g. Moody 33, Westerly 29"
                    value={boatForm.makeModel}
                    onChange={e => setBoatForm(prev => ({ ...prev, makeModel: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Year Built
                  </label>
                  <input
                    data-testid="boat-year-input"
                    type="number"
                    value={boatForm.year}
                    onChange={e => setBoatForm(prev => ({ ...prev, year: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Hull Type / Keel Configuration
                </label>
                <select
                  data-testid="vessel-hull-type-select"
                  value={boatForm.hullType}
                  onChange={e => setBoatForm(prev => ({ ...prev, hullType: e.target.value as HullType }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
                >
                  {HULL_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-[11px] font-mono uppercase text-sky-400 font-bold block">
                  Vessel Dimensions (SailboatData Spec)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Length Overall (LOA)
                    </label>
                    <input
                      type="text"
                      data-testid="vessel-loa-input"
                      placeholder="e.g. 30.00 ft / 9.14 m"
                      value={boatForm.lengthOverall}
                      onChange={e => setBoatForm(prev => ({ ...prev, lengthOverall: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Waterline (LWL)
                    </label>
                    <input
                      type="text"
                      data-testid="vessel-lwl-input"
                      placeholder="e.g. 29.00 ft / 8.84 m"
                      value={boatForm.lengthWaterline}
                      onChange={e => setBoatForm(prev => ({ ...prev, lengthWaterline: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Beam
                    </label>
                    <input
                      type="text"
                      data-testid="vessel-beam-input"
                      placeholder="e.g. 15.33 ft / 4.67 m"
                      value={boatForm.beam}
                      onChange={e => setBoatForm(prev => ({ ...prev, beam: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                      Draft
                    </label>
                    <input
                      type="text"
                      data-testid="vessel-draft-input"
                      placeholder="e.g. 2.00 ft / 0.61 m"
                      value={boatForm.draft}
                      onChange={e => setBoatForm(prev => ({ ...prev, draft: e.target.value }))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    DC System Voltage
                  </label>
                  <select
                    data-testid="boat-voltage-select"
                    value={boatForm.systemVoltage}
                    onChange={e => setBoatForm(prev => ({ ...prev, systemVoltage: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="12V">12V DC (Standard)</option>
                    <option value="24V">24V DC (Commercial/Heavy)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Battery Bank Type
                  </label>
                  <select
                    data-testid="boat-battery-type-select"
                    value={boatForm.houseBatteryType}
                    onChange={e => setBoatForm(prev => ({ ...prev, houseBatteryType: e.target.value as any }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                  >
                    <option value="LiFePO4 Lithium">LiFePO4 Lithium</option>
                    <option value="AGM Deep Cycle">AGM Deep Cycle</option>
                    <option value="Gel">Gel</option>
                    <option value="Flooded Lead-Acid">Flooded Lead-Acid</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Home Marina
                  </label>
                  <input
                    data-testid="boat-marina-input"
                    type="text"
                    placeholder="e.g. Haslar Marina, Gosport Marina"
                    value={boatForm.homeMarina}
                    onChange={e => setBoatForm(prev => ({ ...prev, homeMarina: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Berth / Pontoon
                  </label>
                  <input
                    data-testid="boat-berth-input"
                    type="text"
                    placeholder="e.g. Pontoon C14"
                    value={boatForm.berthPontoon}
                    onChange={e => setBoatForm(prev => ({ ...prev, berthPontoon: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  data-testid="boat-cancel-button"
                  type="button"
                  onClick={() => setShowAddBoatModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  data-testid="boat-submit-button"
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-600/30 cursor-pointer"
                >
                  Save Vessel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
