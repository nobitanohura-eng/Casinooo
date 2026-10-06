import React, { useState } from 'react';
import { X, Sparkles, CheckCircle, ShieldCheck, Zap, Lock, QrCode } from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';
import { soundManager } from '../../lib/sound.ts';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  onTopUp: (amount: number) => Promise<{ success: boolean; error?: string }>;
  onRefreshData?: () => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
  isOpen,
  onClose,
  accountId,
  onTopUp,
  onRefreshData,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [activeMode, setActiveMode] = useState<'instant' | 'upi_qr'>('instant');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstantGrant = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);
    const result = await onTopUp(selectedAmount);
    setIsSubmitting(false);

    if (result.success) {
      soundManager.play('bet');
      setMessage(`Instant Virtual Credit +${formatINR(selectedAmount)} loaded!`);
      if (onRefreshData) onRefreshData();
      setTimeout(() => {
        onClose();
        setMessage(null);
      }, 1000);
    } else {
      setErrorMessage(result.error || 'Failed to grant virtual credits.');
    }
  };

  const handleUtrSubmit = async () => {
    if (!utrNumber || utrNumber.trim().length < 6) {
      setErrorMessage('Please enter a valid 12-digit UPI UTR transaction reference.');
      return;
    }

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/wallet/deposit-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId,
          amount: selectedAmount,
          utrNumber: utrNumber.trim(),
          method: 'UPI',
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        soundManager.play('bet');
        setMessage(`UTR ${utrNumber} submitted to Operator Queue! Status: PENDING`);
        if (onRefreshData) onRefreshData();
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 1500);
      } else {
        setErrorMessage(data.error || 'Failed to submit deposit UTR.');
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
          aria-label="Close recharge drawer"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-slate-950 flex items-center justify-center shadow-md shadow-amber-500/20 border-t border-white/40">
            <Sparkles className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-base leading-tight">
              Recharge Credits
            </h3>
            <p className="text-[11px] text-amber-400 font-bold font-mono">
              Virtual Demo Wallet
            </p>
          </div>
        </div>

        {/* Mode Selector */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#090d18] rounded-xl border border-slate-800 mb-3.5">
          <button
            onClick={() => setActiveMode('instant')}
            className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all ${
              activeMode === 'instant'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            ⚡ Instant Reload
          </button>
          <button
            onClick={() => setActiveMode('upi_qr')}
            className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 ${
              activeMode === 'upi_qr'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>UPI Deposit / UTR</span>
          </button>
        </div>

        {/* Indian Presets [₹500, ₹1000, ₹2000, ₹5000] */}
        <div className="mb-3.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-mono">
            Select Amount (₹)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[500, 1000, 2000, 5000].map((amt) => (
              <button
                key={amt}
                onClick={() => {
                  soundManager.play('chip');
                  setSelectedAmount(amt);
                }}
                className={`py-2.5 px-2 rounded-xl font-mono-nums font-black text-sm border transition-all ${
                  selectedAmount === amt
                    ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 border-amber-300 shadow-md shadow-amber-500/20 scale-[1.02]'
                    : 'bg-[#121929] text-slate-200 border-slate-800 hover:bg-slate-800'
                }`}
              >
                +{formatINR(amt)}
              </button>
            ))}
          </div>
        </div>

        {activeMode === 'upi_qr' && (
          <div className="bg-[#080d17] border border-slate-800 rounded-2xl p-3 mb-3.5 text-center">
            <span className="text-[10px] text-amber-400 font-mono font-bold block mb-1">
              SCAN & PAY VIA ANY UPI APP
            </span>
            <div className="w-32 h-32 mx-auto bg-white p-1 rounded-xl shadow-inner mb-2 flex items-center justify-center">
              <img
                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=upi://pay?pa=apexarcade.pay@upi&pn=ApexArcade&cu=INR"
                alt="UPI Deposit QR"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-[11px] font-mono text-slate-300">
              UPI ID: <span className="text-amber-300 font-bold">apexarcade.pay@upi</span>
            </div>
            <div className="mt-2.5 text-left">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
                12-Digit Bank UTR / Reference
              </label>
              <input
                type="text"
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                placeholder="e.g. 429184019284"
                className="w-full bg-[#101728] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-xs focus:border-amber-500/60 focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>
        )}

        {/* Trust & Payment Badges */}
        <div className="space-y-1.5 bg-[#080d17] border border-slate-800/80 rounded-xl p-2.5 mb-3.5 text-[11px]">
          <div className="flex items-center gap-2 text-emerald-400 font-medium">
            <Zap className="w-3.5 h-3.5 shrink-0" />
            <span>Instant UPI Settlement (GPay / PhonePe / Paytm)</span>
          </div>
          <div className="flex items-center gap-2 text-amber-300/90 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Provably Fair RNG Engine Verified</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 font-medium">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>256-Bit Bank-Grade Sandbox Encryption</span>
          </div>
        </div>

        {errorMessage && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {message && (
          <div className="mb-3.5 p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/50 flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={activeMode === 'instant' ? handleInstantGrant : handleUtrSubmit}
          disabled={isSubmitting}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 border-t border-white/40"
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : activeMode === 'instant' ? (
            <>
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>INSTANT RELOAD ({formatINR(selectedAmount)})</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>SUBMIT UTR FOR VERIFICATION</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
