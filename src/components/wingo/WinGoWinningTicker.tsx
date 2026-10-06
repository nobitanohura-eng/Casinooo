import React, { useEffect, useState } from 'react';
import { Volume2, Flame } from 'lucide-react';

interface IndianWinnerAlert {
  id: number;
  text: string;
}

const INDIAN_WINNERS: IndianWinnerAlert[] = [
  { id: 1, text: '🇮🇳 User 98***31 won ₹1,960.00 on Win Go (Green)' },
  { id: 2, text: '🇮🇳 User 76***14 cashed out 4.50x (₹2,250.00) on Aviator' },
  { id: 3, text: '🇮🇳 User 81***92 won ₹4,500.00 on Win Go (Violet)' },
  { id: 4, text: '🇮🇳 User 62***45 won ₹9,000.00 on Win Go (Number 7)' },
  { id: 5, text: '🇮🇳 User 91***33 won ₹1,960.00 on Win Go (Big)' },
  { id: 6, text: '🇮🇳 User 49***70 cashed out 14.80x (₹7,400.00) on Aviator' },
  { id: 7, text: '🇮🇳 User 33***19 won ₹1,960.00 on Win Go (Small)' },
  { id: 8, text: '🇮🇳 User 55***88 cashed out 6.20x (₹3,100.00) on Aviator' },
];

export const WinGoWinningTicker: React.FC = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % INDIAN_WINNERS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  const winner = INDIAN_WINNERS[index];

  return (
    <div className="w-full bg-[#0b101c] border border-slate-700/60 rounded-md px-2.5 py-1 flex items-center gap-2 shadow-sm overflow-hidden text-xs">
      <div className="flex items-center gap-1 text-amber-400 shrink-0">
        <Volume2 className="w-3.5 h-3.5 animate-pulse text-amber-400" />
        <span className="text-[9px] font-black uppercase tracking-wider font-casino-num text-amber-300">
          LIVE WINS
        </span>
      </div>

      <div className="h-4 overflow-hidden flex-1 relative">
        <div
          key={winner.id}
          className="flex items-center text-[11px] font-casino-num font-bold text-slate-200 animate-in slide-in-from-bottom duration-300 truncate"
        >
          <span className="truncate">{winner.text}</span>
        </div>
      </div>

      <div className="shrink-0 flex items-center gap-1">
        <Flame className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
      </div>
    </div>
  );
};
