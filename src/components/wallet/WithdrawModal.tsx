import React, { useState } from 'react';
import { X, ShieldCheck, Zap, Lock, AlertTriangle, CheckCircle, ArrowUpRight, HelpCircle, User } from 'lucide-react';
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
  const [accountHolderName, setAccountHolderName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // 1X Turnover Requirement Calculation
  const isTurnoverSatisfied = totalWagered >= totalDeposited;
  const turnoverRemaining = Math.max(0, totalDeposited - totalWagered);
  const presets = [300, 500, 1000, 2000, 5000];

  const handleSubmitWithdrawal = async () => {
    if (!accountHolderName.trim()) {
      setErrorMessage('Please enter the beneficiary account holder name.');
      return;
    }

    if (!upiId || !upiId.includes('@')) {
      setErrorMessage('Please enter a valid UPI address (e.g. mobile@upi, name@oksbi).');
      return;
    }

    if (amount < 300) {
      setErrorMessage('Minimum withdrawal amount is ₹300.');
      return;
    }

    if (amount > walletBalance) {
      setErrorMessage(`Insufficient balance. Current available: ${formatINR(walletBalance)}`);
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
          accountHolderName: accountHolderName.trim(),
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        soundManager.play('win');
        setSuccessMessage(`Withdrawal request for ${formatINR(amount)} queued for operator disbursement.`);
        onRefreshData();
        setTimeout(() => {
          onClose();
          setSuccessMessage(null);
        }, 2200);
      } else {
        setErrorMessage(data.error || 'Failed to submit withdrawal request.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Network error occurred. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-gradient-to-b from-[#141b2d] to-[#0a0f1d] border border-amber-500/30 rounded-3xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close withdrawal modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 border-t border-white/40">
            <ArrowUpRight className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-lg leading-tight flex items-center gap-2">
              Withdraw Funds <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">Direct UPI</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">Instant P2P Payout to Any Indian Bank</p>
          </div>
        </div>

        {/* 1X Turnover Requirement Status Pill */}
        <div className="mb-4">
          {isTurnoverSatisfied ? (
            <div className="bg-emerald-950/60 border border-emerald-500/40 rounded-2xl p-3 flex items-center gap-2.5 text-emerald-300 text-xs">
              <CheckCircle className="w-5 h-5 shrink-0 text-emerald-400" />
              <div>
                <span className="font-bold block text-emerald-200">1X Turnover Verification Passed</span>
                <span className="text-[10px] text-emerald-400/90 font-mono block mt-0.5">
                  Wagered: {formatINR(totalWagered)} / Required: {formatINR(totalDeposited)}
                </span>
              </div>
            </div>
          ) : (
            <div className="bg-rose-950/60 border border-rose-500/40 rounded-2xl p-3 flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <span className="font-bold block text-rose-200">
                  Turnover Remaining: {formatINR(turnoverRemaining)}
                </span>
                <span className="text-[10px] text-rose-300/80 font-mono block mt-0.5">
                  Anti-fraud policy requires 1X playthrough before cashout. Wagered: {formatINR(totalWagered)} / Required: {formatINR(totalDeposited)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Available Balance Card */}
        <div className="bg-[#0b101c] border border-amber-500/25 rounded-2xl p-3.5 mb-4 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-mono font-bold">
              Available Balance
            </span>
            <span className="font-mono-nums font-black text-amber-300 text-2xl">
              {formatINR(walletBalance)}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full font-mono font-bold border border-amber-500/30">
              Min ₹300
            </span>
          </div>
        </div>

        {/* Amount Input & Preset Chips */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 font-mono">
            Withdrawal Amount (₹)
          </label>
          <div className="grid grid-cols-5 gap-1.5 mb-2.5">
            {presets.map((preset) => (
              <button
                key={preset}
                onClick={() => {
                  soundManager.play('chip');
                  setAmount(preset);
                }}
                className={`py-2 px-1 rounded-xl text-xs font-mono font-black border transition-all ${
                  amount === preset
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md shadow-amber-500/25 scale-[1.03]'
                    : 'bg-[#182138] text-slate-200 border-slate-700/80 hover:border-amber-500/40'
                }`}
              >
                ₹{preset}
              </button>
            ))}
          </div>
          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-amber-400 font-black text-sm">₹</span>
            <input
              type="number"
              min={300}
              max={walletBalance}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full bg-[#0d1424] border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-white font-mono font-bold text-sm focus:border-amber-500 focus:outline-none"
              placeholder="Enter custom amount"
            />
          </div>
        </div>

        {/* Account Holder Name */}
        <div className="mb-3">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 font-mono">
            Beneficiary Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input
              type="text"
              value={accountHolderName}
              onChange={(e) => setAccountHolderName(e.target.value)}
              placeholder="Account holder name as per bank"
              className="w-full bg-[#0d1424] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-white font-mono text-xs focus:border-amber-500 focus:outline-none placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* UPI ID Input */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 font-mono">
            Your UPI ID / VPA <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            placeholder="e.g. 9876543210@paytm, yourname@oksbi"
            className="w-full bg-[#0d1424] border border-slate-700/80 rounded-xl px-3.5 py-2 text-white font-mono text-xs focus:border-amber-500 focus:outline-none placeholder:text-slate-600"
          />
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleSubmitWithdrawal}
          disabled={isSubmitting || !isTurnoverSatisfied || amount > walletBalance || amount < 300}
          className={`w-full h-12 rounded-xl font-display font-black text-xs uppercase tracking-wider transition-all shadow-lg flex items-center justify-center gap-2 border-t border-white/30 ${
            !isTurnoverSatisfied
              ? 'bg-rose-950/80 text-rose-400 border-rose-800/80 cursor-not-allowed'
              : amount > walletBalance || amount < 300
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
              : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-amber-500/25 active:translate-y-0.5'
          }`}
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : !isTurnoverSatisfied ? (
            `TURNOVER REMAINING: ${formatINR(turnoverRemaining)}`
          ) : amount > walletBalance ? (
            'INSUFFICIENT BALANCE'
          ) : (
            `CONFIRM WITHDRAWAL (${formatINR(amount)})`
          )}
        </button>

        {/* Trust Policy */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-1 text-emerald-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Direct IMPS/UPI</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>24x7 Settlement</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span>0% Payout Fee</span>
          </div>
        </div>
      </div>
    </div>
  );
};
