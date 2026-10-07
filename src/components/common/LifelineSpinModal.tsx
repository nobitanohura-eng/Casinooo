import React, { useState } from 'react';
import { X, Sparkles, Gift, CheckCircle, Zap } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';

interface LifelineSpinModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  onRewardClaimed: (reward: { type: string; value: number; label: string }) => void;
}

export const LifelineSpinModal: React.FC<LifelineSpinModalProps> = ({
  isOpen,
  onClose,
  accountId,
  onRewardClaimed,
}) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDegrees, setSpinDegrees] = useState(0);
  const [wonPrize, setWonPrize] = useState<{ type: string; value: number; label: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSpin = async () => {
    setIsSpinning(true);
    setErrorMessage(null);
    soundManager.play('chip');

    try {
      const res = await fetch('/api/retention/lifeline-spin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });

      const data = await res.json();

      if (data.success && data.reward) {
        // Calculate degree offset based on reward
        // Segments: 0: ₹5 (0-120°), 1: ₹10 (120-240°), 2: +25% Deposit Voucher (240-360°)
        let baseAngle = 60;
        if (data.reward.value === 10) baseAngle = 180;
        else if (data.reward.type === 'voucher') baseAngle = 300;

        const totalRotations = 5 * 360 + (360 - baseAngle);
        setSpinDegrees(totalRotations);

        setTimeout(() => {
          setIsSpinning(false);
          setWonPrize(data.reward);
          soundManager.play('win');
          onRewardClaimed(data.reward);
        }, 3200);
      } else {
        setIsSpinning(false);
        setErrorMessage(data.error || 'Lifeline spin not available or already claimed.');
      }
    } catch (err: any) {
      setIsSpinning(false);
      setErrorMessage(err.message || 'Network error occurred.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#191e33] via-[#0f1424] to-[#0a0d18] border border-amber-500/40 rounded-3xl p-5 shadow-2xl relative text-center">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close lifeline wheel modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[11px] font-mono font-bold mb-2">
          <Zap className="w-3.5 h-3.5 fill-rose-400" />
          <span>ZERO-BALANCE LIFELINE WHEEL</span>
        </div>

        <h2 className="font-display font-black text-xl text-white mb-1">
          FREE SECOND CHANCE!
        </h2>
        <p className="text-[11px] text-slate-400 mb-4">
          Balance reached ₹0? Spin the wheel to get back in the action!
        </p>

        {/* Wheel Graphic */}
        <div className="relative w-48 h-48 mx-auto my-3 flex items-center justify-center">
          {/* Top Indicator Arrow */}
          <div className="absolute -top-3 z-20 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[16px] border-t-amber-400 drop-shadow-md" />

          {/* Wheel Circle */}
          <div
            className="w-44 h-44 rounded-full border-4 border-amber-400/80 shadow-xl overflow-hidden relative"
            style={{
              transform: `rotate(${spinDegrees}deg)`,
              transition: isSpinning ? 'transform 3.2s cubic-bezier(0.15, 0.85, 0.35, 1)' : 'none',
              background: 'conic-gradient(#f59e0b 0deg 120deg, #10b981 120deg 240deg, #8b5cf6 240deg 360deg)',
            }}
          >
            {/* Prize Label 1: ₹5 (0-120 deg) */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[11px] font-black text-slate-950 font-mono flex flex-col items-center">
              <span>₹5 CASH</span>
              <span className="text-[9px] opacity-80">(60%)</span>
            </div>

            {/* Prize Label 2: ₹10 (120-240 deg) */}
            <div className="absolute bottom-6 right-6 text-[11px] font-black text-white font-mono flex flex-col items-center rotate-[120deg]">
              <span>₹10 CASH</span>
              <span className="text-[9px] opacity-80">(30%)</span>
            </div>

            {/* Prize Label 3: +25% Voucher (240-360 deg) */}
            <div className="absolute bottom-6 left-6 text-[10px] font-black text-white font-mono flex flex-col items-center rotate-[240deg]">
              <span>+25% VOUCHER</span>
              <span className="text-[9px] opacity-80">(10%)</span>
            </div>

            {/* Center Cap */}
            <div className="absolute inset-0 m-auto w-12 h-12 rounded-full bg-slate-950 border-2 border-amber-400 flex items-center justify-center shadow-lg">
              <Gift className="w-5 h-5 text-amber-400" />
            </div>
          </div>
        </div>

        {/* Result Announcement */}
        {wonPrize && (
          <div className="mb-3.5 p-3 rounded-2xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs flex items-center justify-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="font-bold">Congratulations! You won {wonPrize.label}!</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Spin CTA */}
        <button
          onClick={handleSpin}
          disabled={isSpinning || wonPrize !== null}
          className={`w-full h-12 rounded-xl font-display font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 border-t border-white/40 transition-all ${
            !isSpinning && wonPrize === null
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-amber-500/25 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
          }`}
        >
          {isSpinning ? (
            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : wonPrize ? (
            <span>CLAIMED REWARD</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>SPIN FREE LIFELINE WHEEL</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
