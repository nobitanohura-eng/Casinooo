import React from 'react';
import { WinGoRoundSummary } from '../../lib/types.ts';

interface WinGoRecentHistoryProps {
  history: WinGoRoundSummary[];
}

export const WinGoRecentHistory: React.FC<WinGoRecentHistoryProps> = ({ history }) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-4 text-center text-slate-500 text-xs font-casino-num">
        No settled rounds recorded yet.
      </div>
    );
  }

  // 3D glossy lottery ball renderer for the number column
  const renderNumberBall = (num: number) => {
    let ballGradient = 'bg-[radial-gradient(circle_at_35%_25%,#34d399,#059669_55%,#064e3b)]'; // Green default

    if (num === 0) {
      ballGradient = 'bg-[linear-gradient(135deg,#e11d48_50%,#8b5cf6_50%)]';
    } else if (num === 5) {
      ballGradient = 'bg-[linear-gradient(135deg,#059669_50%,#8b5cf6_50%)]';
    } else if (num % 2 === 0) {
      ballGradient = 'bg-[radial-gradient(circle_at_35%_25%,#fb7185,#e11d48_55%,#881337)]';
    }

    return (
      <div
        className={`w-6 h-6 rounded-full ${ballGradient} text-white font-casino-num font-black text-xs flex items-center justify-center shadow-[0_2px_4px_rgba(0,0,0,0.6)] border border-white/25`}
      >
        <span className="drop-shadow-sm">{num}</span>
      </div>
    );
  };

  // Small glowing circular dot renderer (with split dots for 0 and 5)
  const renderColorIndicator = (num: number, _colorDisplay: string) => {
    if (num === 0) {
      return (
        <div className="flex items-center gap-1.5 justify-end">
          <div
            className="w-3.5 h-3.5 rounded-full bg-[linear-gradient(135deg,#e11d48_50%,#8b5cf6_50%)] shadow-[0_0_8px_rgba(225,29,72,0.7)] border border-white/30"
            title="Red + Violet"
          />
          <span className="text-[11px] font-bold text-rose-300 font-casino-num">Red+V</span>
        </div>
      );
    }
    if (num === 5) {
      return (
        <div className="flex items-center gap-1.5 justify-end">
          <div
            className="w-3.5 h-3.5 rounded-full bg-[linear-gradient(135deg,#059669_50%,#8b5cf6_50%)] shadow-[0_0_8px_rgba(16,185,129,0.7)] border border-white/30"
            title="Green + Violet"
          />
          <span className="text-[11px] font-bold text-emerald-300 font-casino-num">Green+V</span>
        </div>
      );
    }

    const isRed = num % 2 === 0;
    return (
      <div className="flex items-center gap-1.5 justify-end">
        <div
          className={`w-3.5 h-3.5 rounded-full border border-white/30 ${
            isRed
              ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
              : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
          }`}
        />
        <span
          className={`text-[11px] font-bold font-casino-num ${
            isRed ? 'text-rose-400' : 'text-emerald-400'
          }`}
        >
          {isRed ? 'Red' : 'Green'}
        </span>
      </div>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs font-casino-num">
        <thead>
          <tr className="border-b border-slate-800 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <th className="py-1.5 px-2">Period</th>
            <th className="py-1.5 px-2 text-center">Number</th>
            <th className="py-1.5 px-2 text-center">Big/Small</th>
            <th className="py-1.5 px-2 text-right">Color</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {history.slice(0, 10).map((row) => (
            <tr key={row.roundId} className="hover:bg-slate-800/20 transition-colors">
              {/* Period */}
              <td className="py-1.5 px-2 text-slate-300 font-bold">
                {String(row.periodNumber).slice(-4)}
              </td>

              {/* Number as 3D ball */}
              <td className="py-1.5 px-2 flex justify-center">
                {renderNumberBall(row.number)}
              </td>

              {/* Big / Small Badge */}
              <td className="py-1.5 px-2 text-center">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-black uppercase font-casino-num ${
                    row.size === 'BIG'
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                      : 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                  }`}
                >
                  {row.size}
                </span>
              </td>

              {/* Color indicator dot */}
              <td className="py-1.5 px-2 text-right">
                {renderColorIndicator(row.number, row.colorDisplay)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
