import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle, ShieldCheck, Zap, Lock, Copy, Check, ArrowRight, Wallet } from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';
import { soundManager } from '../../lib/sound.ts';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  onTopUp?: (amount: number) => Promise<{ success: boolean; error?: string }>;
  onRefreshData?: () => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({
  isOpen,
  onClose,
  accountId,
  onRefreshData,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(500);
  const [customAmount, setCustomAmount] = useState<string>('500');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [operatorUpi, setOperatorUpi] = useState<string>('apexarcade.pay@upi');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings?.upi_id) {
          setOperatorUpi(data.settings.upi_id);
        }
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const presets = [100, 300, 500, 1000, 5000];

  const handleSelectPreset = (amt: number) => {
    soundManager.play('chip');
    setSelectedAmount(amt);
    setCustomAmount(amt.toString());
  };

  const handleCustomChange = (val: string) => {
    const num = parseInt(val, 10);
    setCustomAmount(val);
    if (!isNaN(num) && num > 0) {
      setSelectedAmount(num);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(operatorUpi);
    setCopiedUpi(true);
    soundManager.play('bet');
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleUtrSubmit = async () => {
    const trimmedUtr = utrNumber.trim();
    if (!trimmedUtr || trimmedUtr.length !== 12 || !/^\d{12}$/.test(trimmedUtr)) {
      setErrorMessage('Please enter a valid 12-digit numeric Bank UTR transaction reference.');
      return;
    }

    if (selectedAmount < 100) {
      setErrorMessage('Minimum recharge amount is ₹100.');
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
          utrNumber: trimmedUtr,
          method: 'UPI_P2P',
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        soundManager.play('win');
        setMessage(`UTR ${trimmedUtr} submitted! Verification underway, balance updates in 2–5 minutes.`);
        setUtrNumber('');
        if (onRefreshData) onRefreshData();
        setTimeout(() => {
          onClose();
          setMessage(null);
        }, 2500);
      } else {
        setErrorMessage(data.error || 'Failed to submit deposit UTR.');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Network error occurred. Please try again.');
    }
  };

  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    `upi://pay?pa=${operatorUpi}&pn=ApexArcade&am=${selectedAmount}&cu=INR`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-gradient-to-b from-[#141b2d] to-[#0a0f1d] border border-amber-500/30 rounded-3xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close recharge drawer"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 border-t border-white/40">
            <Wallet className="w-5 h-5 fill-slate-950" />
          </div>
          <div>
            <h3 className="font-display font-black text-white text-lg leading-tight flex items-center gap-1.5">
              Recharge Account <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">P2P UPI</span>
            </h3>
            <p className="text-[11px] text-slate-400 font-medium">
              Zero fee • Instant Automated Verification
            </p>
          </div>
        </div>

        {/* Amount Presets */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2 font-mono flex items-center justify-between">
            <span>Select Amount (₹)</span>
            <span className="text-amber-400 font-bold">Min ₹100</span>
          </label>
          <div className="grid grid-cols-5 gap-1.5 mb-2.5">
            {presets.map((amt) => (
              <button
                key={amt}
                onClick={() => handleSelectPreset(amt)}
                className={`py-2 px-1 rounded-xl font-mono font-black text-xs border transition-all ${
                  selectedAmount === amt
                    ? 'bg-gradient-to-b from-amber-400 to-amber-600 text-slate-950 border-amber-300 shadow-md shadow-amber-500/25 scale-[1.03]'
                    : 'bg-[#182138] text-slate-200 border-slate-700/80 hover:border-amber-500/40'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="absolute left-3.5 top-2.5 text-amber-400 font-black text-sm">₹</span>
            <input
              type="number"
              min="100"
              value={customAmount}
              onChange={(e) => handleCustomChange(e.target.value)}
              placeholder="Or enter custom amount"
              className="w-full bg-[#0d1424] border border-slate-700/80 rounded-xl pl-8 pr-3 py-2 text-white font-mono font-bold text-sm focus:border-amber-500 focus:outline-none placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* UPI QR & Payment Info Card */}
        <div className="bg-[#0b101c] border border-amber-500/20 rounded-2xl p-4 mb-4 text-center shadow-inner">
          <div className="text-[11px] text-amber-400 font-mono font-bold tracking-wider mb-2.5 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            SCAN QR WITH GPAY / PHONEPE / PAYTM
          </div>

          <div className="w-36 h-36 mx-auto bg-white p-2 rounded-2xl shadow-md mb-3 flex items-center justify-center">
            <img
              src={dynamicQrUrl}
              alt="UPI Payment QR Code"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Copyable UPI ID Box */}
          <div className="flex items-center justify-between bg-[#131b2e] border border-slate-700/80 rounded-xl px-3 py-2 text-xs mb-3">
            <div className="text-left font-mono truncate mr-2">
              <span className="text-[10px] text-slate-400 block">Official Merchant UPI ID:</span>
              <span className="text-amber-300 font-bold select-all">{operatorUpi}</span>
            </div>
            <button
              onClick={handleCopyUpi}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono flex items-center gap-1 transition-all ${
                copiedUpi
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
              }`}
            >
              {copiedUpi ? (
                <>
                  <Check className="w-3 h-3 stroke-[3]" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" /> Copy
                </>
              )}
            </button>
          </div>

          {/* Payment Steps */}
          <div className="text-left space-y-1.5 text-[11px] text-slate-300 bg-[#070b14] p-3 rounded-xl border border-slate-800">
            <div className="font-bold text-amber-300 mb-1 text-[11px] uppercase tracking-wide">
              Quick Payment Steps:
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">1</span>
              <span>Scan QR or Copy UPI ID & transfer ₹{selectedAmount}</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">2</span>
              <span>Find the 12-digit UTR / Ref No. in payment details</span>
            </div>
            <div className="flex items-start gap-1.5">
              <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">3</span>
              <span>Paste 12-digit UTR below and tap Submit</span>
            </div>
          </div>
        </div>

        {/* 12-Digit UTR Input Field */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1.5 font-mono">
            12-Digit Bank UTR / Reference No. <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            maxLength={12}
            value={utrNumber}
            onChange={(e) => setUtrNumber(e.target.value.replace(/\D/g, ''))}
            placeholder="e.g. 429184019284"
            className="w-full bg-[#0d1424] border border-amber-500/40 rounded-xl px-3.5 py-2.5 text-white font-mono text-sm tracking-wider focus:border-amber-400 focus:outline-none placeholder:text-slate-600"
          />
          <span className="text-[10px] text-slate-400 block mt-1 font-mono">
            {utrNumber.length}/12 digits entered
          </span>
        </div>

        {/* Status Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/60 flex items-center gap-2 text-emerald-300 text-xs">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{message}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={handleUtrSubmit}
          disabled={isSubmitting || utrNumber.length !== 12}
          className={`w-full h-12 rounded-xl font-display font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 border-t border-white/40 ${
            utrNumber.length === 12 && !isSubmitting
              ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-amber-500/25 active:translate-y-0.5'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border-slate-700'
          }`}
        >
          {isSubmitting ? (
            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>SUBMIT RECHARGE FOR VERIFICATION ({formatINR(selectedAmount)})</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>

        {/* Trust Badges */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Encrypted UPI</span>
          </div>
          <div className="flex items-center gap-1 text-amber-400">
            <Zap className="w-3.5 h-3.5" />
            <span>Auto Match</span>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <Lock className="w-3.5 h-3.5" />
            <span>Bank Grade</span>
          </div>
        </div>
      </div>
    </div>
  );
};
