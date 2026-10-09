import React, { useState } from 'react';
import { VesselSpec } from '../../types';
import {
  generateVesselPdf,
  printVesselPdf,
  VesselPdfOptions
} from '../../utils/generateVesselPdf';
import {
  FileText,
  Printer,
  Download,
  X,
  ShieldCheck,
  Battery,
  Zap,
  AlertTriangle,
  Compass,
  CheckCircle2,
  Sliders,
  Eye,
  Anchor,
  FileCheck,
  Sun
} from 'lucide-react';

interface VesselPdfSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  vesselSpec: VesselSpec;
}

export const VesselPdfSummaryModal: React.FC<VesselPdfSummaryModalProps> = ({
  isOpen,
  onClose,
  vesselSpec
}) => {
  const [mode, setMode] = useState<'single_page_summary' | 'comprehensive'>('single_page_summary');
  const [colorTheme, setColorTheme] = useState<'marine_navy' | 'high_contrast_mono'>('marine_navy');
  const [includeEmergencyNotes, setIncludeEmergencyNotes] = useState(true);
  const [includeCriticalFuses, setIncludeCriticalFuses] = useState(true);
  const [includeHistory, setIncludeHistory] = useState(true);
  const [customNotes, setCustomNotes] = useState('');
  const [activeTab, setActiveTab] = useState<'options' | 'preview'>('options');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  if (!isOpen) return null;

  const pdfOptions: VesselPdfOptions = {
    mode,
    colorTheme,
    includeEmergencyNotes,
    includeCriticalFuses,
    includeHistory: mode === 'comprehensive' && includeHistory,
    customNotes: customNotes.trim()
  };

  const handleDownload = () => {
    setIsGenerating(true);
    try {
      generateVesselPdf(vesselSpec, pdfOptions);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to generate PDF', err);
      alert('Error generating PDF. Please try again.');
    } finally {
      setTimeout(() => setIsGenerating(false), 400);
    }
  };

  const handlePrint = () => {
    setIsPrinting(true);
    try {
      printVesselPdf(vesselSpec, pdfOptions);
    } catch (err) {
      console.error('Failed to trigger print', err);
      alert('Error triggering local printer. You can also download the PDF and print from your viewer.');
    } finally {
      setTimeout(() => setIsPrinting(false), 800);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl text-slate-100 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-950/80 border border-sky-500/30 rounded-2xl text-sky-400">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-sky-400 font-semibold">
                  On-Board Print Station
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  A4 Marine Spec
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Vessel Electrical Specification Summary (PDF)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Formatted for {vesselSpec.vesselName} · Suitable for local printing on board, helm laminating &amp; survey binders.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: Options vs Visual Preview */}
        <div className="px-6 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('options')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'options'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Print Settings &amp; Format</span>
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                activeTab === 'preview'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Visual Sheet Preview</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-slate-400 text-[11px]">
            <Anchor className="w-3.5 h-3.5 text-sky-400" />
            <span>{vesselSpec.homeMarina} · {vesselSpec.systemVoltage} DC</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {activeTab === 'options' && (
            <div className="space-y-6">
              {/* Layout Mode Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Select Print Layout &amp; Document Length
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setMode('single_page_summary')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      mode === 'single_page_summary'
                        ? 'bg-sky-950/40 border-sky-500 shadow-md shadow-sky-950/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-sky-400" />
                        <span>Chart Table 1-Page Summary</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-sky-900/60 text-sky-300 border border-sky-500/30">
                        1 Page A4
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Compact single-sheet overview with key DC battery capacities, emergency isolators, shore RCD, critical fuses, and AJW emergency engineer contacts. Ideal for laminating on board.
                    </p>
                  </div>

                  <div
                    onClick={() => setMode('comprehensive')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      mode === 'comprehensive'
                        ? 'bg-sky-950/40 border-sky-500 shadow-md shadow-sky-950/50'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-sm text-white flex items-center gap-2">
                        <FileCheck className="w-4 h-4 text-emerald-400" />
                        <span>Comprehensive Marine Dossier</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                        Multi-Page Full Spec
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Detailed technical survey dossier including full charging breakdown, navigation backbone details, and chronological electrical history audit log with part references.
                    </p>
                  </div>
                </div>
              </div>

              {/* Color Mode / Ink Saver */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Color Scheme &amp; Boat Printer Optimization
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setColorTheme('marine_navy')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                      colorTheme === 'marine_navy'
                        ? 'bg-sky-950/30 border-sky-500'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-sky-500/50 flex items-center justify-center text-sky-400">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Marine Navy &amp; Cyan</div>
                      <div className="text-[11px] text-slate-400">Full color with high-visibility nautical contrast</div>
                    </div>
                  </div>

                  <div
                    onClick={() => setColorTheme('high_contrast_mono')}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                      colorTheme === 'high_contrast_mono'
                        ? 'bg-slate-800/80 border-slate-400'
                        : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-xl bg-white text-slate-900 flex items-center justify-center font-bold text-xs">
                      B&amp;W
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Eco Monochrome / Ink Saver</div>
                      <div className="text-[11px] text-slate-400">Optimized for compact thermal or B&amp;W boat printers</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 block">
                  Included Safety &amp; Circuit Sections
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/90 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={includeEmergencyNotes}
                      onChange={(e) => setIncludeEmergencyNotes(e.target.checked)}
                      className="mt-0.5 rounded text-sky-600 focus:ring-0"
                    />
                    <div>
                      <span className="font-semibold text-white block">Emergency Isolation Protocol</span>
                      <span className="text-[11px] text-slate-400">Rotary battery isolator and unswitched bilge pump checklist</span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/90 cursor-pointer hover:border-slate-700">
                    <input
                      type="checkbox"
                      checked={includeCriticalFuses}
                      onChange={(e) => setIncludeCriticalFuses(e.target.checked)}
                      className="mt-0.5 rounded text-sky-600 focus:ring-0"
                    />
                    <div>
                      <span className="font-semibold text-white block">Critical Fuse Ratings Table</span>
                      <span className="text-[11px] text-slate-400">Class T main, windlass, and solar MPPT fuse amperages</span>
                    </div>
                  </label>

                  {mode === 'comprehensive' && (
                    <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800/90 cursor-pointer hover:border-slate-700 sm:col-span-2">
                      <input
                        type="checkbox"
                        checked={includeHistory}
                        onChange={(e) => setIncludeHistory(e.target.checked)}
                        className="mt-0.5 rounded text-sky-600 focus:ring-0"
                      />
                      <div>
                        <span className="font-semibold text-white block">Full Chronological Electrical History Audit Trail</span>
                        <span className="text-[11px] text-slate-400">Include all past recorded repairs, lithium conversions, and replaced hardware ({vesselSpec.historyLog.length} entries)</span>
                      </div>
                    </label>
                  )}
                </div>
              </div>

              {/* Custom Note for Printout */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">
                  Add Custom Skipper / On-Board Location Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Spare fuses kept in portside chart drawer. Master isolator key located next to companionway."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'preview' && (
            <div className="space-y-4">
              <div className="p-3 bg-sky-950/30 border border-sky-500/20 rounded-2xl flex items-center justify-between text-xs text-sky-300">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-sky-400" />
                  <span>Interactive visual facsimile of your printed on-board document</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400">
                  {mode === 'single_page_summary' ? '1 Page A4' : 'Multi-Page A4'} · {colorTheme === 'marine_navy' ? 'Navy' : 'Monochrome'}
                </span>
              </div>

              {/* Visual Document Canvas Simulation */}
              <div className="bg-white text-slate-900 rounded-2xl shadow-xl p-6 sm:p-8 font-sans border border-slate-300 max-w-2xl mx-auto space-y-4">
                {/* Header Bar */}
                <div className={`p-4 rounded-xl text-white flex justify-between items-start ${
                  colorTheme === 'high_contrast_mono' ? 'bg-slate-900' : 'bg-[#0A192F]'
                }`}>
                  <div>
                    <h3 className="font-bold text-sm tracking-wide">AJW MARINE ELECTRICAL SERVICES</h3>
                    <p className={`text-[10px] ${colorTheme === 'high_contrast_mono' ? 'text-slate-300' : 'text-sky-300'}`}>
                      {mode === 'single_page_summary'
                        ? 'VESSEL ON-BOARD ELECTRICAL SUMMARY · CHART TABLE & HELM SPEC'
                        : 'GOSPORT & SOLENT · TECHNICAL SPECIFICATION & ELECTRICAL HISTORY'}
                    </p>
                  </div>
                  <div className="text-right text-[9px] text-slate-300 font-mono">
                    <div>AUDITED: {vesselSpec.lastInspectionDate || 'Current'}</div>
                    <div>DOC: AJW-VESSEL-{vesselSpec.systemVoltage}</div>
                  </div>
                </div>

                {/* Identity Box */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex justify-between items-start text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-sm text-slate-900">{vesselSpec.vesselName.toUpperCase()}</span>
                      <span className="px-2 py-0.5 rounded bg-sky-100 text-sky-800 text-[10px] font-bold">
                        {vesselSpec.systemVoltage} DC SYSTEM
                      </span>
                    </div>
                    <div className="text-slate-600 mt-1">
                      {vesselSpec.makeModel} ({vesselSpec.year}) · Port: {vesselSpec.homeMarina} ({vesselSpec.berthPontoon})
                    </div>
                  </div>
                  <div className="text-right text-[10px] text-slate-500 font-mono">
                    <div>HIN: {vesselSpec.hinNumber || 'N/A'}</div>
                    <div>Reg: {vesselSpec.sailNumber || 'N/A'}</div>
                  </div>
                </div>

                {/* Emergency Box */}
                {includeEmergencyNotes && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-red-800 text-[11px] flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                      <span>ON-BOARD ELECTRICAL SAFETY &amp; EMERGENCY ISOLATION</span>
                    </div>
                    <p className="text-[10px] text-slate-700">
                      • Turn rotary battery isolator switch OFF during dockside fire or critical short.
                      <br />
                      • Bilge pumps are hardwired via unswitched bus; remain operational when isolator is off.
                    </p>
                  </div>
                )}

                {/* Specs Grid */}
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5 border-b pb-1">
                    <Battery className="w-3.5 h-3.5 text-sky-600" />
                    <span>DC BATTERY BANKS &amp; SMART CHARGING SYSTEM</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-500 block">House Battery:</span>
                      <span className="font-bold text-slate-800">{vesselSpec.houseBatteryType} ({vesselSpec.houseCapacityAh}Ah)</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-500 block">Starter Battery:</span>
                      <span className="font-bold text-slate-800">{vesselSpec.starterBatteryType} ({vesselSpec.starterCca} CCA)</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-500 block">Solar Array &amp; MPPT:</span>
                      <span className="font-bold text-slate-800">{vesselSpec.solarWatts}W · {vesselSpec.solarController}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-500 block">DC-DC Protection:</span>
                      <span className="font-bold text-slate-800">{vesselSpec.dcDcCharger}</span>
                    </div>
                  </div>
                </div>

                {/* AC & Galvanic Section */}
                <div className="space-y-2 text-xs">
                  <div className="font-bold text-slate-900 text-[11px] flex items-center gap-1.5 border-b pb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-sky-600" />
                    <span>230V AC SHORE POWER &amp; GALVANIC ISOLATION</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-500 block">Shore Connection:</span>
                      <span className="font-bold text-slate-800">{vesselSpec.shorePowerRating}</span>
                    </div>
                    <div className="p-2 bg-slate-50 rounded border border-slate-100">
                      <span className="text-slate-500 block">Galvanic Isolator:</span>
                      <span className={`font-bold ${vesselSpec.hasGalvanicIsolator ? 'text-emerald-700' : 'text-red-600'}`}>
                        {vesselSpec.hasGalvanicIsolator ? 'Installed & Tested (Zinc Saver)' : 'Warning: Not Fitted'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Custom Notes Preview */}
                {(customNotes || vesselSpec.generalNotes) && (
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[10px] text-slate-700">
                    <span className="font-bold text-slate-900 block mb-0.5">SKIPPER &amp; ENGINEER ON-BOARD NOTES:</span>
                    <span>{customNotes || vesselSpec.generalNotes}</span>
                  </div>
                )}

                {/* Footer Stamp */}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-500">
                  <span>Maintained via AJW Marine Electrical Services · Gosport, Solent</span>
                  <span className="font-semibold text-slate-700">24/7 Marine Electrician: 07700 900142</span>
                </div>
              </div>
            </div>
          )}

          {downloadSuccess && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-2xl text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>PDF document successfully generated and downloaded to your device!</span>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-5 sm:p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <Anchor className="w-4 h-4 text-sky-400" />
            <span>Ready for on-board printing, laminating, or insurance survey documentation</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handlePrint}
              disabled={isPrinting}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors shadow-sm"
              title="Print directly to local or Wi-Fi boat printer"
            >
              <Printer className="w-4 h-4 text-sky-400" />
              <span>{isPrinting ? 'Opening Print...' : 'Print Directly'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>{isGenerating ? 'Rendering PDF...' : 'Download PDF Spec'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
