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

        {/* Resend Provider Configuration */}
        <div className="bg-white border border-[#e7ebf2] rounded-2xl p-5 shadow-sm space-y-3">
          <div className="font-bold text-sm text-[#172033] flex items-center gap-2">
            <Mail size={16} className="text-[#3659e3]" />
            <span>Verified Resend Sending Address</span>
          </div>
          <p className="text-xs text-slate-500">
            Emails are delivered through Resend using the authenticated domain configured in your environment.
          </p>

          <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Sending Address:</span>
              <strong className="text-slate-800">{resendInfo.fromEmail}</strong>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-400">API Key Configured:</span>
              <span className={`font-bold ${resendInfo.configured ? 'text-emerald-600' : 'text-amber-600'}`}>
                {resendInfo.configured ? 'Yes (Server-side)' : 'Pending environment setup'}
              </span>
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

      {/* 4. DISABLED SMS INTEGRATION SECTION (PREPARE, DO NOT FAKE) */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 opacity-90">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center">
              <MessageSquare size={16} />
            </div>
            <div>
              <div className="font-bold text-sm text-[#172033] flex items-center gap-2">
                <span>Indian Commercial SMS Gateway (TRAI / DLT)</span>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  Disabled / Not Configured
                </span>
              </div>
              <div className="text-xs text-slate-500">
                Regulatory boundary for future commercial SMS outreach in Delhi NCR
              </div>
            </div>
          </div>
          <Lock size={18} className="text-slate-400" />
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2 leading-relaxed">
          <div className="font-semibold text-[#172033] flex items-center gap-1.5">
            <AlertTriangle size={14} className="text-amber-500" />
            <span>Why SMS is disabled in this release:</span>
          </div>
          <p>
            Under Indian Telecom Regulatory Authority (TRAI) Telecom Commercial Communications Customer Preference Regulations (TCCCPR), any commercial B2B/B2C SMS requires:
          </p>
          <ul className="list-disc list-inside space-y-1 pl-2 text-slate-500">
            <li>Enterprise entity registration on a certified DLT portal (e.g., Jio, Airtel, Vodafone-Idea, or BSNL).</li>
            <li>Approved Sender Header / Sender ID (e.g., 6-character Alpha header).</li>
            <li>Pre-registered and scrubbed content templates matching exact outreach wording.</li>
            <li>Demonstrable verifiable commercial consent.</li>
          </ul>
          <p className="pt-1 text-[11px] text-slate-400 border-t border-slate-100">
            <strong>Future Integration Boundary:</strong> Once DLT entity approval and template IDs are secured, a dedicated webhook/API connector to a licensed Indian SMS provider or an authorized local Android phone gateway can be safely plugged in here without exposing Android credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
