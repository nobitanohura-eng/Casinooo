import React, { useState } from 'react';
import { X, CheckCircle, Zap } from 'lucide-react';
import { WinGoSelectionType, WinGoSelectionValue } from '../../lib/types.ts';
import { soundManager } from '../../lib/sound.ts';
import { formatINR } from '../../lib/formatters.ts';
import { useTranslation } from '../../lib/i18n.ts';

interface WinGoBetDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectionType: WinGoSelectionType;
  selectionValue: WinGoSelectionValue;
  periodNumber: number;
  walletBalance: number;
  isLocked: boolean;
  onConfirmBet: (params: {
    selectionType: WinGoSelectionType;
    selectionValue: WinGoSelectionValue;
    stakeAmount: number;
  }) => Promise<{ success: boolean; error?: string }>;
}

export const WinGoBetDrawer: React.FC<WinGoBetDrawerProps> = ({
  isOpen,
  onClose,
  selectionType,
  selectionValue,
  periodNumber,
  walletBalance,
  isLocked,
  onConfirmBet,
}) => {
  const { t } = useTranslation();
  const [stake, setStake] = useState<number>(100);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Multiplier calculation for estimated payout (with 2% platform fee accounted)
  const getMultiplierRate = (): number => {
    if (selectionType === 'NUMBER') return 9.0;
    if (selectionType === 'COLOR') {
      if (selectionValue === 'VIOLET') return 4.5;
      return 1.96; // Red or Green net platform return (2% rake)
    }
    if (selectionType === 'SIZE') return 1.96;
    return 1.0;
  };

  const multiplierRate = getMultiplierRate();
  const estimatedPayout = Math.round(stake * multiplierRate * 100) / 100;
  const hasInsufficientBalance = walletBalance < stake;

  const handleHalf = () => {
    soundManager.play('click');
    setStake((prev) => Math.max(10, Math.floor(prev / 2)));
  };

  const handleDouble = () => {
    soundManager.play('click');
    setStake((prev) => Math.min(walletBalance || 50000, prev * 2));
  };

  const handleSelectPreset = (chip: number) => {
    soundManager.play('chip');
    setStake(chip);
  };

  const handleConfirm = async () => {
    if (isLocked) {
      setErrorMessage('Betting locked for this period. Please wait.');
      return;
    }
    if (hasInsufficientBalance) {
      setErrorMessage(`Insufficient balance (Current: ${formatINR(walletBalance)})`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await onConfirmBet({
      selectionType,
      selectionValue,
      stakeAmount: stake,
    });

    setIsSubmitting(false);

    if (result.success) {
      soundManager.play('bet');
      setSuccessMessage('Bet accepted by server!');
      setTimeout(() => {
        onClose();
        setSuccessMessage(null);
      }, 700);
    } else {
      setErrorMessage(result.error || 'Failed to place bet.');
    }
  };

  const getSelectionBadgeColor = () => {
    if (selectionValue === 'GREEN') return 'bg-emerald-600 text-white';
    if (selectionValue === 'RED') return 'bg-rose-600 text-white';
    if (selectionValue === 'VIOLET') return 'bg-violet-600 text-white';
    if (selectionValue === 'SMALL') return 'bg-blue-600 text-white';
    if (selectionValue === 'BIG') return 'bg-amber-600 text-slate-950 font-black';
    return 'bg-slate-700 text-white';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#0b101c] border-t-2 border-amber-500/40 rounded-t-xl shadow-2xl p-4 pb-safe animate-in slide-in-from-bottom duration-200">
        {/* Grab Handle */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-2.5" />

        {/* Header: Crisp Industrial Micro-borders */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-md font-casino-num font-black text-xs uppercase tracking-wider shadow-sm ${getSelectionBadgeColor()}`}
            >
              {selectionValue}
            </span>
            <div>
              <h3 className="font-casino-num font-black text-white text-sm leading-tight uppercase">
                Win Go Bet Slip
              </h3>
              <p className="text-[10px] text-amber-400 font-casino-num font-bold">
                #{periodNumber} · {multiplierRate}X {t('payoutReturn')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close bet drawer"
            className="w-7 h-7 rounded-md bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors border border-slate-700"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 1. Indian Denominations Chip Presets: [₹10, ₹50, ₹100, ₹500, ₹1,000] */}
        <div className="mt-3">
          <div className="grid grid-cols-5 gap-1.5">
            {[10, 50, 100, 500, 1000].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSelectPreset(chip)}
                className={`py-1.5 rounded-md font-casino-num font-black text-xs transition-all border ${
                  stake === chip
                    ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                ₹{chip}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Industrial Bet Control: Solid Compact Input flanked by 1/2 and 2X */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <button
            onClick={handleHalf}
            className="w-12 h-10 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 font-casino-num font-black text-xs text-amber-400 flex items-center justify-center active:scale-95 transition-transform"
          >
            1/2
          </button>

          <div className="flex-1 h-10 bg-[#060a12] border border-slate-700/80 rounded-md px-3 flex items-center justify-between">
            <span className="font-casino-num font-bold text-amber-400 text-sm">₹</span>
            <input
              type="number"
              min={10}
              max={50000}
              value={stake}
              onChange={(e) => setStake(Math.max(10, Number(e.target.value)))}
              className="w-full text-center font-casino-num font-black text-white text-base bg-transparent focus:outline-none"
            />
            <span className="text-[10px] text-slate-500 font-casino-num font-bold">INR</span>
          </div>

          <button
            onClick={handleDouble}
            className="w-12 h-10 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700/80 font-casino-num font-black text-xs text-amber-400 flex items-center justify-center active:scale-95 transition-transform"
          >
            2X
          </button>
        </div>

        {/* Summary Payout */}
        <div className="mt-3 p-2.5 rounded-md bg-[#070b14] border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block font-casino-num">
              Total Stake
            </span>
            <span className="font-casino-num font-black text-white text-sm">
              {formatINR(stake)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-amber-400/90 font-bold uppercase block font-casino-num">
              Est. Win Payout
            </span>
            <span className="font-casino-num font-black text-amber-300 text-sm">
              {formatINR(estimatedPayout)}
            </span>
          </div>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="mt-2 p-2 rounded-md bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold text-center">
            {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="mt-2 p-2 rounded-md bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold text-center flex items-center justify-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Confirm Action Button */}
        <div className="mt-3">
          <button
            onClick={handleConfirm}
            disabled={isSubmitting || isLocked || hasInsufficientBalance}
            className={`w-full h-11 rounded-md font-casino-num font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-t border-white/30 ${
              isLocked || hasInsufficientBalance
                ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/25 active:scale-98'
            }`}
          >
            {isSubmitting ? (
              <span>Authorizing Bet...</span>
            ) : hasInsufficientBalance ? (
              <span>Insufficient Balance ({formatINR(walletBalance)})</span>
            ) : isLocked ? (
              <span>Period Betting Locked</span>
            ) : (
              <span>Confirm Bet ({formatINR(stake)})</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
