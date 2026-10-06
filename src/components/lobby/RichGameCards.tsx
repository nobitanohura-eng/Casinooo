import React from 'react';
import { GameModule } from '../layout/GameSelector.tsx';
import { soundManager } from '../../lib/sound.ts';
import { Plane, Sparkles, Flame, Clock } from 'lucide-react';

interface RichGameCardsProps {
  activeGame: GameModule;
  onSelectGame: (game: GameModule) => void;
  winGoStatusText: string;
  aviatorStatusText: string;
}

export const RichGameCards: React.FC<RichGameCardsProps> = ({
  activeGame,
  onSelectGame,
  winGoStatusText,
  aviatorStatusText,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2.5 px-3 py-1">
      {/* 1. Win Go Rich 3D Card (Deep Royal Purple with 3D Glossy Bursting Lottery Balls 1, 5, 8) */}
      <button
        onClick={() => {
          soundManager.play('chip');
          onSelectGame('wingo');
        }}
        className={`relative overflow-hidden rounded-2xl p-3 text-left transition-all tap-highlight-none border-2 ${
          activeGame === 'wingo'
            ? 'bg-gradient-to-br from-[#360d5e] via-[#4d1482] to-[#1c0733] border-amber-400 shadow-[0_0_22px_rgba(245,158,11,0.35)] scale-[1.01]'
            : 'bg-gradient-to-br from-[#22093d] via-[#2f0e52] to-[#140524] border-purple-800/60 opacity-85 hover:opacity-100 hover:border-purple-600/60'
        }`}
      >
        {/* Subtle Ambient Sheen */}
        <div className="absolute -top-10 -left-10 w-28 h-28 bg-purple-500/20 rounded-full blur-xl pointer-events-none" />

        {/* Header Ribbon / Status Pill */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-casino-num font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" />
            <span>PARITY LOTTERY</span>
          </span>

          {activeGame === 'wingo' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse" />
          )}
        </div>

        {/* Title */}
        <div className="relative z-10 space-y-0.5">
          <h3 className="font-casino-num font-black text-base sm:text-lg text-white leading-tight drop-shadow tracking-tight flex items-center gap-1">
            <span>WinGo</span>
            <span className="text-amber-400 text-xs sm:text-sm">1 Mins</span>
          </h3>
          <p className="text-[10px] text-purple-200/90 font-medium font-casino-num">
            Colors • Numbers • Big/Small
          </p>
        </div>

        {/* 3D Bursting Glossy Lottery Balls (1, 5, 8) */}
        <div className="relative h-14 mt-2 flex items-center justify-end pr-1">
          {/* Ball 1: Green 3D Sphere */}
          <div className="absolute right-12 bottom-1 w-9 h-9 rounded-full bg-[radial-gradient(circle_at_35%_25%,#34d399,#059669_55%,#064e3b)] border border-emerald-300 shadow-[0_4px_8px_rgba(0,0,0,0.7)] flex items-center justify-center font-casino-num font-black text-sm text-white transform -rotate-12 hover:scale-110 transition-transform">
            <div className="absolute top-1 left-2 w-2 h-1 bg-white/60 rounded-full blur-[0.2px]" />
            1
          </div>

          {/* Ball 5: Split Green/Violet 3D Sphere */}
          <div className="absolute right-6 top-0 w-10 h-10 rounded-full bg-[linear-gradient(135deg,#059669_50%,#8b5cf6_50%)] border border-white/50 shadow-[0_6px_12px_rgba(0,0,0,0.8)] flex items-center justify-center font-casino-num font-black text-base text-white z-10 transform rotate-6 hover:scale-110 transition-transform">
            <div className="absolute top-1.5 left-2.5 w-2.5 h-1.5 bg-white/60 rounded-full blur-[0.2px]" />
            5
          </div>

          {/* Ball 8: Red 3D Sphere Bursting Out */}
          <div className="absolute right-0 bottom-0 w-9 h-9 rounded-full bg-[radial-gradient(circle_at_35%_25%,#fb7185,#e11d48_55%,#881337)] border border-rose-300 shadow-[0_4px_8px_rgba(0,0,0,0.7)] flex items-center justify-center font-casino-num font-black text-sm text-white transform rotate-12 hover:scale-110 transition-transform">
            <div className="absolute top-1 left-2 w-2 h-1 bg-white/60 rounded-full blur-[0.2px]" />
            8
          </div>
        </div>

        {/* Live Period & Countdown Status Bar */}
        <div className="mt-2 pt-2 border-t border-purple-800/60 flex items-center justify-between text-[10px] font-casino-num">
          <span className="text-slate-300 flex items-center gap-1 font-bold">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>{winGoStatusText}</span>
          </span>
          <span className="text-amber-400 font-black">
            PLAY &gt;
          </span>
        </div>
      </button>

      {/* 2. Aviator Rich 3D Card (Deep Crimson-Slate with Climbing Red Aircraft & Smoke Trails) */}
      <button
        onClick={() => {
          soundManager.play('chip');
          onSelectGame('aviator');
        }}
        className={`relative overflow-hidden rounded-2xl p-3 text-left transition-all tap-highlight-none border-2 ${
          activeGame === 'aviator'
            ? 'bg-gradient-to-br from-[#420e1b] via-[#5c1426] to-[#1c060c] border-rose-500 shadow-[0_0_22px_rgba(244,63,94,0.35)] scale-[1.01]'
            : 'bg-gradient-to-br from-[#270911] via-[#380e19] to-[#120306] border-rose-950/80 opacity-85 hover:opacity-100 hover:border-rose-800/60'
        }`}
      >
        {/* Subtle Ambient Sheen */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-rose-500/20 rounded-full blur-xl pointer-events-none" />

        {/* Header Ribbon / Status Pill */}
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-300 font-casino-num font-black text-[9px] uppercase tracking-wider flex items-center gap-1">
            <Flame className="w-2.5 h-2.5 text-rose-400" />
            <span>CRASH MULTIPLIER</span>
          </span>

          {activeGame === 'aviator' && (
            <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_8px_#f43f5e] animate-pulse" />
          )}
        </div>

        {/* Title */}
        <div className="relative z-10 space-y-0.5">
          <h3 className="font-casino-num font-black text-base sm:text-lg text-white leading-tight drop-shadow tracking-tight flex items-center gap-1">
            <span>Aviator</span>
            <span className="text-rose-400 text-xs sm:text-sm">Flight</span>
          </h3>
          <p className="text-[10px] text-rose-200/90 font-medium font-casino-num">
            High Altitude Trajectory
          </p>
        </div>

        {/* 3D Climbing Red Monoplane with Smoke & Flame Trails */}
        <div className="relative h-14 mt-2 flex items-center justify-end pr-2 overflow-hidden">
          {/* Curved Smoke Trail Arc */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 50">
            <path
              d="M 10 45 Q 40 40, 75 18"
              fill="none"
              stroke="rgba(244,63,94,0.3)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d="M 10 45 Q 40 40, 75 18"
              fill="none"
              stroke="#fb7185"
              strokeWidth="2"
              strokeDasharray="4 2"
              strokeLinecap="round"
            />
          </svg>

          {/* 3D Red Climbing Monoplane */}
          <div className="relative z-10 transform -rotate-12 translate-y-[-2px] hover:scale-110 transition-transform">
            <div className="relative w-12 h-10 flex items-center justify-center">
              <Plane className="w-10 h-10 text-rose-500 fill-rose-600 filter drop-shadow-[0_4px_8px_rgba(225,29,72,0.8)]" />
              {/* Flame Jet Particle at Exhaust */}
              <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b] animate-ping" />
            </div>
          </div>
        </div>

        {/* Live Multiplier Status Bar */}
        <div className="mt-2 pt-2 border-t border-rose-900/60 flex items-center justify-between text-[10px] font-casino-num">
          <span className="text-slate-300 flex items-center gap-1 font-bold">
            <Flame className="w-3 h-3 text-rose-400" />
            <span>{aviatorStatusText}</span>
          </span>
          <span className="text-rose-400 font-black">
            FLY &gt;
          </span>
        </div>
      </button>
    </div>
  );
};
