import React from 'react';
import { WinGoRoundSummary } from '../../lib/types.ts';

interface WinGoTrendChartProps {
  history: WinGoRoundSummary[];
}

export const WinGoTrendChart: React.FC<WinGoTrendChartProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs">
        No settled trend data available yet.
      </div>
    );
  }

  // Calculate statistics across history
  const total = history.length;
  const redCount = history.filter(
    (h) => h.colorDisplay === 'RED' || h.colorDisplay === 'RED_VIOLET'
  ).length;
  const greenCount = history.filter(
    (h) => h.colorDisplay === 'GREEN' || h.colorDisplay === 'GREEN_VIOLET'
  ).length;
  const violetCount = history.filter(
    (h) => h.colorDisplay === 'RED_VIOLET' || h.colorDisplay === 'GREEN_VIOLET'
  ).length;
  const bigCount = history.filter((h) => h.size === 'BIG').length;
  const smallCount = history.filter((h) => h.size === 'SMALL').length;

  return (
    <div className="bg-[#0e1424] border border-slate-800/90 rounded-2xl p-3 shadow-xl space-y-3">
      {/* 1. Statistics Pill Row */}
      <div className="grid grid-cols-5 gap-1.5 text-center text-[10px] font-mono">
        <div className="bg-rose-950/70 border border-rose-800/60 rounded-lg p-1.5">
          <span className="text-rose-300 font-bold block">RED</span>
          <span className="font-mono-nums font-black text-white text-xs">{redCount}</span>
        </div>
        <div className="bg-emerald-950/70 border border-emerald-800/60 rounded-lg p-1.5">
          <span className="text-emerald-300 font-bold block">GREEN</span>
          <span className="font-mono-nums font-black text-white text-xs">{greenCount}</span>
        </div>
        <div className="bg-violet-950/70 border border-violet-800/60 rounded-lg p-1.5">
          <span className="text-violet-300 font-bold block">VIOLET</span>
          <span className="font-mono-nums font-black text-white text-xs">{violetCount}</span>
        </div>
        <div className="bg-amber-950/70 border border-amber-800/60 rounded-lg p-1.5">
          <span className="text-amber-300 font-bold block">BIG</span>
          <span className="font-mono-nums font-black text-white text-xs">{bigCount}</span>
        </div>
        <div className="bg-blue-950/70 border border-blue-800/60 rounded-lg p-1.5">
          <span className="text-blue-300 font-bold block">SMALL</span>
          <span className="font-mono-nums font-black text-white text-xs">{smallCount}</span>
        </div>
      </div>

      {/* 2. Number Matrix Trend Table */}
      <div className="overflow-x-auto pb-1">
        <table className="w-full text-center text-[10px] font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="py-1.5 px-1 text-left font-semibold">Period</th>
              <th className="py-1.5 px-0.5">Num</th>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                <th key={n} className="py-1.5 px-0.5 w-6 font-bold text-slate-300">
                  {n}
                </th>
              ))}
              <th className="py-1.5 px-1 font-semibold">B/S</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {history.slice(0, 15).map((row) => (
              <tr key={row.roundId} className="hover:bg-slate-800/30 transition-colors">
                {/* Period */}
                <td className="py-1.5 px-1 text-left text-slate-400 font-medium whitespace-nowrap">
                  {String(row.periodNumber).slice(-4)}
                </td>

                {/* Outcome Num */}
                <td className="py-1.5 px-0.5 font-bold text-amber-400">
                  {row.number}
                </td>

                {/* 0-9 Matrix Columns */}
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                  const isHit = row.number === n;
                  if (!isHit) {
                    return (
                      <td key={n} className="py-1.5 px-0.5 text-slate-600">
                        {n}
                      </td>
                    );
                  }

                  // 3D glossy hit ball
                  let ballBg = 'bg-[radial-gradient(circle_at_35%_25%,#34d399,#059669_50%,#064e3b)]'; // green default
                  if (n === 0) {
                    ballBg = 'bg-[linear-gradient(135deg,#e11d48_50%,#8b5cf6_50%)]';
                  } else if (n === 5) {
                    ballBg = 'bg-[linear-gradient(135deg,#059669_50%,#8b5cf6_50%)]';
                  } else if (n % 2 === 0) {
                    ballBg = 'bg-[radial-gradient(circle_at_35%_25%,#fb7185,#e11d48_50%,#881337)]';
                  }

                  return (
                    <td key={n} className="py-1.5 px-0.5">
                      <div
                        className={`w-5 h-5 mx-auto rounded-full ${ballBg} text-white font-bold text-[10px] flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.6)] border border-white/20`}
                      >
                        {n}
                      </div>
                    </td>
                  );
                })}

                {/* Big / Small */}
                <td className="py-1.5 px-1 font-bold">
                  <span
                    className={
                      row.size === 'BIG' ? 'text-amber-400' : 'text-blue-400'
                    }
                  >
                    {row.size === 'BIG' ? 'B' : 'S'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
