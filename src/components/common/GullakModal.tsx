import React, { useState } from 'react';
import { X, Sparkles, Hammer, Coins, CheckCircle, Flame } from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';
import { soundManager } from '../../lib/sound.ts';

interface GullakModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  gullakBalance: number;
  onGullakSmashed: (transferredAmount: number) => void;
}

export const GullakModal: React.FC<GullakModalProps> = ({
  isOpen,
  onClose,
  accountId,
  gullakBalance,
  onGullakSmashed,
}) => {
  const [isSmashing, setIsSmashing] = useState(false);
  const [isBroken, setIsBroken] = useState(false);
  const [transferred, setTransferred] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSmash = async () => {
    if (gullakBalance <= 0) {
      setErrorMessage('Your Gullak is empty! Play more rounds to save piggy cashback.');
      return;
    }

    setIsSmashing(true);
    setErrorMessage(null);
    soundManager.play('chip');

    try {
      const res = await fetch('/api/retention/smash-gullak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const data = await res.json();
      setIsSmashing(false);

      if (data.success) {
        setIsBroken(true);
        setTransferred(data.smashedAmount);
        soundManager.play('win');
        onGullakSmashed(data.smashedAmount);
        setTimeout(() => {
          setIsBroken(false);
          onClose();
        }, 2500);
      } else {
        setErrorMessage(data.error || 'Failed to smash Gullak.');
      }
    } catch (err: any) {
      setIsSmashing(false);
      setErrorMessage(err.message || 'Network error occurred.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#1b1429] via-[#100d1c] to-[#0a0712] border border-amber-500/40 rounded-3xl p-5 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Gullak modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-bold mb-3">
          <Flame className="w-3.5 h-3.5 fill-amber-400" />
          <span>1.5% VIP CASHBACK VAULT</span>
        </div>

        <h2 className="font-display font-black text-xl text-white mb-1">
          GOLDEN GULLAK
        </h2>
        <p className="text-[11px] text-slate-400 mb-4">
          Every bet automatically saves 1.5% in your piggy vault!
        </p>

        {/* Piggy Visual */}
        <div className="relative w-36 h-36 mx-auto my-3 flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-500/20 rounded-full blur-2xl animate-pulse" />
          <div
            className={`text-7xl transition-transform duration-300 select-none ${
              isSmashing ? 'scale-90 rotate-12' : isBroken ? 'scale-110' : 'animate-bounce'
            }`}
          >
            {isBroken ? '💥' : '🐷'}
          </div>
          {isSmashing && (
            <div className="absolute -top-2 -right-2 text-4xl animate-spin">
              🔨
            </div>
          )}
        </div>

        {/* Balance Display */}
        <div className="bg-[#0e091a] border border-amber-500/30 rounded-2xl p-3.5 mb-4 shadow-inner">
          <span className="text-[10px] text-amber-300/80 uppercase tracking-wider block font-mono font-bold">
            Vault Accumulation
          </span>
          <span className="font-mono font-black text-3xl text-amber-300">
            {formatINR(gullakBalance)}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            Transfers to main balance with 1X turnover
          </span>
        </div>

        {errorMessage && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {isBroken && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center justify-center gap-1.5 font-bold">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Successfully smashed! +{formatINR(transferred)} added!</span>
          </div>
        )}

        {/* Smash Button */}
        <button
          onClick={handleSmash}
          disabled={isSmashing || gullakBalance <= 0 || isBroken}
          className={`w-full h-12 rounded-xl font-display font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 border-t border-white/40 transition-all ${
            gullakBalance > 0 && !isBroken
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-amber-500/25 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
          }`}
        >
          {isSmashing ? (
            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : isBroken ? (
            <span>CLAIMED!</span>
          ) : (
            <>
              <Hammer className="w-4 h-4 fill-slate-950" />
              <span>SMASH GULLAK ({formatINR(gullakBalance)})</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
