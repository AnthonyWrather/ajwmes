import React, { useState } from 'react';
import { PostalOrder } from '../../types';
export { PostalOrderTracker } from '../orders/PostalOrderTracker';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Anchor, 
  Copy, 
  Check, 
  ChevronRight, 
  ExternalLink, 
  AlertCircle,
  Radio,
  FileText,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface OrderTrackingProgressProps {
  orders: PostalOrder[];
  onNavigateToStore?: () => void;
  className?: string;
  compact?: boolean;
}

interface TrackingStep {
  id: string;
  label: string;
  sublabel: string;
  description: string;
}

export const OrderTrackingProgress: React.FC<OrderTrackingProgressProps> = ({
  orders = [],
  onNavigateToStore,
  className = '',
  compact = false
}) => {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [copiedTracking, setCopiedTracking] = useState<boolean>(false);
  const [showItemDetails, setShowItemDetails] = useState<boolean>(false);
  const [showCarrierTimeline, setShowCarrierTimeline] = useState<boolean>(false);

  // Active orders are those in received, packed, or dispatched states
  const activeOrders = orders.filter(o => 
    o.orderStatus === 'received' || 
    o.orderStatus === 'packed' || 
    o.orderStatus === 'dispatched' ||
    o.orderStatus === 'ready_for_pickup'
  );

  // Fallback to latest order if none strictly active, or null
  const currentOrders = activeOrders.length > 0 ? activeOrders : orders.slice(0, 1);
  const currentOrder = currentOrders.find(o => o.id === selectedOrderId) || currentOrders[0];

  if (!currentOrder) {
    if (compact) return null;
    return (
      <div className={`bg-slate-900 border border-slate-800 rounded-3xl p-6 text-center space-y-3 ${className}`}>
        <Package className="w-10 h-10 text-slate-600 mx-auto" />
        <h4 className="text-sm font-bold text-white">No Active Postal Orders</h4>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          You don't have any electrical parts or cable orders currently in transit.
        </p>
        {onNavigateToStore && (
          <button
            onClick={onNavigateToStore}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
          >
            Order Cables &amp; Fuses from Workshop
          </button>
        )}
      </div>
    );
  }

  // Determine stage progression
  // Stages: 1. Received (25%), 2. Packed (55%), 3. Dispatched / In Transit (85%), 4. Delivered (100%)
  const getStageInfo = (status: PostalOrder['orderStatus'], method: PostalOrder['shippingMethod']) => {
    const isPickup = method === 'solent_pickup' || status === 'ready_for_pickup';

    if (isPickup) {
      switch (status) {
        case 'received':
          return {
            percent: 33,
            stepIndex: 0,
            statusBadge: 'Order Received',
            badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/30',
            headline: 'Order Logged & Payment Confirmed',
            subhead: 'Anthony is prepping your components at the Gosport bench.',
            etaText: 'Ready for collection in approx. 2-4 hours'
          };
        case 'packed':
        case 'ready_for_pickup':
          return {
            percent: 85,
            stepIndex: 1,
            statusBadge: 'Ready for Collection',
            badgeBg: 'bg-sky-950 text-sky-300 border-sky-500/30',
            headline: 'Boxed & Ready at Workshop / Pontoon',
            subhead: 'Your order is ready for pickup at Gosport Marine Workshop.',
            etaText: 'Available for immediate pontoon collection'
          };
        default:
          return {
            percent: 100,
            stepIndex: 2,
            statusBadge: 'Collected',
            badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
            headline: 'Order Collected by Owner',
            subhead: 'Thank you for supporting AJW Marine Electrical.',
            etaText: 'Completed'
          };
      }
    }

    switch (status) {
      case 'received':
        return {
          percent: 25,
          stepIndex: 0,
          statusBadge: 'Processing in Workshop',
          badgeBg: 'bg-amber-950 text-amber-300 border-amber-500/30',
          headline: 'Order Received & Queued on Bench',
          subhead: 'Items allocated from workshop stock; tinned cables awaiting reel cut.',
          etaText: 'Dispatches today or next business morning'
        };
      case 'packed':
        return {
          percent: 55,
          stepIndex: 1,
          statusBadge: 'Packed & Labeled',
          badgeBg: 'bg-sky-950 text-sky-300 border-sky-500/30',
          headline: 'Cables Cut, Labeled & Heat-Sealed',
          subhead: 'Awaiting Royal Mail / DPD daily courier collection run.',
          etaText: 'Estimated carrier handover today by 16:30'
        };
      case 'dispatched':
        return {
          percent: 85,
          stepIndex: 2,
          statusBadge: 'In Transit with Courier',
          badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
          headline: 'Package Out on Delivery Route',
          subhead: `In transit via ${currentOrder.trackingCarrier || 'Royal Mail Tracked 24'} to your destination.`,
          etaText: 'Estimated delivery: Within 24-48 hrs'
        };
      default:
        return {
          percent: 100,
          stepIndex: 3,
          statusBadge: 'Delivered',
          badgeBg: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
          headline: 'Delivered to Vessel / Marina Office',
          subhead: 'Package safely delivered.',
          etaText: 'Delivered'
        };
    }
  };

  const stage = getStageInfo(currentOrder.orderStatus, currentOrder.shippingMethod);

  const steps: TrackingStep[] = [
    {
      id: 'step-1',
      label: 'Order Confirmed',
      sublabel: currentOrder.createdAt.split(' ')[1] || 'Workshop',
      description: 'Stock allocated & invoice cleared'
    },
    {
      id: 'step-2',
      label: 'Bench Packed',
      sublabel: currentOrder.orderStatus !== 'received' ? 'Completed' : 'In Progress',
      description: 'Cables cut, spooled & sealed'
    },
    {
      id: 'step-3',
      label: 'Dispatched & In Transit',
      sublabel: currentOrder.dispatchedAt ? currentOrder.dispatchedAt.split(' ')[0] : (currentOrder.trackingCarrier || 'Tracked 24'),
      description: 'With courier or marina driver'
    },
    {
      id: 'step-4',
      label: 'Delivered to Berth',
      sublabel: currentOrder.shippingAddress.isMarinaDelivery ? 'Marina Pontoon' : 'Postal Address',
      description: currentOrder.shippingAddress.isMarinaDelivery 
        ? `${currentOrder.shippingAddress.marinaName || 'Marina'} (${currentOrder.shippingAddress.berthNumber || 'Office'})`
        : currentOrder.shippingAddress.postcode
    }
  ];

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  return (
    <div className={`bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/40 border border-sky-500/30 rounded-3xl p-5 sm:p-7 shadow-xl shadow-sky-950/20 text-slate-100 ${className}`}>
      {/* Top Header: Active Order Switcher & Real-time Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-sky-400 uppercase">
                Real-Time Postal Order Tracking
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-900/40 text-sky-300 border border-sky-500/30">
                LIVE
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-white font-bold mt-0.5">
              <span>{currentOrder.orderNumber}</span>
              <span className="text-slate-500">·</span>
              <span className="text-xs font-normal text-slate-400">{currentOrder.createdAt}</span>
            </div>
          </div>
        </div>

        {/* Multi-Order Tabs if more than 1 active */}
        {currentOrders.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl overflow-x-auto max-w-full">
            {currentOrders.map(ord => (
              <button
                key={ord.id}
                onClick={() => setSelectedOrderId(ord.id)}
                className={`px-2.5 py-1 text-xs font-mono font-bold rounded-lg transition-colors whitespace-nowrap ${
                  currentOrder.id === ord.id
                    ? 'bg-sky-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ord.orderNumber}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-mono uppercase px-3 py-1 rounded-full border ${stage.badgeBg}`}>
            {stage.statusBadge}
          </span>
        </div>
      </div>

      {/* Main Status Callout */}
      <div className="py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 space-y-1.5">
          <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
            <span>{stage.headline}</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {stage.subhead}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
            {/* ETA */}
            <div className="flex items-center gap-1.5 text-sky-300 bg-sky-950/50 px-2.5 py-1 rounded-lg border border-sky-500/20">
              <Clock className="w-3.5 h-3.5 text-sky-400" />
              <span className="font-medium">{stage.etaText}</span>
            </div>

            {/* Destination */}
            <div className="flex items-center gap-1.5 text-slate-300 bg-slate-950/60 px-2.5 py-1 rounded-lg border border-slate-800">
              {currentOrder.shippingAddress.isMarinaDelivery ? (
                <>
                  <Anchor className="w-3.5 h-3.5 text-sky-400" />
                  <span>
                    <strong>{currentOrder.shippingAddress.marinaName}</strong> ({currentOrder.shippingAddress.berthNumber || 'Marina Office'})
                  </span>
                </>
              ) : (
                <>
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.postcode}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tracking Details Box */}
        <div className="md:col-span-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Carrier Service</span>
            <span className="font-bold text-white flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-sky-400" />
              <span>{currentOrder.trackingCarrier || 'Royal Mail Tracked 24'}</span>
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800/80">
            <span className="text-[10px] uppercase font-mono text-slate-500 block">Tracking Number</span>
            {currentOrder.trackingNumber ? (
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono text-xs font-bold text-sky-300 tracking-wider">
                  {currentOrder.trackingNumber}
                </span>
                <button
                  onClick={() => handleCopyTracking(currentOrder.trackingNumber!)}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                  title="Copy tracking code"
                >
                  {copiedTracking ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-400 italic mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>Barcode generating at packing bench</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400">
            <span>{currentOrder.items.length} item types</span>
            <span className="font-mono font-bold text-emerald-400">£{currentOrder.total.toFixed(2)} Paid</span>
          </div>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="py-4 space-y-3">
        {/* Visual Progress Line */}
        <div className="relative">
          {/* Background Track */}
          <div className="h-2.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80">
            {/* Filled Progress Bar */}
            <div 
              className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-all duration-700 ease-out relative"
              style={{ width: `${stage.percent}%` }}
            >
              {/* Shimmer light animation */}
              <div className="absolute inset-0 bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>

        {/* 4 Step Nodes */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
          {steps.map((s, idx) => {
            const isCompleted = idx < stage.stepIndex;
            const isCurrent = idx === stage.stepIndex;
            const isPending = idx > stage.stepIndex;

            return (
              <div 
                key={s.id}
                className={`p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-sky-950/60 border-sky-500/60 shadow-lg shadow-sky-950/40 ring-1 ring-sky-500/40'
                    : isCompleted
                    ? 'bg-slate-950/40 border-emerald-500/30 text-slate-300'
                    : 'bg-slate-950/20 border-slate-800/60 text-slate-500'
                }`}
              >
                <div className="flex items-center justify-between gap-1.5 mb-1">
                  <div className="flex items-center gap-1.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    ) : isCurrent ? (
                      <span className="relative flex h-2.5 w-2.5 flex-shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                      </span>
                    ) : (
                      <span className="w-2.5 h-2.5 rounded-full bg-slate-700 flex-shrink-0" />
                    )}
                    <span className={`text-[11px] font-bold ${
                      isCurrent ? 'text-sky-300' : isCompleted ? 'text-white' : 'text-slate-400'
                    }`}>
                      {s.label}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{idx + 1}/4</span>
                </div>

                <p className="text-[10px] text-slate-400 line-clamp-1">{s.description}</p>
                <span className="text-[10px] font-mono text-sky-400/80 block mt-1 font-semibold">
                  {s.sublabel}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Accordion Panels: Items breakdown & Live Carrier Milestones */}
      <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowItemDetails(!showItemDetails)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            <Package className="w-3.5 h-3.5 text-sky-400" />
            <span>Package Contents ({currentOrder.items.length})</span>
            {showItemDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => setShowCarrierTimeline(!showCarrierTimeline)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-300 hover:text-white transition-colors"
          >
            <Truck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Carrier Timeline</span>
            {showCarrierTimeline ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {onNavigateToStore && (
          <button
            onClick={onNavigateToStore}
            className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
          >
            <span>Order more parts from stock</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Expandable 1: Package Items */}
      {showItemDetails && (
        <div className="mt-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 animate-fadeIn">
          <span className="text-[11px] font-mono uppercase text-slate-400 font-bold block">
            Items in this Postal Parcel:
          </span>
          <div className="divide-y divide-slate-800/60">
            {currentOrder.items.map((it, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <span className="text-white font-medium">{it.name}</span>
                  <span className="text-slate-400 text-[11px] block">
                    Quantity: {it.quantity} {it.unit} @ £{it.unitPrice.toFixed(2)}
                  </span>
                </div>
                <span className="font-mono font-bold text-white">£{it.lineTotal.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-bold text-slate-300">
            <span>Subtotal: £{currentOrder.subtotal.toFixed(2)}</span>
            <span>Shipping: {currentOrder.shippingCost === 0 ? 'FREE' : `£${currentOrder.shippingCost.toFixed(2)}`}</span>
            <span className="text-emerald-400 font-mono text-sm">Total: £{currentOrder.total.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Expandable 2: Carrier Scan Timeline */}
      {showCarrierTimeline && (
        <div className="mt-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 font-bold">
              Dispatch &amp; Transit Log:
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Courier Network: {currentOrder.trackingCarrier || 'Royal Mail Tracked'}
            </span>
          </div>

          <div className="space-y-3 relative pl-4 border-l-2 border-sky-500/40 ml-2">
            {/* Event 1 */}
            <div className="relative">
              <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-sky-500 border-2 border-slate-950" />
              <div className="text-xs">
                <span className="font-bold text-white">Order placed &amp; inventory allocated</span>
                <span className="text-[11px] text-slate-400 block font-mono">{currentOrder.createdAt} · Gosport Workshop</span>
              </div>
            </div>

            {/* Event 2 if packed or dispatched */}
            {(currentOrder.orderStatus === 'packed' || currentOrder.orderStatus === 'dispatched' || currentOrder.orderStatus === 'ready_for_pickup') && (
              <div className="relative">
                <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-sky-500 border-2 border-slate-950" />
                <div className="text-xs">
                  <span className="font-bold text-white">Tinned marine wire spooled &amp; inspected</span>
                  <span className="text-[11px] text-slate-400 block font-mono">Workshop bench QA passed</span>
                </div>
              </div>
            )}

            {/* Event 3 if dispatched */}
            {currentOrder.orderStatus === 'dispatched' && (
              <div className="relative">
                <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950" />
                <div className="text-xs">
                  <span className="font-bold text-emerald-300">Handed to {currentOrder.trackingCarrier}</span>
                  <span className="text-[11px] text-slate-400 block font-mono">
                    {currentOrder.dispatchedAt || 'Today'} · Southampton Distribution Hub
                  </span>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Tracking barcode <code className="text-sky-300 font-bold">{currentOrder.trackingNumber}</code> confirmed active on carrier gateway.
                  </p>
                </div>
              </div>
            )}

            {/* Expected event */}
            <div className="relative opacity-70">
              <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-slate-700 border-2 border-slate-950" />
              <div className="text-xs">
                <span className="font-bold text-slate-300">
                  Delivery to {currentOrder.shippingAddress.isMarinaDelivery ? currentOrder.shippingAddress.marinaName : 'Destination Postcode'}
                </span>
                <span className="text-[11px] text-slate-500 block">
                  {currentOrder.shippingAddress.deliveryNotes ? `Notes: "${currentOrder.shippingAddress.deliveryNotes}"` : 'Berth delivery route'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
