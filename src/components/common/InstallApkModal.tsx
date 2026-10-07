import React, { useState } from 'react';
import { X, Download, ShieldCheck, CheckCircle, Smartphone, Gift, Sparkles } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';

interface InstallApkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClaimBonus: (bonus: number) => void;
}

export const InstallApkModal: React.FC<InstallApkModalProps> = ({
  isOpen,
  onClose,
  onClaimBonus,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    soundManager.play('click');
    setDownloading(true);
    setTimeout(() => {
      setDownloading(false);
      setDownloaded(true);
      soundManager.play('win');
      onClaimBonus(50);
      setTimeout(() => {
        onClose();
        setDownloaded(false);
      }, 1500);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-2xl bg-[#0c101d] border border-amber-500/30 p-5 shadow-2xl text-slate-100 overflow-hidden text-center">
        {/* Glow ambient */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

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

        {/* APK Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#f95959] via-[#ff7979] to-amber-400 flex items-center justify-center text-white shadow-xl mb-3 border-2 border-white/20">
          <Smartphone className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-2">
          <Gift className="w-3 h-3" />
          <span>Includes ₹50 Free Bonus</span>
        </div>

        <h3 className="text-base font-black text-white font-casino-num">
          Apex Arcade Android App
        </h3>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Official lightweight APK (v2.4.1 • 8.4 MB). Fast 60FPS animations, instant crash cashouts, and push alerts.
        </p>

        {/* Specs box */}
        <div className="my-4 p-3 rounded-xl bg-[#121829] border border-slate-800 text-left text-[11px] text-slate-300 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Package:</span>
            <span className="font-mono text-white">com.apex.arcade</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Security Check:</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Verified Virus-Free
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Welcome Reward:</span>
            <span className="text-amber-400 font-bold font-casino-num">+₹50.00 Balance</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handleDownload}
          disabled={downloading || downloaded}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-[#f95959] to-[#ff7979] hover:brightness-105 active:scale-[0.98] text-white font-black text-xs shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 transition-all disabled:opacity-80"
        >
          {downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Downloading APK (8.4 MB)...</span>
            </>
          ) : downloaded ? (
            <>
              <CheckCircle className="w-4 h-4 text-emerald-300" />
              <span>Downloaded! ₹50 Bonus Credited</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download APK & Claim ₹50 Bonus</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
