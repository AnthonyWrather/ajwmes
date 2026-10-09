import React from 'react';
import { PostalOrder } from '../../types';
import { PostalOrdersManager } from '../admin/PostalOrdersManager';
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
  MapPin
} from 'lucide-react';

interface PostalWorkspaceProps {
  orders: PostalOrder[];
  onUpdateOrderStatus: (
    orderId: string, 
    status: PostalOrder['orderStatus'], 
    trackingNumber?: string, 
    carrier?: string
  ) => void;
}

export const PostalWorkspace: React.FC<PostalWorkspaceProps> = ({
  orders,
  onUpdateOrderStatus
}) => {
  const pendingPackCount = orders.filter(o => o.orderStatus === 'received' || o.orderStatus === 'processing').length;
  const packedCount = orders.filter(o => o.orderStatus === 'packed' || o.orderStatus === 'ready_for_pickup').length;
  const dispatchedCount = orders.filter(o => o.orderStatus === 'dispatched').length;
  const deliveredCount = orders.filter(o => o.orderStatus === 'delivered').length;

  return (
    <div className="w-full space-y-6 text-slate-100">
      {/* Role Banner: Explicitly Clarifies Postal Scope */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-500/40 rounded-3xl p-6 shadow-xl">
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
              Authorized to bench package tinned marine cables and electrical supplies, print professional packing slips, assign Royal Mail / courier tracking numbers, and confirm consignments out for Solent or UK dispatch.
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
        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Awaiting Packing</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1 block">
            {pendingPackCount} Consignments
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Needs cable cuts &amp; boxed</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Packed &amp; Sealed</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-purple-400 mt-1 block">
            {packedCount} Orders
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Ready for courier handover</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Dispatched</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-sky-400 mt-1 block">
            {dispatchedCount} Shipped
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Royal Mail / DPD Tracked</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Delivered on Vessel</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            {deliveredCount} Completed
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Marina pontoon verified</span>
        </div>
      </div>

      {/* Packaging & Sending Manager Station */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-2 sm:p-4">
        <PostalOrdersManager
          orders={orders}
          onUpdateOrderStatus={onUpdateOrderStatus}
        />
      </div>
    </div>
  );
};
