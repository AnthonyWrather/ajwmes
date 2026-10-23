import React, { useRef, useState, useEffect } from 'react';
import { JobRecord, CustomerSignOffRecord, SignerRole } from '../../types';
import { 
  X, 
  PenTool, 
  RotateCcw, 
  CheckCircle2, 
  ShieldCheck, 
  Anchor, 
  Clock, 
  Package, 
  AlertCircle,
  WifiOff,
  Cloud
} from 'lucide-react';

interface CustomerSignOffModalProps {
  isOpen: boolean;
  job: JobRecord;
  onClose: () => void;
  onSignOffComplete: (signOff: CustomerSignOffRecord) => void;
}

export const CustomerSignOffModal: React.FC<CustomerSignOffModalProps> = ({
  isOpen,
  job,
  onClose,
  onSignOffComplete
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [signerName, setSignerName] = useState(job.clientName || '');
  const [signerRole, setSignerRole] = useState<SignerRole>('vessel_owner');
  const [feedback, setFeedback] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  // Initialize Canvas
  useEffect(() => {
    if (!isOpen) {
      setHasDrawn(false);
      return;
    }

    // Small delay to ensure modal DOM geometry is settled
    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0) return;
      canvas.width = rect.width * (window.devicePixelRatio || 1);
      canvas.height = rect.height * (window.devicePixelRatio || 1);
      ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);

      ctx.strokeStyle = '#f8fafc'; // slate-50
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Background subtle fill
      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, rect.width, rect.height);
    }, 50);

    return () => clearTimeout(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const startDrawing = (e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasDrawn(true);
    setErrorMsg(null);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasDrawn(false);
    setErrorMsg(null);
  };

  const handleSubmitSignOff = () => {
    if (!signerName.trim()) {
      setErrorMsg('Please enter the customer / representative name');
      return;
    }
    if (!hasDrawn) {
      setErrorMsg('Please provide a handwritten signature on the signature pad');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    setIsSubmitting(true);
    try {
      // Generate clean, compact data URL for instant Firestore synchronization
      const signatureDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const nowIso = new Date().toISOString();

      const record: CustomerSignOffRecord = {
        jobId: job.id,
        jobReference: job.reference,
        clientName: signerName.trim(),
        signerRole,
        signatureDataUrl,
        signedAtOffline: nowIso,
        signedAtSynced: isOnline ? nowIso : undefined,
        agreedDiagnosticHours: job.diagnosticHours,
        agreedTotalEstimate: job.totalLabor + job.totalMaterials,
        customerFeedback: feedback.trim() || undefined,
        synced: isOnline
      };

      onSignOffComplete(record);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to capture signature');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCalculated = (job.diagnosticHours * job.hourlyRate) + (job.materialsUsed?.reduce((sum, m) => sum + (m.quantity * m.unitPrice), 0) || 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div data-testid="customer-signoff-modal" className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <PenTool className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  Customer Pontoon Sign-Off
                </h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border ${
                  isOnline 
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-500/30' 
                    : 'bg-amber-950 text-amber-400 border-amber-500/30'
                }`}>
                  {isOnline ? <Cloud className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  <span>{isOnline ? 'Online Ready' : 'Pontoon Offline Mode'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {job.reference} · {job.vesselName} ({job.berthLocation})
              </p>
            </div>
          </div>

          <button
            data-testid="close-signoff-modal-button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Summary Card for Client Review */}
          <div data-testid="signoff-summary-card" className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
              <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
                Work Sheet Summary
              </span>
              <span className="font-mono text-amber-400 font-bold">
                Flat Rate £25.00/hr
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] block">Diagnostic Labor Logged</span>
                <span className="text-base font-bold font-mono text-white flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>{job.diagnosticHours} Hours (£{(job.diagnosticHours * job.hourlyRate).toFixed(2)})</span>
                </span>
              </div>
              <div className="space-y-1">
                <span className="text-slate-400 text-[11px] block">Hardware &amp; Cables Fitted</span>
                <span className="text-base font-bold font-mono text-sky-400 flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-sky-400" />
                  <span>{job.materialsUsed?.length || 0} Line Items (£{(job.totalMaterials).toFixed(2)})</span>
                </span>
              </div>
            </div>

            {job.materialsUsed && job.materialsUsed.length > 0 && (
              <div className="pt-2 border-t border-slate-800/60 space-y-1">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider block">Fitted parts:</span>
                <div className="max-h-24 overflow-y-auto space-y-1 pr-1 text-xs text-slate-300 font-mono">
                  {job.materialsUsed.map(m => (
                    <div key={m.id} className="flex justify-between text-[11px]">
                      <span>{m.name} ({m.quantity} {m.unit})</span>
                      <span>£{(m.quantity * m.unitPrice).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white">Total Agreed Work Value</span>
              <span data-testid="signoff-total-amount" className="text-lg font-black font-mono text-emerald-400">
                £{totalCalculated.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Signer Identity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Signer Full Name *
              </label>
              <input
                data-testid="signoff-signer-name-input"
                type="text"
                value={signerName}
                onChange={(e) => setSignerName(e.target.value)}
                placeholder="e.g., Capt. David Miller"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Representative Authority *
              </label>
              <select
                data-testid="signoff-signer-role-select"
                value={signerRole}
                onChange={(e) => setSignerRole(e.target.value as SignerRole)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-amber-500"
              >
                <option value="vessel_owner">Vessel Owner</option>
                <option value="skipper">Vessel Skipper / Captain</option>
                <option value="marina_agent">Marina Agent / Berthing Master</option>
              </select>
            </div>
          </div>

          {/* Interactive Touchpad Signature Canvas */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <PenTool className="w-3.5 h-3.5 text-amber-400" />
                <span>Handwritten Signature (Finger or Stylus) *</span>
              </label>
              <button
                data-testid="clear-signature-canvas-button"
                type="button"
                onClick={clearCanvas}
                className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Canvas</span>
              </button>
            </div>

            <div className="relative border-2 border-dashed border-slate-700 rounded-2xl overflow-hidden bg-slate-950 touch-none">
              <canvas
                data-testid="signature-canvas"
                ref={canvasRef}
                onPointerDown={startDrawing}
                onPointerMove={draw}
                onPointerUp={stopDrawing}
                onPointerLeave={stopDrawing}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full h-44 cursor-crosshair block"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-600 text-xs">
                  Sign aboard here using touch or mouse...
                </div>
              )}
            </div>
          </div>

          {/* Feedback & Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Customer Pontoon Feedback / Test Notes (Optional)
            </label>
            <input
              data-testid="signoff-feedback-input"
              type="text"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g., Shore power 230V inverter verified running smoothly, bilge test ok."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {errorMsg && (
            <div data-testid="signoff-error-message" className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            data-testid="cancel-signoff-button"
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            data-testid="submit-signoff-button"
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitSignOff}
            className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white rounded-xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Confirm Sign-Off ({isOnline ? 'Save to Cloud' : 'Queue in Offline Pontoon Cache'})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
