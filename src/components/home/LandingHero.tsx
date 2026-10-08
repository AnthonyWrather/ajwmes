import React from 'react';
import { ArrowRight, Wrench, BatteryCharging, Sun, Compass, Sparkles, CheckCircle2, ShieldCheck, MapPin, ShoppingBag, Truck } from 'lucide-react';

interface LandingHeroProps {
  onOpenDesigner: () => void;
  onOpenQuote: () => void;
  onOpenReplica: () => void;
  onOpenStore?: () => void;
  onOpenTracker?: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onOpenDesigner,
  onOpenQuote,
  onOpenReplica,
  onOpenStore,
  onOpenTracker
}) => {
  return (
    <div className="w-full space-y-12">
      {/* Hero Banner with Nautical Ambient Glow */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900/60 p-6 sm:p-10 lg:p-14">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-300 bg-sky-950/80 border border-sky-500/30 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Gosport Based · From 16ft Day Boats &amp; Anglers to Offshore Cruisers · Solent Wide</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Reliable Marine Electrics For <br className="hidden sm:block" />
            <span className="text-sky-400">Every Boat &amp; Budget.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Whether you need 1 hour to trace a dead battery drain on a 20ft day-cruiser, a clean fuse-box rewire on an angling boat, a full lithium LiFePO4 refit, or you just want to <strong>order marine tinned cable cut to length &amp; parts online posted to your boat</strong>.
          </p>

          {/* Pricing Highlight Pill */}
          <div className="p-3.5 bg-slate-950/90 border border-sky-500/30 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-lg font-mono font-extrabold text-sky-400">£25 / Hour</span>
              <span className="text-slate-300 font-semibold">Flat Diagnostic &amp; Repair Rate · No Minimum Job Penalty</span>
            </div>
            <span className="text-[11px] text-slate-400">
              Budget-friendly fault finding &amp; repairs · Workshop stock postal dispatch · Itemized audit log
            </span>
          </div>

          {/* Dual Audience Quick Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div 
              onClick={onOpenQuote}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Budget &amp; Everyday Repairs</span>
                <span className="text-xs font-mono text-emerald-400">£25/hr</span>
              </div>
              <p className="text-sm font-bold text-white mt-1 group-hover:text-emerald-300 transition-colors">
                12V Fault Finding, Bilge Pumps &amp; Console Tidy-Ups
              </p>
              <p className="text-xs text-slate-400 mt-1">
                For day cruisers, fishing skiffs, weekenders &amp; tenders. Find parasitic battery drains, replace corroded fuse boxes, and repair before replacing.
              </p>
            </div>

            <div 
              onClick={onOpenStore || onOpenDesigner}
              className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-sky-500/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Online Store &amp; Dispatch</span>
                <span className="text-xs font-mono text-sky-400">In Stock</span>
              </div>
              <p className="text-sm font-bold text-white mt-1 group-hover:text-sky-300 transition-colors">
                Order Workshop Stock &amp; Marine Cables by Post
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Oceanflex tinned cables cut to the exact meter, blade fuse blocks, Carling switches, busbars &amp; Victron hardware posted direct to your home or marina.
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <button
              onClick={onOpenQuote}
              className="px-5 py-3 text-sm font-semibold bg-sky-600 hover:bg-sky-500 active:scale-95 text-white rounded-xl shadow-lg shadow-sky-600/30 transition-all flex items-center gap-2"
            >
              <span>Request Diagnostic / Quote</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onOpenStore && (
              <button
                onClick={onOpenStore}
                className="px-5 py-3 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-sky-300 hover:text-white rounded-xl border border-sky-500/30 transition-all flex items-center gap-2 shadow-sm"
              >
                <ShoppingBag className="w-4 h-4 text-sky-400" />
                <span>Shop Workshop Parts Online</span>
              </button>
            )}

            {onOpenTracker && (
              <button
                onClick={onOpenTracker}
                className="px-4 py-3 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all flex items-center gap-2"
              >
                <Truck className="w-4 h-4 text-sky-400" />
                <span>Track Postal Order</span>
              </button>
            )}

            <button
              onClick={onOpenDesigner}
              className="px-5 py-3 text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl border border-slate-700/80 transition-all flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-sky-400" />
              <span>Design Switch Panel Online</span>
            </button>

            <button
              onClick={onOpenReplica}
              className="px-5 py-3 text-sm font-semibold bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl border border-slate-800 transition-all"
            >
              <span>Replica Replacement Panels</span>
            </button>
          </div>

          {/* Trust points */}
          <div className="pt-6 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>ISO &amp; ABYC Marine Wiring</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>In-House Laser Engraver</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Recorded Job Discussions</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Free PWA Phone App</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
