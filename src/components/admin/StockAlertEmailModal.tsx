import React, { useState } from 'react';
import { StockAlert } from '../../types';
import { Mail, AlertTriangle, ArrowRight, X, Copy, Check, ShieldAlert, Clock, Building2 } from 'lucide-react';

interface StockAlertEmailModalProps {
  isOpen: boolean;
  alert: StockAlert | null;
  onClose: () => void;
  onOpenSupplierReorder: (itemId: string) => void;
}

export const StockAlertEmailModal: React.FC<StockAlertEmailModalProps> = ({
  isOpen,
  alert,
  onClose,
  onOpenSupplierReorder
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !alert) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(`Subject: ${alert.emailSubject}\n\n${alert.emailBody}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 max-w-2xl w-full rounded-3xl p-5 sm:p-6 text-slate-100 shadow-2xl space-y-5 my-auto animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-950 border border-rose-500/40 rounded-2xl text-rose-400 shrink-0">
              <Mail className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-500/30">
                  Automated Admin Notification
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {alert.timestamp}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                Zero Stock Email Dispatched
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Email Header Info */}
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-800/80">
            <span className="text-slate-400">To:</span>
            <span className="font-mono text-sky-400 font-bold">{alert.emailRecipient}</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-800/80">
            <span className="text-slate-400">From:</span>
            <span className="font-mono text-slate-300">inventory-alerts@ajwmarineelectrical.co.uk</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-slate-400">Subject:</span>
            <span className="font-semibold text-rose-300">{alert.emailSubject}</span>
          </div>
        </div>

        {/* Email Body */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 font-mono text-xs text-slate-300 space-y-2 max-h-64 overflow-y-auto leading-relaxed shadow-inner">
          <pre className="whitespace-pre-wrap font-mono text-slate-300 text-xs">
            {alert.emailBody}
          </pre>
        </div>

        {/* Footer Actions */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to clipboard' : 'Copy Email Raw Text'}</span>
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSupplierReorder(alert.itemId);
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-md shadow-sky-600/30 transition-colors"
            >
              <span>Reorder from Supplier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
