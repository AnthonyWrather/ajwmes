import React, { useState } from 'react';
import { 
  Wrench, 
  Sparkles, 
  BatteryCharging, 
  Sun, 
  Compass, 
  MapPin, 
  ArrowRight, 
  Zap, 
  ShieldCheck, 
  LifeBuoy, 
  CheckCircle2, 
  Clock, 
  Layers,
  Search,
  Hammer,
  ShoppingBag
} from 'lucide-react';

interface ServicesSectionProps {
  onSelectService: (serviceKey: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({ onSelectService }) => {
  const [activeFilter, setActiveFilter] = useState<'all' | 'budget' | 'upgrades'>('all');

  const services = [
    {
      id: 'diagnostic',
      category: 'budget',
      title: '12V Fault Finding & Parasitic Drain Check',
      subtitle: 'Trace Dead Batteries, Dim Lights & Ground Faults',
      desc: 'Battery flat after sitting for a few days? We use professional DC clamp meters and digital conductance testers to trace phantom draws, clean corroded earth busses, and repair intermittent faults without expensive unnecessary parts.',
      price: '£25 / hr · Typical check 1–2 hrs (£25–£50)',
      image: '/src/assets/images/budget_boat_wiring_clean_1791420126772.jpg',
      badge: 'Most Popular for Day Boats',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
      tags: ['Parasitic Drain Tracing', 'Battery State-of-Health', 'Corroded Busbars', 'Earth Faults']
    },
    {
      id: 'renovation',
      category: 'budget',
      title: 'Day Boat, Angler & Tender Electrics',
      subtitle: 'Practical Wiring for Skiffs, RIBs & Weekenders',
      desc: 'Clean, marine-grade installations of standalone fishfinders/depth sounders, auxiliary battery boxes with isolator switches, 12V USB charger sockets, LED deck worklights, and swing-mooring trickle solar kits.',
      price: '£25 / hr labor + trade price parts',
      image: '/src/assets/images/budget_small_cruiser_boat_1791420135992.jpg',
      badge: 'Budget-Friendly',
      badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500/30',
      tags: ['Fishfinder Installs', 'Mooring Solar Trickle', 'Auxiliary Battery Boxes', 'Deck Worklights']
    },
    {
      id: 'renovation_bilge',
      category: 'budget',
      title: 'Bilge Pump & Essential Safety Wiring',
      subtitle: 'Automatic Float Switches & Cockpit Alarms',
      desc: 'Rewiring unreliable bilge pumps with Rule SuperSwitch float switches, manual/auto/off helm override switches, high-water warning buzzers, and continuous unswitched fused power directly to your battery.',
      price: '£25 / hr · Typically 1.5–2 hrs labor',
      image: '/src/assets/images/hero_workspace_display_1791400165479.jpg',
      badge: 'Safety Essential',
      badgeColor: 'bg-amber-950 text-amber-300 border-amber-500/30',
      tags: ['Auto Float Switches', 'High-Water Buzzer', 'Tinned Marine Wire', 'Emergency Overrides']
    },
    {
      id: 'panels',
      category: 'upgrades',
      title: 'Replica/Custom Switch Panels',
      subtitle: 'Precision Marine Fabrication & Engraving',
      desc: 'Bespoke switchboards and exact drop-in replacements for Westerly, Moody, Sadler in 3mm matte black acrylic, white marine acrylic, or solid marine wood. Backlit circuit labels, push breakers, USB chargers, and digital voltmeters.',
      price: 'From £45 (Faceplate) · Full Pre-Wired Units',
      image: '/src/assets/images/marine_switch_panel_laser_1791400808406.jpg',
      badge: 'Workshop Crafted',
      badgeColor: 'bg-sky-950 text-sky-300 border-sky-500/30',
      tags: ['Westerly Replicas', 'Moody Drop-in', 'Carling Rockers', 'Custom Backlit Labels']
    },
    {
      id: 'lithium',
      category: 'upgrades',
      title: 'Lithium (LiFePO4) Conversions',
      subtitle: 'Safe High-Capacity Storage',
      desc: 'Upgrade tired lead-acid banks to lightweight LiFePO4. We install Victron Orion DC-DC chargers to protect engine alternator diodes, SmartShunts, and class-6 tinned copper battery links.',
      price: '£25 / hr labor + materials at wholesale trade rates',
      image: '/src/assets/images/marine_lithium_battery_bank_1791400821608.jpg',
      badge: 'High Performance',
      badgeColor: 'bg-sky-950 text-sky-300 border-sky-500/30',
      tags: ['Victron Energy', 'DC-DC Chargers', 'Alternator Protection', 'SmartShunt Bluetooth']
    },
    {
      id: 'solar',
      category: 'upgrades',
      title: 'Solar Arrays & Stern Arches',
      subtitle: 'Off-Grid Cruising Independence',
      desc: 'Design and wiring of rigid and semi-flexible solar panel arrays on coachroofs or stainless stern arches. Paired with ultra-fast Victron SmartSolar MPPT controllers.',
      price: 'Free sizing estimate · £25 / hr installation',
      image: '/src/assets/images/marine_solar_array_yacht_1791400831647.jpg',
      badge: 'Self Sufficiency',
      badgeColor: 'bg-sky-950 text-sky-300 border-sky-500/30',
      tags: ['Stern Arch Wiring', 'MPPT Controllers', 'Monocrystalline', 'Split Charging']
    },
    {
      id: 'navigation',
      category: 'upgrades',
      title: 'Navigation & NMEA 2000 Refits',
      subtitle: 'Glass Bridge Helm Electronics',
      desc: 'Installation of multifunction touch chartplotters, sonar transducers, radar domes, AIS transponders, VHF radios, and clean backbone network termination.',
      price: '£25 / hr labor + hardware',
      image: '/src/assets/images/marine_helm_navigation_1791400844235.jpg',
      badge: 'Electronics Refit',
      badgeColor: 'bg-sky-950 text-sky-300 border-sky-500/30',
      tags: ['NMEA 2000 Backbones', 'Chartplotters', 'Autopilots', 'AIS Transponders']
    }
  ];

  const filteredServices = services.filter(svc => {
    if (activeFilter === 'budget') return svc.category === 'budget';
    if (activeFilter === 'upgrades') return svc.category === 'upgrades';
    return true;
  });

  const budgetJobExamples = [
    {
      title: 'Parasitic Battery Drain Check',
      vessel: '20ft Fletcher Day Cruiser',
      problem: 'Starter battery went flat after 4 days moored without use.',
      solution: 'Used DC clamp meter to isolate stereo memory leakage and corroded isolator switch; fitted clean isolator + tested battery health.',
      hours: '1.5 hrs',
      labor: '£37.50',
      parts: '£18.00 (Isolator)',
      total: '£55.50'
    },
    {
      title: 'Automatic Bilge Pump Rewire',
      vessel: '22ft Colvic Seaworker Angler',
      problem: 'Bilge pump only ran manually at helm; float switch dead and corroded.',
      solution: 'Fitted Rule 800 GPH automatic float switch, direct battery fuse line & 3-way helm toggle (Auto/Off/Manual) with status LED.',
      hours: '2.0 hrs',
      labor: '£50.00',
      parts: '£38.00 (Float & wire)',
      total: '£88.00'
    },
    {
      title: 'Console "Birds-Nest" Fuse Tidy-Up',
      vessel: '26ft Westerly Centaur',
      problem: 'Decades of scotch-locks, twisted joints & intermittent navigation lights.',
      solution: 'Removed redundant wire spaghetti; installed 6-way Blue Sea blade fuse block with LED blown-fuse indicators and marine heat-shrink crimps.',
      hours: '2.5 hrs',
      labor: '£62.50',
      parts: '£28.00 (Fuse block)',
      total: '£90.50'
    },
    {
      title: 'Fishfinder / GPS Sounder Fitment',
      vessel: '17ft Warrior 165 Fishing Boat',
      problem: 'Owner bought new Garmin Striker, needed neat transducer mounting and power feed.',
      solution: 'Mounted transom bracket, routed cable through deck seal, and wired dedicated fused 12V supply to helm console.',
      hours: '2.0 hrs',
      labor: '£50.00',
      parts: '£12.00 (Sundries)',
      total: '£62.00'
    },
    {
      title: 'Single Switch / Gauge Repair',
      vessel: '28ft Moody Sailboat',
      problem: 'Cabin light switch and 12V voltmeter dead; boat owner thought whole panel had to be replaced.',
      solution: 'Kept original panel; popped out burnt switch and wired fresh Carling rocker & digital volt display at fraction of replacement cost.',
      hours: '1.0 hr',
      labor: '£25.00',
      parts: '£14.00 (Switch + meter)',
      total: '£39.00'
    },
    {
      title: 'Swing-Mooring Trickle Solar Setup',
      vessel: '19ft Hardy Pilot Family Cruiser',
      problem: 'No shore power on river mooring, batteries slowly discharging.',
      solution: 'Mounted 20W marine trickle solar panel with waterproof regulator to maintain both starter and leisure batteries year-round.',
      hours: '1.5 hrs',
      labor: '£37.50',
      parts: '£45.00 (Kit & cable)',
      total: '£82.50'
    }
  ];

  const marinas = [
    { name: 'Haslar Marina', location: 'Gosport', time: '5 mins' },
    { name: 'Gosport Marina', location: 'Mumby Road', time: '5 mins' },
    { name: 'Premier Marina', location: 'Gosport', time: '10 mins' },
    { name: 'Port Solent Marina', location: 'Portsmouth', time: '20 mins' },
    { name: 'Hamble Point & Warsash', location: 'River Hamble', time: '35 mins' },
    { name: 'Chichester Marina & Birdham', location: 'Chichester Harbour', time: '45 mins' },
    { name: 'Southampton Water & Hythe', location: 'Southampton', time: '40 mins' },
  ];

  return (
    <div className="w-full space-y-16">
      {/* Services Grid with Category Filter */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">
              Services &amp; Capabilities
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mt-1">
              Marine Electrics For Every Vessel &amp; Budget
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-xl">
              From 1-hour battery drain investigations on small day boats to full custom switchboards and lithium refits. Transparent £25/hr flat labor.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl text-xs shrink-0">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                activeFilter === 'all' 
                  ? 'bg-sky-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Services
            </button>
            <button
              onClick={() => setActiveFilter('budget')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeFilter === 'budget' 
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Budget &amp; Everyday 12V</span>
            </button>
            <button
              onClick={() => setActiveFilter('upgrades')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-colors flex items-center gap-1.5 ${
                activeFilter === 'upgrades' 
                  ? 'bg-sky-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-sky-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Panels &amp; Upgrades</span>
            </button>
          </div>
        </div>

        {/* Services Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.map(svc => (
            <div
              key={svc.id}
              onClick={() => {
                if (svc.id === 'panels') {
                  onSelectService('panels');
                } else if (svc.id.startsWith('renovation')) {
                  onSelectService('renovation');
                } else {
                  onSelectService(svc.id);
                }
              }}
              className="group bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden hover:border-sky-500/60 transition-all cursor-pointer flex flex-col justify-between"
            >
              <div className="relative aspect-16/9 bg-slate-950 overflow-hidden">
                <img
                  src={svc.image}
                  alt={svc.title}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />
                
                {/* Badge top-left */}
                <div className="absolute top-3 left-3">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${svc.badgeColor}`}>
                    {svc.badge}
                  </span>
                </div>

                {/* Pricing strip bottom */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-sky-400 bg-slate-950/90 px-2.5 py-1 rounded-lg border border-sky-500/30">
                    {svc.price}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold group-hover:text-sky-300 flex items-center gap-1 bg-slate-950/80 px-2 py-1 rounded-lg border border-slate-800">
                    <span>Book / Info</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-medium text-slate-400 block">{svc.subtitle}</span>
                  <h3 className="text-lg font-bold text-white group-hover:text-sky-300 transition-colors mt-0.5">
                    {svc.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-2">
                    {svc.desc}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-3 text-[11px] text-slate-400 border-t border-slate-800/80">
                  {svc.tags.map(tag => (
                    <span key={tag} className="bg-slate-950 px-2 py-0.5 rounded border border-slate-800 text-slate-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* NEW: Transparent Price Guide for Everyday / Budget Boat Owners */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
              <Zap className="w-4 h-4" />
              <span>Real Job Price Transparency</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Common Everyday Jobs &amp; Realistic Costs
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              No guesswork. Here is what typical small-to-medium electrical jobs actually cost at our flat £25/hour rate.
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-emerald-300 bg-emerald-950/70 border border-emerald-500/30 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
            Flat £25 / Hour · No Marina Markup
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetJobExamples.map(job => (
            <div 
              key={job.title}
              className="p-4 rounded-2xl bg-slate-950 border border-slate-800/90 flex flex-col justify-between hover:border-emerald-500/40 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold text-white">{job.title}</h4>
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 shrink-0">
                    {job.total}
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-sky-400">{job.vessel}</p>
                <div className="text-xs space-y-1.5 text-slate-300 pt-1">
                  <p><span className="text-slate-400 font-medium">Issue:</span> {job.problem}</p>
                  <p><span className="text-slate-400 font-medium">Fix:</span> {job.solution}</p>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <span>Labor: {job.hours} ({job.labor})</span>
                <span>Parts: {job.parts}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* "Repair Before Replace" & Budget Boater Pledge */}
      <div className="bg-gradient-to-r from-emerald-950/30 via-slate-900 to-sky-950/30 border border-emerald-500/20 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="max-w-2xl">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Our Budget Promise
          </span>
          <h3 className="text-xl sm:text-2xl font-bold text-white mt-1">
            "Repair First, Replace Second"
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
            Many boat owners get intimidated by big marina electrical firms quoting thousands of pounds to rip out entire dashboards. At AJW Marine, we test what you have first. If cleaning a terminal, fitting a new £8 breaker, or replacing an old fuse block gets you safely back on the water, that's exactly what we will do.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white">No Minimum Job Fee</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Need 1 hour to trace why your navigation light keeps blowing? You pay £25. No minimum job intimidation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white">Trade Price Parts</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Oceanflex tinned wire, marine heat shrink, Blue Sea fuse blocks &amp; switches passed on with zero marina markup.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white">All Boats Welcome</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Day cruisers, fishing skiffs, tender RIBs, classic Westerlys, canal boats, or liveaboard yachts.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <h4 className="text-xs font-bold text-white">Direct Chat &amp; Log</h4>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal">
              Every job and diagnostic test is logged in your client portal with photos so you have a complete boat history.
            </p>
          </div>
        </div>
      </div>

      {/* Workshop Stock Online Postal Store Banner */}
      <div className="bg-gradient-to-r from-sky-950/70 via-slate-900 to-slate-950 border border-sky-500/30 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-sky-400 bg-sky-950 border border-sky-500/30 px-3 py-1 rounded-full">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>DIY Boat Electrician? Workshop Stock Direct Dispatch</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Order Marine Tinned Cables &amp; Hardware Online
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Need 12 meters of 2.5mm² twin cable, an ST-blade fuse block, or a Victron SmartShunt for your own weekend project? We cut cable continuous to length and post Royal Mail Tracked / DPD direct to your door or marina pontoon.
          </p>
        </div>

        <button
          onClick={() => onSelectService('store')}
          className="px-6 py-3.5 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-sky-600/30 flex items-center justify-center gap-2 whitespace-nowrap self-start md:self-auto transition-transform active:scale-95"
        >
          <span>Browse Parts &amp; Cables Store</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Local Coverage Strip */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Gosport Base &amp; 1-Hour Travel Zone</h3>
              <p className="text-xs text-slate-400">Direct mobile van callout to marinas, swing moorings, boatyards &amp; driveways.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold text-sky-400 bg-sky-950 px-3 py-1 rounded-lg border border-sky-500/30">
            £25/hr · No Travel Surcharge within 1 hour
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-2">
          {marinas.map(m => (
            <div key={m.name} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 text-center">
              <p className="text-xs font-bold text-white truncate">{m.name}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{m.location}</p>
              <span className="text-[9px] font-mono text-sky-400 font-semibold mt-1 block">
                ~{m.time} away
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
