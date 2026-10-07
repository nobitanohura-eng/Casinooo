'use client';

import React, { useState } from 'react';
import { Truck, ArrowRight, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';

export default function Login() {
  const [pin, setPin] = useState('1234');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleLogin(e?: React.FormEvent, directPin?: string) {
    if (e) e.preventDefault();
    setBusy(true);
    setError('');

    const pinToSubmit = directPin !== undefined ? directPin : pin;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToSubmit }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Login failed. Please check the PIN.');
      }

      // Successfully authenticated
      window.location.href = '/';
    } catch (err: any) {
      setError(err?.message || 'Could not connect. Please try again.');
      setBusy(false);
    }
  }

  return (
    <main className="login-shell min-h-screen bg-[#f5f7fb] flex items-center justify-center p-4">
      <div className="login-card bg-white border border-[#e7ebf2] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-xl">
        {/* Brand header */}
        <div className="login-brand flex items-center gap-3.5 mb-6">
          <div className="brand-icon w-12 h-12 rounded-2xl bg-blue-50 text-[#3659e3] flex items-center justify-center shrink-0 shadow-sm border border-blue-100">
            <Truck size={26} />
          </div>
          <div>
            <b className="text-xl font-extrabold text-[#172033] block tracking-tight">NCR Transport</b>
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase block">
              DELHI NCR LOGISTICS CRM
            </span>
          </div>
        </div>

        {/* Heading */}
        <div className="login-heading mb-6">
          <h1 className="text-2xl font-black text-[#172033] tracking-tight">Owner Workspace</h1>
          <p className="text-xs text-slate-500 mt-1">
            Chota Hathi (Tata Ace) local logistics management in Noida & Delhi NCR.
          </p>
        </div>

        {/* Quick Access for Papa */}
        <div className="quick-access-box bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 mb-5">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 mb-1">
            <Sparkles size={16} className="text-blue-600" />
            <span>Papa Direct Access</span>
          </div>
          <p className="text-[11px] text-blue-700/80 mb-3">
            Click below to instantly open your transport dashboard without typing.
          </p>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleLogin(undefined, '1234')}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#3659e3] hover:bg-[#2848c7] text-white text-xs sm:text-sm font-extrabold rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
          >
            <span>{busy ? 'Opening…' : '🚚 Enter Transport Dashboard'}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        <div className="relative flex items-center justify-center my-5">
          <div className="border-t border-slate-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            or enter pin
          </span>
        </div>

        {/* PIN Form */}
        <form onSubmit={handleLogin} className="login-form space-y-4">
          <label className="block text-xs font-bold text-slate-700">
            Security PIN
            <div className="relative mt-1">
              <KeyRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                required
                type="password"
                inputMode="numeric"
                maxLength={8}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1234"
                className="w-full text-center text-lg font-bold tracking-widest pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl outline-none focus:border-[#3659e3] focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </label>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <span className="font-medium">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
          >
            <ShieldCheck size={16} />
            <span>{busy ? 'Verifying…' : 'Unlock with PIN'}</span>
          </button>

          <p className="privacy-note text-[11px] text-slate-400 text-center leading-relaxed pt-2">
            Default PIN is <strong>1234</strong>. Zero external accounts needed. Works directly on Render & mobile.
          </p>
        </form>
      </div>
    </main>
  );
}
