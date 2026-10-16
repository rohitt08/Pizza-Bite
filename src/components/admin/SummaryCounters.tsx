import React from 'react';
import { Clock, ChefHat, CheckCircle2 } from 'lucide-react';

interface SummaryCountersProps {
  newCount: number;
  acceptedCount: number;
  completedCount: number;
  activeFilter?: string;
  onSelectFilter?: (filter: string) => void;
}

export const SummaryCounters: React.FC<SummaryCountersProps> = ({
  newCount,
  acceptedCount,
  completedCount,
}) => {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {/* 1. New Orders Counter (Amber) */}
      <div className="bg-stone-900 border border-amber-500/30 rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            <span>New Orders</span>
          </span>
          {newCount > 0 && (
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
          )}
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-2xl sm:text-4xl font-black text-amber-300 tracking-tight font-mono">
            {newCount}
          </span>
        </div>
      </div>

      <div className="bg-stone-900 border border-sky-500/30 rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
            <ChefHat className="w-3.5 h-3.5" />
            <span>Preparing</span>
          </span>
        </div>
        <div className="mt-1.5">
          <span className="text-2xl sm:text-4xl font-black text-sky-300 tracking-tight font-mono">{acceptedCount}</span>
        </div>
      </div>

      {/* 2. Completed Today Counter (Green) */}
      <div className="bg-stone-900 border border-emerald-500/30 rounded-2xl p-3.5 sm:p-4 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none"></div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Completed</span>
          </span>
        </div>
        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-2xl sm:text-4xl font-black text-emerald-300 tracking-tight font-mono">
            {completedCount}
          </span>
        </div>
      </div>
    </div>
  );
};
