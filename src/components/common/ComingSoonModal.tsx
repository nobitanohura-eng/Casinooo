import React from 'react';
import { X, Clock, Sparkles, ShieldCheck, Play, Flame } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';

interface ComingSoonModalProps {
  isOpen: boolean;
  gameTitle: string;
  gameCategory?: string;
  onClose: () => void;
  onPlayWinGo: () => void;
  onPlayAviator: () => void;
}

export const ComingSoonModal: React.FC<ComingSoonModalProps> = ({
  isOpen,
  gameTitle,
  gameCategory = 'Casino',
  onClose,
  onPlayWinGo,
  onPlayAviator,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0c101d] border border-amber-500/30 p-5 shadow-2xl text-slate-100 overflow-hidden">
        {/* Glow ambient background */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={() => {
            soundManager.play('click');
            onClose();
          }}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex flex-col items-center text-center pt-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mb-3 shadow-inner">
            <Clock className="w-7 h-7 animate-pulse" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3" />
            <span>Under RNG Audit</span>
          </div>

          <h3 className="text-lg font-black text-white font-casino-num tracking-wide">
            {gameTitle}
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-[280px]">
            {gameTitle} ({gameCategory}) is undergoing provably fair compliance testing.
            Scheduled for our upcoming release!
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 p-3 rounded-xl bg-[#121829] border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Certification Progress
            </span>
            <span className="text-amber-400 font-casino-num">94%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full w-[94%]" />
          </div>
        </div>

        {/* Quick CTA to active games */}
        <div className="mt-5 space-y-2.5">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block text-center">
            Play Our Live Flagship Games Right Now:
          </span>

          <button
            onClick={() => {
              soundManager.play('click');
              onClose();
              onPlayWinGo();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
              <span>🎲 Win Go 1Min (Live Round)</span>
            </div>
            <Play className="w-3.5 h-3.5 fill-white" />
          </button>

          <button
            onClick={() => {
              soundManager.play('click');
              onClose();
              onPlayAviator();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-rose-950/40 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-2">
              <Flame className="w-3.5 h-3.5 text-amber-300" />
              <span>✈️ Spribe Aviator (Live Multiplier)</span>
            </div>
            <Play className="w-3.5 h-3.5 fill-white" />
          </button>
        </div>
      </div>
    </div>
  );
};
