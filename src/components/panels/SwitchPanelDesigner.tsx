import React, { useState } from 'react';
import { SwitchPanelConfig, SwitchConfig } from '../../types';
import { INITIAL_SAMPLE_PANEL } from '../../data/seedData';
import { Sliders, Sparkles, Check, Download, Layers, ShieldCheck, Ruler } from 'lucide-react';

interface SwitchPanelDesignerProps {
  onOrderPanel?: (config: SwitchPanelConfig) => void;
}

export const SwitchPanelDesigner: React.FC<SwitchPanelDesignerProps> = ({ onOrderPanel }) => {
  const [config, setConfig] = useState<SwitchPanelConfig>(INITIAL_SAMPLE_PANEL);
  const [activeTab, setActiveTab] = useState<'layout' | 'switches' | 'options'>('layout');
  const [orderModalOpen, setOrderModalOpen] = useState(false);

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
      // Add switches + terminals (£8 per switch kit)
      return Math.round(base + cfg.gangCount * 8 + 12);
    } else {
      // Assembled and bench-tested (materials + 1.5 hrs labor)
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

    // Auto adjust panel width if many switches
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Laser Workshop Tool</span>
            <span aria-hidden="true">·</span>
            <span>Laser-Engraved & Cut in Gosport</span>
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

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Marine grade UV-stable acrylic & sealed marine components</span>
            </span>
            <button
              onClick={() => {
                if (onOrderPanel) onOrderPanel(config);
                setOrderModalOpen(true);
              }}
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg shadow-sm shadow-sky-600/30 transition-all text-xs"
            >
              Order / Request Quote for this Panel
            </button>
          </div>
        </div>

        {/* Right 5 Cols: Customization Controls */}
        <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 space-y-5">
          {/* Sub Navigation Tabs */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-xl">
            <button
              onClick={() => setActiveTab('layout')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'layout' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Dimensions & Material
            </button>
            <button
              onClick={() => setActiveTab('switches')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'switches' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Switch Labels ({config.gangCount})
            </button>
            <button
              onClick={() => setActiveTab('options')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                activeTab === 'options' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Kit & Accessories
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
                  Add-on Laser Cutouts & Meters
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
                Continue to Quote & Booking
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
