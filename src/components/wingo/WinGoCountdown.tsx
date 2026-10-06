import React from 'react';

interface WinGoCountdownProps {
  periodNumber: number;
  remainingSeconds: number;
  status: 'OPEN' | 'LOCKED' | 'SETTLING' | 'SETTLED';
  totalCycleSeconds: number;
  betLockSeconds: number;
}

export const WinGoCountdown: React.FC<WinGoCountdownProps> = ({
  periodNumber,
  remainingSeconds,
  status,
  betLockSeconds,
}) => {
  const isLocked = remainingSeconds <= betLockSeconds || status === 'LOCKED';
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const locksInSec = Math.max(0, remainingSeconds - betLockSeconds);

  return (
    <div className="h-11 px-3 bg-[#0d1320]/80 backdrop-blur-md border border-slate-700/60 rounded-lg flex items-center justify-between shadow-sm">
      {/* Left: Period number with subtle pulsing dot */}
      <div className="flex items-center gap-2">
        <span
          className={`w-2 h-2 rounded-full ${
            isLocked ? 'bg-rose-500 shadow-[0_0_6px_#f43f5e]' : 'bg-emerald-400 shadow-[0_0_6px_#34d399] animate-pulse'
          }`}
        />
        <span className="font-casino-num font-black text-xs text-amber-300 tracking-tight">
          #{periodNumber || '202610061219'}
        </span>
      </div>

      {/* Right: High-contrast condensed timer countdown with inline lock info */}
      <div className="flex items-center gap-2.5">
        <span className="text-[10px] text-slate-400 font-casino-num font-bold">
          {isLocked ? 'Settling' : `Locks in ${locksInSec}s`}
        </span>
        <div className="flex items-center gap-1 bg-[#060910] border border-slate-800 px-2 py-0.5 rounded">
          <span className="text-xs">⏱️</span>
          <span
            className={`font-casino-num font-black text-sm tracking-tight leading-none ${
              isLocked ? 'text-rose-400 animate-pulse' : 'text-white'
            }`}
          >
            {formattedTime}
          </span>
        </div>
      </div>
    </div>
  );
};
