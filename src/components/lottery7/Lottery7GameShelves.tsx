import React from 'react';
import { Flame, Dices, Plane, Sparkles, ChevronRight, PlusCircle, Play, ShieldCheck, Zap, Lock } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';

interface Lottery7GameShelvesProps {
  onSelectGame: (game: 'aviator' | 'wingo') => void;
  winGoStatusText?: string;
  aviatorStatusText?: string;
  activeCategory?: string;
  onOpenComingSoon: (gameTitle: string, gameCategory: string) => void;
  onOpenAddToDesktop: () => void;
}

export const Lottery7GameShelves: React.FC<Lottery7GameShelvesProps> = ({
  onSelectGame,
  winGoStatusText = '60s Cycle',
  aviatorStatusText = 'Flying Live',
  activeCategory = 'popular',
  onOpenComingSoon,
  onOpenAddToDesktop,
}) => {
  return (
    <div className="space-y-4">
      {/* =========================================================================
          LEAD HERO SECTION: OUR 2 CERTIFIED WORKING FLAGSHIP GAMES (APEX SIGNATURE)
          ========================================================================= */}
      <div className="bg-white rounded-2xl p-3 shadow-md border border-slate-100">
        <div className="flex items-center justify-between mb-2.5 px-0.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 font-casino-num flex items-center gap-1">
              <span>Apex Live Flagship Games</span>
            </h2>
          </div>
          <span className="text-[10px] bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
            2 Games Active Now
          </span>
        </div>

        {/* 2 Big High-Impact Lead Game Banners */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* LEAD 1: SPRIBE AVIATOR CRASH */}
          <div
            onClick={() => {
              soundManager.play('click');
              onSelectGame('aviator');
            }}
            className="group relative cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-[#121315] via-[#1a1b1e] to-[#0c0d0e] p-3 text-white border border-rose-500/30 shadow-lg hover:border-rose-500/60 transition-all active:scale-[0.99]"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-rose-600/20 rounded-full blur-2xl group-hover:bg-rose-600/35 transition-all" />

            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-rose-500 text-white">
                    LIVE CRASH
                  </span>
                  <span className="text-[9px] font-bold text-amber-400 font-casino-num">
                    97% RTP
                  </span>
                </div>
                <h3 className="text-base font-black tracking-wide font-casino-num text-white group-hover:text-rose-400 transition-colors">
                  AVIATOR
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  Spribe Provably Fair Flight
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-rose-500/30 text-rose-300 text-[10px] font-bold font-casino-num">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>{aviatorStatusText}</span>
                </div>
              </div>

              {/* Red Airplane Artwork */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <img
                  src="/assets/lottery7/game-aviator.png"
                  alt="Aviator"
                  className="w-full h-full object-contain group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300 drop-shadow-[0_4px_10px_rgba(244,63,94,0.4)]"
                />
              </div>
            </div>

            {/* Launch CTA Strip */}
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-300 group-hover:text-white transition-colors">
                Instant Cash Out • Play Now
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 text-white text-[10px] font-black flex items-center gap-1 shadow-sm">
                <span>LAUNCH</span>
                <Play className="w-2.5 h-2.5 fill-white" />
              </span>
            </div>
          </div>

          {/* LEAD 2: WIN GO 1MIN LOTTERY */}
          <div
            onClick={() => {
              soundManager.play('click');
              onSelectGame('wingo');
            }}
            className="group relative cursor-pointer overflow-hidden rounded-xl bg-gradient-to-br from-[#0c1424] via-[#101b33] to-[#070e1c] p-3 text-white border border-emerald-500/30 shadow-lg hover:border-emerald-500/60 transition-all active:scale-[0.99]"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-10 -right-10 w-28 h-28 bg-emerald-600/20 rounded-full blur-2xl group-hover:bg-emerald-600/35 transition-all" />

            <div className="relative z-10 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500 text-slate-950 font-bold">
                    60S PARITY
                  </span>
                  <span className="text-[9px] font-bold text-amber-300 font-casino-num">
                    9X PAYOUT
                  </span>
                </div>
                <h3 className="text-base font-black tracking-wide font-casino-num text-white group-hover:text-emerald-400 transition-colors">
                  WIN GO 1MIN
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                  Green • Violet • Red Lottery
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/60 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold font-casino-num">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{winGoStatusText}</span>
                </div>
              </div>

              {/* Colorful Lottery Balls Artwork */}
              <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                <img
                  src="/assets/lottery7/game-wingo.jpg"
                  alt="Win Go"
                  className="w-full h-full object-contain rounded-xl group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-300 shadow-md"
                />
              </div>
            </div>

            {/* Launch CTA Strip */}
            <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-300 group-hover:text-white transition-colors">
                Live Numbers • Play Now
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-[10px] font-black flex items-center gap-1 shadow-sm">
                <span>LAUNCH</span>
                <Play className="w-2.5 h-2.5 fill-white" />
              </span>
            </div>
          </div>
        </div>

        {/* Floating "Add to Desktop" pill badge */}
        <div className="mt-3 flex justify-center">
          <button
            onClick={onOpenAddToDesktop}
            className="px-3.5 py-1 rounded-full bg-gradient-to-r from-rose-50 to-orange-50 border border-rose-200 text-[#f95959] text-[11px] font-bold flex items-center gap-1.5 shadow-xs hover:bg-rose-100 transition-colors active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5 text-[#f95959]" />
            <span>Add Apex Arcade to Desktop (+₹25 Free)</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          CATEGORY-AWARE SHELVES
          ========================================================================= */}

      {/* 1. LOTTERY SHELF (Shows Win Go active + upcoming titles) */}
      {(activeCategory === 'popular' || activeCategory === 'lottery') && (
        <div className="l7-section-container">
          <div className="l7-section-header">
            <div className="l7-section-title">
              <Dices className="w-4 h-4 text-orange-500" />
              <span>Lottery Games</span>
            </div>
            <div className="text-[10px] text-slate-400 font-bold">
              Fair Parity RNG
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Win Go (ACTIVE) */}
            <div
              onClick={() => {
                soundManager.play('click');
                onSelectGame('wingo');
              }}
              className="l7-game-card cursor-pointer ring-2 ring-emerald-500/60 relative group"
            >
              <img src="/assets/lottery7/game-wingo.jpg" alt="Win Go" />
              <div className="absolute top-1 left-1 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded shadow-xs uppercase">
                ACTIVE
              </div>
            </div>

            {/* K3 (COMING SOON) */}
            <div
              onClick={() => onOpenComingSoon('K3 3-Dice Lottery', 'Lottery')}
              className="l7-game-card cursor-pointer relative group opacity-90 hover:opacity-100 transition-opacity"
            >
              <img src="/assets/lottery7/game-k3.png" alt="K3" />
              <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded shadow-xs uppercase">
                SOON
              </div>
            </div>

            {/* 5D (COMING SOON) */}
            <div
              onClick={() => onOpenComingSoon('5D Number Parity', 'Lottery')}
              className="l7-game-card cursor-pointer relative group opacity-90 hover:opacity-100 transition-opacity"
            >
              <img src="/assets/lottery7/game-5d.png" alt="5D" />
              <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded shadow-xs uppercase">
                SOON
              </div>
            </div>

            {/* Moto Racing (COMING SOON) */}
            <div
              onClick={() => onOpenComingSoon('Moto Racing Parity', 'Lottery')}
              className="l7-game-card cursor-pointer relative group opacity-90 hover:opacity-100 transition-opacity"
            >
              <img src="/assets/lottery7/game-motoracing.png" alt="Moto Racing" />
              <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded shadow-xs uppercase">
                SOON
              </div>
            </div>

            {/* Aviator (ACTIVE) */}
            <div
              onClick={() => {
                soundManager.play('click');
                onSelectGame('aviator');
              }}
              className="l7-game-card cursor-pointer ring-2 ring-rose-500/60 relative group"
            >
              <img src="/assets/lottery7/game-aviator.png" alt="Aviator" />
              <div className="absolute top-1 left-1 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded shadow-xs uppercase">
                ACTIVE
              </div>
            </div>

            {/* TRX Dice (COMING SOON) */}
            <div
              onClick={() => onOpenComingSoon('TRX Crypto Dice', 'Lottery')}
              className="l7-game-card cursor-pointer relative group opacity-90 hover:opacity-100 transition-opacity"
            >
              <img src="/assets/lottery7/game-trxdice.png" alt="TRX Dice" />
              <div className="absolute top-1 right-1 bg-amber-500 text-slate-950 text-[8px] font-black px-1.5 py-0.2 rounded shadow-xs uppercase">
                SOON
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. MINI GAMES SHELF (Shows Aviator active + upcoming mini games) */}
      {(activeCategory === 'popular' || activeCategory === 'minigames') && (
        <div className="l7-section-container">
          <div className="l7-section-header">
            <div className="l7-section-title">
              <Plane className="w-4 h-4 text-purple-500" />
              <span>Mini Games</span>
            </div>
            <div className="text-[10px] text-slate-400 font-bold">
              Instant Payouts
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {/* Aviator (ACTIVE) */}
            <div
              onClick={() => {
                soundManager.play('click');
                onSelectGame('aviator');
              }}
              className="l7-game-card cursor-pointer ring-2 ring-rose-500/60 relative group"
            >
              <img src="/assets/lottery7/game-aviator.png" alt="Aviator" />
              <div className="absolute top-1 left-1 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.2 rounded shadow-xs uppercase">
                ACTIVE
              </div>
            </div>

            {/* Mines (COMING SOON) */}
            <div
              onClick={() => onOpenComingSoon('Apex Mines Crash', 'Mini games')}
              className="l7-game-card bg-gradient-to-br from-slate-50 to-slate-100 min-h-[92px] flex flex-col items-center justify-center p-2 text-center cursor-pointer border border-slate-200 hover:border-amber-400 transition-all relative group"
            >
              <div className="text-xl mb-1">💣</div>
              <span className="text-[11px] font-bold text-slate-700 leading-tight">Mines</span>
              <span className="text-[8px] font-black text-amber-500 uppercase mt-0.5">Soon</span>
            </div>

            {/* Plinko (COMING SOON) */}
            <div
              onClick={() => onOpenComingSoon('Apex Plinko 3D', 'Mini games')}
              className="l7-game-card bg-gradient-to-br from-slate-50 to-slate-100 min-h-[92px] flex flex-col items-center justify-center p-2 text-center cursor-pointer border border-slate-200 hover:border-amber-400 transition-all relative group"
            >
              <div className="text-xl mb-1">🔴</div>
              <span className="text-[11px] font-bold text-slate-700 leading-tight">Plinko</span>
              <span className="text-[8px] font-black text-amber-500 uppercase mt-0.5">Soon</span>
            </div>
          </div>
        </div>
      )}

      {/* 3. SLOTS, FISHING, SPORTS, CASINO (Shows upcoming games showcase) */}
      {(activeCategory === 'slots' || activeCategory === 'fishing' || activeCategory === 'pvc' || activeCategory === 'sports' || activeCategory === 'casino') && (
        <div className="l7-section-container">
          <div className="l7-section-header">
            <div className="l7-section-title">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="capitalize">{activeCategory} Showcase</span>
            </div>
            <span className="text-[10px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
              Release in Progress
            </span>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-amber-50/40 border border-amber-200/60 text-center space-y-3">
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Certified {activeCategory} titles are undergoing final server sync.
              Enjoy our 2 live certified flagship games with instant UPI payouts right now!
            </p>

            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  soundManager.play('click');
                  onSelectGame('wingo');
                }}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <span>🎲 Win Go 1Min</span>
              </button>

              <button
                onClick={() => {
                  soundManager.play('click');
                  onSelectGame('aviator');
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm active:scale-95 transition-all"
              >
                <span>✈️ Aviator Live</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
