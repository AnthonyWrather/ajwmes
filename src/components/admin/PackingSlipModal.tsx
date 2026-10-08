import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { PostalOrder } from '../../types';
import { 
  Printer, 
  X, 
  CheckCircle2, 
  Anchor, 
  MapPin, 
  Truck, 
  ShieldCheck, 
  Package, 
  Calendar, 
  Phone, 
  Mail, 
  Check, 
  Clock,
  Eye,
  FileText
} from 'lucide-react';

interface PackingSlipModalProps {
  isOpen: boolean;
  order: PostalOrder | null;
  onClose: () => void;
  autoPrint?: boolean;
}

export const PackingSlipModal: React.FC<PackingSlipModalProps> = ({
  isOpen,
  order,
  onClose,
  autoPrint = false
}) => {
  const [showPrices, setShowPrices] = useState(true);
  const [benchChecked, setBenchChecked] = useState(true);
  const [packerName, setPackerName] = useState('Anthony Wrather (AJW Marine)');
  const [specialNote, setSpecialNote] = useState('');

  // Handle escape key & print body classes
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('packing-slip-modal-open');

    // If autoPrint requested, trigger window.print() after a slight tick for DOM paint
    let timer: NodeJS.Timeout | null = null;
    if (autoPrint) {
      timer = setTimeout(() => {
        window.print();
      }, 250);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('packing-slip-modal-open');
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, autoPrint, onClose]);

  if (!isOpen || !order) return null;

  const todayDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const totalItemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const modalContent = (
    <div 
      id="packing-slip-portal-root"
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex flex-col items-center packing-slip-overlay"
    >
      {/* Top Floating Control Toolbar (Hidden in Print) */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 no-print print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-sky-400 font-bold">Standard Document Layout</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {order.orderNumber}
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Packing Slip &amp; Consignment Note
            </h3>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer select-none hover:border-slate-700">
            <input
              type="checkbox"
              checked={showPrices}
              onChange={(e) => setShowPrices(e.target.checked)}
              className="rounded border-slate-700 text-sky-600 focus:ring-sky-500"
            />
            <span>Show Item Prices</span>
          </label>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-sky-600/30 transition-all cursor-pointer"
            title="Open browser print dialog"
          >
            <Printer className="w-4 h-4" />
            <span>Print Packing Slip</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Close packing slip preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* The Printable Packing Slip Document (Styled with print media classes) */}
      <div 
        id="printable-packing-slip"
        className="packing-slip-sheet bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl p-6 sm:p-10 font-sans border border-slate-200"
      >
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b-2 border-slate-900 pb-6">
          {/* Company Brand Letterhead */}
          <div className="flex items-start gap-4">
            {/* Marine Anchor & Lightning Bolt Mark */}
            <div className="w-14 h-14 rounded-xl bg-slate-950 p-2 flex items-center justify-center shrink-0 border border-slate-800 shadow-sm print:border-slate-900">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Ring */}
                <circle cx="50" cy="22" r="8" fill="none" stroke="#38BDF8" strokeWidth="4" />
                {/* Crossbar */}
                <line x1="28" y1="36" x2="72" y2="36" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
                <circle cx="28" cy="36" r="3" fill="#38BDF8" />
                <circle cx="72" cy="36" r="3" fill="#38BDF8" />
                {/* Electric Lightning Shank */}
                <path d="M 54 32 L 44 52 L 55 52 L 46 76" fill="none" stroke="#38BDF8" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Flukes */}
                <path d="M 22 64 C 26 84, 74 84, 78 64" fill="none" stroke="#0284C7" strokeWidth="5" strokeLinecap="round" />
                {/* Tips */}
                <polygon points="22,64 16,69 25,70" fill="#38BDF8" />
                <polygon points="78,64 84,69 75,70" fill="#38BDF8" />
                {/* Base crown */}
                <circle cx="50" cy="83" r="3" fill="#38BDF8" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 font-mono">
                  AJW MARINE ELECTRICAL
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-sky-400 px-2 py-0.5 rounded">
                  SERVICES
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                Gosport Workshop &amp; Solent Marine Engineering
              </p>
              <div className="text-[11px] text-slate-600 space-y-0.5 mt-1 font-sans">
                <div>Unit 4, Haslar Marina Trade Yard, Gosport, Hampshire PO12 1NU</div>
                <div className="flex items-center gap-3">
                  <span><strong>Tel:</strong> 07700 900142</span>
                  <span>·</span>
                  <span><strong>Email:</strong> anthony@ajw-marine.co.uk</span>
                  <span>·</span>
                  <span><strong>Web:</strong> ajw-marine.co.uk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Title & Meta Box */}
          <div className="sm:text-right shrink-0">
            <div className="inline-block bg-slate-900 text-white font-mono font-extrabold text-lg sm:text-xl px-4 py-1.5 rounded-lg tracking-wider uppercase mb-2">
              PACKING SLIP
            </div>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-slate-500 font-mono uppercase text-[10px] block">Order Reference</span>
                <span className="font-mono font-bold text-base text-slate-900">{order.orderNumber}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                <span>Order Date: </span>
                <span className="font-medium text-slate-900">{order.createdAt}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                <span>Packed Date: </span>
                <span className="font-medium text-slate-900">{todayDate}</span>
              </div>
              <div className="pt-1">
                <span className="inline-block text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-slate-300 bg-slate-100 text-slate-800">
                  Status: {order.orderStatus.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Two-Column Shipment & Customer Info Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
          {/* Box 1: Deliver To / Vessel Destination */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-700" />
                <span>SHIP TO / DELIVERY DESTINATION</span>
              </span>
              {order.shippingAddress.isMarinaDelivery && (
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300 flex items-center gap-1">
                  <Anchor className="w-3 h-3" />
                  <span>Marina Berth Delivery</span>
                </span>
              )}
            </div>

            <div className="space-y-1 text-xs">
              <div className="font-bold text-slate-950 text-sm">
                {order.shippingAddress.fullName || order.customerName}
              </div>

              {order.shippingAddress.isMarinaDelivery && (
                <div className="p-2 rounded-lg bg-sky-50 border border-sky-200 text-sky-950 font-medium">
                  <div className="font-bold">{order.shippingAddress.marinaName}</div>
                  <div className="text-[11px] font-mono text-sky-800">
                    Berth / Pontoon: {order.shippingAddress.berthNumber || 'General Pontoon Delivery'}
                  </div>
                </div>
              )}

              <div className="text-slate-700">
                <div>{order.shippingAddress.addressLine1}</div>
                {order.shippingAddress.addressLine2 && <div>{order.shippingAddress.addressLine2}</div>}
                <div className="font-semibold text-slate-900">
                  {order.shippingAddress.city}, <span className="font-mono">{order.shippingAddress.postcode}</span>
                </div>
              </div>

              <div className="pt-1 text-[11px] text-slate-600 flex flex-wrap gap-x-4">
                <span><strong>Phone:</strong> {order.shippingAddress.phone || order.customerPhone}</span>
                <span><strong>Email:</strong> {order.shippingAddress.email || order.customerEmail}</span>
              </div>

              {order.shippingAddress.deliveryNotes && (
                <div className="mt-2 p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 text-[11px]">
                  <strong>Special Delivery Note:</strong> "{order.shippingAddress.deliveryNotes}"
                </div>
              )}
            </div>
          </div>

          {/* Box 2: Consignment, Carrier & Payment Info */}
          <div className="border border-slate-300 rounded-xl p-4 bg-slate-50/70 space-y-2 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="text-[10px] font-mono font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-slate-700" />
                  <span>CONSIGNMENT &amp; CARRIER SPECIFICATION</span>
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  {order.paymentStatus === 'paid' ? 'PAID IN FULL' : 'PAYMENT PENDING'}
                </span>
              </div>

              <div className="space-y-1.5 text-xs pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-600">Carrier / Service:</span>
                  <span className="font-bold text-slate-900">
                    {order.trackingCarrier || 'Royal Mail Tracked 24'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Dispatch Speed:</span>
                  <span className="font-medium text-slate-900 capitalize">
                    {order.shippingMethod.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Tracking Number:</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {order.trackingNumber || 'GB-CONSIGNMENT-PENDING'}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-slate-600">Payment Method:</span>
                  <span className="font-medium text-slate-900 uppercase">
                    {order.paymentMethod}
                  </span>
                </div>

                {order.notes && (
                  <div className="mt-1 text-[11px] text-slate-600 italic">
                    Vessel Project Ref: "{order.notes}"
                  </div>
                )}
              </div>
            </div>

            {/* Simulated Logistics Barcode Visual */}
            <div className="pt-2 border-t border-slate-200 flex flex-col items-center">
              <div className="h-9 w-52 flex items-center justify-between gap-[2px] px-1 py-1 bg-white border border-slate-300 rounded">
                {[1,3,2,4,1,2,3,1,4,2,1,3,2,1,4,2,3,1,2,4,1,3,2,1,4,2,1,3,2,4,1,2].map((w, i) => (
                  <div 
                    key={i} 
                    className="bg-slate-900 h-full rounded-[0.5px]" 
                    style={{ width: `${w}px` }} 
                  />
                ))}
              </div>
              <span className="font-mono text-[9px] text-slate-500 tracking-widest uppercase mt-0.5">
                *{order.orderNumber}*
              </span>
            </div>
          </div>
        </div>

        {/* Itemized Pick & Pack Checklist Table */}
        <div className="my-6 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-700" />
              <span>Workshop Pick &amp; Pack Manifest ({order.items.length} Lines · {totalItemCount} Total Units)</span>
            </h4>
            <span className="text-[11px] text-slate-500 italic">
              Checked against workshop bin inventory
            </span>
          </div>

          <div className="overflow-x-auto border-2 border-slate-900 rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-mono text-[10px] uppercase tracking-wider">
                  <th className="py-2.5 px-3 w-12 text-center">Item</th>
                  <th className="py-2.5 px-3">Description &amp; Marine Specifications</th>
                  <th className="py-2.5 px-3 w-28 font-mono">Part Ref</th>
                  <th className="py-2.5 px-3 w-20 text-center">Unit</th>
                  <th className="py-2.5 px-3 w-20 text-center font-bold">Qty Ord</th>
                  <th className="py-2.5 px-3 w-24 text-center bg-slate-800 font-bold">Packed</th>
                  {showPrices && (
                    <>
                      <th className="py-2.5 px-3 w-24 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 w-24 text-right">Total</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    {/* Line Number */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-500">
                      {String(idx + 1).padStart(2, '0')}
                    </td>

                    {/* Name & Specification */}
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-950 text-sm">{item.name}</div>
                      <div className="text-[11px] text-slate-500 font-sans">
                        Certified marine-grade spec · Gosport bench cut &amp; crimp inspected
                      </div>
                    </td>

                    {/* SKU */}
                    <td className="py-3 px-3 font-mono text-slate-600 text-[11px]">
                      {item.itemId.toUpperCase()}
                    </td>

                    {/* Unit */}
                    <td className="py-3 px-3 text-center text-slate-600 capitalize">
                      {item.unit}
                    </td>

                    {/* Qty Ordered */}
                    <td className="py-3 px-3 text-center font-mono font-bold text-slate-900 text-sm">
                      {item.quantity}
                    </td>

                    {/* Qty Packed / Verification Check */}
                    <td className="py-3 px-3 text-center bg-slate-50 font-mono font-bold text-emerald-800">
                      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-emerald-100 border border-emerald-300">
                        <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                        <span>{item.quantity}</span>
                      </div>
                    </td>

                    {/* Financial Columns (if toggled) */}
                    {showPrices && (
                      <>
                        <td className="py-3 px-3 text-right font-mono text-slate-700">
                          £{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-950">
                          £{item.lineTotal.toFixed(2)}
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Totals & Notes Section */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start my-6">
          {/* Left Column: Workshop Notes & Installation Service */}
          <div className="md:col-span-7 p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-2 text-xs">
            <div className="font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-700" />
              <span>Workshop Quality &amp; Packaging Notes</span>
            </div>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              All multi-strand tinned copper marine cables have been accurately measured, cut, and sealed in weatherproof packaging. Electrical hardware has been verified against factory pinouts and terminal torque standards.
            </p>
            <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-700">
              <span className="font-bold text-slate-900">Solent Mobile Vessel Diagnostics:</span> Anthony Wrather provides practical on-board electrical troubleshooting, lithium upgrades, and custom switch panel installation at a flat <strong>£25/hr rate</strong> across Gosport, Haslar, Portsmouth, and Southampton Water.
            </div>
          </div>

          {/* Right Column: Order Financial Totals */}
          <div className="md:col-span-5 border border-slate-300 rounded-xl p-4 bg-slate-50 space-y-2 text-xs">
            {showPrices ? (
              <>
                <div className="flex justify-between text-slate-600">
                  <span>Goods Subtotal:</span>
                  <span className="font-mono font-medium text-slate-900">£{order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Postage &amp; Packaging ({order.trackingCarrier || 'Royal Mail 24'}):</span>
                  <span className="font-mono font-medium text-slate-900">
                    {order.shippingCost === 0 ? 'FREE' : `£${order.shippingCost.toFixed(2)}`}
                  </span>
                </div>
                <div className="pt-2 border-t-2 border-slate-900 flex justify-between items-baseline font-bold">
                  <span className="text-sm text-slate-950">TOTAL PAID:</span>
                  <span className="font-mono text-base text-slate-950">£{order.total.toFixed(2)}</span>
                </div>
                <div className="text-[10px] text-center font-mono font-semibold uppercase text-emerald-800 bg-emerald-100/70 border border-emerald-300 py-1 rounded mt-2">
                  ✓ ZERO BALANCE DUE — FULLY PREPAID
                </div>
              </>
            ) : (
              <div className="py-4 text-center space-y-1">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">Packing Slip Mode</span>
                <span className="text-xs font-bold text-slate-900 block">
                  {order.items.length} Parts Verified &amp; Dispatched
                </span>
                <span className="text-[10px] text-slate-600 block">
                  Invoice and VAT receipt sent electronically to {order.customerEmail}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Bench Sign-off & Inspection Certification */}
        <div className="border-t-2 border-slate-900 pt-5 mt-6 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-7 space-y-1.5 text-xs">
            <span className="text-[10px] font-mono uppercase font-bold text-slate-500 tracking-wider block">
              Workshop Bench Sign-off &amp; Compliance Certification
            </span>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-700">
              <span className="flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>BS6883 / ISO 13297 Compliant</span>
              </span>
              <span className="flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Marine Tinned Conductors Verified</span>
              </span>
              <span className="flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Weatherproof Transit Seal</span>
              </span>
            </div>
          </div>

          <div className="sm:col-span-5 sm:text-right text-xs">
            <div className="inline-block text-left border border-slate-300 rounded-lg p-2.5 bg-slate-50 min-w-[200px]">
              <div className="text-[10px] font-mono text-slate-500 uppercase">Packed &amp; Verified By</div>
              <div className="font-bold text-slate-900 text-xs font-serif italic text-base mt-0.5">
                Anthony Wrather
              </div>
              <div className="text-[10px] font-mono text-slate-600 flex justify-between mt-1 pt-1 border-t border-slate-200">
                <span>Date: {todayDate}</span>
                <span>Ref: AJW-SOLENT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Document Footer */}
        <div className="mt-8 pt-4 border-t border-slate-200 text-[10px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div>
            AJW Marine Electrical Services · Anthony Wrather · Gosport, Solent, UK
          </div>
          <div className="font-mono text-[9px]">
            Please retain this packing slip for your vessel's electrical maintenance logbook.
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
