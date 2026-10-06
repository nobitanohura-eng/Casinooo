import React, { useState } from 'react';
import { Zap, AlertCircle } from 'lucide-react';
import { AviatorRoundStatus, AviatorBet } from '../../lib/types.ts';
import { soundManager } from '../../lib/sound.ts';
import { formatINR } from '../../lib/formatters.ts';
import { useTranslation } from '../../lib/i18n.ts';

interface AviatorBetPanelProps {
  status: AviatorRoundStatus;
  currentMultiplier: number;
  walletBalance: number;
  activeUserBet: AviatorBet | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onPlaceBet: (stake: number, autoCashout?: number) => void;
  onCashOut: (betId: string) => void;
}

export const AviatorBetPanel: React.FC<AviatorBetPanelProps> = ({
  status,
  currentMultiplier,
  walletBalance,
  activeUserBet,
  isSubmitting,
  errorMessage,
  onPlaceBet,
  onCashOut,
}) => {
  const { t } = useTranslation();
  const [stake, setStake] = useState<number>(100);
  const [isAutoCashout, setIsAutoCashout] = useState<boolean>(false);
  const [autoCashoutValue, setAutoCashoutValue] = useState<number>(2.0);

  const isFlying = status === 'FLYING';
  const isBetting = status === 'BETTING';

  const hasInFlightBet = activeUserBet && activeUserBet.status === 'IN_FLIGHT';
  const hasWonBet = activeUserBet && activeUserBet.status === 'WON';

  // Live cashout payout in INR
  const liveCashoutPayout = hasInFlightBet
    ? Math.round(activeUserBet.stake_amount * currentMultiplier * 100) / 100
    : 0;

  const handleSelectPreset = (val: number) => {
    soundManager.play('chip');
    setStake(val);
  };

  const handleDouble = () => {
    soundManager.play('click');
    setStake((prev) => Math.min(walletBalance || 50000, prev * 2));
  };

  const handleHalf = () => {
    soundManager.play('click');
    setStake((prev) => Math.max(10, Math.floor(prev / 2)));
  };

  const handleTriggerBet = () => {
    soundManager.play('bet');
    onPlaceBet(stake, isAutoCashout ? autoCashoutValue : undefined);
  };

  const handleTriggerCashOut = (betId: string) => {
    soundManager.play('cashout');
    onCashOut(betId);
  };

  return (
    <div className="bg-[#0b101c] border border-slate-700/60 rounded-lg p-2.5 shadow-md space-y-2">
      {/* 1. Indian Quick Preset Chips [₹10, ₹50, ₹100, ₹500, ₹1,000] */}
      <div className="grid grid-cols-5 gap-1.5">
        {[10, 50, 100, 500, 1000].map((val) => (
          <button
            key={val}
            onClick={() => handleSelectPreset(val)}
            disabled={isFlying}
            className={`py-1 rounded-md font-casino-num font-black text-xs transition-all border ${
              stake === val
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
            } disabled:opacity-40`}
          >
            ₹{val}
          </button>
        ))}
      </div>

      {/* 2. Industrial Bet Input Bar Flanked by 1/2 and 2X Toggles */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={handleHalf}
          disabled={isFlying}
          className="w-12 h-9 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700/80 font-casino-num font-black text-xs text-amber-400 flex items-center justify-center active:scale-95 transition-transform"
        >
          1/2
        </button>

        <div className="flex-1 h-9 bg-[#060a12] border border-slate-700/80 rounded-md px-3 flex items-center gap-1.5">
          <span className="font-casino-num font-bold text-amber-400 text-sm">₹</span>
          <input
            type="number"
            min={10}
            max={50000}
            value={stake}
            disabled={isFlying}
            onChange={(e) => setStake(Math.max(10, Number(e.target.value)))}
            className="w-full text-center font-casino-num font-black text-white text-base bg-transparent focus:outline-none"
          />
        </div>

        <button
          onClick={handleDouble}
          disabled={isFlying}
          className="w-12 h-9 rounded-md bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-700/80 font-casino-num font-black text-xs text-amber-400 flex items-center justify-center active:scale-95 transition-transform"
        >
          2X
        </button>
      </div>

      {/* 3. Auto Cash Out Bar */}
      <div className="flex items-center justify-between bg-[#070b14] border border-slate-800 rounded-md px-2.5 py-1.5 text-xs">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            id="auto-cashout"
            checked={isAutoCashout}
            disabled={isFlying}
            onChange={(e) => setIsAutoCashout(e.target.checked)}
            className="accent-amber-500 w-3.5 h-3.5 cursor-pointer rounded"
          />
          <span className="font-casino-num font-bold text-slate-300 text-[11px] uppercase">
            {t('autoCashout')}
          </span>
        </label>

        <div className="flex items-center gap-1">
          <input
            type="number"
            step="0.1"
            min="1.1"
            max="100"
            disabled={!isAutoCashout || isFlying}
            value={autoCashoutValue}
            onChange={(e) => setAutoCashoutValue(Math.max(1.05, Number(e.target.value)))}
            className={`w-14 text-right font-casino-num font-black text-xs bg-transparent border-b ${
              isAutoCashout ? 'text-amber-400 border-amber-500' : 'text-slate-600 border-slate-800'
            } focus:outline-none`}
          />
          <span className={`text-xs font-casino-num font-bold ${isAutoCashout ? 'text-amber-400' : 'text-slate-600'}`}>
            X
          </span>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="p-1.5 rounded-md bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-1.5 justify-center">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 4. Action Button: Place Bet vs In-Flight Cash Out */}
      <div>
        {hasInFlightBet ? (
          <button
            onClick={() => handleTriggerCashOut(activeUserBet.id)}
            className="w-full h-11 rounded-md bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-casino-num font-black text-sm uppercase tracking-wider flex items-center justify-between px-4 shadow-lg shadow-amber-500/30 transition-transform active:scale-98 border-t border-white/40"
          >
            <span>{t('cashOut')}</span>
            <span className="text-base font-black">
              {formatINR(liveCashoutPayout)} ({currentMultiplier.toFixed(2)}x)
            </span>
          </button>
        ) : (
          <button
            onClick={handleTriggerBet}
            disabled={isSubmitting || !isBetting || walletBalance < stake}
            className={`w-full h-11 rounded-md font-casino-num font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all border-t border-white/30 ${
              isFlying
                ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                : walletBalance < stake
                ? 'bg-slate-800 border-slate-700 text-rose-400 cursor-not-allowed'
                : isSubmitting
                ? 'bg-emerald-800 text-emerald-200 cursor-wait'
                : 'bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 shadow-md shadow-emerald-500/25 active:scale-98'
            }`}
          >
            {isSubmitting ? (
              <span>Placing Wager...</span>
            ) : walletBalance < stake ? (
              <span>Insufficient Balance ({formatINR(walletBalance)})</span>
            ) : isFlying ? (
              <span>Flight in Progress · Wait Next</span>
            ) : (
              <span>{t('placeBet')} ({formatINR(stake)})</span>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
