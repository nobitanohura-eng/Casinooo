import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft,
  Phone,
  Lock,
  Eye,
  EyeOff,
  Gift,
  ShieldCheck,
  CheckCircle2,
  Headphones,
  Sparkles,
  Zap,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';
import { Account } from '../../lib/types.ts';

interface AuthPageProps {
  initialMode?: 'login' | 'register';
  onAuthSuccess: (account: Account, token: string) => void;
  onBackToHome: () => void;
  onOpenSupport?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({
  initialMode = 'login',
  onAuthSuccess,
  onBackToHome,
  onOpenSupport,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Slide-to-Verify Captcha States
  const [isSlideVerified, setIsSlideVerified] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sliderTrackRef = useRef<HTMLDivElement>(null);

  // Fallback 2-digit math captcha
  const [captchaNum1, setCaptchaNum1] = useState(6);
  const [captchaNum2, setCaptchaNum2] = useState(4);
  const [captchaAnswer, setCaptchaAnswer] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const generateCaptcha = () => {
    setCaptchaNum1(Math.floor(Math.random() * 9) + 1);
    setCaptchaNum2(Math.floor(Math.random() * 9) + 1);
    setCaptchaAnswer('');
  };

  useEffect(() => {
    generateCaptcha();
    const urlParams = new URLSearchParams(window.location.search);
    const ref = urlParams.get('ref');
    if (ref) {
      setReferralCode(ref.toUpperCase());
      setMode('register');
    }
  }, []);

  // Slide Captcha Touch/Mouse Handlers
  const handleTouchStart = () => {
    if (isSlideVerified) return;
    setIsDragging(true);
  };

  const handleTouchMove = (clientX: number) => {
    if (!isDragging || isSlideVerified || !sliderTrackRef.current) return;
    const trackRect = sliderTrackRef.current.getBoundingClientRect();
    const maxDrag = trackRect.width - 48; // thumb width is 48px
    const currentX = Math.max(0, Math.min(clientX - trackRect.left - 24, maxDrag));
    const percentage = currentX / maxDrag;
    setSliderPosition(percentage * 100);

    if (percentage >= 0.88) {
      setIsSlideVerified(true);
      setIsDragging(false);
      setSliderPosition(100);
      soundManager.play('win');
    }
  };

  const handleTouchEnd = () => {
    if (isSlideVerified) return;
    setIsDragging(false);
    if (sliderPosition < 88) {
      setSliderPosition(0);
    }
  };

  const resetSlider = () => {
    setIsSlideVerified(false);
    setSliderPosition(0);
    generateCaptcha();
  };

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
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (mode === 'register' && password !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify.');
      return;
    }

    // Verify slide captcha OR fallback math captcha
    const isMathValid = parseInt(captchaAnswer, 10) === captchaNum1 + captchaNum2;
    if (!isSlideVerified && !isMathValid) {
      setErrorMessage('Please drag the slider to verify you are human, or complete the security calculation.');
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
      } else {
        setErrorMessage(data.error || 'Authentication failed. Please check your credentials.');
        resetSlider();
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Network connection failed. Please retry.');
      resetSlider();
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f8ff] text-[#1e2637] flex flex-col justify-between max-w-md mx-auto relative select-none shadow-2xl">
      {/* 1. Official Apex Coral Header */}
      <div className="bg-gradient-to-r from-[#f95959] via-[#fa6c6c] to-[#ff8579] text-white px-4 pt-3 pb-5 rounded-b-2xl shadow-md">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onBackToHome}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            title="Return to Lobby"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Center Brand Identity */}
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-white text-[#f95959] font-black flex items-center justify-center text-xs shadow-sm">
              A
            </div>
            <span className="font-black italic tracking-tight text-white text-base">
              APEX ARCADE
            </span>
            <span className="text-[8px] font-black bg-amber-400 text-slate-900 px-1 py-0.5 rounded shadow-xs uppercase">
              OFFICIAL
            </span>
          </div>

          <button
            onClick={onOpenSupport || onBackToHome}
            className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            title="Customer Support"
          >
            <Headphones className="w-4 h-4" />
          </button>
        </div>

        {/* Header Title Greeting */}
        <div className="px-1 mt-2">
          <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
            <span>{mode === 'login' ? 'Member Login' : 'Create Account'}</span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </h1>
          <p className="text-xs text-white/90 font-medium mt-0.5">
            {mode === 'login'
              ? 'Please sign in with your registered phone number'
              : 'Join Apex Arcade India and claim ₹25 welcome gift'}
          </p>
        </div>
      </div>

      {/* 2. Main Content Card */}
      <div className="flex-1 px-3 -mt-3 pb-8">
        <div className="bg-white rounded-2xl shadow-sm border border-[#ebedf0] p-4.5">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#f4f5f8] rounded-xl mb-4 border border-[#e5e7eb]">
            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setMode('login');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'login'
                  ? 'bg-gradient-to-r from-[#f95959] to-[#fa6c6c] text-white shadow-sm font-black'
                  : 'text-[#768096] hover:text-slate-800'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Phone Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => {
                soundManager.play('click');
                setMode('register');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                mode === 'register'
                  ? 'bg-gradient-to-r from-[#f95959] to-[#fa6c6c] text-white shadow-sm font-black'
                  : 'text-[#768096] hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Fast Register</span>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Phone Number */}
            <div>
              <label className="text-[11px] font-bold text-[#768096] block mb-1 uppercase tracking-wider">
                Mobile Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1 text-slate-700 font-bold text-xs border-r border-slate-200 pr-2">
                  <span className="text-sm">🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit phone number"
                  className="w-full bg-[#f9fafc] border border-[#e2e5eb] rounded-xl pl-18 pr-3 py-2.5 text-slate-900 font-bold text-xs focus:border-[#f95959] focus:bg-white focus:outline-none transition-colors"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-bold text-[#768096] block mb-1 uppercase tracking-wider">
                Set Password
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (minimum 6 characters)"
                  className="w-full bg-[#f9fafc] border border-[#e2e5eb] rounded-xl pl-9 pr-10 py-2.5 text-slate-900 font-medium text-xs focus:border-[#f95959] focus:bg-white focus:outline-none transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password (Register mode) */}
            {mode === 'register' && (
              <div>
                <label className="text-[11px] font-bold text-[#768096] block mb-1 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    className="w-full bg-[#f9fafc] border border-[#e2e5eb] rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-medium text-xs focus:border-[#f95959] focus:bg-white focus:outline-none transition-colors"
                    required
                  />
                </div>
              </div>
            )}

            {/* Referral / Invite Code (Register mode) */}
            {mode === 'register' && (
              <div>
                <label className="text-[11px] font-bold text-[#768096] block mb-1 uppercase tracking-wider flex items-center justify-between">
                  <span>Invite / Referral Code</span>
                  <span className="text-[#f95959] font-normal lowercase">(optional)</span>
                </label>
                <div className="relative flex items-center">
                  <Gift className="absolute left-3 w-4 h-4 text-amber-500" />
                  <input
                    type="text"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    placeholder="e.g. PILOT01"
                    className="w-full bg-[#f9fafc] border border-[#e2e5eb] rounded-xl pl-9 pr-3 py-2.5 text-slate-900 font-bold text-xs uppercase tracking-wider focus:border-[#f95959] focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Interactive Slide-to-Verify Captcha ("slide wala captcha") */}
            <div className="pt-1">
              <label className="text-[11px] font-bold text-[#768096] block mb-1.5 uppercase tracking-wider flex items-center justify-between">
                <span>Security Slide Verification</span>
                {isSlideVerified && (
                  <span className="text-emerald-600 font-bold flex items-center gap-1 text-[10px]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Verified
                  </span>
                )}
              </label>

              {/* Slider Track */}
              <div
                ref={sliderTrackRef}
                onMouseMove={(e) => isDragging && handleTouchMove(e.clientX)}
                onMouseUp={handleTouchEnd}
                onMouseLeave={handleTouchEnd}
                onTouchMove={(e) => isDragging && handleTouchMove(e.touches[0].clientX)}
                onTouchEnd={handleTouchEnd}
                className={`relative w-full h-11 rounded-xl overflow-hidden border transition-colors flex items-center select-none ${
                  isSlideVerified
                    ? 'bg-emerald-50 border-emerald-400'
                    : 'bg-[#f0f2f7] border-[#d8dce6]'
                }`}
              >
                {/* Green fill progress */}
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all opacity-30"
                  style={{ width: `${sliderPosition}%` }}
                />

                {/* Track label */}
                <span
                  className={`w-full text-center text-[11px] font-bold tracking-wide pointer-events-none ${
                    isSlideVerified ? 'text-emerald-700' : 'text-[#768096]'
                  }`}
                >
                  {isSlideVerified
                    ? '✓ Human Verification Passed'
                    : '>>> Slide right to verify >>>'}
                </span>

                {/* Draggable thumb */}
                <div
                  onMouseDown={handleTouchStart}
                  onTouchStart={handleTouchStart}
                  style={{ left: `calc(${sliderPosition}% * 0.88)` }}
                  className={`absolute top-1 bottom-1 w-10 rounded-lg flex items-center justify-center cursor-pointer shadow-md transition-all ${
                    isSlideVerified
                      ? 'bg-emerald-500 text-white shadow-emerald-400/50'
                      : 'bg-white text-[#f95959] border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {isSlideVerified ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                  )}
                </div>
              </div>

              {/* Fallback Math challenge if user prefers quick math */}
              {!isSlideVerified && (
                <div className="mt-2 p-2 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1 font-mono font-bold text-slate-700">
                    <span>Quick Anti-Bot:</span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-300 text-[#f95959]">
                      {captchaNum1} + {captchaNum2} = ?
                    </span>
                  </div>
                  <input
                    type="number"
                    value={captchaAnswer}
                    onChange={(e) => setCaptchaAnswer(e.target.value)}
                    placeholder="Sum"
                    className="w-16 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-bold text-xs focus:border-[#f95959] focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
                {errorMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-[#f95959] via-[#fa6c6c] to-[#ff8579] hover:brightness-105 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-[#f95959]/25 transition-all flex items-center justify-center gap-2 mt-2"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === 'login' ? (
                <span>Log In to Apex Arcade</span>
              ) : (
                <span>Register & Claim ₹25 Bonus</span>
              )}
            </button>
          </form>

          {/* Quick Switch Prompt */}
          <div className="mt-4 pt-3 border-t border-slate-100 text-center text-xs text-[#768096]">
            {mode === 'login' ? (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                  }}
                  className="text-[#f95959] font-bold hover:underline"
                >
                  Register Now
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMessage(null);
                  }}
                  className="text-[#f95959] font-bold hover:underline"
                >
                  Log In Here
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security & Regulatory Badges */}
        <div className="mt-5 text-center space-y-1 text-[11px] text-[#768096]">
          <div className="flex items-center justify-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-medium">256-Bit Encrypted Indian Network</span>
          </div>
          <p className="text-[10px] text-[#a0a8b9]">
            Certified RNG System • 24x7 Customer Support • Strictly 18+
          </p>
        </div>
      </div>
    </div>
  );
};
