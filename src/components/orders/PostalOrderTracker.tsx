import React, { useState, useMemo } from 'react';
import { PostalOrder, PostalOrderStatus } from '../../types';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Anchor, 
  Copy, 
  Check, 
  ExternalLink, 
  Search, 
  ChevronRight, 
  Box, 
  ShieldCheck, 
  Navigation as NavIcon, 
  AlertCircle,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';

export interface PostalOrderTrackerProps {
  orders: PostalOrder[];
  selectedOrderId?: string;
  onSelectOrder?: (orderId: string) => void;
  onUpdateOrderStatus?: (
    orderId: string, 
    status: PostalOrderStatus, 
    trackingNumber?: string, 
    carrier?: string
  ) => void;
  onNavigateToStore?: () => void;
  className?: string;
  compact?: boolean;
}

interface TimelineStage {
  key: 'pending' | 'processing' | 'dispatched' | 'delivered';
  label: string;
  sublabel: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: string;
  borderColor: string;
  bgGlow: string;
}

const TIMELINE_STAGES: TimelineStage[] = [
  {
    key: 'pending',
    label: 'Pending',
    sublabel: 'Order Logged & Verified',
    description: 'Payment verified and order entered into the Gosport workshop queue. Marine components reserved.',
    icon: Clock,
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500',
    bgGlow: 'bg-amber-500/10'
  },
  {
    key: 'processing',
    label: 'Processing',
    sublabel: 'Bench Assembly & Packing',
    description: 'Cable lengths continuous cut, terminals crimped, fuses inspected, and packed with moisture-resistant protection.',
    icon: Package,
    accentColor: 'text-sky-400',
    borderColor: 'border-sky-500',
    bgGlow: 'bg-sky-500/10'
  },
  {
    key: 'dispatched',
    label: 'Dispatched',
    sublabel: 'In Transit / Solent Transit',
    description: 'Handed over to Royal Mail Tracked 24 or DPD, or placed at designated marina pontoon collection point.',
    icon: Truck,
    accentColor: 'text-indigo-400',
    borderColor: 'border-indigo-500',
    bgGlow: 'bg-indigo-500/10'
  },
  {
    key: 'delivered',
    label: 'Delivered',
    sublabel: 'Safely Arrived at Vessel',
    description: 'Delivered to vessel berth pontoon, marina reception desk, or safe place as requested.',
    icon: CheckCircle2,
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500',
    bgGlow: 'bg-emerald-500/10'
  }
];

export const PostalOrderTracker: React.FC<PostalOrderTrackerProps> = ({
  orders = [],
  selectedOrderId: controlledSelectedOrderId,
  onSelectOrder,
  onUpdateOrderStatus,
  onNavigateToStore,
  className = '',
  compact = false
}) => {
  const [internalSelectedId, setInternalSelectedId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedTracking, setCopiedTracking] = useState<boolean>(false);
  const [showItemDetails, setShowItemDetails] = useState<boolean>(true);
  const [activeCarrierModal, setActiveCarrierModal] = useState<boolean>(false);

  // Normalize current selected order
  const effectiveSelectedId = controlledSelectedOrderId || internalSelectedId;
  const currentOrder = useMemo(() => {
    if (orders.length === 0) return null;
    if (effectiveSelectedId) {
      const match = orders.find(o => o.id === effectiveSelectedId);
      if (match) return match;
    }
    return orders[0];
  }, [orders, effectiveSelectedId]);

  const handleSelectOrder = (id: string) => {
    setInternalSelectedId(id);
    if (onSelectOrder) {
      onSelectOrder(id);
    }
  };

  // Filter orders by search query
  const filteredOrders = useMemo(() => {
    if (!searchQuery.trim()) return orders;
    const q = searchQuery.toLowerCase().trim();
    return orders.filter(o => 
      o.orderNumber.toLowerCase().includes(q) ||
      o.customerName.toLowerCase().includes(q) ||
      (o.trackingNumber && o.trackingNumber.toLowerCase().includes(q)) ||
      o.shippingAddress.postcode.toLowerCase().includes(q) ||
      (o.shippingAddress.marinaName && o.shippingAddress.marinaName.toLowerCase().includes(q))
    );
  }, [orders, searchQuery]);

  // Stage mapping helper: Convert PostalOrder['orderStatus'] to stage index (0 to 3)
  const getStageIndex = (status: PostalOrderStatus): number => {
    switch (status) {
      case 'pending':
      case 'received':
        return 0; // Stage 1: Pending
      case 'processing':
      case 'packed':
        return 1; // Stage 2: Processing
      case 'dispatched':
      case 'ready_for_pickup':
        return 2; // Stage 3: Dispatched
      case 'delivered':
        return 3; // Stage 4: Delivered
      default:
        return 0;
    }
  };

  const currentStageIndex = currentOrder ? getStageIndex(currentOrder.orderStatus) : 0;

  // Percentage progress for the visual bar
  const getProgressPercentage = (stageIdx: number): number => {
    switch (stageIdx) {
      case 0: return 15;
      case 1: return 48;
      case 2: return 80;
      case 3: return 100;
      default: return 15;
    }
  };

  const progressPercent = getProgressPercentage(currentStageIndex);

  // Copy tracking number to clipboard
  const handleCopyTracking = (trackingNum: string) => {
    navigator.clipboard.writeText(trackingNum);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2200);
  };

  // Quick interactive status change (useful for testing or updating workflow)
  const handleSimulateStatus = (newStatus: PostalOrderStatus) => {
    if (!currentOrder || !onUpdateOrderStatus) return;
    const defaultTracking = currentOrder.trackingNumber || `GB${Math.floor(100000000 + Math.random() * 900000000)}RM`;
    const defaultCarrier = currentOrder.trackingCarrier || 'Royal Mail Tracked 24';
    onUpdateOrderStatus(currentOrder.id, newStatus, defaultTracking, defaultCarrier);
  };

  if (orders.length === 0) {
    return (
      <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-4 max-w-2xl mx-auto ${className}`}>
        <div className="w-16 h-16 rounded-2xl bg-sky-950/60 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
          <Package className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-white">No Postal Orders to Track</h3>
        <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
          There are currently no active parts or cable orders registered in the system. Browse our workshop stock to place a postal delivery or marina pontoon pickup.
        </p>
        {onNavigateToStore && (
          <button
            onClick={onNavigateToStore}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/30 transition-all inline-flex items-center gap-2"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Order Cables &amp; Fuses from Workshop</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Top Banner / Order Switcher Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 backdrop-blur-sm shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
              <NavIcon className="w-4 h-4" />
              <span>Gosport Marine Electrical Dispatch</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-emerald-400 text-[11px] font-mono">Live Tracking</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>Postal Order Tracker</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Visual fulfillment and courier tracking for marine cables, fuse blocks, and electrical hardware.
            </p>
          </div>

          {/* Search / Lookup input */}
          <div className="relative min-w-[260px] sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Order # or Postcode..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 transition-colors"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Quick Order Tabs / Selector Pills */}
        <div className="pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap mr-1">
              Select Order ({filteredOrders.length}):
            </span>
            {filteredOrders.map((ord) => {
              const isSelected = currentOrder?.id === ord.id;
              const stageIdx = getStageIndex(ord.orderStatus);
              const stage = TIMELINE_STAGES[stageIdx];

              return (
                <button
                  key={ord.id}
                  onClick={() => handleSelectOrder(ord.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-sky-600/20 border-sky-500 text-white font-bold shadow-sm shadow-sky-950'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${
                    ord.orderStatus === 'delivered' ? 'bg-emerald-400' :
                    ord.orderStatus === 'dispatched' || ord.orderStatus === 'ready_for_pickup' ? 'bg-indigo-400' :
                    ord.orderStatus === 'processing' || ord.orderStatus === 'packed' ? 'bg-sky-400' : 'bg-amber-400'
                  }`} />
                  <span className="font-mono">{ord.orderNumber}</span>
                  <span className="text-[10px] text-slate-500 hidden sm:inline">
                    · {ord.customerName.split(' ')[0]}
                  </span>
                  <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded border ${
                    isSelected ? 'bg-sky-950 border-sky-500/40 text-sky-300' : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    {stage.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {currentOrder && (
        <div className="space-y-6">
          {/* Main Visual Tracking Timeline Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl">
            {/* Background ambient lighting */}
            <div className="absolute -right-20 -top-20 w-80 h-80 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* Order Header Summary */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xl sm:text-2xl font-extrabold text-white">
                    {currentOrder.orderNumber}
                  </span>
                  <span className={`text-xs font-mono font-bold uppercase px-3 py-1 rounded-full border ${
                    currentOrder.orderStatus === 'delivered'
                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/40'
                      : currentOrder.orderStatus === 'dispatched' || currentOrder.orderStatus === 'ready_for_pickup'
                      ? 'bg-indigo-950/90 text-indigo-300 border-indigo-500/40'
                      : currentOrder.orderStatus === 'processing' || currentOrder.orderStatus === 'packed'
                      ? 'bg-sky-950/90 text-sky-300 border-sky-500/40'
                      : 'bg-amber-950/90 text-amber-300 border-amber-500/40'
                  }`}>
                    {TIMELINE_STAGES[currentStageIndex].label}
                  </span>
                </div>
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <span>Ordered on {currentOrder.createdAt}</span>
                  <span>•</span>
                  <span>Customer: <strong className="text-slate-200">{currentOrder.customerName}</strong></span>
                  <span>•</span>
                  <span>Total: <strong className="text-emerald-400 font-mono">£{currentOrder.total.toFixed(2)}</strong></span>
                </p>
              </div>

              {/* Destination badge */}
              <div className="flex items-center gap-3 p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-xs">
                <div className="p-2 rounded-xl bg-sky-950 text-sky-400 border border-sky-500/20">
                  {currentOrder.shippingAddress.isMarinaDelivery ? (
                    <Anchor className="w-5 h-5 text-sky-400" />
                  ) : (
                    <MapPin className="w-5 h-5 text-sky-400" />
                  )}
                </div>
                <div>
                  <div className="text-[10px] font-mono text-slate-500 uppercase">
                    {currentOrder.shippingAddress.isMarinaDelivery ? 'Solent Berth Pontoon' : 'UK Postal Destination'}
                  </div>
                  <div className="font-bold text-white">
                    {currentOrder.shippingAddress.isMarinaDelivery 
                      ? `${currentOrder.shippingAddress.marinaName} (${currentOrder.shippingAddress.berthNumber})`
                      : `${currentOrder.shippingAddress.city}, ${currentOrder.shippingAddress.postcode}`}
                  </div>
                </div>
              </div>
            </div>

            {/* THE VISUAL TIMELINE */}
            <div className="py-8 relative z-10">
              {/* Desktop / Tablet Horizontal Timeline Bar */}
              <div className="hidden md:block">
                {/* Connecting Progress Track */}
                <div className="relative mb-8">
                  <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 h-2 bg-slate-950 rounded-full border border-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 via-sky-500 to-emerald-400 transition-all duration-700 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* 4 Stage Nodes Along the Line */}
                  <div className="relative flex justify-between">
                    {TIMELINE_STAGES.map((stage, idx) => {
                      const isCompleted = currentStageIndex > idx;
                      const isCurrent = currentStageIndex === idx;
                      const isUpcoming = currentStageIndex < idx;
                      const IconComponent = stage.icon;

                      return (
                        <div 
                          key={stage.key} 
                          className="flex flex-col items-center cursor-pointer group"
                          onClick={() => onUpdateOrderStatus && handleSimulateStatus(stage.key)}
                          title={`Click to set stage to ${stage.label}`}
                        >
                          {/* Circle Node */}
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 relative z-10 border-2 ${
                            isCompleted
                              ? 'bg-slate-900 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-950/40'
                              : isCurrent
                              ? `${stage.bgGlow} ${stage.borderColor} ${stage.accentColor} ring-4 ring-sky-500/20 shadow-xl shadow-sky-950`
                              : 'bg-slate-950 border-slate-800 text-slate-600'
                          }`}>
                            {isCompleted ? (
                              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                            ) : (
                              <IconComponent className={`w-6 h-6 ${isCurrent ? stage.accentColor : 'text-slate-500'}`} />
                            )}

                            {/* Active Pulse indicator */}
                            {isCurrent && (
                              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500" />
                              </span>
                            )}
                          </div>

                          {/* Stage Label & Details */}
                          <div className="mt-3 text-center max-w-[170px]">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className={`text-xs font-bold ${
                                isCompleted ? 'text-emerald-400' :
                                isCurrent ? 'text-white' : 'text-slate-500'
                              }`}>
                                {stage.label}
                              </span>
                              {isCurrent && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-900/60 text-sky-300 border border-sky-500/30">
                                  CURRENT
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-medium mt-0.5">
                              {stage.sublabel}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Mobile Vertical Stepped Timeline */}
              <div className="md:hidden space-y-6">
                <div className="space-y-4 relative pl-8 before:absolute before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
                  {TIMELINE_STAGES.map((stage, idx) => {
                    const isCompleted = currentStageIndex > idx;
                    const isCurrent = currentStageIndex === idx;
                    const IconComponent = stage.icon;

                    return (
                      <div 
                        key={stage.key}
                        onClick={() => onUpdateOrderStatus && handleSimulateStatus(stage.key)}
                        className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                          isCurrent
                            ? 'bg-slate-950 border-sky-500 ring-2 ring-sky-500/20'
                            : isCompleted
                            ? 'bg-slate-950/60 border-emerald-500/30'
                            : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                        }`}
                      >
                        {/* Bullet Icon */}
                        <div className={`absolute -left-[30px] top-4 w-7 h-7 rounded-xl flex items-center justify-center border ${
                          isCompleted
                            ? 'bg-slate-900 border-emerald-500 text-emerald-400'
                            : isCurrent
                            ? 'bg-sky-950 border-sky-500 text-sky-400'
                            : 'bg-slate-950 border-slate-800 text-slate-600'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <IconComponent className="w-3.5 h-3.5" />
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${
                            isCompleted ? 'text-emerald-400' :
                            isCurrent ? 'text-white' : 'text-slate-400'
                          }`}>
                            {stage.label}
                          </span>
                          {isCurrent && (
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-500/40">
                              ACTIVE STEP
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{stage.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Active Step Detailed Card Banner */}
              <div className="mt-4 p-5 rounded-2xl bg-slate-950/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="text-slate-400">Current Status:</span>
                    <span className="text-sky-300 font-bold">{TIMELINE_STAGES[currentStageIndex].sublabel}</span>
                  </div>
                  <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                    {TIMELINE_STAGES[currentStageIndex].description}
                  </p>
                </div>

                {/* Progress Metric Badge */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-500 uppercase">Fulfillment Level</div>
                    <div className="text-base font-extrabold font-mono text-sky-400">{progressPercent}% Completed</div>
                  </div>
                  <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center relative">
                    <div 
                      className="absolute inset-0 rounded-full border-4 border-sky-500 border-t-transparent animate-spin" 
                      style={{ animationDuration: '6s' }}
                    />
                    <span className="text-xs font-mono font-bold text-white">{currentStageIndex + 1}/4</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Carrier & Tracking Details Section */}
            <div className="mt-6 pt-6 border-t border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Carrier Details Box */}
              <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Carrier &amp; Dispatch Logistics
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Method: <strong className="text-slate-200 capitalize">{currentOrder.shippingMethod.replace(/_/g, ' ')}</strong>
                  </span>
                </div>

                {/* Tracking Number Bar */}
                {currentOrder.trackingNumber ? (
                  <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase block">Tracking Reference</span>
                      <div className="font-mono text-sm font-bold text-sky-300 select-all">
                        {currentOrder.trackingNumber}
                      </div>
                      <span className="text-[10px] text-slate-400 block">
                        Carrier: {currentOrder.trackingCarrier || 'Royal Mail Tracked 24'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopyTracking(currentOrder.trackingNumber!)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition-colors"
                        title="Copy Tracking Number"
                      >
                        {copiedTracking ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-slate-300" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => setActiveCarrierModal(true)}
                        className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium flex items-center gap-1 transition-colors"
                      >
                        <span>Checkpoints</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-800/80 text-xs text-slate-400 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-400" />
                      <span>Tracking reference will be issued once packed at the Gosport bench.</span>
                    </div>
                  </div>
                )}

                {/* Dispatch / Delivery Timestamps */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Order Dispatched</span>
                    <span className="font-medium text-slate-200">
                      {currentOrder.dispatchedAt ? currentOrder.dispatchedAt : 'Pending bench prep'}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase block">Estimated Delivery</span>
                    <span className="font-medium text-emerald-400">
                      {currentOrder.orderStatus === 'delivered' 
                        ? 'Delivered to vessel' 
                        : currentOrder.shippingMethod === 'solent_pickup'
                        ? 'Same day at Haslar / Gosport'
                        : '1-2 Working Days (Tracked 24)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery Address & Notes Box */}
              <div className="lg:col-span-6 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Destination Details
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-sky-300 border border-slate-800">
                    {currentOrder.shippingAddress.isMarinaDelivery ? 'Marina Delivery' : 'Standard UK Postal'}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-900 rounded-xl border border-slate-800 text-xs space-y-2">
                  <div className="font-bold text-white">{currentOrder.shippingAddress.fullName}</div>
                  
                  {currentOrder.shippingAddress.isMarinaDelivery ? (
                    <div className="text-slate-300 space-y-0.5">
                      <div className="text-sky-300 font-semibold">{currentOrder.shippingAddress.marinaName}</div>
                      <div>Berth / Pontoon: <span className="font-mono font-bold text-white">{currentOrder.shippingAddress.berthNumber}</span></div>
                      <div className="text-slate-400">{currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.postcode}</div>
                    </div>
                  ) : (
                    <div className="text-slate-300 space-y-0.5">
                      <div>{currentOrder.shippingAddress.addressLine1}</div>
                      {currentOrder.shippingAddress.addressLine2 && <div>{currentOrder.shippingAddress.addressLine2}</div>}
                      <div className="text-slate-400">{currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.postcode}</div>
                    </div>
                  )}

                  {currentOrder.shippingAddress.deliveryNotes && (
                    <div className="pt-2 border-t border-slate-800/80 text-[11px] text-amber-300/90 italic">
                      Special Note: "{currentOrder.shippingAddress.deliveryNotes}"
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Contact: {currentOrder.customerEmail}</span>
                  <span>{currentOrder.customerPhone}</span>
                </div>
              </div>
            </div>

            {/* Order Items Accordion */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <button
                onClick={() => setShowItemDetails(!showItemDetails)}
                className="w-full flex items-center justify-between text-xs font-bold text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Box className="w-4 h-4 text-sky-400" />
                  <span>Parcel Contents ({currentOrder.items.length} Component Lines)</span>
                </div>
                <div className="flex items-center gap-1.5 text-sky-400">
                  <span>{showItemDetails ? 'Collapse Items' : 'View Components'}</span>
                  <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showItemDetails ? 'rotate-90' : ''}`} />
                </div>
              </button>

              {showItemDetails && (
                <div className="mt-4 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden">
                  <div className="divide-y divide-slate-800/80 text-xs">
                    {currentOrder.items.map((item, idx) => (
                      <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-white">{item.name}</span>
                          <div className="text-[11px] text-slate-400">
                            Quantity: <strong className="text-slate-200">{item.quantity} {item.unit}</strong> @ £{item.unitPrice.toFixed(2)} / {item.unit}
                          </div>
                        </div>
                        <span className="font-mono font-bold text-white text-sm">
                          £{item.lineTotal.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-slate-900/60 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 text-slate-400">
                      <span>Subtotal: <strong className="text-white">£{currentOrder.subtotal.toFixed(2)}</strong></span>
                      <span>•</span>
                      <span>Postage: <strong className="text-white">{currentOrder.shippingCost === 0 ? 'FREE' : `£${currentOrder.shippingCost.toFixed(2)}`}</strong></span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Total Paid:</span>
                      <span className="text-base font-mono font-extrabold text-emerald-400">
                        £{currentOrder.total.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Timeline Stage Simulator / Admin Quick Toggle */}
            {onUpdateOrderStatus && (
              <div className="mt-6 pt-6 border-t border-slate-800/80 bg-slate-950/40 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 sm:p-8 rounded-b-3xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-300 block">
                      Quick Status Timeline Controls (Simulate Order State)
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Test live timeline transitions between Pending, Processing, Dispatched, and Delivered.
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {TIMELINE_STAGES.map((st) => (
                      <button
                        key={st.key}
                        onClick={() => handleSimulateStatus(st.key)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                          currentOrder.orderStatus === st.key || 
                          (st.key === 'pending' && currentOrder.orderStatus === 'received') ||
                          (st.key === 'processing' && currentOrder.orderStatus === 'packed') ||
                          (st.key === 'dispatched' && currentOrder.orderStatus === 'ready_for_pickup')
                            ? 'bg-sky-600 border-sky-400 text-white shadow-md'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                        }`}
                      >
                        Set {st.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Simulated Live Courier Checkpoint Modal */}
      {activeCarrierModal && currentOrder && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-white">
                  {currentOrder.trackingCarrier || 'Royal Mail Tracked 24'} Live Scans
                </h3>
              </div>
              <button 
                onClick={() => setActiveCarrierModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1 font-mono text-xs">
              <span className="text-slate-500 uppercase block text-[10px]">Tracking Number</span>
              <span className="text-sky-300 font-bold text-sm">{currentOrder.trackingNumber}</span>
            </div>

            {/* Simulated Logistics Checkpoint Nodes */}
            <div className="space-y-4 relative pl-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              <div className="relative">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-500/20" />
                <div className="text-xs font-bold text-white">
                  {currentOrder.orderStatus === 'delivered' ? 'Delivered & Signed' : 'In Transit / Out for Delivery'}
                </div>
                <div className="text-[11px] text-slate-400">
                  {currentOrder.shippingAddress.city} Delivery Depot
                </div>
                <div className="text-[10px] font-mono text-slate-500">Today, 08:45 AM</div>
              </div>

              <div className="relative">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-sky-400" />
                <div className="text-xs font-bold text-white">Processed Through Sorting Facility</div>
                <div className="text-[11px] text-slate-400">Southampton Mail Hub (Inbound Solent)</div>
                <div className="text-[10px] font-mono text-slate-500">Yesterday, 22:15 PM</div>
              </div>

              <div className="relative">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-600" />
                <div className="text-xs font-bold text-white">Item Received by Post Office</div>
                <div className="text-[11px] text-slate-400">Gosport High Street / Haslar Collection Point</div>
                <div className="text-[10px] font-mono text-slate-500">Yesterday, 16:30 PM</div>
              </div>

              <div className="relative">
                <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-slate-600" />
                <div className="text-xs font-bold text-white">Despatch Manifest Generated</div>
                <div className="text-[11px] text-slate-400">AJW Marine Electrical Workshop (Gosport)</div>
                <div className="text-[10px] font-mono text-slate-500">{currentOrder.createdAt}</div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setActiveCarrierModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
              >
                Close Tracking Log
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostalOrderTracker;
