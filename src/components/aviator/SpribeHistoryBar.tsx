import React, { useState, useRef, useEffect } from 'react';
import { AviatorRecentCrash } from '../../lib/types.ts';
import { Clock, ChevronDown } from 'lucide-react';

interface SpribeHistoryBarProps {
  recentCrashes: AviatorRecentCrash[];
  onOpenDetailedHistory?: () => void;
}

export const SpribeHistoryBar: React.FC<SpribeHistoryBarProps> = ({
  recentCrashes,
  onOpenDetailedHistory,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isDropdownOpen]);

  const getTierClass = (mult: number) => {
    if (mult < 2.0) return 'tier-blue';
    if (mult < 10.0) return 'tier-purple';
    return 'tier-magenta';
  };

  // Seed with realistic Spribe history if empty
  const defaultHistory: AviatorRecentCrash[] = [
    { roundNumber: 1042, crashMultiplier: 2.55, crashedAt: '2026-10-07T12:00:00.000Z' },
    { roundNumber: 1041, crashMultiplier: 6.11, crashedAt: '2026-10-07T11:59:00.000Z' },
    { roundNumber: 1040, crashMultiplier: 18.33, crashedAt: '2026-10-07T11:58:00.000Z' },
    { roundNumber: 1039, crashMultiplier: 2.96, crashedAt: '2026-10-07T11:57:00.000Z' },
    { roundNumber: 1038, crashMultiplier: 4.31, crashedAt: '2026-10-07T11:56:00.000Z' },
    { roundNumber: 1037, crashMultiplier: 1.30, crashedAt: '2026-10-07T11:55:00.000Z' },
    { roundNumber: 1036, crashMultiplier: 1.08, crashedAt: '2026-10-07T11:54:00.000Z' },
    { roundNumber: 1035, crashMultiplier: 4.30, crashedAt: '2026-10-07T11:53:00.000Z' },
    { roundNumber: 1034, crashMultiplier: 1.03, crashedAt: '2026-10-07T11:52:00.000Z' },
    { roundNumber: 1033, crashMultiplier: 1.52, crashedAt: '2026-10-07T11:51:00.000Z' },
    { roundNumber: 1032, crashMultiplier: 1.19, crashedAt: '2026-10-07T11:50:00.000Z' },
    { roundNumber: 1031, crashMultiplier: 1.33, crashedAt: '2026-10-07T11:49:00.000Z' },
    { roundNumber: 1030, crashMultiplier: 12.51, crashedAt: '2026-10-07T11:48:00.000Z' },
    { roundNumber: 1029, crashMultiplier: 2.16, crashedAt: '2026-10-07T11:47:00.000Z' },
    { roundNumber: 1028, crashMultiplier: 1.34, crashedAt: '2026-10-07T11:46:00.000Z' },
    { roundNumber: 1027, crashMultiplier: 13.95, crashedAt: '2026-10-07T11:45:00.000Z' },
    { roundNumber: 1026, crashMultiplier: 2.13, crashedAt: '2026-10-07T11:44:00.000Z' },
  ];

  const list = recentCrashes && recentCrashes.length > 0 ? recentCrashes : defaultHistory;

  return (
    <div className="spribe-history-ribbon" ref={dropdownRef}>
      {/* Scrollable Horizontal Multiplier Badges */}
      <div className="spribe-history-scroll">
        {list.map((c, i) => {
          const tier = getTierClass(c.crashMultiplier);
          return (
            <div
              key={`${c.roundNumber}-${i}`}
              className={`spribe-mult-pill ${tier}`}
              title={`Round #${c.roundNumber} flew away @ ${c.crashMultiplier.toFixed(2)}x`}
              onClick={() => setIsDropdownOpen((prev) => !prev)}
            >
              {c.crashMultiplier.toFixed(2)}x
            </div>
          );
        })}
      </div>

      {/* History Dropdown Toggle Button */}
      <button
        onClick={() => setIsDropdownOpen((prev) => !prev)}
        className="spribe-history-dropdown-btn"
        title="Round History"
        aria-label="Round History"
      >
        <Clock className="w-3.5 h-3.5" />
      </button>

      {/* Detailed Round History Dropdown */}
      {isDropdownOpen && (
        <div className="absolute top-9 right-2 w-72 bg-[#1b1c1d] border border-[#2a2b2e] rounded-xl shadow-2xl z-50 p-3 max-h-80 overflow-y-auto">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#282a2e]">
            <span className="text-xs font-bold text-white uppercase tracking-wider">
              Round History
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Provably Fair
            </span>
          </div>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {list.map((c, i) => (
              <span
                key={i}
                className={`spribe-mult-pill ${getTierClass(c.crashMultiplier)}`}
              >
                {c.crashMultiplier.toFixed(2)}x
              </span>
            ))}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-[#282a2e] text-[11px]">
            <div className="text-[10px] text-slate-400 font-semibold mb-1">
              RECENT ROUND SEEDS
            </div>
            {list.slice(0, 5).map((c, i) => (
              <div
                key={i}
                className="p-1.5 bg-[#141516] rounded border border-slate-800 flex items-center justify-between font-mono"
              >
                <span className="text-slate-300">Round #{c.roundNumber}</span>
                <span className={`font-bold ${getTierClass(c.crashMultiplier) === 'tier-blue' ? 'text-sky-400' : getTierClass(c.crashMultiplier) === 'tier-purple' ? 'text-purple-400' : 'text-pink-400'}`}>
                  {c.crashMultiplier.toFixed(2)}x
                </span>
              </div>
            ))}
          </div>

          {onOpenDetailedHistory && (
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                onOpenDetailedHistory();
              }}
              className="w-full mt-2 py-1.5 bg-[#252528] hover:bg-[#2c2d30] text-xs font-bold text-slate-200 rounded-lg transition-colors text-center"
            >
              View Full Provably Fair Log
            </button>
          )}
        </div>
      )}
    </div>
  );
};
