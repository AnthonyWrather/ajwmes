import React, { useState } from 'react';
import { PostalOrder } from '../../types';
import { PackingSlipModal } from './PackingSlipModal';
import { 
  Package, 
  Truck, 
  CheckCircle2, 
  Printer, 
  Anchor, 
  Building2, 
  Clock, 
  Search, 
  ExternalLink, 
  Send,
  AlertCircle,
  FileText
} from 'lucide-react';

interface PostalOrdersManagerProps {
  orders: PostalOrder[];
  onUpdateOrderStatus: (
    orderId: string, 
    status: PostalOrder['orderStatus'], 
    trackingNumber?: string, 
    carrier?: string
  ) => void;
}

export const PostalOrdersManager: React.FC<PostalOrdersManagerProps> = ({
  orders,
  onUpdateOrderStatus
}) => {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || '');
  const [trackingInputs, setTrackingInputs] = useState<{ [orderId: string]: { number: string; carrier: string } }>({});
  const [showPrintLabel, setShowPrintLabel] = useState<PostalOrder | null>(null);
  const [packingSlipOrder, setPackingSlipOrder] = useState<PostalOrder | null>(null);
  const [autoPrintSlip, setAutoPrintSlip] = useState<boolean>(false);

  const selectedOrder = orders.find(o => o.id === selectedOrderId) || orders[0];

  const handleOpenPackingSlip = (order: PostalOrder, triggerAutoPrint = false) => {
    setPackingSlipOrder(order);
    setAutoPrintSlip(triggerAutoPrint);
  };

  // Metrics
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const receivedCount = orders.filter(o => o.orderStatus === 'received').length;
  const packedCount = orders.filter(o => o.orderStatus === 'packed').length;
  const dispatchedCount = orders.filter(o => o.orderStatus === 'dispatched').length;

  const filteredOrders = orders.filter(order => {
    if (filterStatus !== 'all' && order.orderStatus !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.orderNumber.toLowerCase().includes(q);
      const matchName = order.customerName.toLowerCase().includes(q);
      const matchEmail = order.customerEmail.toLowerCase().includes(q);
      const matchPostcode = order.shippingAddress.postcode.toLowerCase().includes(q);
      return matchNum || matchName || matchEmail || matchPostcode;
    }
    return true;
  });

  const handleDispatch = (orderId: string) => {
    const tracking = trackingInputs[orderId] || {
      number: `GB${Math.floor(100000000 + Math.random() * 900000000)}RM`,
      carrier: 'Royal Mail Tracked 24'
    };
    onUpdateOrderStatus(orderId, 'dispatched', tracking.number, tracking.carrier);
  };

  return (
    <div className="space-y-6">
      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Total Online Store Sales</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-emerald-400 mt-1 block">
            £{totalRevenue.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">{orders.length} postal orders total</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Needs Packing Now</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-amber-400 mt-1 block">
            {receivedCount} Orders
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Waiting for workshop bench pack</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Ready to Label</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-sky-400 mt-1 block">
            {packedCount} Orders
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Awaiting postal pickup</span>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[11px] text-slate-400 block">Dispatched with Tracking</span>
          <span className="text-xl sm:text-2xl font-bold font-mono text-white mt-1 block">
            {dispatchedCount} Posted
          </span>
          <span className="text-[10px] text-slate-500 mt-0.5 block">Delivered or in transit</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 border border-slate-800 p-3 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'all', label: `All (${orders.length})` },
            { id: 'received', label: `To Pack (${receivedCount})` },
            { id: 'packed', label: `Packed (${packedCount})` },
            { id: 'dispatched', label: `Dispatched (${dispatchedCount})` }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === tab.id
                  ? 'bg-sky-600 text-white'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, customer, postcode..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Orders Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Order Cards List (Left Column) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Online Postal Orders ({filteredOrders.length})
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-2">
              <Package className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">No orders match the selected filter.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2.5 ${
                    selectedOrderId === order.id
                      ? 'bg-slate-900 border-sky-500 shadow-lg shadow-sky-950/40'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono text-sky-400 font-bold">{order.orderNumber}</span>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full border ${
                      order.orderStatus === 'received'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                        : order.orderStatus === 'packed'
                        ? 'bg-sky-950 text-sky-300 border-sky-500/30'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {order.orderStatus === 'received' ? 'Needs Packing' : order.orderStatus}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-sm">{order.customerName}</h4>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      {order.shippingAddress.isMarinaDelivery ? (
                        <span className="flex items-center gap-1 text-sky-400">
                          <Anchor className="w-3 h-3" />
                          <span>{order.shippingAddress.marinaName || 'Solent Marina'}</span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>{order.shippingAddress.city}, {order.shippingAddress.postcode}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Items summary */}
                  <div className="text-[11px] text-slate-300 bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                    <span className="font-semibold">{order.items.length} items: </span>
                    {order.items.map(i => `${i.quantity}x ${i.name.split(' ')[0]}`).join(', ')}
                  </div>

                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-emerald-400 font-bold">
                      £{order.total.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {order.createdAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Selected Order Detail Panel (Right Column) */}
        <div className="lg:col-span-7">
          {selectedOrder ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white font-mono">{selectedOrder.orderNumber}</h3>
                    <span className={`text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full border ${
                      selectedOrder.orderStatus === 'received'
                        ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                        : selectedOrder.orderStatus === 'packed'
                        ? 'bg-sky-950 text-sky-300 border-sky-500/30'
                        : 'bg-emerald-950 text-emerald-300 border-emerald-500/30'
                    }`}>
                      {selectedOrder.orderStatus === 'received' ? 'Needs Packing' : selectedOrder.orderStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Placed on {selectedOrder.createdAt} · Payment: <span className="text-emerald-400 font-semibold">{selectedOrder.paymentStatus.toUpperCase()} ({selectedOrder.paymentMethod.toUpperCase()})</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleOpenPackingSlip(selectedOrder, true)}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shadow-sky-950/40 cursor-pointer"
                    title="Format and print standard packing slip"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Packing Slip</span>
                  </button>

                  <button
                    onClick={() => setShowPrintLabel(selectedOrder)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Print dispatch address label"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Address Label</span>
                  </button>
                </div>
              </div>

              {/* Customer & Delivery Address Card */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/60 p-4 rounded-2xl border border-slate-800 text-xs">
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">Customer Details</span>
                  <div className="font-bold text-white text-sm">{selectedOrder.customerName}</div>
                  <div className="text-slate-300">{selectedOrder.customerEmail}</div>
                  <div className="text-slate-300">{selectedOrder.customerPhone}</div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider">
                    {selectedOrder.shippingAddress.isMarinaDelivery ? 'Marina Delivery Destination' : 'Postal Delivery Address'}
                  </span>
                  {selectedOrder.shippingAddress.isMarinaDelivery ? (
                    <div className="text-slate-300">
                      <div className="font-bold text-sky-400">{selectedOrder.shippingAddress.marinaName}</div>
                      <div>{selectedOrder.shippingAddress.berthNumber}</div>
                      <div>{selectedOrder.shippingAddress.addressLine1}</div>
                      <div>{selectedOrder.shippingAddress.postcode}</div>
                    </div>
                  ) : (
                    <div className="text-slate-300">
                      <div>{selectedOrder.shippingAddress.addressLine1}</div>
                      {selectedOrder.shippingAddress.addressLine2 && <div>{selectedOrder.shippingAddress.addressLine2}</div>}
                      <div>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postcode}</div>
                    </div>
                  )}

                  {selectedOrder.shippingAddress.deliveryNotes && (
                    <div className="text-[11px] text-amber-300/90 pt-1 italic">
                      Note: "{selectedOrder.shippingAddress.deliveryNotes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Items Pack List */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Workshop Pick &amp; Pack List</span>
                  <span>Method: {selectedOrder.shippingMethod.replace(/_/g, ' ').toUpperCase()}</span>
                </div>

                <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/30">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-sky-950/60 border border-sky-500/30 text-sky-400 font-bold flex items-center justify-center font-mono">
                          {item.quantity}x
                        </div>
                        <div>
                          <div className="font-bold text-white">{item.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Unit: {item.unit} @ £{item.unitPrice.toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <div className="font-mono font-bold text-white">
                        £{item.lineTotal.toFixed(2)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Totals Breakdown */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal:</span>
                    <span>£{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Postage / Shipping:</span>
                    <span>{selectedOrder.shippingCost === 0 ? 'FREE' : `£${selectedOrder.shippingCost.toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-slate-800">
                    <span>Order Total:</span>
                    <span className="text-emerald-400">£{selectedOrder.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Status Update / Dispatch Workflow */}
              <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    <Truck className="w-4 h-4 text-sky-400" />
                    <span>Fulfillment &amp; Postal Dispatch Control</span>
                  </span>
                  {selectedOrder.trackingNumber && (
                    <span className="font-mono text-xs text-sky-400 bg-sky-950/80 px-2.5 py-1 rounded-lg border border-sky-500/30">
                      Tracking: {selectedOrder.trackingNumber} ({selectedOrder.trackingCarrier})
                    </span>
                  )}
                </div>

                {selectedOrder.orderStatus === 'received' && (
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      onClick={() => handleOpenPackingSlip(selectedOrder, true)}
                      className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
                      title="Print workshop packing slip before boxing"
                    >
                      <Printer className="w-4 h-4 text-sky-400" />
                      <span>Print Packing Slip</span>
                    </button>
                    <button
                      onClick={() => onUpdateOrderStatus(selectedOrder.id, 'packed')}
                      className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-sky-600/20 cursor-pointer"
                    >
                      <Package className="w-4 h-4" />
                      <span>Mark Packed in Workshop Box</span>
                    </button>
                    <button
                      onClick={() => handleDispatch(selectedOrder.id)}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span>Mark Dispatched (Royal Mail 24)</span>
                    </button>
                  </div>
                )}

                {selectedOrder.orderStatus === 'packed' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Carrier</label>
                        <select
                          value={trackingInputs[selectedOrder.id]?.carrier || 'Royal Mail Tracked 24'}
                          onChange={e => setTrackingInputs({
                            ...trackingInputs,
                            [selectedOrder.id]: {
                              number: trackingInputs[selectedOrder.id]?.number || `GB${Math.floor(100000000 + Math.random() * 900000000)}RM`,
                              carrier: e.target.value
                            }
                          })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                        >
                          <option value="Royal Mail Tracked 24">Royal Mail Tracked 24</option>
                          <option value="Royal Mail Tracked 48">Royal Mail Tracked 48</option>
                          <option value="DPD Next Day Courier">DPD Next Day Courier</option>
                          <option value="Workshop Ready for Collection">Workshop Ready for Collection</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] text-slate-400 mb-1">Tracking Number</label>
                        <input
                          type="text"
                          placeholder="e.g. GB289192482RM"
                          value={trackingInputs[selectedOrder.id]?.number || `GB${Math.floor(100000000 + Math.random() * 900000000)}RM`}
                          onChange={e => setTrackingInputs({
                            ...trackingInputs,
                            [selectedOrder.id]: {
                              carrier: trackingInputs[selectedOrder.id]?.carrier || 'Royal Mail Tracked 24',
                              number: e.target.value
                            }
                          })}
                          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => handleDispatch(selectedOrder.id)}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm Postal Dispatch &amp; Email Customer Tracking</span>
                    </button>
                  </div>
                )}

                {selectedOrder.orderStatus === 'dispatched' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-bold text-white">Dispatched and Consignment Logged</div>
                          <div className="text-slate-400 text-[11px]">
                            Carrier tracking number: <span className="font-mono text-sky-400">{selectedOrder.trackingNumber}</span> ({selectedOrder.trackingCarrier}).
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => onUpdateOrderStatus(selectedOrder.id, 'delivered')}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow transition-all shrink-0"
                      >
                        Mark Delivered
                      </button>
                    </div>
                  </div>
                )}

                {selectedOrder.orderStatus === 'delivered' && (
                  <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-bold text-emerald-300">Delivered to Vessel / Marina</div>
                        <div className="text-slate-400 text-[11px]">
                          Package confirmed delivered to {selectedOrder.shippingAddress.isMarinaDelivery ? selectedOrder.shippingAddress.marinaName : selectedOrder.shippingAddress.city}.
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-500/30">
                      FULFILLED
                    </span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500">
              Select an order from the left list to view fulfillment details.
            </div>
          )}
        </div>
      </div>

      {/* Modal: Printable Postal Address Label & Packing Slip */}
      {showPrintLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-white text-slate-900 max-w-lg w-full rounded-2xl p-6 shadow-2xl space-y-5 print:shadow-none font-sans">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-black text-lg tracking-tight">AJW MARINE ELECTRICAL</h3>
                <p className="text-xs text-slate-600">Gosport Workshop · Solent Marine Postal Dispatch</p>
              </div>
              <button
                onClick={() => setShowPrintLabel(null)}
                className="text-slate-400 hover:text-slate-900 text-sm print:hidden"
              >
                ✕ Close
              </button>
            </div>

            {/* Address Box */}
            <div className="border-2 border-slate-800 p-4 rounded-xl space-y-1 bg-slate-50">
              <span className="text-[10px] font-mono text-slate-500 uppercase font-bold">SHIP TO:</span>
              <div className="font-extrabold text-base">{showPrintLabel.shippingAddress.fullName}</div>
              {showPrintLabel.shippingAddress.isMarinaDelivery && (
                <div className="font-bold text-sky-800">{showPrintLabel.shippingAddress.marinaName} ({showPrintLabel.shippingAddress.berthNumber})</div>
              )}
              <div>{showPrintLabel.shippingAddress.addressLine1}</div>
              {showPrintLabel.shippingAddress.addressLine2 && <div>{showPrintLabel.shippingAddress.addressLine2}</div>}
              <div className="font-bold">{showPrintLabel.shippingAddress.city}</div>
              <div className="font-black text-lg tracking-wider font-mono">{showPrintLabel.shippingAddress.postcode}</div>
              <div className="text-xs text-slate-500">Tel: {showPrintLabel.shippingAddress.phone}</div>
            </div>

            {/* Contents list */}
            <div className="text-xs space-y-2">
              <div className="font-bold text-slate-700">Order: {showPrintLabel.orderNumber} ({showPrintLabel.createdAt})</div>
              <div className="border-t pt-2 space-y-1">
                {showPrintLabel.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{i.quantity}x {i.name}</span>
                    <span className="font-mono">£{i.lineTotal.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-1 flex justify-between font-bold text-sm">
                <span>Total Paid:</span>
                <span>£{showPrintLabel.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Print Action */}
            <div className="flex justify-end gap-2 pt-2 border-t print:hidden">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
              >
                <Printer className="w-4 h-4" />
                <span>Print Physical Label</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Printable Packing Slip & Consignment Note */}
      <PackingSlipModal
        isOpen={!!packingSlipOrder}
        order={packingSlipOrder}
        autoPrint={autoPrintSlip}
        onClose={() => {
          setPackingSlipOrder(null);
          setAutoPrintSlip(false);
        }}
      />
    </div>
  );
};
