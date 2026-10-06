import React from 'react';
import { WinGoBet } from '../../lib/types.ts';
import { formatINR } from '../../lib/formatters.ts';

interface WinGoMyBetsProps {
  bets: WinGoBet[];
}

export const WinGoMyBets: React.FC<WinGoMyBetsProps> = ({ bets }) => {
  if (!bets || bets.length === 0) {
    return (
      <div className="bg-[#0e1424]/60 border border-slate-800 rounded-2xl p-6 text-center text-slate-500 text-xs font-mono">
        No Win Go bets placed yet. Tap any color or number ball above to place a wager.
      </div>
    );
  }

  return (
    <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-display font-black text-white text-xs uppercase tracking-wider">
          My Win Go Bets
        </h4>
        <span className="text-[11px] text-amber-400/90 font-mono font-bold">
          {bets.length} Recorded
        </span>
      </div>

      <div className="space-y-2">
        {bets.slice(0, 15).map((bet) => {
          const isPending = bet.status === 'PENDING';
          const isWon = bet.status === 'WON';

          return (
            <div
              key={bet.id}
              className="p-2.5 rounded-xl bg-[#080d17] border border-slate-800/80 flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-black text-slate-200">
                    {bet.selection_value}
                  </span>
                  <span className="text-[10px] text-amber-400 font-mono">
                    ({bet.selection_type})
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                  Wager: <span className="font-mono-nums font-bold text-white">{formatINR(bet.stake_amount)}</span>
                </div>
              </div>

              <div className="text-right">
                <span
                  className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                    isPending
                      ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60 animate-pulse'
                      : isWon
                      ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {isPending ? 'PENDING' : isWon ? `WON (+${formatINR(bet.payout_amount)})` : 'LOST'}
                </span>
                <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                  {new Date(bet.created_at).toLocaleTimeString('en-IN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
