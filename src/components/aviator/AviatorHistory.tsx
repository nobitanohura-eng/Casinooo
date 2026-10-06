import React from 'react';
import { AviatorRecentCrash } from '../../lib/types.ts';

interface AviatorHistoryProps {
  recentCrashes: AviatorRecentCrash[];
}

export const AviatorHistory: React.FC<AviatorHistoryProps> = ({ recentCrashes }) => {
  if (!recentCrashes || recentCrashes.length === 0) {
    return null;
  }

  const getMultiplierStyle = (mult: number) => {
    if (mult >= 10.0) {
      // 10.00x+: Glowing Gold / Neon Magenta
      return 'bg-gradient-to-r from-amber-950 to-fuchsia-950 text-amber-300 border-amber-400/80 shadow-[0_0_8px_rgba(245,158,11,0.35)] font-black animate-pulse';
    }
    if (mult >= 2.0) {
      // 2.00x - 9.99x: Vibrant Electric Purple
      return 'bg-purple-950/90 text-purple-300 border-purple-500/50 shadow-[0_0_6px_rgba(168,85,247,0.2)] font-black';
    }
    // 1.00x - 1.99x: Soft Slate Blue
    return 'bg-slate-900 text-sky-300 border-sky-500/30 font-bold';
  };

  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-1.5 px-0.5 min-w-max">
        {recentCrashes.slice(0, 16).map((crash, idx) => (
          <div
            key={idx}
            className={`px-2 py-0.5 rounded-md border text-[11px] font-casino-num tracking-tight ${getMultiplierStyle(
              crash.crashMultiplier
            )}`}
          >
            {crash.crashMultiplier.toFixed(2)}x
          </div>
        ))}
      </div>
    </div>
  );
};
