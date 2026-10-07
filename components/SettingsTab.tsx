'use client';

import React, { useState } from 'react';
import {
  Settings,
  ShieldAlert,
  ShieldCheck,
  PauseCircle,
  PlayCircle,
  Mail,
  MessageSquare,
  AlertTriangle,
  Lock,
  Plus,
  RefreshCw,
  CheckCircle2,
  ExternalLink,
  Sparkles,
  Bot,
  Smartphone,
  Send,
  Info,
  Check,
} from 'lucide-react';
import { AppSettings } from '@/lib/types';

interface SettingsTabProps {
  settings: AppSettings | null;
  suppressions: any[];
  suppressionsCount: number;
  resendInfo: { configured: boolean; fromEmail: string };
  smsInfo: { enabled: boolean; reason: string; futureBoundary: string };
  loading: boolean;
  onRefresh: () => void;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  onAddManualSuppression: (email: string) => Promise<void>;
  busy: boolean;
}

export default function SettingsTab({
  settings,
  suppressions,
  suppressionsCount,
  resendInfo,
  smsInfo,
  loading,
  onRefresh,
  onUpdateSettings,
  onAddManualSuppression,
  busy,
}: SettingsTabProps) {
  const [globalPaused, setGlobalPaused] = useState(settings?.global_email_paused ?? true);
  const [dailyLimit, setDailyLimit] = useState(settings?.daily_send_limit ?? 25);
  const [manualEmail, setManualEmail] = useState('');
  const [notice, setNotice] = useState('');

  const [provider, setProvider] = useState<'gmail' | 'resend'>(
    settings?.email_config?.provider === 'resend' ? 'resend' : 'gmail'
  );
  const [gmailUser, setGmailUser] = useState(settings?.email_config?.gmail_user || '');
  const [gmailAppPass, setGmailAppPass] = useState(settings?.email_config?.gmail_app_password || '');
  const [resendApiKey, setResendApiKey] = useState(settings?.email_config?.resend_api_key || '');
  const [resendFromEmail, setResendFromEmail] = useState(settings?.email_config?.resend_from_email || '');
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailStatusMessage, setEmailStatusMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [showAppPassHelp, setShowAppPassHelp] = useState(false);

  React.useEffect(() => {
    if (settings?.email_config) {
      if (settings.email_config.provider) {
        setProvider(settings.email_config.provider === 'resend' ? 'resend' : 'gmail');
      }
      if (settings.email_config.gmail_user) setGmailUser(settings.email_config.gmail_user);
      if (settings.email_config.gmail_app_password) setGmailAppPass(settings.email_config.gmail_app_password);
      if (settings.email_config.resend_api_key) setResendApiKey(settings.email_config.resend_api_key);
      if (settings.email_config.resend_from_email) setResendFromEmail(settings.email_config.resend_from_email);
    }
  }, [settings]);

  async function handleSaveEmailSettings() {
    setEmailStatusMessage(null);
    try {
      await onUpdateSettings({
        email_config: {
          provider,
          gmail_user: gmailUser.trim(),
          gmail_app_password: gmailAppPass.trim(),
          resend_api_key: resendApiKey.trim(),
          resend_from_email: resendFromEmail.trim(),
        },
      });
      setNotice('Email configuration saved successfully.');
    } catch (err: any) {
      setEmailStatusMessage({ ok: false, text: err.message || 'Failed to save settings' });
    }
  }

  async function handleSendTestEmail() {
    setTestingEmail(true);
    setEmailStatusMessage(null);
    try {
      const res = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: testEmailAddress.trim() || gmailUser.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setEmailStatusMessage({ ok: false, text: data.error || 'Failed to send test email' });
      } else {
        setEmailStatusMessage({
          ok: true,
          text: `✓ ${data.message || 'Test email sent successfully! Please check your inbox or spam folder.'}`,
        });
      }
    } catch (err: any) {
      setEmailStatusMessage({ ok: false, text: err.message || 'Network error while sending test email' });
    } finally {
      setTestingEmail(false);
    }
  }

  const currentPaused = settings?.global_email_paused ?? true;

  async function handleTogglePause() {
    const nextVal = !currentPaused;
    try {
      await onUpdateSettings({ global_email_paused: nextVal });
      setGlobalPaused(nextVal);
      setNotice(nextVal ? 'Global outbound email paused.' : 'Global outbound email activated.');
    } catch {
      // Error handled by parent
    }
  }

  async function handleSaveLimit() {
    try {
      await onUpdateSettings({ daily_send_limit: Number(dailyLimit) });
      setNotice(`Daily sending limit updated to ${dailyLimit}.`);
    } catch {
      // Error handled by parent
    }
  }

  async function handleAddSuppression(e: React.FormEvent) {
    e.preventDefault();
    if (!manualEmail.trim()) return;
    try {
      await onAddManualSuppression(manualEmail.trim());
      setManualEmail('');
      setNotice(`Email ${manualEmail} added to central suppression list.`);
    } catch {
      // Error handled by parent
    }
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-bold text-[#3659e3] uppercase tracking-wider">
            Workspace Configuration
          </div>
          <h1 className="text-2xl font-extrabold text-[#172033] tracking-tight">
            Security, Outreach & Suppression Settings
          </h1>
          <p className="text-xs text-slate-500">
            Control outbound delivery safeguards, privacy suppression lists, and sending quotas.
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="p-2.5 bg-white border border-[#e7ebf2] rounded-xl text-slate-600 hover:bg-slate-50 shadow-sm transition-colors"
          title="Refresh settings"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <span>{notice}</span>
          <button onClick={() => setNotice('')} className="font-bold">
            ✕
          </button>
        </div>
      )}

      {/* 1. OUTBOUND EMAIL GLOBAL PAUSE SWITCH */}
      <div className="bg-white border border-[#e7ebf2] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  currentPaused ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                }`}
              >
                {currentPaused ? <PauseCircle size={18} /> : <PlayCircle size={18} />}
              </div>
              <h2 className="text-base font-bold text-[#172033]">Global Outbound Email Switch</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Immediately halts all outgoing email transmission across the entire application. When paused, no user can send any email even if previously approved.
            </p>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={handleTogglePause}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2 ${
              currentPaused
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {currentPaused ? <PlayCircle size={15} /> : <PauseCircle size={15} />}
            <span>{currentPaused ? 'Activate Outreach' : 'Pause All Outbound Email'}</span>
          </button>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 text-xs flex items-center gap-2">
          <span className="font-bold text-slate-700">Current Switch Status:</span>
          <span
            className={`font-extrabold uppercase px-2 py-0.5 rounded-md text-[10px] ${
              currentPaused ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {currentPaused ? 'Outbound Paused (All sending blocked)' : 'Active (Sending permitted with approval)'}
          </span>
        </div>
      </div>

      {/* 2. SENDING LIMITS & RESEND STATUS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily Send Limit */}
        <div className="bg-white border border-[#e7ebf2] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="font-bold text-sm text-[#172033] flex items-center gap-2">
            <ShieldCheck size={16} className="text-[#3659e3]" />
            <span>Conservative Daily Sending Limit</span>
          </div>
          <p className="text-xs text-slate-500">
            Enforces a hard ceiling on total emails transmitted per 24-hour window to protect sender reputation and prevent accidental high-volume dispatch.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="number"
              min="1"
              max="100"
              value={dailyLimit}
              onChange={(e) => setDailyLimit(Number(e.target.value))}
              className="w-24 text-xs font-bold px-3 py-2 border border-slate-300 rounded-xl outline-none"
            />
            <span className="text-xs text-slate-500">emails / 24 hours</span>
            <button
              disabled={busy}
              onClick={handleSaveLimit}
              className="px-4 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-xl transition-colors"
            >
              Update Limit
            </button>
          </div>
        </div>

        {/* Email Sending Configuration & Live Tester */}
        <div className="bg-white border border-[#e7ebf2] rounded-2xl p-5 shadow-sm space-y-4 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="font-bold text-sm text-[#172033] flex items-center gap-2">
                <Mail size={16} className="text-[#3659e3]" />
                <span>Outreach Email Gateway Configuration (Gmail / Resend)</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Send genuine proposal emails from your own Gmail or an authenticated domain.
              </p>
            </div>

            {/* Provider Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setProvider('gmail')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  provider === 'gmail'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Personal Gmail (SMTP)
              </button>
              <button
                type="button"
                onClick={() => setProvider('resend')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  provider === 'resend'
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Resend API
              </button>
            </div>
          </div>

          {emailStatusMessage && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center justify-between ${
                emailStatusMessage.ok
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <span>{emailStatusMessage.text}</span>
              <button onClick={() => setEmailStatusMessage(null)} className="font-bold px-1.5">
                ✕
              </button>
            </div>
          )}

          {provider === 'gmail' ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Your Gmail Address:
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. yourname@gmail.com"
                    value={gmailUser}
                    onChange={(e) => setGmailUser(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Google App Password (16 Letters):
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAppPassHelp(!showAppPassHelp)}
                      className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Info size={12} />
                      <span>{showAppPassHelp ? 'Hide guide' : 'Kaise banaye?'}</span>
                    </button>
                  </div>
                  <input
                    type="password"
                    placeholder="16-character app password (e.g. abcd efgh ijkl mnop)"
                    value={gmailAppPass}
                    onChange={(e) => setGmailAppPass(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              {showAppPassHelp && (
                <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 space-y-1.5 leading-relaxed">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>📌 Personal Gmail se email bhejne ke liye 1-minute setup:</span>
                  </div>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] text-blue-800">
                    <li>
                      Apne Google Account me jayein: <strong>myaccount.google.com/security</strong>
                    </li>
                    <li>
                      <strong>2-Step Verification</strong> ON karein (agar pehle se ON nahi hai).
                    </li>
                    <li>
                      Search box me type karein <strong>&quot;App passwords&quot;</strong> (ya Security me App passwords khole).
                    </li>
                    <li>
                      App name me likhein <strong>&quot;Papa Transport&quot;</strong> aur &quot;Create&quot; button dabayein.
                    </li>
                    <li>
                      Jo <strong>16-digit code</strong> (yellow box me) dikhega, usko copy karke yahan paste karein aur Save dabayein!
                    </li>
                  </ol>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Resend API Key:
                </label>
                <input
                  type="password"
                  placeholder="re_xxxxxxxxxxxxxxxxx"
                  value={resendApiKey}
                  onChange={(e) => setResendApiKey(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Verified Sender Address:
                </label>
                <input
                  type="email"
                  placeholder="e.g. dispatch@papatransport.com"
                  value={resendFromEmail}
                  onChange={(e) => setResendFromEmail(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={handleSaveEmailSettings}
              className="px-4 py-2 bg-[#3659e3] hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5"
            >
              <Check size={14} />
              <span>Save Email Settings</span>
            </button>

            {/* Test Email Trigger */}
            <div className="flex items-center gap-2">
              <input
                type="email"
                placeholder={gmailUser || 'Send test email to address...'}
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                className="w-48 text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none"
              />
              <button
                type="button"
                disabled={testingEmail || busy}
                onClick={handleSendTestEmail}
                className="px-3 py-2 bg-slate-800 hover:bg-black text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0"
              >
                <Send size={13} className={testingEmail ? 'animate-spin' : ''} />
                <span>{testingEmail ? 'Sending...' : 'Send Test Email'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* AI Autonomous Lead Scout Configuration */}
        <div className="bg-white border border-[#e7ebf2] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="font-bold text-sm text-[#172033] flex items-center gap-2">
            <Bot size={16} className="text-indigo-600" />
            <span>AI Autonomous Lead Scout</span>
          </div>
          <p className="text-xs text-slate-500">
            Autonomous agent that researches and auto-generates verified Delhi NCR B2B leads needing Tata Ace freight transit.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Scout Engine:</span>
              <strong className="text-slate-800">Delhi NCR Logistics Hub Engine (40+ clusters)</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">LLM Mode:</span>
              <span className="font-bold text-emerald-600">OpenAI / Gemini Ready + Built-in Fallback</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Autonomous Actions:</span>
              <span className="text-slate-700">Deduplication + Auto-Draft + Follow-up schedule</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. CENTRAL SUPPRESSION LIST MANAGER */}
      <div className="bg-white border border-[#e7ebf2] rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="font-bold text-sm text-[#172033] flex items-center gap-2">
              <ShieldAlert size={16} className="text-red-500" />
              <span>Central Suppression List ({suppressionsCount} Records)</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Permanently blocks sending to unsubscribed, bounced, or complaining recipients. Survives lead deletion and CSV re-imports.
            </p>
          </div>
        </div>

        {/* MANUAL SUPPRESSION FORM */}
        <form onSubmit={handleAddSuppression} className="flex items-center gap-2 max-w-md">
          <input
            type="email"
            required
            placeholder="Manual suppression: email@company.com"
            value={manualEmail}
            onChange={(e) => setManualEmail(e.target.value)}
            className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded-xl outline-none focus:border-red-400"
          />
          <button
            type="submit"
            disabled={busy || !manualEmail.trim()}
            className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Suppress</span>
          </button>
        </form>

        {/* SUPPRESSIONS TABLE */}
        <div className="border border-slate-100 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
          {suppressions.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-xs">
              No emails currently suppressed. Opt-out links and bounces will appear here.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {suppressions.map((s) => (
                <div key={s.id} className="p-3 flex items-center justify-between gap-3 bg-slate-50/50">
                  <div className="font-semibold text-slate-800">{s.email}</div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                    <span className="capitalize font-medium text-red-600">
                      Reason: {s.reason.replace('_', ' ')}
                    </span>
                    <span>
                      {new Date(s.created_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 4. ANDROID PHONE + SIM SMS GATEWAY */}
      <div className="bg-white border border-[#e7ebf2] rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <div>
              <div className="font-bold text-sm text-[#172033] flex items-center gap-2">
                <span>Android Phone + SIM SMS Gateway</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Ready & Integrated
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Dispatches automated SMS follow-ups through your paired Android phone&apos;s physical SIM card
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2 leading-relaxed">
          <div className="font-semibold text-[#172033] flex items-center gap-1.5">
            <Smartphone size={14} className="text-blue-600" />
            <span>How to use your phone as an SMS Gateway:</span>
          </div>
          <p>
            You can pair any Android phone running our companion app. The web dashboard safely queues SMS jobs into the database, and your phone sends them via SIM 1 or SIM 2 with zero third-party SMS costs.
          </p>
          <div className="pt-2 flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Go to the dedicated tab in the left sidebar / bottom nav:</span>
            <strong className="text-blue-600 text-xs">📱 SMS Gateway</strong>
          </div>
        </div>
      </div>
    </div>
  );
}
