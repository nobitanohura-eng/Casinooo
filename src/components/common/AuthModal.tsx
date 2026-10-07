import React, { useState, useEffect } from 'react';
import { X, Lock, Phone, UserPlus, LogIn, Eye, EyeOff, RefreshCw, Sparkles, Gift } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';
import { Account } from '../../lib/types.ts';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
  onAuthSuccess: (account: Account, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'login',
  onAuthSuccess,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [captchaNum1, setCaptchaNum1] = useState(5);
  const [captchaNum2, setCaptchaNum2] = useState(3);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 9) + 1;
    const n2 = Math.floor(Math.random() * 9) + 1;
    setCaptchaNum1(n1);
    setCaptchaNum2(n2);
    setCaptchaAnswer('');
  };

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
      generateCaptcha();
      // Check for ?ref= in URL
      const urlParams = new URLSearchParams(window.location.search);
      const ref = urlParams.get('ref');
      if (ref) {
        setReferralCode(ref.toUpperCase());
        setMode('register');
      }
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const validateMobile = (mob: string) => {
    return /^[6-9]\d{9}$/.test(mob.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanMobile = mobile.trim();
    if (!validateMobile(cleanMobile)) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    // Validate Math Captcha
    if (parseInt(captchaAnswer, 10) !== captchaNum1 + captchaNum2) {
      setErrorMessage(`Incorrect security code answer: ${captchaNum1} + ${captchaNum2} = ?`);
      generateCaptcha();
      return;
    }

    setIsSubmitting(true);

    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
      const payload: any = {
        mobile: cleanMobile,
        password,
      };
      if (mode === 'register' && referralCode) {
        payload.referralCode = referralCode.trim();
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success && data.account && data.token) {
        soundManager.play('win');
        localStorage.setItem('apex_auth_token', data.token);
        localStorage.setItem('apex_account_id', data.account.id);
        onAuthSuccess(data.account, data.token);
        onClose();
      } else {
        setErrorMessage(data.error || 'Authentication failed. Please try again.');
        generateCaptcha();
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Network error occurred. Please try again.');
      generateCaptcha();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-gradient-to-b from-[#141b2d] to-[#0a0f1d] border border-amber-500/30 rounded-3xl p-5 shadow-2xl relative max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close authentication modal"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="text-center mb-4">
          <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 border-t border-white/40">
            <Sparkles className="w-6 h-6 fill-slate-950" />
          </div>
          <h2 className="font-display font-black text-xl text-white tracking-wider">
            APEX ARCADE
          </h2>
          <p className="text-[11px] text-amber-400 font-mono font-bold">
            Official India Fast Cash Edition
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-[#090d18] rounded-xl border border-slate-800 mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMessage(null);
            }}
            className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Register</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Mobile Input */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
              Indian Mobile Number
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3 flex items-center gap-1 text-slate-400 font-mono text-xs border-r border-slate-700 pr-2">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <span>+91</span>
              </div>
              <input
                type="tel"
                maxLength={10}
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                placeholder="10-digit mobile"
                className="w-full bg-[#0d1424] border border-slate-700 rounded-xl pl-16 pr-3 py-2.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-none placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
              Password
            </label>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-3.5 h-3.5 text-slate-500" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password (min 6 chars)"
                className="w-full bg-[#0d1424] border border-slate-700 rounded-xl pl-9 pr-9 py-2.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-none placeholder:text-slate-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password (Register Mode only) */}
          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
                Confirm Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-3.5 h-3.5 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter password"
                  className="w-full bg-[#0d1424] border border-slate-700 rounded-xl pl-9 pr-3 py-2.5 text-white font-mono text-xs focus:border-amber-500 focus:outline-none placeholder:text-slate-600"
                  required
                />
              </div>
            </div>
          )}

          {/* Invite / Referral Code (Register Mode only) */}
          {mode === 'register' && (
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono flex items-center justify-between">
                <span>Invite / Referral Code</span>
                <span className="text-amber-400 flex items-center gap-1">
                  <Gift className="w-3 h-3" /> Optional
                </span>
              </label>
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="e.g. PILOT01"
                className="w-full bg-[#0d1424] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-xs tracking-wider focus:border-amber-500 focus:outline-none placeholder:text-slate-600 uppercase"
              />
            </div>
          )}

          {/* 2-Digit Math Visual Challenge Captcha */}
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-mono">
              Security Anti-Bot Challenge
            </label>
            <div className="flex items-center gap-2">
              <div className="bg-[#090e1a] border border-amber-500/30 px-3 py-2 rounded-xl font-mono font-black text-amber-300 text-sm tracking-widest flex items-center gap-1.5 shrink-0 select-none">
                <span>{captchaNum1}</span>
                <span>+</span>
                <span>{captchaNum2}</span>
                <span>=</span>
                <span>?</span>
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="ml-1 text-slate-400 hover:text-amber-300"
                  title="New question"
                >
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <input
                type="number"
                value={captchaAnswer}
                onChange={(e) => setCaptchaAnswer(e.target.value)}
                placeholder="Answer"
                className="flex-1 bg-[#0d1424] border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono text-xs text-center font-bold focus:border-amber-500 focus:outline-none placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2.5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs">
              {errorMessage}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 active:translate-y-0.5 transition-all flex items-center justify-center gap-2 border-t border-white/40 mt-2"
          >
            {isSubmitting ? (
              <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4 fill-slate-950" />
                <span>ENTER APEX ARCADE</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 fill-slate-950" />
                <span>CREATE ACCOUNT & CLAIM BONUS</span>
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <p className="mt-3.5 text-center text-[10px] text-slate-500 font-medium">
          Guests can view live games. Login is required to bet and withdraw winnings.
        </p>
      </div>
    </div>
  );
};
