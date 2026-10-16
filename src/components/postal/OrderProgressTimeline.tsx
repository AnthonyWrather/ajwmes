import React, { useState } from 'react';
import { PostalOrder, PostalOrderStatus, PostalOrderTimelineEvent } from '../../types';
import { 
  buildOrderTimelineSteps, 
  buildOrderTimelineHistory, 
  getOrderProgressPercent,
  getStatusTier,
  ProgressStep 
} from '../../utils/postalTimeline';
import { 
  CheckCircle2, 
  Package, 
  Truck, 
  Clock, 
  Receipt, 
  Anchor, 
  Building2, 
  Copy, 
  Check, 
  ExternalLink, 
  Plus, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  ShieldCheck, 
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';

interface OrderProgressTimelineProps {
  order: PostalOrder;
  onUpdateStatus?: (
    orderId: string, 
    status: PostalOrderStatus, 
    trackingNumber?: string, 
    carrier?: string
  ) => void;
  onAddTimelineEvent?: (orderId: string, event: PostalOrderTimelineEvent) => void;
  compact?: boolean;
  interactive?: boolean;
  className?: string;
}

export const OrderProgressTimeline: React.FC<OrderProgressTimelineProps> = ({
  order,
  onUpdateStatus,
  onAddTimelineEvent,
  compact = false,
  interactive = true,
  className = ''
}) => {
  const [copiedTracking, setCopiedTracking] = useState(false);
  const [showHistoryLog, setShowHistoryLog] = useState(!compact);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [customNote, setCustomNote] = useState('');
  const [customLocation, setCustomLocation] = useState('Gosport Workshop');

  const steps: ProgressStep[] = buildOrderTimelineSteps(order);
  const historyEvents: PostalOrderTimelineEvent[] = buildOrderTimelineHistory(order);
  const progressPercent = getOrderProgressPercent(order);
  const currentTier = getStatusTier(order.orderStatus);

  const handleCopyTracking = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedTracking(true);
    setTimeout(() => setCopiedTracking(false), 2000);
  };

  const handleAddCheckpointNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNote.trim()) return;

    const newEvt: PostalOrderTimelineEvent = {
      id: `custom-evt-${Date.now()}`,
      status: order.orderStatus,
      title: 'Workshop Checkpoint Note',
      description: customNote.trim(),
      timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
      location: customLocation.trim() || 'Gosport Workshop Bench',
      completed: true,
      operator: 'Postal Dispatch Technician'
    };

    if (onAddTimelineEvent) {
      onAddTimelineEvent(order.id, newEvt);
    }
    setCustomNote('');
    setIsAddingNote(false);
  };

  // Quick Action Buttons
  const renderQuickActions = () => {
    if (!onUpdateStatus || !interactive) return null;

    return (
      <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800">
        <span className="text-[11px] font-mono uppercase text-slate-400 mr-1 flex items-center gap-1">
          <span>Advance Stage:</span>
        </span>

        {currentTier === 0 && (
          <button
            data-testid="advance-to-packed-btn"
            onClick={() => onUpdateStatus(order.id, 'packed')}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-sky-900/30 cursor-pointer"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Mark Bench Packed &amp; Sealed</span>
          </button>
        )}

        {currentTier <= 1 && (
          <button
            data-testid="advance-to-dispatched-btn"
            onClick={() => {
              const defaultTracking = order.trackingNumber || `GB${Math.floor(100000000 + Math.random() * 900000000)}RM`;
              const defaultCarrier = order.trackingCarrier || 'Royal Mail Tracked 24';
              onUpdateStatus(order.id, 'dispatched', defaultTracking, defaultCarrier);
            }}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-indigo-900/30 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Mark Dispatched (Royal Mail 24)</span>
          </button>
        )}

        {currentTier === 2 && (
          <button
            data-testid="advance-to-delivered-btn"
            onClick={() => onUpdateStatus(order.id, 'delivered')}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-900/30 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Confirm Delivered on Vessel / Pontoon</span>
          </button>
        )}

        {currentTier === 3 && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Consignment Fully Fulfilled</span>
          </div>
        )}

        {/* Note Trigger Button */}
        <button
          type="button"
          onClick={() => setIsAddingNote(!isAddingNote)}
          className="ml-auto px-2.5 py-1 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
        >
          <Plus className="w-3 h-3" />
          <span>Add Checkpoint Note</span>
        </button>
      </div>
    );
  };

  return (
    <div data-testid="order-progress-timeline" className={`bg-slate-950/80 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-4 ${className}`}>
      {/* Top Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-sm font-bold text-sky-400">
              {order.orderNumber}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-xs text-slate-300 font-medium">
              {order.customerName}
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>{order.createdAt}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            {order.shippingAddress.isMarinaDelivery ? (
              <span className="flex items-center gap-1 text-sky-300">
                <Anchor className="w-3.5 h-3.5 text-sky-400" />
                <span>{order.shippingAddress.marinaName || 'Solent Marina'} ({order.shippingAddress.berthNumber || 'Berth Pontoon'})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1 text-slate-300">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <span>{order.shippingAddress.city}, {order.shippingAddress.postcode}</span>
              </span>
            )}
          </div>
        </div>

        {/* Current Stage Badge & Percent Pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Progress</span>
            <span className="text-xs font-mono font-bold text-white block">
              {progressPercent}% Complete
            </span>
          </div>
          <div className="h-8 w-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-mono text-xs font-bold text-sky-400">
            {currentTier + 1}/4
          </div>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="space-y-1.5">
        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-800/80">
          <div 
            className="h-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] font-mono text-slate-500 px-0.5">
          <span>1. Receipt</span>
          <span>2. Bench Pack</span>
          <span>3. Dispatch</span>
          <span>4. Delivery</span>
        </div>
      </div>

      {/* Visual Step-by-Step Stepper Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {steps.map((step) => {
          const isDone = step.status === 'completed';
          const isCurrent = step.status === 'current';
          const isUpcoming = step.status === 'upcoming';

          return (
            <div
              key={step.key}
              data-testid={`timeline-step-${step.key}`}
              className={`relative rounded-xl p-3.5 border transition-all space-y-2 ${
                isCurrent
                  ? 'bg-gradient-to-b from-slate-900 to-slate-950 border-sky-500/80 ring-1 ring-sky-500/30 shadow-lg shadow-sky-950/50'
                  : isDone
                  ? 'bg-slate-900/60 border-emerald-500/30 hover:border-emerald-500/50'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-60'
              }`}
            >
              {/* Top row in step card */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold font-mono transition-colors ${
                      isDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isCurrent
                        ? 'bg-sky-500 text-white shadow-md shadow-sky-500/40 animate-pulse'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : step.stepNumber}
                  </div>
                  <span className={`text-xs font-bold ${isCurrent ? 'text-white' : isDone ? 'text-slate-200' : 'text-slate-400'}`}>
                    {step.label}
                  </span>
                </div>

                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${step.badgeColor}`}>
                  {step.badge}
                </span>
              </div>

              {/* Step Sublabel & Timestamp */}
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium text-slate-300 line-clamp-1">
                  {step.sublabel}
                </p>
                {step.timestamp && (
                  <p className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    <span>{step.timestamp}</span>
                  </p>
                )}
              </div>

              {/* Step Narrative */}
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Courier Tracking Callout (if tracking exists or in transit) */}
      {(order.trackingNumber || currentTier >= 2) && (
        <div className="p-3 bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white flex items-center gap-2">
                <span>Carrier: {order.trackingCarrier || 'Royal Mail Tracked 24'}</span>
                {order.orderStatus === 'delivered' && (
                  <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
                    Delivered
                  </span>
                )}
              </div>
              <div className="text-slate-400 text-[11px] font-mono flex items-center gap-2 mt-0.5">
                <span>Tracking Reference:</span>
                <span className="text-sky-300 font-bold">{order.trackingNumber || 'GB-RM24-PENDING'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {order.trackingNumber && (
              <button
                type="button"
                onClick={() => handleCopyTracking(order.trackingNumber!)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Copy tracking code to clipboard"
              >
                {copiedTracking ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTracking ? 'Copied' : 'Copy Track #'}</span>
              </button>
            )}

            <a
              href={`https://www.royalmail.com/track-your-item#/tracking-results/${order.trackingNumber || ''}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <span>Live Carrier Portal</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Add Checkpoint Form */}
      {isAddingNote && (
        <form onSubmit={handleAddCheckpointNote} className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
          <div className="font-semibold text-white flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sky-400">
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Workshop Checkpoint / Note</span>
            </span>
            <button
              type="button"
              onClick={() => setIsAddingNote(false)}
              className="text-slate-500 hover:text-white"
            >
              ✕ Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Location / Station</label>
              <input
                type="text"
                value={customLocation}
                onChange={e => setCustomLocation(e.target.value)}
                placeholder="e.g. Haslar Marina Office, Workshop Bench 1"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-400 mb-1">Checkpoint Details / Event Note</label>
              <input
                type="text"
                value={customNote}
                onChange={e => setCustomNote(e.target.value)}
                placeholder="e.g. 12m cable run verified & crimped; handed to driver"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                autoFocus
              />
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              Save Event into History
            </button>
          </div>
        </form>
      )}

      {/* Expandable Chronological History Log */}
      <div className="border-t border-slate-800/80 pt-3">
        <button
          type="button"
          onClick={() => setShowHistoryLog(!showHistoryLog)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white py-1 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-slate-400">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>Audited Event History Log ({historyEvents.length} Recorded Milestones)</span>
          </span>
          <span className="flex items-center gap-1 text-[11px] text-sky-400">
            <span>{showHistoryLog ? 'Hide History' : 'Show Full History'}</span>
            {showHistoryLog ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </span>
        </button>

        {showHistoryLog && (
          <div className="mt-3 space-y-2.5 pl-2 sm:pl-3 border-l-2 border-slate-800 ml-2">
            {historyEvents.map((evt, idx) => (
              <div key={evt.id || idx} className="relative pl-4 space-y-1 text-xs">
                {/* Timeline node pip */}
                <div className="absolute -left-[17px] top-1 w-2.5 h-2.5 rounded-full bg-sky-400 ring-4 ring-slate-950" />

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-white text-xs">
                    {evt.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {evt.timestamp}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {evt.description}
                </p>

                <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500 pt-0.5">
                  {evt.location && (
                    <span className="flex items-center gap-1 text-slate-400">
                      <MapPin className="w-2.5 h-2.5 text-slate-500" />
                      <span>{evt.location}</span>
                    </span>
                  )}
                  {evt.operator && (
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-2.5 h-2.5 text-slate-500" />
                      <span>{evt.operator}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Action Stage Buttons */}
      {renderQuickActions()}
    </div>
  );
};
