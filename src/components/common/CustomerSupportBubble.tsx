import React, { useState } from 'react';
import { MessageCircle, Headphones, X, Send, ShieldCheck, Zap } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';

interface CustomerSupportBubbleProps {
  onOpenTelegram?: () => void;
}

export const CustomerSupportBubble: React.FC<CustomerSupportBubbleProps> = ({
  onOpenTelegram,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating Green Customer Support Badge */}
      <div className="fixed bottom-20 right-4 z-40">
        <button
          onClick={() => {
            soundManager.play('click');
            setIsOpen((prev) => !prev);
          }}
          aria-label="Customer Support 24/7"
          className="relative w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-[0_4px_20px_rgba(16,185,129,0.5)] border-2 border-emerald-300 hover:scale-105 active:scale-95 transition-transform"
        >
          <Headphones className="w-6 h-6 stroke-[2.2]" />
          {/* Active Online Pulse Dot */}
          <span className="absolute top-0 right-0 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-slate-950 animate-pulse" />
        </button>
      </div>

      {/* Support Drawer / Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl bg-[#0b101d] border border-emerald-500/40 p-4 shadow-2xl relative text-left">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <Headphones className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-casino-num font-black text-white text-sm">
                    24/7 VIP Customer Support
                  </h3>
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Online • Average reply 1 min
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Support Channels */}
            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  soundManager.play('click');
                  setIsOpen(false);
                  if (onOpenTelegram) onOpenTelegram();
                }}
                className="w-full p-3 rounded-xl bg-gradient-to-r from-sky-950/80 to-[#0c1a2e] border border-sky-500/40 hover:border-sky-400 flex items-center justify-between transition-colors text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Send className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-casino-num font-black text-white text-xs block">
                      Telegram Official VIP Channel
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Live lottery predictions & deposit resolution
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-sky-400 font-bold uppercase font-casino-num">
                  OPEN →
                </span>
              </button>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold font-casino-num">
                  <Zap className="w-3.5 h-3.5" />
                  <span>Instant UPI Deposit Help</span>
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  If your UPI deposit is delayed, submit your 12-digit UTR number in the Recharge section for instant auto-crediting.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-[10px] text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>RNG Certified & 100% Encrypted Indian Settlement</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
