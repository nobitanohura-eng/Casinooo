'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { Truck, Mail, ArrowRight, ShieldAlert } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'not_allowed') {
        setError('This email address is not in the authorized workspace allowlist.');
      }
    }
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { error: signInErr } = await createClient().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: `${location.origin}/auth/callback` },
      });
      if (signInErr) throw signInErr;
      setSent(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send sign-in link');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-shell min-h-screen bg-[#f5f7fb] flex items-center justify-center p-4">
      <div className="login-card bg-white border border-[#e7ebf2] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-lg">
        <div className="login-brand flex items-center gap-3 mb-6">
          <div className="brand-icon w-11 h-11 rounded-2xl bg-blue-50 text-[#3659e3] flex items-center justify-center">
            <Truck size={23} />
          </div>
          <div>
            <b className="text-lg font-extrabold text-[#172033] block">Papa Transport</b>
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block">
              DELHI NCR LOGISTICS CRM
            </span>
          </div>
        </div>

        <div className="login-heading mb-6">
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight">Welcome back</h1>
          <p className="text-xs text-slate-500 mt-1">
            Sign in with your email to manage business leads and approved outreach.
          </p>
        </div>

        {sent ? (
          <div className="login-success text-center py-6 space-y-3">
            <div className="success-circle w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Mail size={24} />
            </div>
            <h2 className="text-lg font-bold text-[#172033]">Check your inbox</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              A secure sign-in magic link has been sent to <strong>{email}</strong>. Only authorized emails in your allowlist can access the workspace.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="login-form space-y-4">
            <label className="block text-xs font-bold text-slate-700">
              Email address
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@papatransport.com"
                className="w-full text-xs sm:text-sm px-3.5 py-2.5 mt-1 border border-slate-200 rounded-xl outline-none focus:border-[#3659e3]"
              />
            </label>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#3659e3] hover:bg-[#2848c7] text-white text-xs font-bold rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              <span>{busy ? 'Sending link…' : 'Send secure sign-in link'}</span>
              <ArrowRight size={16} />
            </button>

            <p className="privacy-note text-[11px] text-slate-400 text-center leading-relaxed pt-2">
              Private small-business workspace. Passwordless and secured by Supabase Auth.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
