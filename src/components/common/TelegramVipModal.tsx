import React from 'react';
import { X, Send, Sparkles, CheckCircle2, ShieldCheck, Gift } from 'lucide-react';

interface TelegramVipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramVipModal: React.FC<TelegramVipModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#0e1424] border border-blue-500/30 rounded-3xl p-5 shadow-2xl relative text-left">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Telegram modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Send className="w-5 h-5 fill-white" />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-base leading-tight">
              Apex VIP Community
            </h3>
            <p className="text-[11px] text-blue-400 font-mono font-bold">
              38,400+ Active Members
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed mb-4">
          Join our verified official Telegram community for daily free promo chips, instant round analysis, and 24/7 VIP pilot assistance.
        </p>

        {/* VIP Perks */}
        <div className="space-y-2 bg-[#080d17] border border-blue-500/20 rounded-xl p-3 mb-4 text-xs font-medium">
          <div className="flex items-center gap-2 text-blue-300">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Daily ₹1,000 Free Reload Codes</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Live Win Go & Aviator Signals</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <Gift className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Weekend ₹50,000 Giveaway Pools</span>
          </div>
          <div className="flex items-center gap-2 text-slate-300">
            <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Official Provably Fair Verification</span>
          </div>
        </div>

        <button
          onClick={() => {
            onClose();
          }}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:from-blue-400 hover:to-blue-600 text-white font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-transform active:scale-98"
        >
          <Send className="w-4 h-4 fill-white" />
          <span>JOIN OFFICIAL TELEGRAM CHANNEL</span>
        </button>
      </div>
    </div>
  );
};
