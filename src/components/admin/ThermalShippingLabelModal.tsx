import React from 'react';
import { PostalOrder, ShipStationLabelResult } from '../../types';
import { Printer, X, CheckCircle2, ShieldCheck, Tag } from 'lucide-react';

interface ThermalShippingLabelModalProps {
  isOpen: boolean;
  order: PostalOrder | null;
  labelResult: ShipStationLabelResult | null;
  onClose: () => void;
  onPrint?: () => void;
}

export const ThermalShippingLabelModal: React.FC<ThermalShippingLabelModalProps> = ({
  isOpen,
  order,
  labelResult,
  onClose,
  onPrint
}) => {
  if (!isOpen || !order || !labelResult) return null;

  const handlePrint = () => {
    if (onPrint) {
      onPrint();
    } else {
      window.print();
    }
  };

  const isDpd = labelResult.carrierCode === 'dpd_uk';
  const carrierName = isDpd ? 'DPD UK Next Day Courier' : 'Royal Mail Tracked 24';

  return (
    <div 
      data-testid="shipstation-label-modal"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-sm p-4"
    >
      <div className="bg-slate-900 border border-slate-700 max-w-xl w-full max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header Bar */}
        <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-sky-950 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">Thermal Shipping Label (4x6" Format)</h3>
              <p className="text-[11px] text-slate-400">
                Order <span className="font-mono text-sky-400">{order.orderNumber}</span> · {carrierName}
              </p>
            </div>
          </div>
          <button
            data-testid="close-thermal-label-btn"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Label Preview */}
        <div className="p-6 space-y-5 flex-1 overflow-y-auto">
          {/* Metadata pill row */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 text-[11px]">Tracking:</span>
              <span 
                data-testid="modal-tracking-number"
                className="font-mono font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded-lg border border-sky-500/30"
              >
                {labelResult.trackingNumber}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{labelResult.isSimulated ? 'Simulated Label Ready' : 'Carrier Generated'}</span>
            </div>
          </div>

          {/* 4x6" Printable Sheet Container */}
          <div className="flex justify-center bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
            <div 
              data-testid="thermal-label-sheet"
              className="bg-white rounded-xl p-2 shadow-2xl w-full max-w-sm aspect-[4/6] overflow-hidden flex items-center justify-center border-2 border-slate-300"
            >
              {labelResult.labelUrl ? (
                <img
                  src={labelResult.labelUrl}
                  alt={`Shipping Label ${labelResult.trackingNumber}`}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Generating SVG Label Preview...
                </div>
              )}
            </div>
          </div>

          {/* Solent Workshop Dispatch Notice */}
          <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Directly print to your Zebra or Brother 4x6" thermal label printer (100x150mm), or adhesive A4 dispatch sheet. Tracking reference will automatically attach to order dispatch email.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            data-testid="close-thermal-label-footer-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>

          <button
            data-testid="print-thermal-label-btn"
            onClick={handlePrint}
            className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition-colors shadow-lg shadow-sky-600/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print 4x6" Thermal Label</span>
          </button>
        </div>
      </div>
    </div>
  );
};
