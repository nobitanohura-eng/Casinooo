'use client';

import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Signal,
  Battery,
  BatteryCharging,
  Play,
  Pause,
  RefreshCw,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  QrCode,
  ShieldAlert,
  Sliders,
  RotateCcw,
  XCircle,
  HelpCircle,
  PhoneCall,
  Loader2,
} from 'lucide-react';
import { SmsDevice, SmsJob, SmsSettings, SmsTemplate } from '@/lib/types';

export default function SmsGatewayTab() {
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [dailyUsage, setDailyUsage] = useState({ sent_today: 0, daily_limit: 50, remaining: 50 });
  const [counts, setCounts] = useState({ queued: 0, claimed: 0, sent: 0, delivered: 0, failed: 0, unknown: 0, total: 0 });
  const [devices, setDevices] = useState<SmsDevice[]>([]);
  const [activeDevice, setActiveDevice] = useState<SmsDevice | null>(null);
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [jobs, setJobs] = useState<SmsJob[]>([]);
  const [jobFilter, setJobFilter] = useState<string>('all');

  // Modals & Action States
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [pairingData, setPairingData] = useState<{ pin: string; server_url: string; expires_at: string } | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testPhone, setTestPhone] = useState('');
  const [testConfirmed, setTestConfirmed] = useState(false);
  const [testSending, setTestSending] = useState(false);

  // Direct Android Phone Gateway App State (From User's Phone: sms-gate.app)
  const [phoneGatewayHealth, setPhoneGatewayHealth] = useState<{
    online: boolean;
    battery: number | null;
    charging: boolean;
    version: string | null;
    statusText: string;
    latencyMs: number;
    baseUrl: string;
  } | null>(null);
  const [phoneGatewayConfig, setPhoneGatewayConfig] = useState<{
    baseUrl: string;
    username: string;
    simNumber: number;
    enabled: boolean;
  } | null>(null);
  const [isPhoneConfigModalOpen, setIsPhoneConfigModalOpen] = useState(false);
  const [phoneIpInput, setPhoneIpInput] = useState('http://10.108.104.59:8080');
  const [phoneUserInput, setPhoneUserInput] = useState('sms');
  const [phonePassInput, setPhonePassInput] = useState('Tz3tO82d');
  const [phoneSimInput, setPhoneSimInput] = useState(1);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadGatewayData();
    const interval = setInterval(loadGatewayData, 8000); // 8s auto refresh
    return () => clearInterval(interval);
  }, []);

  async function loadGatewayData() {
    try {
      const res = await fetch('/api/sms/gateway');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSettings(data.settings);
      setDailyUsage(data.daily_usage);
      setCounts(data.counts);
      setDevices(data.devices);
      setActiveDevice(data.active_device);
      setTemplates(data.templates);
      setJobs(data.recent_jobs);

      // Fetch Direct Phone Gateway Status
      try {
        const pgRes = await fetch('/api/sms/phone-gateway');
        if (pgRes.ok) {
          const pgData = await pgRes.json();
          setPhoneGatewayHealth(pgData.health);
          setPhoneGatewayConfig(pgData.config);
          if (pgData.rawConfig) {
            setPhoneIpInput(pgData.rawConfig.baseUrl || 'http://10.108.104.59:8080');
            setPhoneUserInput(pgData.rawConfig.username || 'sms');
            setPhoneSimInput(pgData.rawConfig.simNumber || 1);
          }
        }
      } catch (e) {
        console.error('Failed to load phone gateway:', e);
      }

      setError('');
    } catch (err: any) {
      console.error('Failed to load SMS gateway:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleGateway(enable: boolean) {
    setBusy(true);
    try {
      const res = await fetch('/api/sms/gateway', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ enabled: enable }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSettings(data.settings);
      setNotice(enable ? 'SMS Gateway Resumed! Pending jobs will be dispatched.' : 'SMS Gateway Paused.');
      setTimeout(() => setNotice(''), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdateFollowupMode(mode: string) {
    setBusy(true);
    try {
      const res = await fetch('/api/sms/gateway', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ followup_mode: mode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSettings(data.settings);
      setNotice('Follow-up sequence rule updated.');
      setTimeout(() => setNotice(''), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleStartPairing() {
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/sms/pair/start', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPairingData(data);
      setIsPairModalOpen(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleRevokeDevice(deviceId: string) {
    if (!confirm('Are you sure you want to disconnect and revoke this phone?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/sms/devices/${deviceId}/revoke`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotice('Device disconnected.');
      loadGatewayData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSavePhoneConfig() {
    setBusy(true);
    try {
      const res = await fetch('/api/sms/phone-gateway', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          baseUrl: phoneIpInput.trim(),
          username: phoneUserInput.trim(),
          password: phonePassInput.trim(),
          simNumber: Number(phoneSimInput),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setPhoneGatewayHealth(data.health);
      setPhoneGatewayConfig(data.config);
      setNotice('Phone SMS Gateway configuration saved!');
      setIsPhoneConfigModalOpen(false);
      setTimeout(() => setNotice(''), 4000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleSendTestSms() {
    if (!testConfirmed) {
      setError('Please check the confirmation box before sending test SMS.');
      return;
    }
    setTestSending(true);
    setError('');
    try {
      if (phoneGatewayHealth?.online) {
        const res = await fetch('/api/sms/phone-gateway', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: testPhone,
            message: `[Test SMS] NCR Transport Logistics Gateway verification. Sent from your Android Phone SIM on ${new Date().toLocaleTimeString('en-IN')}.`,
            simNumber: phoneSimInput,
            confirm: true,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setNotice(`✓ SMS dispatched directly through your Android phone! Message ID: ${data.messageId}`);
        setIsTestModalOpen(false);
        setTestPhone('');
        setTestConfirmed(false);
        loadGatewayData();
        return;
      }

      const res = await fetch('/api/sms/test', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone_number: testPhone,
          confirm: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setNotice(data.message);
      setIsTestModalOpen(false);
      setTestPhone('');
      setTestConfirmed(false);
      loadGatewayData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTestSending(false);
    }
  }

  async function handleJobAction(action: 'approve' | 'retry' | 'cancel', jobId: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/sms/jobs/${jobId}/${action}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setNotice(data.message || `Job ${action} successful.`);
      setTimeout(() => setNotice(''), 3000);
      loadGatewayData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  const filteredJobs = jobs.filter((j) => (jobFilter === 'all' ? true : j.status === jobFilter));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500">
        <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
        <span className="text-sm font-semibold">Loading SMS Gateway & Phone status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Notices */}
      {notice && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-800 text-xs font-semibold flex items-center gap-2 shadow-sm animate-fadeIn">
          <AlertTriangle size={16} className="text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* TOP HEADER & CONTROLS */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shadow-inner">
            <Smartphone size={26} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-slate-900">Android SIM SMS Gateway</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  settings?.enabled
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-amber-100 text-amber-700'
                }`}
              >
                {settings?.enabled ? 'Active' : 'Paused'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Sends automated B2B follow-ups through your paired Android phone&apos;s SIM card
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {settings?.enabled ? (
            <button
              onClick={() => handleToggleGateway(false)}
              disabled={busy}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <Pause size={14} />
              <span>Pause SMS</span>
            </button>
          ) : (
            <button
              onClick={() => handleToggleGateway(true)}
              disabled={busy}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition"
            >
              <Play size={14} />
              <span>Resume SMS</span>
            </button>
          )}

          <button
            onClick={() => setIsTestModalOpen(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
          >
            <Send size={14} />
            <span>Test My Number</span>
          </button>

          <button
            onClick={handleStartPairing}
            disabled={busy}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition"
          >
            <QrCode size={14} />
            <span>Pair Android Phone</span>
          </button>
        </div>
      </div>

      {/* DEVICE STATUS & METRICS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: Connected Phone Status (Direct Android Gateway or Paired Companion) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Connected Android Phone</span>
            <span
              className={`flex items-center gap-1.5 font-bold ${
                phoneGatewayHealth?.online || activeDevice ? 'text-emerald-600' : 'text-slate-400'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  phoneGatewayHealth?.online || activeDevice ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
              />
              {phoneGatewayHealth?.online || activeDevice ? 'Online & Ready' : 'No Phone Connected'}
            </span>
          </div>

          {phoneGatewayHealth?.online ? (
            <div className="space-y-2">
              <div className="font-extrabold text-slate-900 text-base flex items-center justify-between">
                <span>Android SMS Gateway</span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  Direct SIM Active
                </span>
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Server IP:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {phoneGatewayHealth.baseUrl.replace('http://', '')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Active SIM Slot:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const newSlot = phoneSimInput === 1 ? 2 : 1;
                        setPhoneSimInput(newSlot);
                        fetch('/api/sms/phone-gateway', {
                          method: 'PATCH',
                          headers: { 'content-type': 'application/json' },
                          body: JSON.stringify({ simNumber: newSlot }),
                        });
                        setNotice(`Switched default to SIM ${newSlot}`);
                        setTimeout(() => setNotice(''), 3000);
                      }}
                      className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded text-[11px] border border-blue-200 transition"
                      title="Click to toggle SIM 1 / SIM 2"
                    >
                      SIM {phoneSimInput} (Click to toggle)
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span>Battery Level:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    {phoneGatewayHealth.charging ? (
                      <BatteryCharging size={14} className="text-emerald-500" />
                    ) : (
                      <Battery size={14} />
                    )}
                    {phoneGatewayHealth.battery ?? '—'}% {phoneGatewayHealth.charging ? '(Charging)' : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Connection:</span>
                  <span className="font-semibold text-emerald-600">
                    Active Wi-Fi ({phoneGatewayHealth.latencyMs}ms)
                  </span>
                </div>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTestModalOpen(true)}
                  className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition text-center"
                >
                  Send Test SMS
                </button>
                <button
                  type="button"
                  onClick={() => setIsPhoneConfigModalOpen(true)}
                  className="py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Config
                </button>
              </div>
            </div>
          ) : activeDevice ? (
            <div className="space-y-2">
              <div className="font-extrabold text-slate-900 text-base">
                {activeDevice.device_name}
              </div>
              <div className="text-xs text-slate-500 space-y-1">
                <div className="flex items-center justify-between">
                  <span>Dispatch SIM:</span>
                  <span className="font-semibold text-slate-800">
                    {activeDevice.sim_carrier || 'SIM 1'} (Slot {activeDevice.selected_sim_slot + 1})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Battery Level:</span>
                  <span className="font-semibold text-slate-800 flex items-center gap-1">
                    {activeDevice.is_charging ? <BatteryCharging size={14} className="text-emerald-500" /> : <Battery size={14} />}
                    {activeDevice.battery_level}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Last Seen:</span>
                  <span className="font-semibold text-slate-800">
                    {new Date(activeDevice.last_seen_at).toLocaleTimeString('en-IN')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleRevokeDevice(activeDevice.id)}
                className="w-full mt-2 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-[11px] rounded-lg transition"
              >
                Disconnect & Revoke Phone
              </button>
            </div>
          ) : (
            <div className="py-4 text-center space-y-2">
              <p className="text-xs text-slate-500">
                Phone Gateway not responding or disconnected. Check if SMS Gateway service is running on phone.
              </p>
              <div className="flex items-center justify-center gap-2 pt-1">
                <button
                  onClick={() => setIsPhoneConfigModalOpen(true)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition"
                >
                  Edit Phone IP
                </button>
                <button
                  onClick={handleStartPairing}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-lg transition"
                >
                  Pairing PIN
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Card 2: Daily SIM Limit Gauge */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
            <span>Daily SIM Safety Gauge</span>
            <span className="text-slate-400">Personal SIM Protection</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-extrabold text-slate-900">
                {dailyUsage.sent_today}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                / {dailyUsage.daily_limit} max per day
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  dailyUsage.sent_today / dailyUsage.daily_limit > 0.8
                    ? 'bg-amber-500'
                    : 'bg-blue-600'
                }`}
                style={{
                  width: `${Math.min(100, (dailyUsage.sent_today / dailyUsage.daily_limit) * 100)}%`,
                }}
              />
            </div>

            <p className="text-[11px] text-slate-500">
              {dailyUsage.remaining} SMS remaining today. Limit keeps your SIM safely below telecom spam thresholds.
            </p>
          </div>
        </div>

        {/* Card 3: Queue & Delivery Status Counters */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            SMS Queue Overview
          </div>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl">
              <div className="text-lg font-extrabold text-blue-700">{counts.queued}</div>
              <div className="text-[10px] font-bold text-blue-600 uppercase">Queued / Pending</div>
            </div>
            <div className="p-2.5 bg-emerald-50/70 border border-emerald-100 rounded-xl">
              <div className="text-lg font-extrabold text-emerald-700">{counts.sent}</div>
              <div className="text-[10px] font-bold text-emerald-600 uppercase">Sent via SIM</div>
            </div>
            <div className="p-2.5 bg-purple-50/70 border border-purple-100 rounded-xl">
              <div className="text-lg font-extrabold text-purple-700">{counts.delivered}</div>
              <div className="text-[10px] font-bold text-purple-600 uppercase">Delivered</div>
            </div>
            <div className="p-2.5 bg-red-50/70 border border-red-100 rounded-xl">
              <div className="text-lg font-extrabold text-red-700">{counts.failed}</div>
              <div className="text-[10px] font-bold text-red-600 uppercase">Failed / Error</div>
            </div>
          </div>
        </div>
      </div>

      {/* SEQUENCE SETTINGS & FOLLOW-UP RULES */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Sliders size={18} className="text-blue-600" />
          <h2 className="text-sm font-extrabold text-slate-900">Campaign Follow-up Sequence Rules</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { id: 'manual_approval_sms', label: 'Manual Approval Before SMS', desc: 'Prepares SMS draft; requires owner to tap approve before dispatch.' },
            { id: 'email_then_sms', label: 'Email Followed By SMS', desc: 'Day 0 initial email; Day 2 follow-up; Day 4 SMS if no reply.' },
            { id: 'auto_sms', label: 'Automatic SMS for Eligible Leads', desc: 'Dispatches SMS immediately when lead is approved.' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => handleUpdateFollowupMode(mode.id)}
              disabled={busy}
              className={`p-3.5 rounded-xl border text-left transition ${
                settings?.followup_mode === mode.id
                  ? 'bg-blue-50 border-blue-500 shadow-sm ring-1 ring-blue-500/20'
                  : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <div className="font-extrabold text-xs text-slate-900 mb-1">{mode.label}</div>
              <div className="text-[11px] text-slate-500 leading-relaxed">{mode.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* SMS QUEUE TABLE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-slate-900">Recent SMS Job Queue</h2>
            <p className="text-xs text-slate-500">Live dispatch status from your Android companion phone</p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {['all', 'queued', 'claimed', 'sent', 'failed'].map((f) => (
              <button
                key={f}
                onClick={() => setJobFilter(f)}
                className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition ${
                  jobFilter === f
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No SMS jobs matching filter &quot;{jobFilter}&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="p-3.5">Lead / Party</th>
                  <th className="p-3.5">Recipient Phone</th>
                  <th className="p-3.5">Message Text</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Created</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 font-bold text-slate-900">{job.lead_company_name}</td>
                    <td className="p-3.5 font-mono text-slate-600">{job.recipient_phone}</td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate" title={job.message_text}>
                      {job.message_text}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                          job.status === 'sent' || job.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-700'
                            : job.status === 'failed'
                            ? 'bg-red-100 text-red-700'
                            : job.status === 'claimed'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {job.status}
                      </span>
                      {job.error_message && (
                        <div className="text-[10px] text-red-600 mt-0.5 truncate max-w-[140px]" title={job.error_message}>
                          {job.error_message}
                        </div>
                      )}
                    </td>
                    <td className="p-3.5 text-slate-400 whitespace-nowrap">
                      {new Date(job.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {job.status === 'queued' && job.requires_manual_approval && (
                        <button
                          onClick={() => handleJobAction('approve', job.id)}
                          disabled={busy}
                          className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-[10px] rounded-md hover:bg-emerald-700 transition"
                        >
                          Approve
                        </button>
                      )}
                      {(job.status === 'failed' || job.status === 'unknown') && (
                        <button
                          onClick={() => handleJobAction('retry', job.id)}
                          disabled={busy}
                          className="px-2.5 py-1 bg-amber-600 text-white font-bold text-[10px] rounded-md hover:bg-amber-700 transition"
                        >
                          Retry
                        </button>
                      )}
                      {job.status === 'queued' && (
                        <button
                          onClick={() => handleJobAction('cancel', job.id)}
                          disabled={busy}
                          className="px-2 py-1 text-slate-400 hover:text-red-600 text-[10px] rounded-md transition"
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRE-LOADED TEMPLATES */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
        <h2 className="text-sm font-extrabold text-slate-900">Pre-Loaded Tata Ace SMS Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {templates.map((tmpl) => (
            <div key={tmpl.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                <span>{tmpl.name}</span>
                <span className="text-[10px] font-semibold text-blue-600 uppercase">{tmpl.language}</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed italic bg-white p-2.5 rounded-lg border border-slate-200/60 font-mono">
                &ldquo;{tmpl.template_text}&rdquo;
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: PAIRING INSTRUCTIONS & 6-DIGIT PIN */}
      {isPairModalOpen && pairingData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Smartphone size={20} className="text-blue-600" />
                <span>Pair Android Companion Phone</span>
              </div>
              <button onClick={() => setIsPairModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl text-center space-y-1">
              <div className="text-xs text-blue-700 font-bold uppercase tracking-wider">6-Digit Pairing PIN</div>
              <div className="text-3xl font-extrabold tracking-widest text-blue-900 font-mono">{pairingData.pin}</div>
              <div className="text-[10px] text-blue-600">Expires in 10 minutes</div>
            </div>

            <div className="text-xs text-slate-600 space-y-2">
              <div className="font-bold text-slate-800">Instructions:</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 leading-relaxed">
                <li>Install the <strong>Papa Transport Companion</strong> app on your Android phone (located in <code className="bg-slate-100 px-1 py-0.5 rounded">android-companion/</code>).</li>
                <li>Enter the Server URL: <strong className="font-mono text-slate-900">{pairingData.server_url}</strong></li>
                <li>Enter the PIN <strong className="font-mono text-slate-900">{pairingData.pin}</strong> and tap <strong>Pair Phone</strong>.</li>
              </ol>
            </div>

            <button
              onClick={() => setIsPairModalOpen(false)}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: SAFE TEST SMS TO MY OWN NUMBER */}
      {isTestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Send size={18} className="text-blue-600" />
                <span>Test SIM SMS on Your Phone</span>
              </div>
              <button onClick={() => setIsTestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Your Mobile Number
                </label>
                <input
                  type="tel"
                  placeholder="+91 98110 00000"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="w-full text-xs p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldAlert size={15} />
                  <span>Mandatory Explicit Safeguard</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  NCR Transport Leads never silently messages real customer leads. This test will ONLY send a single diagnostic confirmation message to the number you specified.
                </p>
              </div>

              <label className="flex items-start gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={testConfirmed}
                  onChange={(e) => setTestConfirmed(e.target.checked)}
                  className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-700 font-medium">
                  I explicitly confirm sending a diagnostic test SMS to this number.
                </span>
              </label>

              <button
                onClick={handleSendTestSms}
                disabled={testSending || !testConfirmed || !testPhone.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 transition"
              >
                {testSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span>Send Verified Test SMS</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DIRECT ANDROID PHONE GATEWAY CONFIGURATION */}
      {isPhoneConfigModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Sliders size={18} className="text-blue-600" />
                <span>Android Phone Gateway Settings</span>
              </div>
              <button onClick={() => setIsPhoneConfigModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone Local Address / URL
                </label>
                <input
                  type="text"
                  placeholder="http://10.108.104.59:8080"
                  value={phoneIpInput}
                  onChange={(e) => setPhoneIpInput(e.target.value)}
                  className="w-full text-xs p-3 font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="text-[11px] text-slate-400">As shown in your SMS Gateway app on your phone</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    value={phoneUserInput}
                    onChange={(e) => setPhoneUserInput(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    value={phonePassInput}
                    onChange={(e) => setPhonePassInput(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Dispatch Physical SIM
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPhoneSimInput(1)}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      phoneSimInput === 1
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    SIM 1 (Primary)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoneSimInput(2)}
                    className={`py-2 text-xs font-bold rounded-xl border transition ${
                      phoneSimInput === 2
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    SIM 2 (Secondary)
                  </button>
                </div>
              </div>

              <button
                onClick={handleSavePhoneConfig}
                disabled={busy}
                className="w-full py-2.5 bg-slate-900 hover:bg-black text-white font-bold text-xs rounded-xl shadow-sm transition"
              >
                Save Phone Gateway Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
