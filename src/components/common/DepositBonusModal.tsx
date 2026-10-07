import React, { useEffect, useState } from 'react';
import { X, Sparkles, Gift, ArrowRight, Zap, ShieldCheck } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';
import { formatINR } from '../../lib/formatters.ts';

interface DepositBonusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecharge: () => void;
}

export const DepositBonusModal: React.FC<DepositBonusModalProps> = ({
  isOpen,
  onClose,
  onRecharge,
}) => {
  const [ticketFloating, setTicketFloating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      soundManager.play('win');
      setTicketFloating(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-gradient-to-b from-[#1f0b35] via-[#120722] to-[#080312] border-2 border-amber-400/60 p-5 shadow-[0_0_50px_rgba(245,158,11,0.35)] overflow-hidden text-center">
        {/* Ambient Glows */}
        <div className="absolute -top-20 -left-20 w-44 h-44 bg-pink-500/30 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-44 h-44 bg-amber-500/30 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.play('click');
            onClose();
          }}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-900/80 border border-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors z-20"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Floating 3D Lottery Tickets Banner */}
        <div className="relative my-2 h-24 flex items-center justify-center">
          {/* Flying Ticket 1 (Left - ₹500 Match) */}
          <div
            className={`absolute -left-2 top-2 w-28 h-14 bg-gradient-to-br from-amber-400 via-amber-500 to-yellow-600 rounded-lg p-1.5 shadow-xl border border-yellow-200 text-slate-950 transform -rotate-12 transition-all duration-700 ${
              ticketFloating ? 'translate-y-0' : '-translate-y-4 opacity-50'
            }`}
          >
            <div className="border border-dashed border-slate-900/40 h-full rounded flex flex-col justify-center items-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-slate-900">
                DEPOSIT PASS
              </span>
              <span className="text-xs font-black tracking-tight text-slate-950 font-casino-num">
                +100% MATCH
              </span>
            </div>
          </div>

          {/* Flying Ticket 2 (Right - ₹500 BONUS) */}
          <div
            className={`absolute -right-2 top-4 w-32 h-16 bg-gradient-to-br from-rose-500 via-pink-600 to-purple-700 rounded-lg p-1.5 shadow-xl border border-pink-300 text-white transform rotate-12 transition-all duration-700 ${
              ticketFloating ? 'translate-y-0' : 'translate-y-4 opacity-50'
            }`}
          >
            <div className="border border-dashed border-white/40 h-full rounded flex flex-col justify-center items-center">
              <span className="text-[8px] font-black uppercase tracking-wider text-pink-200">
                INSTANT RECHARGE
              </span>
              <span className="text-sm font-black tracking-tight text-yellow-300 font-casino-num drop-shadow">
                GET ₹500
              </span>
            </div>
          </div>


          {/* Center 3D Gift Box Icon with Glow */}
          <div className="relative z-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 via-yellow-300 to-amber-600 p-0.5 shadow-2xl shadow-amber-500/50 flex items-center justify-center animate-bounce">
            <div className="w-full h-full rounded-[14px] bg-gradient-to-br from-purple-900 to-indigo-950 flex items-center justify-center">
              <Gift className="w-8 h-8 text-amber-300 animate-pulse stroke-[2.2]" />
            </div>
          </div>
        </div>

        {/* Metallic 3D Headline */}
        <div className="mt-2 space-y-1">
          <div className="inline-block px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 via-pink-500/20 to-amber-500/20 border border-amber-400/40 text-[10px] font-casino-num font-black text-amber-300 tracking-wider uppercase mb-1">
            🔥 OFFICIAL INDIAN WELCOME BOUNTY
          </div>

          <h2 className="text-2xl sm:text-3xl font-black font-casino-num uppercase tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500 drop-shadow-[0_2px_10px_rgba(245,158,11,0.5)]">
            Unlimited 100%
          </h2>
          <h3 className="text-lg sm:text-xl font-black font-casino-num uppercase text-white tracking-wide">
            Deposit Bonus
          </h3>
          <p className="text-xs text-purple-200/90 font-medium pt-1 max-w-xs mx-auto leading-relaxed">
            Double your first UPI recharge instantly! Deposit <span className="text-amber-300 font-bold">₹500</span> get <span className="text-emerald-300 font-bold">₹1,000 Play Cash</span>.
          </p>
        </div>

        {/* Feature Pills */}
        <div className="grid grid-cols-2 gap-2 my-4 text-[10px] font-casino-num font-bold">
          <div className="p-2 rounded-lg bg-slate-900/80 border border-amber-500/30 flex items-center gap-1.5 justify-center text-amber-300">
            <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>Instant UPI 24/7</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-900/80 border border-emerald-500/30 flex items-center gap-1.5 justify-center text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>1X Easy Turnover</span>
          </div>
        </div>

        {/* Action Button: High-Energy Neon Gradient */}
        <button
          onClick={() => {
            soundManager.play('click');
            onClose();
            onRecharge();
          }}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-yellow-300 text-slate-950 font-casino-num font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.45)] border-t border-white/60 active:scale-95 transition-transform"
        >
          <Sparkles className="w-4 h-4 fill-slate-950" />
          <span>RECHARGE NOW (100% FREE)</span>
          <ArrowRight className="w-4 h-4 stroke-[3]" />
        </button>

        <p className="text-[10px] text-slate-400 mt-2.5 font-casino-num">
          ⚡ Paytm • PhonePe • Google Pay • BHIM UPI
        </p>
      </div>
    </div>
  );
};
