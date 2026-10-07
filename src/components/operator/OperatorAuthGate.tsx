import React, { useState, useEffect } from 'react';
import { ShieldAlert, KeyRound, Lock, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { OperatorConsole } from './OperatorConsole.tsx';

interface OperatorAuthGateProps {
  onClose?: () => void;
}

export const OperatorAuthGate: React.FC<OperatorAuthGateProps> = ({ onClose }) => {
  const [token, setToken] = useState<string | null>(() => {
    return sessionStorage.getItem('apex_operator_token');
  });

  const [pin, setPin] = useState<string>('');
  const [passphrase, setPassphrase] = useState<string>('');
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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin || !passphrase) {
      setErrorMessage('Master 6-Digit PIN and Passphrase required');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ops/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pin.trim(), passphrase: passphrase.trim() }),
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
        if (data.lockoutSeconds) {
          setLockoutSeconds(data.lockoutSeconds);
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
    <div className="min-h-screen bg-[#050811] text-slate-200 flex flex-col items-center justify-center p-4 font-mono select-none">
      <div className="w-full max-w-md bg-[#0a0f1d] border border-amber-500/30 rounded-2xl p-6 shadow-2xl relative shadow-amber-500/10">
        {/* Top Back Button */}
        <button
          onClick={handleBackToHome}
          className="text-xs text-slate-400 hover:text-white flex items-center gap-1 mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Arcade Home</span>
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/20 font-black">
            <ShieldAlert className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2 className="font-display font-black text-white text-base tracking-wide">
              STEALTH OPERATOR COMMAND
            </h2>
            <p className="text-[10px] text-amber-400 font-bold tracking-wider">
              AUTHORIZED PERSONNEL ONLY // NODE 91X
            </p>
          </div>
        </div>

        {lockoutSeconds ? (
          <div className="p-5 rounded-xl bg-rose-950/80 border border-rose-500/60 text-center space-y-3">
            <Lock className="w-8 h-8 text-rose-400 mx-auto animate-pulse" />
            <h3 className="text-sm font-bold text-rose-200 uppercase tracking-wide">
              BRUTE-FORCE LOCKOUT ACTIVE
            </h3>
            <p className="text-xs text-rose-300">
              Maximum failed attempts exceeded. Security cool-off active:
            </p>
            <div className="text-xl font-bold font-mono text-rose-400">
              {Math.floor(lockoutSeconds / 60)}m {lockoutSeconds % 60}s
            </div>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                MASTER 6-DIGIT PIN
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  maxLength={6}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  autoFocus
                  className="w-full bg-[#050811] border border-slate-800 rounded-lg pl-9 pr-3 py-2.5 text-white font-mono text-base tracking-widest focus:border-amber-500/60 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                ADMINISTRATIVE PASSPHRASE
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type={showPassphrase ? 'text' : 'password'}
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Enter security passphrase"
                  className="w-full bg-[#050811] border border-slate-800 rounded-lg pl-9 pr-10 py-2.5 text-white font-mono text-xs focus:border-amber-500/60 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassphrase(!showPassphrase)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs">
                <span>{errorMessage}</span>
                {remainingAttempts !== null && remainingAttempts > 0 && (
                  <span className="block mt-1 text-[10px] text-rose-400 font-bold">
                    Remaining attempts before lockout: {remainingAttempts}
                  </span>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || !pin || !passphrase}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <span>{isSubmitting ? 'VERIFYING CREDENTIALS...' : 'AUTHENTICATE & ENTER'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
          <p className="text-[10px] text-slate-500">
            256-Bit Cryptographic Authorization Gate • All access attempts logged with IP & timestamp.
          </p>
        </div>
      </div>
    </div>
  );
};
