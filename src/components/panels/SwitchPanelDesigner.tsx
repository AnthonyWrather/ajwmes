import React, { useState, useRef } from 'react';
import { SwitchPanelConfig, SwitchConfig } from '../../types';
import { INITIAL_SAMPLE_PANEL } from '../../data/seedData';
import { 
  Sliders, 
  Sparkles, 
  Check, 
  Download, 
  Layers, 
  ShieldCheck, 
  Ruler, 
  Cloud, 
  Camera, 
  Loader2, 
  Trash2, 
  Eye, 
  ExternalLink 
} from 'lucide-react';
import { 
  uploadSwitchPanelImage, 
  uploadSvgAsStorageImage, 
  deleteSwitchPanelImage, 
  UploadedPanelImage 
} from '../../lib/storage';
import { ImageLightboxModal } from '../common/ImageLightboxModal';

interface SwitchPanelDesignerProps {
  onOrderPanel?: (config: SwitchPanelConfig) => void;
}

export const SwitchPanelDesigner: React.FC<SwitchPanelDesignerProps> = ({ onOrderPanel }) => {
  const [config, setConfig] = useState<SwitchPanelConfig>(INITIAL_SAMPLE_PANEL);
  const [activeTab, setActiveTab] = useState<'layout' | 'switches' | 'options' | 'cloud_assets'>('layout');
  const [orderModalOpen, setOrderModalOpen] = useState(false);

  // Cloud reference photos state
  const [referencePhotos, setReferencePhotos] = useState<UploadedPanelImage[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoUploadProgress, setPhotoUploadProgress] = useState(0);

  // CAD Cloud Save State
  const [isSavingCad, setIsSavingCad] = useState(false);
  const [savedCadUrl, setSavedCadUrl] = useState<string | null>(null);

  // Lightbox
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  const svgRef = useRef<SVGSVGElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Recalculate estimated pricing based on options
  const calculatePrice = (cfg: SwitchPanelConfig) => {
    let base = 35; // base laser cut & setup
    // Material factor
    if (cfg.material === 'wood_teak') base += 25;
    if (cfg.material === 'wood_birch') base += 15;
    // Gang count
    base += cfg.gangCount * 2.5;
    // Add-on cutouts
    if (cfg.hasVoltmeter) base += 8;
    if (cfg.hasUsbCharger) base += 10;
    if (cfg.has12vSocket) base += 6;

    // Package multiplier
    if (cfg.packageOption === 'faceplate_only') {
      return Math.round(base);
    } else if (cfg.packageOption === 'diy_kit') {
      return Math.round(base + cfg.gangCount * 8 + 12);
    } else {
      return Math.round(base + cfg.gangCount * 12 + 35);
    }
  };

  const updateConfig = (updated: Partial<SwitchPanelConfig>) => {
    const next = { ...config, ...updated };
    next.estimatedPrice = calculatePrice(next);
    setConfig(next);
  };

  const handleGangCountChange = (count: number) => {
    const current = [...config.switches];
    const defaultLabels = [
      'NAV LIGHTS', 'ANCHOR LIGHT', 'CABIN LIGHTS', 'BILGE PUMP AUTO',
      'VHF RADIO', 'SOLAR / BMS', 'CHARTPLOTTER', 'DECK FLOOD',
      'FRIDGE / 12V', 'FRESH WATER PUMP', 'AUTOPILOT', 'SPARE AUX'
    ];

    let newSwitches: SwitchConfig[] = [];
    for (let i = 0; i < count; i++) {
      if (current[i]) {
        newSwitches.push({ ...current[i], position: i + 1 });
      } else {
        newSwitches.push({
          position: i + 1,
          label: defaultLabels[i] || `CIRCUIT ${i + 1}`,
          breakerRatingAmps: 10,
          switchType: 'rocker_illuminated'
        });
      }
    }

    let minWidth = Math.max(160, Math.ceil(count / 2) * 55 + (config.hasVoltmeter ? 45 : 0));
    updateConfig({
      gangCount: count,
      switches: newSwitches,
      widthMm: Math.max(config.widthMm, minWidth)
    });
  };

  const updateSwitchLabel = (index: number, label: string) => {
    const nextSwitches = [...config.switches];
    if (nextSwitches[index]) {
      nextSwitches[index] = { ...nextSwitches[index], label: label.toUpperCase() };
      updateConfig({ switches: nextSwitches });
    }
  };

  const updateSwitchAmps = (index: number, amps: number) => {
    const nextSwitches = [...config.switches];
    if (nextSwitches[index]) {
      nextSwitches[index] = { ...nextSwitches[index], breakerRatingAmps: amps };
      updateConfig({ switches: nextSwitches });
    }
  };

  // Upload reference photo to Firebase Storage
  const handleUploadReferencePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];

    setIsUploadingPhoto(true);
    setPhotoUploadProgress(0);

    try {
      const uploaded = await uploadSwitchPanelImage(file, {
        jobReference: `CAD-${config.gangCount}GANG`,
        category: 'mounting_cavity',
        onProgress: (info) => setPhotoUploadProgress(info.progress)
      });

      setReferencePhotos(prev => [...prev, uploaded]);
    } catch (err) {
      console.error('Failed to upload reference photo:', err);
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploadingPhoto(false);
      setPhotoUploadProgress(0);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  // Save current CAD SVG drawing directly to Firebase Storage
  const handleSaveCadToFirebase = async () => {
    if (!svgRef.current) return;
    setIsSavingCad(true);

    try {
      const svgSerializer = new XMLSerializer();
      const svgString = svgSerializer.serializeToString(svgRef.current);
      const filename = `switch_panel_${config.gangCount}gang_${config.widthMm}x${config.heightMm}mm_${Date.now()}.svg`;

      const result = await uploadSvgAsStorageImage(svgString, filename, {
        jobReference: `CAD-${config.gangCount}GANG`,
        vesselName: 'Custom Specification'
      });

      setSavedCadUrl(result.url);
    } catch (err) {
      console.error('Failed to save CAD SVG to Firebase Storage:', err);
      alert('Could not save CAD design to Firebase Storage.');
    } finally {
      setIsSavingCad(false);
    }
  };

  const handleDeletePhoto = async (photo: UploadedPanelImage) => {
    try {
      await deleteSwitchPanelImage(photo.storagePath);
    } catch (e) {
      console.warn('Error deleting photo:', e);
    }
    setReferencePhotos(prev => prev.filter(p => p.id !== photo.id));
  };

  // Material visual colors
  const materialColors = {
    acrylic_black: { bg: '#0F172A', border: '#334155', text: '#F8FAFC', label: 'Matte Black Marine Acrylic (3mm)' },
    acrylic_white: { bg: '#F1F5F9', border: '#CBD5E1', text: '#0F172A', label: 'Gloss Marine White Acrylic (3mm)' },
    wood_teak: { bg: '#78350F', border: '#92400E', text: '#FEF3C7', label: 'Solid Marine Teak Veneer (4mm)' },
    wood_birch: { bg: '#B45309', border: '#D97706', text: '#FFFBEB', label: 'Hardwood Marine Birch Plywood (4mm)' },
  };

  const currentMat = materialColors[config.material as keyof typeof materialColors];

  return (
    <div className="w-full space-y-6">
      <ImageLightboxModal
        isOpen={!!lightboxUrl}
        imageUrl={lightboxUrl}
        imageTitle={lightboxTitle}
        onClose={() => setLightboxUrl(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Laser Workshop Tool</span>
            <span aria-hidden="true">·</span>
            <span>Laser-Engraved &amp; Cut in Gosport</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400 flex items-center gap-1 font-mono">
              <Cloud className="w-3 h-3" />
              <span>Firebase Cloud Storage</span>
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Replica/Custom Switch Panel Designer
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Design your bespoke marine switchboard with live scale preview, laser cut holes, and instant price estimates.
          </p>
        </div>

        <div className="text-right sm:text-right bg-slate-900 border border-slate-800 p-2.5 rounded-xl self-start sm:self-auto">
          <span className="text-[11px] text-slate-400 block">Calculated Price</span>
          <span className="text-xl sm:text-2xl font-bold text-sky-400 font-mono tabular-nums">
            £{config.estimatedPrice.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-400 block capitalize">
            {config.packageOption.replace('_', ' ')}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Cols: Live Scaled Visual Preview */}
        <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-sky-400" />
              <span className="font-medium text-slate-300">
                Live Scale CAD Preview: {config.widthMm}mm × {config.heightMm}mm
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-400">
              {config.gangCount} Circuits · {config.material.replace('_', ' ')}
            </span>
          </div>

          {/* SVG Visual Render Frame */}
          <div className="w-full aspect-16/10 bg-slate-950 rounded-xl p-4 flex items-center justify-center overflow-hidden border border-slate-800 relative shadow-inner">
            <svg
              ref={svgRef}
              viewBox={`0 0 ${config.widthMm + 20} ${config.heightMm + 20}`}
              className="max-w-full max-h-full drop-shadow-2xl transition-all duration-300"
            >
              {/* Outer Plate Shadow */}
              <rect
                x="12"
                y="12"
                width={config.widthMm}
                height={config.heightMm}
                rx="6"
                fill="#000000"
                opacity="0.5"
              />

              {/* Main Panel Plate Material */}
              <rect
                x="10"
                y="10"
                width={config.widthMm}
                height={config.heightMm}
                rx="6"
                fill={currentMat.bg}
                stroke={currentMat.border}
                strokeWidth="1.5"
              />

              {/* Decorative Laser Bevel Border */}
              <rect
                x="14"
                y="14"
                width={config.widthMm - 8}
                height={config.heightMm - 8}
                rx="4"
                fill="none"
                stroke={config.material === 'acrylic_white' ? '#94A3B8' : '#334155'}
                strokeWidth="0.8"
                strokeDasharray="2,2"
              />

              {/* 4 Corner Screw Holes (4mm laser cut) */}
              <circle cx="16" cy="16" r="2.5" fill="#1E293B" stroke="#475569" strokeWidth="0.5" />
              <circle cx={config.widthMm + 4} cy="16" r="2.5" fill="#1E293B" stroke="#475569" strokeWidth="0.5" />
              <circle cx="16" cy={config.heightMm + 4} r="2.5" fill="#1E293B" stroke="#475569" strokeWidth="0.5" />
              <circle cx={config.widthMm + 4} cy={config.heightMm + 4} r="2.5" fill="#1E293B" stroke="#475569" strokeWidth="0.5" />

              {/* Header Title Engraved */}
              <text
                x={config.widthMm / 2 + 10}
                y="24"
                textAnchor="middle"
                fontSize="5.5"
                fontFamily="Plus Jakarta Sans, sans-serif"
                fontWeight="bold"
                fill={currentMat.text}
                letterSpacing="0.8"
              >
                12V DC MAIN ELECTRICAL DISTRIBUTION
              </text>

              {/* Switches Grid Layout */}
              {config.switches.map((sw: SwitchConfig, idx: number) => {
                const cols = Math.ceil(config.gangCount / 2);
                const colIdx = idx % cols;
                const rowIdx = Math.floor(idx / cols);

                const cellWidth = (config.widthMm - (config.hasVoltmeter ? 50 : 25)) / cols;
                const startX = 22 + colIdx * cellWidth;
                const startY = 34 + rowIdx * 38;

                return (
                  <g key={sw.position} className="transition-all">
                    {/* Carling Rocker Switch Bezel (37mm x 21mm standard cutout) */}
                    <rect
                      x={startX}
                      y={startY}
                      width="16"
                      height="26"
                      rx="2.5"
                      fill="#020617"
                      stroke="#1E293B"
                      strokeWidth="0.8"
                    />

                    {/* Illuminated LED Indicator */}
                    <rect
                      x={startX + 4}
                      y={startY + 3}
                      width="8"
                      height="3"
                      rx="1"
                      fill={
                        config.backlightColor === 'cyan' ? '#38BDF8' :
                        config.backlightColor === 'red' ? '#F43F5E' :
                        config.backlightColor === 'amber' ? '#F59E0B' : '#3B82F6'
                      }
                      filter="drop-shadow(0 0 1px #38BDF8)"
                    />

                    {/* Rocker Actuator body */}
                    <rect
                      x={startX + 2}
                      y={startY + 7}
                      width="12"
                      height="16"
                      rx="1.5"
                      fill="#0F172A"
                      stroke="#334155"
                      strokeWidth="0.5"
                    />

                    {/* Breaker Rating Fuse / Indicator dot */}
                    <circle cx={startX + 8} cy={startY + 20} r="1.5" fill="#475569" />

                    {/* Laser Engraved Circuit Label Beneath Switch */}
                    <text
                      x={startX + 8}
                      y={startY + 32}
                      textAnchor="middle"
                      fontSize="3.2"
                      fontWeight="600"
                      fontFamily="JetBrains Mono, monospace"
                      fill={currentMat.text}
                    >
                      {sw.label.slice(0, 14)}
                    </text>

                    {/* Breaker Rating Amperage */}
                    <text
                      x={startX + 8}
                      y={startY + 36}
                      textAnchor="middle"
                      fontSize="2.4"
                      fill="#94A3B8"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {sw.breakerRatingAmps}A
                    </text>
                  </g>
                );
              })}

              {/* Optional Voltmeter Cutout */}
              {config.hasVoltmeter && (
                <g transform={`translate(${config.widthMm - 24}, 36)`}>
                  <circle cx="12" cy="14" r="11" fill="#000000" stroke="#334155" strokeWidth="1" />
                  <rect x="5" y="9" width="14" height="8" rx="1" fill="#020617" />
                  <text x="12" y="15" textAnchor="middle" fontSize="3.6" fill="#38BDF8" fontFamily="monospace" fontWeight="bold">
                    13.4V
                  </text>
                  <text x="12" y="29" textAnchor="middle" fontSize="2.8" fill={currentMat.text} fontWeight="600">
                    VOLTS
                  </text>
                </g>
              )}

              {/* Optional USB Charger Cutout */}
              {config.hasUsbCharger && (
                <g transform={`translate(${config.widthMm - 24}, 74)`}>
                  <circle cx="12" cy="12" r="10" fill="#000000" stroke="#334155" strokeWidth="1" />
                  <rect x="7" y="9" width="10" height="3" rx="0.5" fill="#1E293B" />
                  <rect x="8" y="13" width="8" height="2" rx="0.5" fill="#1E293B" />
                  <text x="12" y="27" textAnchor="middle" fontSize="2.8" fill={currentMat.text} fontWeight="600">
                    USB 3.0
                  </text>
                </g>
              )}
            </svg>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800 gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveCadToFirebase}
                disabled={isSavingCad}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-slate-700 cursor-pointer"
              >
                {isSavingCad ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Cloud className="w-3.5 h-3.5" />}
                <span>{isSavingCad ? 'Saving...' : 'Save CAD to Firebase Storage'}</span>
              </button>
              {savedCadUrl && (
                <a
                  href={savedCadUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-emerald-400 flex items-center gap-1 hover:underline"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>CAD Saved (Cloud Link)</span>
                </a>
              )}
            </div>

            <button
              onClick={() => {
                if (onOrderPanel) onOrderPanel(config);
                setOrderModalOpen(true);
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-sm shadow-sky-600/30 transition-all text-xs cursor-pointer"
            >
              Order / Request Quote for this Panel
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Customization Controls */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
            <button
              onClick={() => setActiveTab('layout')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap px-2 ${
                activeTab === 'layout' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Layout
            </button>
            <button
              onClick={() => setActiveTab('switches')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap px-2 ${
                activeTab === 'switches' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Switches ({config.gangCount})
            </button>
            <button
              onClick={() => setActiveTab('options')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap px-2 ${
                activeTab === 'options' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kit
            </button>
            <button
              onClick={() => setActiveTab('cloud_assets')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap px-2 flex items-center justify-center gap-1 ${
                activeTab === 'cloud_assets' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>Reference Photos ({referencePhotos.length})</span>
            </button>
          </div>

          {/* Tab 1: Layout & Material */}
          {activeTab === 'layout' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">
                  Replica/Custom Panel Material
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(materialColors) as (keyof typeof materialColors)[]).map(matKey => (
                    <button
                      key={matKey}
                      onClick={() => updateConfig({ material: matKey })}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        config.material === matKey
                          ? 'border-sky-500 bg-sky-950/40 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <span className="font-bold block text-white">{materialColors[matKey].label.split(' ')[0]}</span>
                      <span className="text-[10px] text-slate-400">{materialColors[matKey].label.split('(')[1]?.replace(')', '') || 'Marine'}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">
                  Number of Switch Circuits (Gangs)
                </label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[4, 6, 8, 10, 12].map(count => (
                    <button
                      key={count}
                      onClick={() => handleGangCountChange(count)}
                      className={`py-2 rounded-lg font-bold border transition-colors ${
                        config.gangCount === count
                          ? 'bg-sky-600 border-sky-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {count} Gang
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">
                    Width (mm)
                  </label>
                  <input
                    type="number"
                    min="120"
                    max="350"
                    value={config.widthMm}
                    onChange={e => updateConfig({ widthMm: Number(e.target.value) || 160 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-400 block mb-1">
                    Height (mm)
                  </label>
                  <input
                    type="number"
                    min="80"
                    max="250"
                    value={config.heightMm}
                    onChange={e => updateConfig({ heightMm: Number(e.target.value) || 120 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Individual Switch Labels & Ratings */}
          {activeTab === 'switches' && (
            <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
              <p className="text-[11px] text-slate-400">
                Type custom labels to be laser-etched onto each switch circuit position:
              </p>
              {config.switches.map((sw: SwitchConfig, idx: number) => (
                <div
                  key={sw.position}
                  className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl flex items-center gap-2"
                >
                  <span className="w-5 text-[11px] font-mono font-bold text-sky-400 shrink-0">
                    #{sw.position}
                  </span>
                  <input
                    type="text"
                    value={sw.label}
                    onChange={e => updateSwitchLabel(idx, e.target.value)}
                    placeholder="e.g. BILGE PUMP"
                    className="flex-1 bg-slate-900 border border-slate-800 text-xs px-2.5 py-1.5 rounded text-white font-mono uppercase focus:outline-none focus:border-sky-500"
                  />
                  <select
                    value={sw.breakerRatingAmps}
                    onChange={e => updateSwitchAmps(idx, Number(e.target.value))}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-300 px-2 py-1.5 rounded focus:outline-none"
                  >
                    <option value={5}>5A</option>
                    <option value={10}>10A</option>
                    <option value={15}>15A</option>
                    <option value={20}>20A</option>
                    <option value={25}>25A</option>
                  </select>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Package Type & Accessories */}
          {activeTab === 'options' && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 block mb-1.5">
                  Package Readiness
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'faceplate_only', title: 'Faceplate Only', desc: 'Laser cut & engraved panel with mounting holes. You transfer existing switches.' },
                    { id: 'diy_kit', title: 'DIY Assembly Kit', desc: 'Faceplate + IP66 Carling rockers + marine terminals + circuit fuses.' },
                    { id: 'assembled_wired', title: 'Assembled & Bench-Tested', desc: 'Drop-in unit with tinned copper busbars, labeled jumpers & 12V bench test.' },
                  ].map(pkg => (
                    <div
                      key={pkg.id}
                      onClick={() => updateConfig({ packageOption: pkg.id as any })}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        config.packageOption === pkg.id
                          ? 'border-sky-500 bg-sky-950/40 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{pkg.title}</span>
                        {config.packageOption === pkg.id && <Check className="w-4 h-4 text-sky-400" />}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{pkg.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Accessories toggles */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="font-semibold text-slate-300 block">
                  Add-on Laser Cutouts &amp; Meters
                </label>
                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                  <span>Digital LED Voltmeter Cutout (29mm)</span>
                  <input
                    type="checkbox"
                    checked={config.hasVoltmeter}
                    onChange={e => updateConfig({ hasVoltmeter: e.target.checked })}
                    className="rounded text-sky-600 focus:ring-0"
                  />
                </label>
                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800 cursor-pointer">
                  <span>Dual USB-A/C 12V Charger Cutout</span>
                  <input
                    type="checkbox"
                    checked={config.hasUsbCharger}
                    onChange={e => updateConfig({ hasUsbCharger: e.target.checked })}
                    className="rounded text-sky-600 focus:ring-0"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Tab 4: Reference Photos & Cloud Storage */}
          {activeTab === 'cloud_assets' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white">Upload Existing Boat Panel Photos</h4>
                  <p className="text-[11px] text-slate-400">
                    Directly stored in Firebase Storage to verify cutouts against old panels.
                  </p>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30">
                  Firebase Cloud Storage
                </span>
              </div>

              {/* Uploading progress bar */}
              {isUploadingPhoto && (
                <div className="p-3 bg-slate-950 border border-sky-500/40 rounded-xl space-y-2">
                  <div className="flex items-center justify-between text-xs text-sky-300">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                      <span>Uploading to Firebase Cloud Storage...</span>
                    </span>
                    <span className="font-mono">{photoUploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-sky-500 h-1.5 rounded-full transition-all duration-200" 
                      style={{ width: `${photoUploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Photos List */}
              <div className="grid grid-cols-2 gap-2">
                {referencePhotos.map(photo => (
                  <div 
                    key={photo.id}
                    className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-950 border border-slate-800 group"
                  >
                    <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => {
                          setLightboxUrl(photo.url);
                          setLightboxTitle(photo.name);
                        }}
                        className="p-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                        title="Zoom In"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePhoto(photo)}
                        className="p-1.5 bg-rose-600/80 text-white rounded-lg hover:bg-rose-600"
                        title="Delete from Firebase Storage"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1.5 right-1.5 text-[9px] bg-black/75 px-1 py-0.5 rounded text-white truncate font-mono">
                      {photo.originalName}
                    </span>
                  </div>
                ))}

                <label className="aspect-4/3 border-2 border-dashed border-slate-800 hover:border-emerald-500 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-950/60 text-slate-400 hover:text-white">
                  <Camera className="w-5 h-5 text-emerald-400 mb-1" />
                  <span className="text-[11px] font-semibold">Upload Photo</span>
                  <span className="text-[9px] text-emerald-400 font-mono">Firebase Storage</span>
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    disabled={isUploadingPhoto}
                    onChange={handleUploadReferencePhoto}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {orderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 max-w-md w-full rounded-2xl p-6 text-slate-100 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Check className="w-5 h-5 text-emerald-400" />
              <span>Switch Panel Specification Saved</span>
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your {config.gangCount}-gang {config.material.replace('_', ' ')} panel specification (estimated at £{config.estimatedPrice.toFixed(2)}) has been loaded into your job request.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-sky-300">
              {config.switches.map((s: SwitchConfig) => `${s.position}: ${s.label} (${s.breakerRatingAmps}A)`).join(' · ')}
            </div>
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => setOrderModalOpen(false)}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg text-xs"
              >
                Continue to Quote &amp; Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
