import React from 'react';
import { Gift, Sparkles, ArrowRight, Disc3, Coins } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';

interface LobbyHeroProps {
  onOpenLuckyWheel: () => void;
  onOpenCheckIn: () => void;
  onOpenDepositBonus?: () => void;
}

export const LobbyHero: React.FC<LobbyHeroProps> = ({
  onOpenLuckyWheel,
  onOpenCheckIn,
  onOpenDepositBonus,
}) => {
  return (
    <div className="space-y-2.5 px-3 pt-2">
      {/* 1. High-Converting 100% First Deposit Bonus Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2a0845] via-[#4d105c] to-[#1e0538] border border-amber-400/50 p-4 shadow-[0_4px_30px_rgba(245,158,11,0.25)]">
        {/* Ambient Glows */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/25 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-pink-500/30 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between gap-3">
          {/* Left Text & CTA */}
          <div className="flex-1 space-y-1.5">
            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/25 border border-amber-400/60 text-[9px] font-casino-num font-black text-amber-300 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>UNLIMITED 100% MATCH</span>
            </div>

            <h2 className="text-base sm:text-lg font-black font-casino-num uppercase tracking-tight text-white leading-tight">
              100% FIRST DEPOSIT BONUS
              <span className="block text-xs sm:text-sm text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-400 font-bold">
                Double Your Coins on First UPI Recharge
              </span>
            </h2>

            <p className="text-[10px] text-purple-200/90 leading-tight line-clamp-1 font-medium">
              Instant 1:1 auto-match credited directly to your balance!
            </p>

            <button
              onClick={() => {
                soundManager.play('click');
                if (onOpenDepositBonus) {
                  onOpenDepositBonus();
                } else {
                  onOpenCheckIn();
                }
              }}
              className="mt-1 h-8 px-4 rounded-lg bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-casino-num font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-[0_0_20px_rgba(245,158,11,0.5)] border-t border-white/60 active:scale-95 transition-transform"
            >
              <span>CLAIM NOW</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>

          {/* Right 3D Styled Graphic Elements (Golden Ticket + 3D Coins + Gift) */}
          <div className="relative w-28 h-24 flex items-center justify-center shrink-0">
            {/* 3D Floating Bonus Badge */}
            <div className="relative w-18 h-18 rounded-2xl p-1 bg-gradient-to-tr from-yellow-500 via-amber-300 to-yellow-600 shadow-[0_0_25px_rgba(245,158,11,0.5)] border-2 border-amber-300 flex flex-col items-center justify-center rotate-6">
              <div className="w-full h-full rounded-xl bg-gradient-to-br from-purple-950 to-slate-950 flex flex-col items-center justify-center border border-amber-400/40">
                <span className="font-casino-num font-black text-base text-amber-300 leading-none">
                  +100%
                </span>
                <span className="text-[7px] text-yellow-200 font-black uppercase tracking-wider mt-0.5">
                  DOUBLE
                </span>
              </div>
            </div>

            {/* Floating 3D Rupee Coin 1 */}
            <div className="absolute -top-1 left-0 w-7 h-7 rounded-full bg-gradient-to-tr from-yellow-600 via-amber-300 to-yellow-500 border border-white/60 shadow-md flex items-center justify-center font-casino-num font-black text-[10px] text-slate-950 animate-bounce">
              ₹
            </div>

            {/* Floating 3D Rupee Coin 2 */}
            <div className="absolute -bottom-1 -left-1 w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-500 via-amber-200 to-yellow-600 border border-white/60 shadow-md flex items-center justify-center font-casino-num font-black text-[9px] text-slate-950 animate-pulse">
              ₹
            </div>

            {/* Glowing Gift Box Accent */}
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 via-rose-600 to-purple-700 p-0.5 shadow-lg border border-yellow-300 flex items-center justify-center">
              <Gift className="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. High-Gloss Quick Action Cards Side-by-Side */}
      <div className="grid grid-cols-2 gap-2">
        {/* Card 1: Check In - Daily Free Bounty */}
        <button
          onClick={() => {
            soundManager.play('click');
            onOpenCheckIn();
          }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1c122c] to-[#0f0919] border border-purple-500/30 p-2.5 text-left shadow-md hover:border-purple-400/60 active:scale-98 transition-all group"
        >
          {/* Subtle Ambient Sheen */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between gap-1 mb-1.5">
            {/* Illustrated 3D Gift Box */}
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-600 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full rounded-[6px] bg-gradient-to-br from-purple-900 to-indigo-950 flex items-center justify-center">
                <Gift className="w-5 h-5 text-amber-300 stroke-[2.2]" />
              </div>
            </div>

            {/* Red [ GO ] Badge */}
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white font-casino-num font-black text-[10px] tracking-wider uppercase shadow-[0_0_8px_rgba(225,29,72,0.6)] group-hover:scale-105 transition-transform">
              GO &gt;
            </span>
          </div>

          <div>
            <h3 className="font-casino-num font-black text-white text-xs leading-tight group-hover:text-amber-300 transition-colors">
              Check In
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 font-casino-num">
              Daily Free Bounty
            </p>
          </div>
        </button>

        {/* Card 2: Spinner - Wheel of Fortune */}
        <button
          onClick={() => {
            soundManager.play('click');
            onOpenLuckyWheel();
          }}
          className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1c122c] to-[#0f0919] border border-amber-500/30 p-2.5 text-left shadow-md hover:border-amber-400/60 active:scale-98 transition-all group"
        >
          {/* Subtle Ambient Sheen */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center justify-between gap-1 mb-1.5">
            {/* Illustrated 3D Circular Wheel */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-yellow-500 via-amber-300 to-yellow-600 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full rounded-full bg-gradient-to-br from-slate-950 to-purple-950 flex items-center justify-center border border-amber-300">
                <Disc3 className="w-5 h-5 text-amber-300 animate-[spin_8s_linear_infinite]" />
              </div>
            </div>

            {/* Red [ GO ] Badge */}
            <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white font-casino-num font-black text-[10px] tracking-wider uppercase shadow-[0_0_8px_rgba(225,29,72,0.6)] group-hover:scale-105 transition-transform">
              GO &gt;
            </span>
          </div>

          <div>
            <h3 className="font-casino-num font-black text-white text-xs leading-tight group-hover:text-amber-300 transition-colors">
              Spinner
            </h3>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5 font-casino-num">
              Wheel of Fortune
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
