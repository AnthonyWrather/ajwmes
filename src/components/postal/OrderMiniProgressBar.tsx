import React from 'react';
import { PostalOrder } from '../../types';
import { getStatusTier } from '../../utils/postalTimeline';
import { Check, Clock, Package, Truck, CheckCircle2 } from 'lucide-react';

interface OrderMiniProgressBarProps {
  order: PostalOrder;
  className?: string;
}

export const OrderMiniProgressBar: React.FC<OrderMiniProgressBarProps> = ({ order, className = '' }) => {
  const currentTier = getStatusTier(order.orderStatus);

  const stages = [
    { label: 'Received', icon: Clock },
    { label: 'Packed', icon: Package },
    { label: 'Dispatched', icon: Truck },
    { label: 'Delivered', icon: CheckCircle2 }
  ];

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* 4-Step Stepper Bar */}
      <div className="flex items-center justify-between relative">
        {/* Background track line */}
        <div className="absolute left-2.5 right-2.5 top-1/2 -translate-y-1/2 h-0.5 bg-slate-800 -z-0" />
        {/* Active progress fill */}
        <div 
          className="absolute left-2.5 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-sky-500 to-emerald-400 transition-all duration-500 -z-0"
          style={{ width: `${(currentTier / 3) * 100}%` }}
        />

        {stages.map((stage, idx) => {
          const isDone = idx < currentTier;
          const isCurrent = idx === currentTier;
          const isUpcoming = idx > currentTier;

          return (
            <div key={stage.label} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isDone
                    ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-slate-950'
                    : isCurrent
                    ? 'bg-sky-500 text-white ring-2 ring-sky-400/50 shadow-md animate-pulse'
                    : 'bg-slate-900 text-slate-500 border border-slate-700/80'
                }`}
                title={`${stage.label}: ${isDone ? 'Completed' : isCurrent ? 'In Progress' : 'Pending'}`}
              >
                {isDone ? (
                  <Check className="w-3 h-3 stroke-[3]" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage labels */}
      <div className="flex justify-between text-[9px] font-mono text-slate-400 px-0.5">
        <span className={currentTier >= 0 ? 'text-sky-300 font-semibold' : 'text-slate-500'}>Received</span>
        <span className={currentTier >= 1 ? 'text-sky-300 font-semibold' : 'text-slate-500'}>Packed</span>
        <span className={currentTier >= 2 ? 'text-indigo-300 font-semibold' : 'text-slate-500'}>Dispatched</span>
        <span className={currentTier >= 3 ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>Delivered</span>
      </div>
    </div>
  );
};
