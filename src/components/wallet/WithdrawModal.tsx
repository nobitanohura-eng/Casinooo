import React, { useState } from 'react';
import { X, ShieldCheck, Zap, Lock, AlertTriangle, CheckCircle, ArrowUpRight } from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';
import { soundManager } from '../../lib/sound.ts';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  walletBalance: number;
  accountId: string;
  totalDeposited: number;
  totalWagered: number;
  onRefreshData: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  walletBalance,
  accountId,
  totalDeposited,
  totalWagered,
  onRefreshData,
}) => {
  const [amount, setAmount] = useState<number>(500);
  const [upiId, setUpiId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1X Turnover Requirement Calculation
  const isTurnoverSatisfied = totalWagered >= totalDeposited;
  const turnoverRemaining = Math.max(0, totalDeposited - totalWagered);

  const handleSubmitWithdrawal = async () => {
    if (!upiId || !upiId.includes('@')) {
      setErrorMessage('Please enter a valid UPI ID (e.g. mobile@upi, name@oksbi)');
      return;
    }
    if (amount <= 0 || amount > walletBalance) {
      setErrorMessage(`Invalid withdrawal amount. Available: ${formatINR(walletBalance)}`);
      return;
    }
    if (!isTurnoverSatisfied) {
      setErrorMessage(`1X Turnover unmet. Need ₹${turnoverRemaining.toFixed(2)} more wagering before requesting withdrawal.`);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await fetch('/api/wallet/withdraw-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          amount,
          upiId: upiId.trim(),
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        soundManager.play('bet');
        setSuccessMessage(`Withdrawal request for ${formatINR(amount)} queued for operator approval.`);
        onRefreshData();
        setTimeout(() => {
          onClose();
          setSuccessMessage(null);
        }, 1500);
      } else {
        setErrorMessage(data.error || 'Failed to submit withdrawal request.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-[#0e1424] border border-amber-500/30 rounded-3xl p-5 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close withdrawal modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-700 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-base">
              UPI Withdrawal Desk
            </h3>
            <p className="text-[11px] text-amber-400 font-mono font-medium">1X Turnover Verification</p>
          </div>
        </div>

        {/* 1X Turnover Requirement Status Pill */}
        <div className="mb-4">
          {isTurnoverSatisfied ? (
            <div className="bg-emerald-950/80 border border-emerald-500/50 rounded-xl p-2.5 flex items-center gap-2 text-emerald-300 text-xs">
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              <div>
                <span className="font-bold block">1X Turnover Requirement Satisfied</span>
                <span className="text-[10px] text-emerald-400/80 font-mono">
                  Wagered: {formatINR(totalWagered)} / Deposited: {formatINR(totalDeposited)}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-rose-950/80 border border-rose-500/60 rounded-xl p-2.5 flex items-start gap-2 text-rose-300 text-xs">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-200">
                  Turnover Remaining: {formatINR(turnoverRemaining)}
                </span>
                <span className="text-[10px] text-rose-300/80 font-mono block mt-0.5">
                  1X wager required before payouts. Wagered: {formatINR(totalWagered)} / Required: {formatINR(totalDeposited)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Available Balance */}
        <div className="bg-[#080d17] border border-amber-500/20 rounded-xl p-3 mb-3.5 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono font-bold">
              Available Balance
            </span>
            <span className="font-mono-nums font-black text-amber-300 text-xl">
              {formatINR(walletBalance)}
            </span>
          </div>
          <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full font-mono font-bold border border-amber-500/20">
            Virtual INR
          </span>
        </div>

        {/* Amount Input & Preset Chips */}
        <div className="mb-3.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
            Withdrawal Amount (₹)
          </label>
          <div className="grid grid-cols-4 gap-1.5 mb-2">
            {[200, 500, 1000, 2000].map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  soundManager.play('chip');
                  setAmount(preset);
                }}
                className={`py-1.5 rounded-lg text-xs font-mono font-bold border transition-all ${
                  amount === preset
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-sm'
                    : 'bg-[#121929] text-slate-300 border-slate-800 hover:bg-slate-800'
                }`}
              >
                ₹{preset}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={100}
            max={walletBalance}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full bg-[#080d17] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono font-black text-sm focus:border-amber-500/60 focus:outline-none"
            placeholder="Enter custom withdrawal amount"
          />
        </div>

        {/* UPI ID Input */}
        <div className="mb-4">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
            Beneficiary UPI Address
          </label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="e.g. mobile@upi, username@oksbi"
            className="w-full bg-[#080d17] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-500/60 focus:outline-none placeholder:text-slate-600"
          />
        </div>

        {/* Micro Trust & Regulatory Badges */}
        <div className="space-y-1.5 bg-[#080d17] border border-slate-800 rounded-xl p-2.5 mb-4 text-[10px] font-mono">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <Zap className="w-3 h-3 shrink-0" />
            <span>Instant UPI Sandbox Payout Settlement</span>
          </div>
          <div className="flex items-center gap-2 text-amber-300 font-medium">
            <ShieldCheck className="w-3 h-3 shrink-0" />
            <span>Provably Fair RNG Engine Verified</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <Lock className="w-3 h-3 shrink-0" />
            <span>1-Click Operator Instant Refund Guarantee</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSubmitWithdrawal}
          disabled={isSubmitting || !isTurnoverSatisfied || amount > walletBalance}
          className={`w-full h-12 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-1.5 ${
            !isTurnoverSatisfied
              ? 'bg-rose-950/60 text-rose-400 border border-rose-900/60 cursor-not-allowed'
              : amount > walletBalance
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-[0_4px_0_#78350f] active:translate-y-1 active:shadow-none'
          }`}
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : !isTurnoverSatisfied ? (
            `TURNOVER REMAINING: ${formatINR(turnoverRemaining)}`
          ) : (
            `REQUEST UPI PAYOUT (${formatINR(amount)})`
          )}
        </button>
      </div>
    </div>
  );
};
