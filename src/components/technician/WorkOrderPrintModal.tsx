import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { JobRecord } from '../../types';
import {
  Printer,
  X,
  ClipboardList,
  CheckCircle2,
  Anchor,
  MapPin,
  Wrench,
  ShieldCheck,
  User,
  Phone,
  Mail,
  FileText,
  Clock,
  Square,
  PenTool,
  Check,
  AlertCircle
} from 'lucide-react';

interface WorkOrderPrintModalProps {
  isOpen: boolean;
  job: JobRecord | null;
  onClose: () => void;
  autoPrint?: boolean;
}

export const WorkOrderPrintModal: React.FC<WorkOrderPrintModalProps> = ({
  isOpen,
  job,
  onClose,
  autoPrint = false
}) => {
  const [showPricing, setShowPricing] = useState(true);
  const [showBenchNotesGrid, setShowBenchNotesGrid] = useState(true);
  const [showSafetyChecklist, setShowSafetyChecklist] = useState(true);
  const [technicianName, setTechnicianName] = useState('Anthony Wrather (Field Lead)');
  const [customClipboardNote, setCustomClipboardNote] = useState('');

  // Handle escape key & print body classes
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.classList.add('work-order-modal-open');

    let timer: NodeJS.Timeout | null = null;
    if (autoPrint) {
      timer = setTimeout(() => {
        window.print();
      }, 300);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.classList.remove('work-order-modal-open');
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, autoPrint, onClose]);

  if (!isOpen || !job) return null;

  const todayDate = new Date().toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  const currentTime = new Date().toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const materials = job.materialsUsed || [];
  const totalItemCount = materials.reduce((sum, item) => sum + item.quantity, 0);

  const modalContent = (
    <div
      id="work-order-portal-root"
      className="fixed inset-0 z-[9999] bg-slate-950/85 backdrop-blur-md overflow-y-auto p-3 sm:p-6 flex flex-col items-center work-order-overlay"
    >
      {/* Top Floating Control Toolbar (Hidden in Print) */}
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl p-4 mb-4 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 no-print print:hidden">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono uppercase text-amber-400 font-bold">Workshop Clipboard Job Sheet</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {job.reference}
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight">
              Work Order: {job.vesselName} ({job.vesselType})
            </h3>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer select-none hover:border-slate-700">
            <input
              type="checkbox"
              checked={showPricing}
              onChange={(e) => setShowPricing(e.target.checked)}
              className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
            />
            <span>Show Pricing &amp; Rates</span>
          </label>

          <label className="flex items-center gap-2 text-xs text-slate-300 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 cursor-pointer select-none hover:border-slate-700">
            <input
              type="checkbox"
              checked={showBenchNotesGrid}
              onChange={(e) => setShowBenchNotesGrid(e.target.checked)}
              className="rounded border-slate-700 text-amber-500 focus:ring-amber-400"
            />
            <span>Clipboard Grid</span>
          </label>

          <button
            onClick={() => window.print()}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
            title="Open browser print dialog for clipboard work order"
          >
            <Printer className="w-4 h-4" />
            <span>Print Work Order</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Close preview"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* The Printable Work Order Document (Formatted specifically for a workshop clipboard) */}
      <div
        id="printable-work-order"
        className="work-order-sheet bg-white text-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl p-6 sm:p-10 font-sans border border-slate-200 print:shadow-none print:border-none print:p-0"
      >
        {/* Document Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b-2 border-slate-900 pb-5">
          {/* Company Brand Letterhead */}
          <div className="flex items-start gap-4">
            {/* Marine Anchor & Electric Lightning Mark */}
            <div className="w-14 h-14 rounded-xl bg-slate-950 p-2 flex items-center justify-center shrink-0 border border-slate-800 shadow-sm print:border-slate-900">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Ring */}
                <circle cx="50" cy="22" r="8" fill="none" stroke="#F59E0B" strokeWidth="4" />
                {/* Crossbar */}
                <line x1="28" y1="36" x2="72" y2="36" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
                <circle cx="28" cy="36" r="3" fill="#F59E0B" />
                <circle cx="72" cy="36" r="3" fill="#F59E0B" />
                {/* Electric Lightning Shank */}
                <path d="M 54 32 L 44 52 L 55 52 L 46 76" fill="none" stroke="#F59E0B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                {/* Flukes */}
                <path d="M 22 64 C 26 84, 74 84, 78 64" fill="none" stroke="#D97706" strokeWidth="5" strokeLinecap="round" />
                {/* Tips */}
                <polygon points="22,64 16,69 25,70" fill="#F59E0B" />
                <polygon points="78,64 84,69 75,70" fill="#F59E0B" />
                {/* Base crown */}
                <circle cx="50" cy="83" r="3" fill="#F59E0B" />
              </svg>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 font-mono">
                  AJW MARINE ELECTRICAL
                </h1>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-900 text-amber-400 px-2 py-0.5 rounded">
                  WORKSHOP &amp; FIELD
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 mt-0.5">
                Solent Marine Engineering &amp; Haslar Marina Diagnostics
              </p>
              <div className="text-[11px] text-slate-600 space-y-0.5 mt-1 font-sans">
                <div>Unit 4, Haslar Marina Trade Yard, Gosport, Hampshire PO12 1NU</div>
                <div className="flex items-center gap-3">
                  <span><strong>Workshop VHF:</strong> Ch 77</span>
                  <span>·</span>
                  <span><strong>Tel:</strong> 07700 900142</span>
                  <span>·</span>
                  <span><strong>Email:</strong> anthony@ajw-marine.co.uk</span>
                </div>
              </div>
            </div>
          </div>

          {/* Document Title & Meta Box */}
          <div className="sm:text-right shrink-0">
            <div className="inline-block bg-slate-900 text-white font-mono font-extrabold text-base sm:text-lg px-3.5 py-1.5 rounded-lg tracking-wider uppercase mb-1.5">
              WORK ORDER &amp; JOB SHEET
            </div>
            <div className="space-y-0.5 text-xs">
              <div>
                <span className="text-slate-500 font-mono uppercase text-[10px] block">Job Reference</span>
                <span className="font-mono font-extrabold text-base text-slate-950">{job.reference}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                <span>Date Issued: </span>
                <span className="font-semibold text-slate-900">{todayDate} {currentTime}</span>
              </div>
              <div className="text-[11px] text-slate-600">
                <span>Status: </span>
                <span className="font-mono uppercase font-bold text-slate-900">
                  {job.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vessel & Client Workshop Routing Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-5 bg-slate-50 p-4 rounded-xl border border-slate-300">
          {/* Vessel Info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              <Anchor className="w-3.5 h-3.5 text-amber-600" />
              <span>Vessel &amp; Mooring Location</span>
            </div>
            <div className="text-xs space-y-0.5 pt-0.5">
              <p className="text-sm font-bold text-slate-950">{job.vesselName}</p>
              <p className="text-slate-700"><strong>Type / Class:</strong> {job.vesselType}</p>
              <p className="text-slate-700 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-500 inline" />
                <span><strong>Berth Location:</strong> {job.berthLocation}</span>
              </p>
              <p className="text-slate-700">
                <strong>Service Category:</strong> {job.serviceCategory.replace('_', ' ').toUpperCase()}
              </p>
            </div>
          </div>

          {/* Client & Engineer Info */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1">
              <User className="w-3.5 h-3.5 text-amber-600" />
              <span>Owner &amp; Assigned Field Tech</span>
            </div>
            <div className="text-xs space-y-0.5 pt-0.5">
              <p className="text-sm font-bold text-slate-950">{job.clientName}</p>
              <p className="text-slate-700"><strong>Phone:</strong> {job.clientPhone || 'Not provided'}</p>
              <p className="text-slate-700"><strong>Email:</strong> {job.clientEmail}</p>
              <p className="text-slate-700">
                <strong>Assigned Tech:</strong> {technicianName}
              </p>
            </div>
          </div>
        </div>

        {/* Scope of Work / Reported Problem Description */}
        <div className="mb-5 p-3.5 rounded-xl border border-slate-300 bg-amber-50/50">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 mb-1">
            <span className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-amber-700" />
              <span>Scope of Work / Reported Faults</span>
            </span>
            <span className="text-[10px] text-amber-800 font-mono">Clipboard Instructions</span>
          </div>
          <p className="text-xs text-slate-800 leading-relaxed font-sans">
            {job.notes || 'Routine electrical system diagnosis, harness inspection, and marine hardware installation as authorized.'}
          </p>
        </div>

        {/* Section 1: Labor Hours Breakdown */}
        <div className="mb-5">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5 mb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-950 uppercase tracking-wider">
                1. Diagnostic &amp; Installation Labor Breakdown
              </h2>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-700">
              Logged Time: {job.diagnosticHours} Hours
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
                <th className="py-2 px-2.5 w-10">Check</th>
                <th className="py-2 px-2.5">Labor Item / Operation Description</th>
                <th className="py-2 px-2.5 text-center w-24">Hours Logged</th>
                {showPricing && (
                  <>
                    <th className="py-2 px-2.5 text-right w-24">Hourly Rate</th>
                    <th className="py-2 px-2.5 text-right w-28">Labor Amount</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2.5 px-2.5 text-center">
                  <Square className="w-3.5 h-3.5 text-slate-400 inline" />
                </td>
                <td className="py-2.5 px-2.5 font-medium text-slate-900">
                  <div>Solent On-Vessel Electrical Labor &amp; Diagnostic Time</div>
                  <div className="text-[10px] text-slate-500 font-normal">
                    Berth visit, multimeter drop testing, circuit tracing, terminal crimping &amp; load testing.
                  </div>
                </td>
                <td className="py-2.5 px-2.5 text-center font-mono font-semibold text-slate-800">
                  {job.diagnosticHours.toFixed(1)} hrs
                </td>
                {showPricing && (
                  <>
                    <td className="py-2.5 px-2.5 text-right font-mono text-slate-700">
                      £{(job.hourlyRate || 25).toFixed(2)}/hr
                    </td>
                    <td className="py-2.5 px-2.5 text-right font-mono font-bold text-slate-950">
                      £{(job.totalLabor || (job.diagnosticHours * (job.hourlyRate || 25))).toFixed(2)}
                    </td>
                  </>
                )}
              </tr>

              {/* Blank clipboard lines for field technician to note additional dockside hours */}
              <tr className="border-t border-dashed border-slate-300 text-slate-400 text-[11px]">
                <td className="py-2 px-2.5 text-center">
                  <Square className="w-3.5 h-3.5 text-slate-300 inline" />
                </td>
                <td className="py-2 px-2.5 italic">
                  Additional Dockside Labor / Sea Trial testing: _____________________________
                </td>
                <td className="py-2 px-2.5 text-center font-mono">______ hrs</td>
                {showPricing && (
                  <>
                    <td className="py-2 px-2.5 text-right font-mono">£25.00/hr</td>
                    <td className="py-2 px-2.5 text-right font-mono">£________</td>
                  </>
                )}
              </tr>
            </tbody>
            {showPricing && (
              <tfoot>
                <tr className="border-t-2 border-slate-800 bg-slate-50 font-bold text-xs">
                  <td colSpan={3} className="py-2 px-2.5 text-right text-slate-800">
                    Labor Subtotal:
                  </td>
                  <td colSpan={2} className="py-2 px-2.5 text-right font-mono text-slate-950">
                    £{(job.totalLabor || (job.diagnosticHours * (job.hourlyRate || 25))).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Section 2: Materials & Hardware Breakdown */}
        <div className="mb-5">
          <div className="flex items-center justify-between border-b-2 border-slate-800 pb-1.5 mb-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <h2 className="text-xs sm:text-sm font-extrabold text-slate-950 uppercase tracking-wider">
                2. Materials, Hardware &amp; Cable Requisition
              </h2>
            </div>
            <span className="text-[11px] font-mono font-bold text-slate-700">
              {materials.length} Line Item{materials.length === 1 ? '' : 's'} ({totalItemCount} total units)
            </span>
          </div>

          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
                <th className="py-2 px-2.5 w-10 text-center">Fitted</th>
                <th className="py-2 px-2.5 w-10 text-center">Item</th>
                <th className="py-2 px-2.5">Hardware / Marine Part Description</th>
                <th className="py-2 px-2.5 text-center w-20">Qty / Unit</th>
                {showPricing && (
                  <>
                    <th className="py-2 px-2.5 text-right w-24">Unit Price</th>
                    <th className="py-2 px-2.5 text-right w-28">Total</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {materials.length > 0 ? (
                materials.map((item, idx) => (
                  <tr key={item.id || idx}>
                    <td className="py-2 px-2.5 text-center">
                      <Square className="w-3.5 h-3.5 text-slate-400 inline" />
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono text-slate-500 text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2.5 font-medium text-slate-900">
                      <div>{item.name}</div>
                    </td>
                    <td className="py-2 px-2.5 text-center font-mono font-semibold text-slate-800">
                      {item.quantity} {item.unit}
                    </td>
                    {showPricing && (
                      <>
                        <td className="py-2 px-2.5 text-right font-mono text-slate-700">
                          £{item.unitPrice.toFixed(2)}
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-950">
                          £{(item.quantity * item.unitPrice).toFixed(2)}
                        </td>
                      </>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={showPricing ? 6 : 4} className="py-3 px-2.5 text-center text-slate-500 italic">
                    No preliminary catalog items assigned to this job record. Field parts lines provided below for workshop requisitions.
                  </td>
                </tr>
              )}

              {/* Lined rows for dockside parts requisition with pencil/pen */}
              <tr className="border-t border-dashed border-slate-300 text-slate-400 text-[11px]">
                <td className="py-2 px-2.5 text-center"><Square className="w-3.5 h-3.5 text-slate-300 inline" /></td>
                <td className="py-2 px-2.5 text-center font-mono">{materials.length + 1}</td>
                <td className="py-2 px-2.5 italic">____________________________________________________________</td>
                <td className="py-2 px-2.5 text-center font-mono">______</td>
                {showPricing && (
                  <>
                    <td className="py-2 px-2.5 text-right font-mono">£_______</td>
                    <td className="py-2 px-2.5 text-right font-mono">£_______</td>
                  </>
                )}
              </tr>
              <tr className="text-slate-400 text-[11px]">
                <td className="py-2 px-2.5 text-center"><Square className="w-3.5 h-3.5 text-slate-300 inline" /></td>
                <td className="py-2 px-2.5 text-center font-mono">{materials.length + 2}</td>
                <td className="py-2 px-2.5 italic">____________________________________________________________</td>
                <td className="py-2 px-2.5 text-center font-mono">______</td>
                {showPricing && (
                  <>
                    <td className="py-2 px-2.5 text-right font-mono">£_______</td>
                    <td className="py-2 px-2.5 text-right font-mono">£_______</td>
                  </>
                )}
              </tr>
            </tbody>
            {showPricing && (
              <tfoot>
                <tr className="border-t-2 border-slate-800 bg-slate-50 font-bold text-xs">
                  <td colSpan={4} className="py-2 px-2.5 text-right text-slate-800">
                    Materials Subtotal:
                  </td>
                  <td colSpan={2} className="py-2 px-2.5 text-right font-mono text-slate-950">
                    £{(job.totalMaterials || 0).toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Section 3: Summary Totals Box (if pricing enabled) */}
        {showPricing && (
          <div className="mb-5 flex justify-end">
            <div className="w-full sm:w-72 bg-slate-100 rounded-xl p-3 border border-slate-300 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-700">
                <span>Labor Total ({job.diagnosticHours}h @ £25/hr):</span>
                <span className="font-mono font-medium">£{job.totalLabor.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-700">
                <span>Materials &amp; Hardware:</span>
                <span className="font-mono font-medium">£{job.totalMaterials.toFixed(2)}</span>
              </div>
              {job.depositPaid && (
                <div className="flex justify-between text-emerald-700">
                  <span>Deposit Received:</span>
                  <span className="font-mono font-medium">-£{job.depositAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="border-t-2 border-slate-900 pt-1.5 flex justify-between font-extrabold text-sm text-slate-950">
                <span>Grand Total:</span>
                <span className="font-mono">
                  £{(job.totalLabor + job.totalMaterials - (job.depositPaid ? job.depositAmount : 0)).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Section 4: Workshop Clipboard Bench Notes & Meter Readings Grid */}
        {showBenchNotesGrid && (
          <div className="mb-5 border border-slate-300 rounded-xl p-3.5 bg-white avoid-page-break">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-200 pb-1.5 mb-2">
              <span className="flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-amber-600" />
                <span>Field Engineer Bench Notes &amp; Test Measurements (Clipboard Entry)</span>
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Solent Test Kit</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs mb-3">
              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Rest Voltage</span>
                <span className="font-mono font-semibold text-slate-800">_______ . ___ V</span>
              </div>
              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Loaded Voltage</span>
                <span className="font-mono font-semibold text-slate-800">_______ . ___ V</span>
              </div>
              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Earth Bond</span>
                <span className="font-mono font-semibold text-slate-800">&lt; 0.1 Ω [ &nbsp; ] Pass</span>
              </div>
              <div className="p-2 border border-slate-200 rounded-lg bg-slate-50">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Alternator Cut-in</span>
                <span className="font-mono font-semibold text-slate-800">_______ . ___ V</span>
              </div>
            </div>

            {/* Ruled lines for handwritten notes */}
            <div className="space-y-3.5 pt-1">
              <div className="border-b border-dashed border-slate-300 h-4"></div>
              <div className="border-b border-dashed border-slate-300 h-4"></div>
              <div className="border-b border-dashed border-slate-300 h-4"></div>
            </div>
          </div>
        )}

        {/* Section 5: Standards Compliance & Physical Signatures */}
        <div className="border border-slate-300 rounded-xl p-4 bg-slate-50 text-xs space-y-3 avoid-page-break">
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>ISO 13297 (Small Craft DC/AC) &amp; ABYC E-11 Marine Standards Compliance</span>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed">
            All cables crimped with calibrated ratchet tooling, adhesive-lined marine heatshrink, and rated thermal breakers. Workmanship verified and tested aboard vessel prior to handover.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3 border-t border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Field Technician Sign-Off</span>
              <div className="border-b border-slate-900 mt-5 mb-1"></div>
              <div className="flex justify-between text-[11px] text-slate-700">
                <span>Signature: _______________________</span>
                <span>Date: ____________</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-500 uppercase font-mono block">Boat Owner / Skipper Acceptance</span>
              <div className="border-b border-slate-900 mt-5 mb-1"></div>
              <div className="flex justify-between text-[11px] text-slate-700">
                <span>Signature: _______________________</span>
                <span>Date: ____________</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-4 pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 font-mono">
          AJW Marine Electrical Services · Haslar Marina &amp; Gosport Workshop · Job Card Ref: {job.reference} · Generated {todayDate}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};
