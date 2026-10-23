import React, { useState } from 'react';
import { PostalOrder, PostalOrderStatus, PostalOrderTimelineEvent, ShipStationLabelResult } from '../../types';
import { PostalOrdersManager } from '../admin/PostalOrdersManager';
import { OrderProgressTimeline } from './OrderProgressTimeline';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Printer, 
  ShieldCheck, 
  Info, 
  Clock, 
  FileText, 
  AlertCircle,
  Sparkles,
  MapPin,
  Search,
  SlidersHorizontal,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface PostalWorkspaceProps {
  orders: PostalOrder[];
  onUpdateOrderStatus: (
    orderId: string, 
    status: PostalOrder['orderStatus'], 
    trackingNumber?: string, 
    carrier?: string,
    shippingLabelUrl?: string,
    shippingLabelBase64?: string,
    shipstationShipmentId?: string
  ) => void;
  onSaveOrderShippingLabel?: (
    orderId: string,
    labelResult: ShipStationLabelResult
  ) => void;
}

export const PostalWorkspace: React.FC<PostalWorkspaceProps> = ({
  orders,
  onUpdateOrderStatus,
  onSaveOrderShippingLabel
}) => {
  const [activeView, setActiveView] = useState<'manager' | 'timelines'>('manager');
  const [timelineFilter, setTimelineFilter] = useState<string>('all');
  const [timelineSearch, setTimelineSearch] = useState<string>('');

  const pendingPackCount = orders.filter(o => o.orderStatus === 'received' || o.orderStatus === 'processing').length;
  const packedCount = orders.filter(o => o.orderStatus === 'packed' || o.orderStatus === 'ready_for_pickup').length;
  const dispatchedCount = orders.filter(o => o.orderStatus === 'dispatched').length;
  const deliveredCount = orders.filter(o => o.orderStatus === 'delivered').length;

  const filteredTimelineOrders = orders.filter(order => {
    if (timelineFilter === 'received' && !(order.orderStatus === 'received' || order.orderStatus === 'pending' || order.orderStatus === 'processing')) return false;
    if (timelineFilter === 'packed' && !(order.orderStatus === 'packed' || order.orderStatus === 'ready_for_pickup')) return false;
    if (timelineFilter === 'dispatched' && order.orderStatus !== 'dispatched') return false;
    if (timelineFilter === 'delivered' && order.orderStatus !== 'delivered') return false;

    if (timelineSearch.trim()) {
      const q = timelineSearch.toLowerCase();
      const matchNum = order.orderNumber.toLowerCase().includes(q);
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchEmail = order.customerEmail.toLowerCase().includes(q);
      const matchMarina = order.shippingAddress.marinaName?.toLowerCase().includes(q);
      const matchPostcode = order.shippingAddress.postcode.toLowerCase().includes(q);
      return matchNum || matchName || matchEmail || matchMarina || matchPostcode;
    }
    return true;
  });

  return (
    <div data-testid="postal-workspace" className="w-full space-y-6 text-slate-100">
      {/* Role Banner: Explicitly Clarifies Postal Scope */}
      <div data-testid="postal-role-banner" className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-purple-400" />
                <span>Postal Role Active</span>
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-300 font-medium">
                Scope: <strong className="text-white">Package &amp; Send Postal Orders Only</strong>
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <span>Gosport Marine Postal Dispatch Station</span>
            </h2>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              Authorized to bench package tinned marine cables and electrical supplies, print professional packing slips, assign Royal Mail / courier tracking numbers, and audit step-by-step progress timelines from receipt to final vessel delivery.
            </p>
          </div>

          {/* Role Boundary Badges */}
          <div className="flex flex-wrap lg:flex-col items-start gap-1.5 p-3 rounded-2xl bg-slate-950/80 border border-slate-800 text-[11px]">
            <span className="text-slate-400 font-mono text-[10px] uppercase">Permission Bounds:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Postal Orders &amp; Packing Slips: Full Access</span>
            </span>
            <span className="text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-500" />
              <span>Diagnostic Jobs &amp; Labor: Restricted to Tech/Admin</span>
            </span>
            <span className="text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3 text-slate-500" />
              <span>Stock Catalog Pricing &amp; Flyers: Restricted to Admin</span>
            </span>
          </div>
        </div>
      </div>

      {/* Fulfillment Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div data-testid="metric-awaiting-packing" className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Awaiting Packing</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1 block">
            {pendingPackCount} Consignments
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Needs cable cuts &amp; boxed</span>
        </div>

        <div data-testid="metric-packed" className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Packed &amp; Sealed</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-purple-400 mt-1 block">
            {packedCount} Orders
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Ready for courier handover</span>
        </div>

        <div data-testid="metric-dispatched" className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Dispatched</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-sky-400 mt-1 block">
            {dispatchedCount} Shipped
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Royal Mail / DPD Tracked</span>
        </div>

        <div data-testid="metric-delivered" className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Delivered on Vessel</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            {deliveredCount} Completed
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Marina pontoon verified</span>
        </div>
      </div>

      {/* Primary Workspace View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-2.5 rounded-2xl">
        <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
          <button
            type="button"
            data-testid="view-manager-tab"
            onClick={() => setActiveView('manager')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'manager'
                ? 'bg-sky-600 text-white shadow-md shadow-sky-950/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Fulfillment Desk &amp; Packing Slips</span>
          </button>

          <button
            type="button"
            data-testid="view-timelines-tab"
            onClick={() => setActiveView('timelines')}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeView === 'timelines'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-950/60'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Visual Progress Timelines ({orders.length})</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 px-2 font-mono flex items-center gap-2">
          <span>Active Consignments: <strong className="text-white">{orders.length}</strong></span>
          <span>·</span>
          <span>Postal Station: <strong className="text-sky-400">Gosport Bench 1</strong></span>
        </div>
      </div>

      {/* View 1: Fulfillment Desk (Split Order List & Detail with Progress Timeline) */}
      {activeView === 'manager' && (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-2 sm:p-4">
          <PostalOrdersManager
            orders={orders}
            onUpdateOrderStatus={onUpdateOrderStatus}
            onSaveOrderShippingLabel={onSaveOrderShippingLabel}
          />
        </div>
      )}

      {/* View 2: Visual Progress Timelines for Each Order */}
      {activeView === 'timelines' && (
        <div className="space-y-5 bg-slate-900/40 border border-slate-800/80 rounded-3xl p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span>Order Progress Timelines &amp; Lifecycle History</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Visual step-by-step progress milestones for every postal order, from receipt and bench assembly to courier transit and vessel delivery.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative min-w-[220px]">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  data-testid="timeline-search-input"
                  placeholder="Filter orders, vessel, client..."
                  value={timelineSearch}
                  onChange={e => setTimelineSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {[
              { id: 'all', label: `All Orders (${orders.length})` },
              { id: 'received', label: `Awaiting Packing (${pendingPackCount})` },
              { id: 'packed', label: `Packed & Sealed (${packedCount})` },
              { id: 'dispatched', label: `In Transit (${dispatchedCount})` },
              { id: 'delivered', label: `Delivered on Vessel (${deliveredCount})` }
            ].map(f => (
              <button
                key={f.id}
                type="button"
                data-testid={`timeline-filter-${f.id}`}
                onClick={() => setTimelineFilter(f.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  timelineFilter === f.id
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Orders Timeline Stream */}
          {filteredTimelineOrders.length === 0 ? (
            <div className="p-12 text-center bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <Clock className="w-10 h-10 text-slate-600 mx-auto" />
              <h4 className="text-sm font-bold text-white">No Matching Orders Found</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No orders match your filter criteria or search query.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredTimelineOrders.map(order => (
                <div key={order.id} className="space-y-3">
                  <OrderProgressTimeline
                    order={order}
                    onUpdateStatus={onUpdateOrderStatus}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

