import React from 'react';
import { X, ShieldCheck, Zap, Lock, CheckCircle, Bell } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';

interface ApexNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApexNoticeModal: React.FC<ApexNoticeModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0c101d] border border-amber-500/30 p-5 shadow-2xl text-slate-100 overflow-hidden">
        {/* Glow ambient */}
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

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-md">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white font-casino-num">
              Official Apex Guarantee
            </h3>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
              Safety & Security Notice
            </span>
          </div>
        </div>

        {/* Bullet points */}
        <div className="space-y-2.5 text-xs text-slate-300">
          <div className="p-2.5 rounded-xl bg-[#121829] border border-slate-800 flex items-start gap-2.5">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block text-[11px]">Sub-Second UPI Banking</span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Automated credit faucet with sub-second balance settlement directly to your wallet.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#121829] border border-slate-800 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block text-[11px]">Provably Fair RNG Engine</span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Win Go 1Min parity outcomes and Aviator crash trajectories are cryptographically verified.
              </p>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-[#121829] border border-slate-800 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block text-[11px]">256-Bit Financial Encryption</span>
              <p className="text-[10px] text-slate-400 mt-0.5">
                All transactions and player session data are encrypted end-to-end.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.play('click');
            onClose();
          }}
          className="mt-5 w-full py-2.5 rounded-xl bg-gradient-to-r from-[#f95959] to-[#ff7979] text-white font-bold text-xs shadow-md hover:brightness-105 active:scale-[0.98] transition-all"
        >
          Understood & Verified
        </button>
      </div>
    </div>
  );
};
