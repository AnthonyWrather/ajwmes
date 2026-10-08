import React, { useState } from 'react';
import { Logo } from '../brand/Logo';
import { Download, Printer, Scissors, Sparkles, Check, QrCode } from 'lucide-react';

export const PrintLaserAssetStudio: React.FC = () => {
  const [activeAsset, setActiveAsset] = useState<'card' | 'flyer'>('card');
  const [renderMode, setRenderMode] = useState<'print_paper' | 'laser_acrylic' | 'laser_wood'>('print_paper');
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');

  // Trigger download of laser SVG vector
  const handleDownloadLaserSVG = (type: 'card' | 'flyer') => {
    let svgContent = '';
    const filename = `ajwmes-${type}-laser-lightburn.svg`;

    if (type === 'card') {
      svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 85 55" width="85mm" height="55mm">
  <!-- RED LAYER: VECTOR CUT LINE (0.001in Hairline, #FF0000) -->
  <rect x="0" y="0" width="85" height="55" rx="3" fill="none" stroke="#FF0000" stroke-width="0.1" />
  
  <!-- BLACK LAYER: RASTER ENGRAVE (#000000) -->
  <g fill="#000000" stroke="none">
    <!-- Anchor Bolt Logo -->
    <circle cx="16" cy="16" r="3.5" fill="none" stroke="#000000" stroke-width="1.2" />
    <line x1="10" y1="21" x2="22" y2="21" stroke="#000000" stroke-width="1.2" />
    <path d="M 17 20 L 14 27 L 18 27 L 14 36" fill="none" stroke="#000000" stroke-width="1.2" />
    <path d="M 9 32 C 10 39, 22 39, 23 32" fill="none" stroke="#000000" stroke-width="1.2" />
    
    <!-- Typography -->
    <text x="26" y="18" font-family="Arial, sans-serif" font-size="6" font-weight="bold">AJWMES</text>
    <text x="26" y="23" font-family="Arial, sans-serif" font-size="2.6">MARINE ELECTRICAL SERVICES</text>
    <text x="26" y="27" font-family="Arial, sans-serif" font-size="2.2" font-style="italic">Gosport &amp; Solent Marinas · 07700 900142</text>

    <!-- Details Box -->
    <text x="6" y="42" font-family="Arial, sans-serif" font-size="2.8" font-weight="bold">FLAT RATE: £25 / HOUR + MATERIALS</text>
    <text x="6" y="47" font-family="Arial, sans-serif" font-size="2.2">Diagnostics · Lithium Battery Banks · Solar · Replica/Custom Switch Panels</text>
  </g>
</svg>`;
    } else {
      svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 148 210" width="148mm" height="210mm">
  <!-- RED LAYER: VECTOR CUT LINE (0.001in Hairline, #FF0000) -->
  <rect x="0" y="0" width="148" height="210" rx="4" fill="none" stroke="#FF0000" stroke-width="0.1" />
  
  <!-- BLACK LAYER: RASTER ENGRAVE (#000000) -->
  <g fill="#000000" stroke="none">
    <text x="74" y="22" text-anchor="middle" font-family="Arial, sans-serif" font-size="10" font-weight="bold">AJWMES</text>
    <text x="74" y="29" text-anchor="middle" font-family="Arial, sans-serif" font-size="4.5">MARINE ELECTRICAL SERVICES · GOSPORT &amp; SOLENT</text>
    <line x1="20" y1="33" x2="128" y2="33" stroke="#000000" stroke-width="0.6" />
    
    <text x="74" y="44" text-anchor="middle" font-family="Arial, sans-serif" font-size="6.5" font-weight="bold">FLAT RATE: £25 / HOUR + MATERIALS</text>
    <text x="74" y="51" text-anchor="middle" font-family="Arial, sans-serif" font-size="3.5">Cost-effective diagnostics &amp; budget electrical refits for practical boat owners</text>

    <text x="20" y="68" font-family="Arial, sans-serif" font-size="4" font-weight="bold">• Marine Diagnostics &amp; Fault Finding</text>
    <text x="20" y="74" font-family="Arial, sans-serif" font-size="3">Draining batteries, alternator charging, bilge pumps &amp; NMEA instruments</text>

    <text x="20" y="86" font-family="Arial, sans-serif" font-size="4" font-weight="bold">• Lithium (LiFePO4) &amp; Solar Systems</text>
    <text x="20" y="92" font-family="Arial, sans-serif" font-size="3">Victron DC-DC chargers, smart shunts, solar arch &amp; MPPT controllers</text>

    <text x="20" y="104" font-family="Arial, sans-serif" font-size="4" font-weight="bold">• Replica/Custom Switch Panels (Acrylic &amp; Wood)</text>
    <text x="20" y="110" font-family="Arial, sans-serif" font-size="3">Custom switchboards &amp; drop-in replacements for Westerly, Moody, Sadler</text>

    <text x="74" y="175" text-anchor="middle" font-family="Arial, sans-serif" font-size="4" font-weight="bold">Anthony Wrather · 07700 900142</text>
    <text x="74" y="182" text-anchor="middle" font-family="Arial, sans-serif" font-size="3.5">Serving Haslar, Gosport, Port Solent, Hamble &amp; Solent Marinas</text>
  </g>
</svg>`;
    }

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPrintPDF = (type: 'card' | 'flyer') => {
    alert(`Downloading high-resolution 300DPI print file for ${type === 'card' ? 'Business Cards (85x55mm)' : 'A5 Marina Flyer (148x210mm)'}. Ready for printing on cardstock or commercial printer.`);
  };

  return (
    <div className="w-full space-y-6 text-slate-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Marketing & Laser Workshop</span>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5">
            Print & Laser Engraving Asset Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Export unified business cards and A5 marina flyers in both <strong>Print on Paper (PDF)</strong> and <strong>Laser Engrave (SVG for LightBurn/Laser)</strong>.
          </p>
        </div>

        {/* Asset Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveAsset('card')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeAsset === 'card' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Business Cards (85×55mm)
          </button>
          <button
            onClick={() => setActiveAsset('flyer')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeAsset === 'flyer' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            A5 Marina Flyer (148×210mm)
          </button>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Rendering Mode:</span>
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setRenderMode('print_paper')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                renderMode === 'print_paper' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Full Color Print</span>
            </button>
            <button
              onClick={() => setRenderMode('laser_acrylic')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                renderMode === 'laser_acrylic' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Laser Acrylic Engrave</span>
            </button>
            <button
              onClick={() => setRenderMode('laser_wood')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                renderMode === 'laser_wood' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Marine Wood Engrave</span>
            </button>
          </div>
        </div>

        {/* Download Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleDownloadPrintPDF(activeAsset)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Download Print File</span>
          </button>
          <button
            onClick={() => handleDownloadLaserSVG(activeAsset)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-sm shadow-sky-600/30 transition-all"
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Download LightBurn Vector (SVG)</span>
          </button>
        </div>
      </div>

      {/* Visual Asset Preview Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 sm:p-10 flex flex-col items-center justify-center min-h-[500px]">
        {/* Business Card Preview */}
        {activeAsset === 'card' && (
          <div className="space-y-4 flex flex-col items-center">
            {/* Front / Back Toggle */}
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setCardSide('front')}
                className={`px-3 py-1 rounded-md font-semibold ${cardSide === 'front' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400'}`}
              >
                Front Side
              </button>
              <button
                onClick={() => setCardSide('back')}
                className={`px-3 py-1 rounded-md font-semibold ${cardSide === 'back' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-400'}`}
              >
                Back Side
              </button>
            </div>

            {/* Scaled Card Mockup (85mm x 55mm ratio = 1.545) */}
            <div
              className={`w-[360px] h-[230px] rounded-2xl p-6 flex flex-col justify-between shadow-2xl relative select-none transition-all duration-300 border ${
                renderMode === 'print_paper'
                  ? 'bg-gradient-to-br from-[#0A192F] to-[#050C1A] border-sky-500/40 text-white'
                  : renderMode === 'laser_acrylic'
                  ? 'bg-[#0B0F17] border-red-500/80 text-white font-mono'
                  : 'bg-[#92400E] border-red-500/80 text-[#FEF3C7] font-mono'
              }`}
            >
              {/* Laser Cut Outline Highlight in Laser Mode */}
              {renderMode !== 'print_paper' && (
                <div className="absolute inset-1 rounded-xl border border-dashed border-red-500/60 pointer-events-none" />
              )}

              {cardSide === 'front' ? (
                <>
                  <div className="flex items-start justify-between">
                    <Logo size="md" showSubtitle={false} />
                    <span className="text-[10px] uppercase font-mono tracking-wider text-sky-400 font-bold bg-sky-950/80 border border-sky-500/30 px-2 py-0.5 rounded">
                      Solent
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-extrabold tracking-tight">
                      AJW MARINE ELECTRICAL SERVICES
                    </h4>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Diagnostics · Lithium &amp; Solar · Replica/Custom Switch Panels
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px]">
                    <span className="font-bold text-sky-400 font-mono">£25 / HOUR FLAT RATE</span>
                    <span className="text-slate-400">Gosport &amp; 1-Hour Travel</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Anthony Wrather</h4>
                      <p className="text-[10px] text-sky-400 font-medium">Marine Electrical Specialist</p>
                    </div>
                    <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center">
                      <QrCode className="w-10 h-10 text-slate-900" />
                    </div>
                  </div>

                  <div className="space-y-1 text-xs">
                    <p className="text-slate-300">📞 07700 900142</p>
                    <p className="text-slate-300">✉ anthonywrather@gmail.com</p>
                    <p className="text-slate-300">🌐 ajwmarine.co.uk</p>
                  </div>

                  <div className="pt-2 border-t border-slate-700/60 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>Haslar · Gosport · Port Solent · Hamble</span>
                    <span className="text-sky-400 font-semibold">Scan to Book</span>
                  </div>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Standard 85mm × 55mm Card Size</span>
          </div>
        )}

        {/* A5 Flyer Preview */}
        {activeAsset === 'flyer' && (
          <div className="space-y-4 flex flex-col items-center">
            {/* Scaled A5 Mockup (148mm x 210mm ratio = 0.704) */}
            <div
              className={`w-[340px] sm:w-[420px] rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative select-none transition-all duration-300 border ${
                renderMode === 'print_paper'
                  ? 'bg-gradient-to-br from-[#0A192F] via-[#0D2137] to-[#050C1A] border-sky-500/40 text-white'
                  : renderMode === 'laser_acrylic'
                  ? 'bg-[#0B0F17] border-red-500/80 text-white font-mono'
                  : 'bg-[#92400E] border-red-500/80 text-[#FEF3C7] font-mono'
              }`}
            >
              {renderMode !== 'print_paper' && (
                <div className="absolute inset-1 rounded-2xl border border-dashed border-red-500/60 pointer-events-none" />
              )}

              {/* Flyer Header */}
              <div className="flex items-center justify-between border-b border-slate-700/60 pb-3">
                <Logo size="sm" />
                <span className="text-[9px] uppercase font-bold text-sky-400 bg-sky-950 px-2 py-0.5 rounded border border-sky-500/30">
                  Gosport Based
                </span>
              </div>

              {/* Headline */}
              <div className="my-4 text-center space-y-1">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white leading-snug">
                  Cost-Effective, Budget-Friendly Marine Electrics <br />
                  Without Marina Markups
                </h3>
                <p className="text-xs font-mono font-bold text-sky-400">
                  FLAT RATE: £25 PER HOUR + MATERIALS
                </p>
                <p className="text-[10px] text-slate-300">
                  Covering Haslar, Gosport, Port Solent, Hamble &amp; Solent Boatyards
                </p>
              </div>

              {/* 3 Core Columns */}
              <div className="space-y-2.5 text-[11px] bg-slate-950/60 p-3.5 rounded-2xl border border-slate-800">
                <div>
                  <strong className="text-sky-300 block">1. Electrical Diagnostics &amp; Fault Finding</strong>
                  <span className="text-slate-400 text-[10px]">
                    Draining battery banks, alternator checks, bilge pumps, corroded wiring.
                  </span>
                </div>
                <div>
                  <strong className="text-sky-300 block">2. Lithium (LiFePO4) &amp; Solar Upgrades</strong>
                  <span className="text-slate-400 text-[10px]">
                    Victron DC-DC chargers, SmartShunts, solar arch arrays, split charging.
                  </span>
                </div>
                <div>
                  <strong className="text-sky-300 block">3. Replica/Custom Switch Panels (Acrylic &amp; Wood)</strong>
                  <span className="text-slate-400 text-[10px]">
                    Drop-in replica replacements for Westerly, Moody, Sadler yachts with Carling illuminated switches.
                  </span>
                </div>
              </div>

              {/* Footer with QR */}
              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-white">Anthony Wrather</p>
                  <p className="text-[10px] text-slate-400">Call / WhatsApp: 07700 900142</p>
                  <p className="text-[10px] text-slate-400">ajwmarine.co.uk</p>
                </div>
                <div className="w-12 h-12 bg-white rounded-lg p-1 flex items-center justify-center shrink-0">
                  <QrCode className="w-10 h-10 text-slate-900" />
                </div>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Standard A5 Noticeboard Format (148mm × 210mm)</span>
          </div>
        )}
      </div>
    </div>
  );
};
