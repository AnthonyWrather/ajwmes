import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showSubtitle = true }) => {
  const iconSize = size === 'sm' ? 28 : size === 'lg' ? 44 : 36;
  const textSize = size === 'sm' ? 'text-base' : size === 'lg' ? 'text-2xl' : 'text-lg';

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Anchor-Bolt Geometric Mark */}
      <div 
        style={{ width: iconSize, height: iconSize }}
        className="shrink-0 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-sky-500/40 p-1 flex items-center justify-center shadow-md shadow-sky-950/40"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full">
          {/* Ring */}
          <circle cx="50" cy="22" r="8" fill="none" stroke="#38BDF8" strokeWidth="4" />
          {/* Crossbar */}
          <line x1="28" y1="36" x2="72" y2="36" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
          <circle cx="28" cy="36" r="3" fill="#38BDF8" />
          <circle cx="72" cy="36" r="3" fill="#38BDF8" />
          {/* Electric Lightning Shank */}
          <path d="M 54 32 L 44 52 L 55 52 L 46 76" fill="none" stroke="#38BDF8" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          {/* Flukes / Curved arms */}
          <path d="M 22 64 C 26 84, 74 84, 78 64" fill="none" stroke="#0284C7" strokeWidth="4.5" strokeLinecap="round" />
          {/* Tips */}
          <polygon points="22,64 16,69 25,70" fill="#38BDF8" />
          <polygon points="78,64 84,69 75,70" fill="#38BDF8" />
          {/* Base crown */}
          <circle cx="50" cy="83" r="3" fill="#38BDF8" />
        </svg>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span className={`font-extrabold tracking-tight text-white font-mono ${textSize}`}>
            AJWMES
          </span>
          <span className="text-[10px] uppercase font-bold text-sky-400 bg-sky-950/80 border border-sky-500/30 px-1.5 py-0.5 rounded tracking-wider">
            Marine
          </span>
        </div>
        {showSubtitle && (
          <span className="text-[10px] text-slate-400 font-medium tracking-tight mt-0.5">
            Electrical Services · Gosport & Solent
          </span>
        )}
      </div>
    </div>
  );
};
