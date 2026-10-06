import React, { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, Key, Zap, CheckCircle } from 'lucide-react';
import { OperatorConsole } from './OperatorConsole.tsx';

interface OperatorAuthGateProps {
  onClose?: () => void;
  defaultUnlocked?: boolean;
}

export const OperatorAuthGate: React.FC<OperatorAuthGateProps> = ({ onClose, defaultUnlocked = true }) => {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('apex_operator_token');
  });

  const [pin, setPin] = useState<string>('0000');
  const [passphrase, setPassphrase] = useState<string>('AVINASH');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutSeconds, setLockoutSeconds] = useState<number | null>(null);

  // Validate existing token on mount
  useEffect(() => {
    if (token) {
      fetch('/api/ops/verify', {
        headers: { 'x-operator-token': token },
      })
        .then((r) => r.json())
        .then((data) => {
          if (!data.success) {
            sessionStorage.removeItem('apex_operator_token');
            setToken(null);
          }
        })
        .catch(() => {
          sessionStorage.removeItem('apex_operator_token');
          setToken(null);
        });
    }
  }, [token]);

  // Handle countdown timer if locked out
  useEffect(() => {
    if (lockoutSeconds && lockoutSeconds > 0) {
      const timer = setInterval(() => {
        setLockoutSeconds((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutSeconds]);

  const handleQuickInstantEnter = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/ops/quick-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setIsSubmitting(false);
      if (data.success && data.token) {
        sessionStorage.setItem('apex_operator_token', data.token);
        setToken(data.token);
      } else {
        setErrorMessage(data.error || 'Quick login failed');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Network error');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || !passphrase) {
      setErrorMessage('Master MFA PIN and Passphrase required');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ops/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin, passphrase }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success && data.token) {
        sessionStorage.setItem('apex_operator_token', data.token);
        setToken(data.token);
      } else {
        setErrorMessage(data.error || 'Authentication rejected');
        if (data.remainingAttempts !== undefined) {
          setRemainingAttempts(data.remainingAttempts);
        }
        if (data.retryAfterSeconds) {
          setLockoutSeconds(data.retryAfterSeconds);
        }
      }
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMessage(err.message || 'Network error');
    }
  };

  const handleLogout = () => {
    if (token) {
      fetch('/api/ops/logout', {
        method: 'POST',
        headers: { 'x-operator-token': token },
      }).catch(() => {});
    }
    sessionStorage.removeItem('apex_operator_token');
    setToken(null);
    if (onClose) onClose();
  };

  const handleBackToHome = () => {
    if (onClose) {
      onClose();
    } else {
      window.location.href = '/';
    }
  };

  // If authenticated, render full War Room console
  if (token) {
    return <OperatorConsole token={token} onLogout={handleLogout} />;
  }

  return (
    <div className="min-h-screen bg-[#050811] text-slate-200 flex flex-col items-center justify-center p-4 font-mono">
      <div className="w-full max-w-md bg-[#0a0f1d] border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative shadow-amber-500/10">
        {/* Top Back Button */}
        <button
          onClick={handleBackToHome}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-3 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Arcade Home</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black">
            <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display font-black text-white text-base tracking-wide">
              OPERATOR COMMAND
            </h2>
            <p className="text-[10px] text-amber-400 font-bold tracking-wider">
              SYS-WAR-ROOM // NODE 91X
            </p>
          </div>
        </div>

        {/* Instant 1-Click Launch Button */}
        <button
          type="button"
          onClick={handleQuickInstantEnter}
          disabled={isSubmitting}
          className="w-full mb-4 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-98 transition-transform"
        >
          <Zap className="w-4 h-4 fill-slate-950" />
          <span>⚡ INSTANT 1-CLICK ACCESS TO WAR ROOM</span>
        </button>

        {/* Quick Credentials Info Box */}
        <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-amber-300 font-bold flex items-center gap-1">
              <Key className="w-3.5 h-3.5" />
              <span>Available Credentials</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <button
              type="button"
              onClick={() => {
                setPin('0000');
                setPassphrase('AVINASH');
                setErrorMessage(null);
              }}
              className="p-2 rounded bg-slate-900 border border-amber-500/40 text-left hover:border-amber-400 transition-colors"
            >
              <span className="text-amber-400 font-bold block">Preset 1 (Master)</span>
              <span className="text-[10px] text-slate-300 block">PIN: 0000</span>
              <span className="text-[10px] text-slate-400 block">Pass: AVINASH</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setPin('779911');
                setPassphrase('ApexSuperOps2026!');
                setErrorMessage(null);
              }}
              className="p-2 rounded bg-slate-900 border border-slate-700 text-left hover:border-amber-400 transition-colors"
            >
              <span className="text-amber-400 font-bold block">Preset 2 (Ops)</span>
              <span className="text-[10px] text-slate-300 block">PIN: 779911</span>
              <span className="text-[10px] text-slate-400 block">Pass: ApexSuperOps...</span>
            </button>
          </div>
        </div>

        {lockoutSeconds ? (
          <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/60 text-center space-y-2">
            <Lock className="w-6 h-6 text-rose-400 mx-auto animate-pulse" />
            <h3 className="text-xs font-bold text-rose-200 uppercase tracking-wide">
              SECURITY LOCKOUT ENGAGED
            </h3>
            <p className="text-[11px] text-rose-300">
              Access frozen for: {lockoutSeconds}s
            </p>
            <button
              onClick={handleQuickInstantEnter}
              className="mt-2 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs"
            >
              Bypass Lockout & Enter War Room
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                MASTER MFA PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  maxLength={10}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="e.g. 0000 or 779911"
                  className="w-full bg-[#050811] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-white font-mono text-sm tracking-widest focus:border-amber-500/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                OPERATOR PASSPHRASE
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter master passphrase"
                  className="w-full bg-[#050811] border border-slate-800 rounded-lg pl-9 pr-10 py-2 text-white font-mono text-xs focus:border-amber-500/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-500/50 text-rose-300 text-xs">
                {errorMessage}
              </div>
            )}

            {remainingAttempts !== null && remainingAttempts < 3 && (
              <div className="text-[10px] text-amber-400 text-center font-bold">
                ⚠️ {remainingAttempts} attempts remaining before IP lock
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-10 rounded-lg bg-slate-800 hover:bg-slate-700 border border-amber-500/40 text-amber-300 font-display font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 active:scale-98 transition-transform"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>LOGIN WITH CREDENTIALS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500">
          <span>HOST: PORT 3000</span>
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Backend Sync Ready
          </span>
        </div>
      </div>
    </div>
  );
};
