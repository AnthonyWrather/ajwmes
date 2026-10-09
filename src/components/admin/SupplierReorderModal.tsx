import React, { useState, useEffect } from 'react';
import { CatalogItem, SupplierPurchaseOrder, SupplierInfo } from '../../types';
import { normalizeImageUrl } from '../../utils/imageUrl';
import { MARINE_SUPPLIERS, getDefaultSupplierForCategory, generateSupplierPOEmail } from '../../data/supplierData';
import { 
  Building2, 
  Send, 
  Copy, 
  Check, 
  AlertTriangle, 
  Truck, 
  Mail, 
  Phone, 
  Printer, 
  FileText, 
  X, 
  Clock, 
  DollarSign, 
  Package, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

interface SupplierReorderModalProps {
  isOpen: boolean;
  item: CatalogItem | null;
  onClose: () => void;
  onConfirmRestock?: (itemId: string, restockCount: number) => void;
  onOrderPlaced?: (order: SupplierPurchaseOrder) => void;
}

export const SupplierReorderModal: React.FC<SupplierReorderModalProps> = ({
  isOpen,
  item,
  onClose,
  onConfirmRestock,
  onOrderPlaced
}) => {
  if (!isOpen || !item) return null;

  const defaultSupplier = getDefaultSupplierForCategory(item.category);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>(defaultSupplier.id);
  const [customSupplierEmail, setCustomSupplierEmail] = useState<string>(defaultSupplier.email);
  const [reorderQty, setReorderQty] = useState<number>(() => {
    return item.category === 'cable' ? 50 : 10;
  });
  const [unitCost, setUnitCost] = useState<number>(() => {
    return Number((item.unitPrice * 0.65).toFixed(2));
  });
  const [shippingSpeed, setShippingSpeed] = useState<SupplierPurchaseOrder['shippingSpeed']>('next_day_solent');
  const [deliveryNotes, setDeliveryNotes] = useState<string>('Leave at Unit 4 Haslar Marina yard if technician is out on vessel diagnostics.');
  const [poNumber] = useState<string>(() => `PO-AJW-${Date.now().toString().slice(-4)}`);
  const [copied, setCopied] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [activeView, setActiveView] = useState<'draft' | 'preview'>('draft');

  const selectedSupplier: SupplierInfo = MARINE_SUPPLIERS.find(s => s.id === selectedSupplierId) || defaultSupplier;

  useEffect(() => {
    setCustomSupplierEmail(selectedSupplier.email);
  }, [selectedSupplierId]);

  const totalCost = Number((reorderQty * unitCost).toFixed(2));

  const { subject, body } = generateSupplierPOEmail({
    poNumber,
    item,
    supplier: {
      ...selectedSupplier,
      email: customSupplierEmail || selectedSupplier.email
    },
    quantity: reorderQty,
    unitCost,
    shippingSpeed,
    deliveryNotes
  });

  const handleCopyEmail = () => {
    const fullText = `Subject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendOrder = () => {
    const orderRecord: SupplierPurchaseOrder = {
      id: `po-${Date.now()}`,
      poNumber,
      itemId: item.id,
      itemName: item.name,
      supplierName: selectedSupplier.name,
      supplierEmail: customSupplierEmail || selectedSupplier.email,
      quantity: reorderQty,
      unit: item.unit,
      estimatedUnitCost: unitCost,
      totalCost,
      shippingSpeed,
      status: 'dispatched',
      notes: deliveryNotes,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' ')
    };

    if (onOrderPlaced) {
      onOrderPlaced(orderRecord);
    }

    setIsSent(true);
  };

  const handleInstantReceive = () => {
    if (onConfirmRestock) {
      onConfirmRestock(item.id, reorderQty);
    }
    onClose();
  };

  const mailtoLink = `mailto:${encodeURIComponent(customSupplierEmail || selectedSupplier.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 max-w-4xl w-full rounded-3xl p-5 sm:p-7 text-slate-100 shadow-2xl space-y-6 my-auto animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-500/40 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Zero Stock Drafter</span>
              </span>
              <span className="text-xs text-sky-400 font-mono font-bold">
                PO Reference: {poNumber}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
              Reorder from Marine Supplier
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Rapid procurement workflow for AJW Marine Electrical workshop restocking.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Item Info Banner */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {item.imageUrl ? (
              <img
                src={normalizeImageUrl(item.imageUrl)}
                alt={item.name}
                className="w-14 h-14 object-cover rounded-xl border border-slate-800 shrink-0"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                <Package className="w-7 h-7 text-sky-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-white text-sm sm:text-base">{item.name}</h4>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800">
                  {item.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{item.specification}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs">
                <span className="font-mono text-rose-400 font-bold bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
                  Stock: {item.stockCount} {item.unit} (OUT OF STOCK)
                </span>
                <span className="text-slate-400">
                  Customer Price: <strong className="text-white font-mono">£{item.unitPrice.toFixed(2)}</strong>/{item.unit}
                </span>
              </div>
            </div>
          </div>

          <div className="sm:text-right shrink-0">
            <span className="text-[11px] text-slate-400 block">Est. PO Total</span>
            <span className="text-2xl font-mono font-extrabold text-emerald-400">
              £{totalCost.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 block">ex VAT Trade Pricing</span>
          </div>
        </div>

        {/* Success Confirmation Banner if Dispatched */}
        {isSent && (
          <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                <Check className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-bold text-emerald-300">
                  Purchase Order Dispatched to Supplier!
                </h5>
                <p className="text-xs text-emerald-400/80 mt-0.5">
                  Simulated PO email sent to <span className="font-mono text-emerald-200">{customSupplierEmail || selectedSupplier.email}</span> ({selectedSupplier.name}).
                </p>
              </div>
            </div>

            <button
              onClick={handleInstantReceive}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-900/40 shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Mark Received &amp; Replenish (+{reorderQty} {item.unit})</span>
            </button>
          </div>
        )}

        {/* Reorder Form Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Supplier Selection */}
          <div className="space-y-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-sky-400" />
                <span>1. Select Trade Wholesaler</span>
              </label>
              <span className="text-[10px] text-slate-500 font-mono">
                Solent Marine Network
              </span>
            </div>

            <div className="space-y-2">
              <select
                value={selectedSupplierId}
                onChange={e => setSelectedSupplierId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
              >
                {MARINE_SUPPLIERS.map(sup => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} ({sup.location})
                  </option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Trade Account #</span>
                  <span className="font-mono font-bold text-sky-300 text-xs">
                    {selectedSupplier.accountNumber}
                  </span>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">Standard Lead Time</span>
                  <span className="text-slate-200 text-xs font-medium">
                    {selectedSupplier.defaultLeadTime}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Supplier Order Desk Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="email"
                    value={customSupplierEmail}
                    onChange={e => setCustomSupplierEmail(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs pl-8 pr-3 py-2 rounded-xl text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quantity & Pricing */}
          <div className="space-y-4 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
            <label className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-sky-400" />
              <span>2. Quantity &amp; Trade Unit Price</span>
            </label>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-slate-300">Reorder Batch Quantity</span>
                  <div className="flex gap-1.5">
                    {[5, 10, 25, 50, 100].map(q => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => setReorderQty(q)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold transition-colors ${
                          reorderQty === q
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        +{q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={reorderQty}
                    onChange={e => setReorderQty(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-slate-900 border border-slate-700 text-sm font-mono px-3 py-2 rounded-xl text-white focus:outline-none focus:border-sky-500 font-bold"
                  />
                  <span className="text-xs text-slate-400 font-mono shrink-0">
                    {item.unit}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Trade Unit Cost (£ ex. VAT)
                  </label>
                  <input
                    type="number"
                    step="0.05"
                    min="0"
                    value={unitCost}
                    onChange={e => setUnitCost(Math.max(0, Number(e.target.value) || 0))}
                    className="w-full bg-slate-900 border border-slate-700 text-xs font-mono px-3 py-2 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">
                    Fulfillment Speed
                  </label>
                  <select
                    value={shippingSpeed}
                    onChange={e => setShippingSpeed(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-700 text-xs px-2 py-2 rounded-xl text-white focus:outline-none focus:border-sky-500"
                  >
                    <option value="next_day_solent">Next-Day Solent Priority</option>
                    <option value="standard_courier">Standard 48hr Courier</option>
                    <option value="workshop_pickup">Workshop Depot Collection</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  Delivery Yard Instructions
                </label>
                <input
                  type="text"
                  value={deliveryNotes}
                  onChange={e => setDeliveryNotes(e.target.value)}
                  placeholder="Notes for courier / gate access..."
                  className="w-full bg-slate-900 border border-slate-700 text-xs px-3 py-1.5 rounded-xl text-slate-300 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Purchase Order Draft View / Email Preview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-400" />
                <span>3. Automated Purchase Order Email Draft</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyEmail}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded-lg flex items-center gap-1 transition-colors"
                title="Copy entire PO email to clipboard"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-sky-400" />}
                <span>{copied ? 'Copied PO!' : 'Copy Email'}</span>
              </button>

              <a
                href={mailtoLink}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-sky-400 rounded-lg flex items-center gap-1 transition-colors"
                title="Launch default email client (Outlook, Mail, etc.)"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Open in Mail App</span>
              </a>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-[11px] text-slate-300 space-y-2 max-h-56 overflow-y-auto leading-relaxed shadow-inner">
            <div className="text-sky-400 pb-2 border-b border-slate-800/80 font-bold">
              Subject: {subject}
            </div>
            <pre className="whitespace-pre-wrap font-mono text-slate-300">
              {body}
            </pre>
          </div>
        </div>

        {/* Action Controls Footer */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Gosport Workshop Delivery: Unit 4 Haslar Marina PO12 1NU</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleInstantReceive}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
              title="Instantly update inventory stock count"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
              <span>Restock Now (+{reorderQty} {item.unit})</span>
            </button>

            <button
              type="button"
              onClick={handleSendOrder}
              disabled={isSent}
              className={`px-5 py-2.5 font-bold rounded-xl flex items-center gap-2 transition-all shadow-md ${
                isSent
                  ? 'bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 cursor-default'
                  : 'bg-sky-600 hover:bg-sky-500 text-white shadow-sky-600/30'
              }`}
            >
              {isSent ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>PO Sent to Supplier!</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Send Purchase Order Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
