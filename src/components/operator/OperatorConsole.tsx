import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  LogOut,
  Target,
  Plane,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  Settings,
  FileText,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RotateCcw,
  Search,
  Plus,
  Minus,
  Lock,
  Unlock,
} from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';

interface OperatorConsoleProps {
  token: string;
  onLogout: () => void;
}

type OpsTab = 'wingo' | 'aviator' | 'deposits' | 'withdrawals' | 'players' | 'settings' | 'audit';

export const OperatorConsole: React.FC<OperatorConsoleProps> = ({ token, onLogout }) => {
  const [activeTab, setActiveTab] = useState<OpsTab>('wingo');

  // Win Go War Room State
  const [winGoLive, setWinGoLive] = useState<any>(null);
  const [winGoLoading, setWinGoLoading] = useState<boolean>(false);

  // Aviator Controller State
  const [aviatorLive, setAviatorLive] = useState<any>(null);
  const [presetMultiplier, setPresetMultiplier] = useState<string>('2.50');
  const [aviatorLoading, setAviatorLoading] = useState<boolean>(false);

  // Financial Queues State
  const [deposits, setDeposits] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [queueLoading, setQueueLoading] = useState<boolean>(false);

  // Player Directory State
  const [players, setPlayers] = useState<any[]>([]);
  const [playerSearch, setPlayerSearch] = useState<string>('');
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [adjustDelta, setAdjustDelta] = useState<string>('500');
  const [adjustReason, setAdjustReason] = useState<string>('Promotional VIP Bonus');

  // System Settings State
  const [sysSettings, setSysSettings] = useState<any>({
    upi_id: '',
    qr_code_url: '',
    telegram_link: '',
    marquee_broadcast: '',
  });

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Action feedback message
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ message, type });
    setTimeout(() => setFeedback(null), 3000);
  };

  const authHeaders = {
    'Content-Type': 'application/json',
    'x-operator-token': token,
  };

  // Poll active tab data every 2 seconds for live telemetry
  useEffect(() => {
    const fetchCurrentTabData = () => {
      if (activeTab === 'wingo') {
        fetch('/api/ops/wingo/live', { headers: authHeaders })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) setWinGoLive(data.data);
          })
          .catch(() => {});
      } else if (activeTab === 'aviator') {
        fetch('/api/ops/aviator/live', { headers: authHeaders })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) setAviatorLive(data.data);
          })
          .catch(() => {});
      } else if (activeTab === 'deposits') {
        fetch('/api/ops/deposits', { headers: authHeaders })
          .then((r) => r.json())
          .then((data) => {
            if (data && data.success && Array.isArray(data.deposits)) setDeposits(data.deposits);
          })
          .catch(() => {});
      } else if (activeTab === 'withdrawals') {
        fetch('/api/ops/withdrawals', { headers: authHeaders })
          .then((r) => r.json())
          .then((data) => {
            if (data && data.success && Array.isArray(data.withdrawals)) setWithdrawals(data.withdrawals);
          })
          .catch(() => {});
      } else if (activeTab === 'players') {
        fetch('/api/ops/players', { headers: authHeaders })
          .then((r) => r.json())
          .then((data) => {
            if (data && data.success && Array.isArray(data.players)) setPlayers(data.players);
          })
          .catch(() => {});
      } else if (activeTab === 'settings') {
        fetch('/api/ops/settings', { headers: authHeaders })
          .then((r) => r.json())
          .then((data) => {
            if (data && data.success && data.settings) setSysSettings(data.settings);
          })
          .catch(() => {});
      } else if (activeTab === 'audit') {
        fetch('/api/ops/audit-logs', { headers: authHeaders })
          .then((r) => r.json())
          .then((data) => {
            if (data && data.success && Array.isArray(data.logs)) setAuditLogs(data.logs);
          })
          .catch(() => {});
      }
    };

    fetchCurrentTabData();
    const interval = setInterval(fetchCurrentTabData, 2000);
    return () => clearInterval(interval);
  }, [activeTab, token]);

  // 1. Win Go Overrides
  const handleForceWinGoNumber = async (num: number) => {
    setWinGoLoading(true);
    try {
      const res = await fetch('/api/ops/wingo/override', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ forcedNumber: num }),
      });
      const data = await res.json();
      setWinGoLoading(false);
      if (data.success) {
        showFeedback(`Next Win Go outcome locked to number ${num}!`);
      } else {
        showFeedback(data.error || 'Failed to force number', 'error');
      }
    } catch (err: any) {
      setWinGoLoading(false);
      showFeedback(err.message, 'error');
    }
  };

  const handleToggleWinGoMode = async () => {
    const nextMode = winGoLive?.mode === 'AUTO_RISK_MIN' ? 'MANUAL' : 'AUTO_RISK_MIN';
    setWinGoLoading(true);
    try {
      const res = await fetch('/api/ops/wingo/override', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ mode: nextMode }),
      });
      const data = await res.json();
      setWinGoLoading(false);
      if (data.success) {
        showFeedback(`Win Go mode switched to ${nextMode}`);
      }
    } catch (err: any) {
      setWinGoLoading(false);
      showFeedback(err.message, 'error');
    }
  };

  // 2. Aviator Overrides
  const handlePresetAviatorCrash = async () => {
    const val = parseFloat(presetMultiplier);
    if (isNaN(val) || val < 1.0) {
      showFeedback('Multiplier must be >= 1.00', 'error');
      return;
    }
    setAviatorLoading(true);
    try {
      const res = await fetch('/api/ops/aviator/override', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ forcedCrashMultiplier: val, mode: 'MANUAL' }),
      });
      const data = await res.json();
      setAviatorLoading(false);
      if (data.success) {
        showFeedback(`Next Aviator flight crash locked to ${val.toFixed(2)}x!`);
      } else {
        showFeedback(data.error, 'error');
      }
    } catch (err: any) {
      setAviatorLoading(false);
      showFeedback(err.message, 'error');
    }
  };

  const handleInstantCrashTrigger = async () => {
    setAviatorLoading(true);
    try {
      const res = await fetch('/api/ops/aviator/instant-crash', {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      setAviatorLoading(false);
      if (data.success) {
        showFeedback(data.message || 'Instant 1.00x crash triggered!');
      } else {
        showFeedback(data.message || 'Failed to trigger crash', 'error');
      }
    } catch (err: any) {
      setAviatorLoading(false);
      showFeedback(err.message, 'error');
    }
  };

  // 3. Deposit Approvals
  const handleApproveDeposit = async (id: string) => {
    setQueueLoading(true);
    try {
      const res = await fetch(`/api/ops/deposits/${id}/approve`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ note: 'Approved by Operator' }),
      });
      const data = await res.json();
      setQueueLoading(false);
      if (data.success) {
        showFeedback('Deposit approved and credited to player wallet!');
      } else {
        showFeedback(data.error || 'Failed to approve', 'error');
      }
    } catch (err: any) {
      setQueueLoading(false);
      showFeedback(err.message, 'error');
    }
  };

  const handleRejectDeposit = async (id: string) => {
    setQueueLoading(true);
    try {
      const res = await fetch(`/api/ops/deposits/${id}/reject`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ note: 'Invalid or forged UTR reference' }),
      });
      const data = await res.json();
      setQueueLoading(false);
      if (data.success) {
        showFeedback('Deposit rejected.');
      }
    } catch (err: any) {
      setQueueLoading(false);
      showFeedback(err.message, 'error');
    }
  };

  // 4. Withdrawal Approvals
  const handleApproveWithdrawal = async (id: string) => {
    setQueueLoading(true);
    try {
      const res = await fetch(`/api/ops/withdrawals/${id}/approve`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ note: 'Payout settled via Banking UPI' }),
      });
      const data = await res.json();
      setQueueLoading(false);
      if (data.success) {
        showFeedback('Withdrawal approved and marked settled!');
      }
    } catch (err: any) {
      setQueueLoading(false);
      showFeedback(err.message, 'error');
    }
  };

  const handleRejectWithdrawalRefund = async (id: string) => {
    setQueueLoading(true);
    try {
      const res = await fetch(`/api/ops/withdrawals/${id}/reject`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ note: 'Rejected with instant wallet refund' }),
      });
      const data = await res.json();
      setQueueLoading(false);
      if (data.success) {
        showFeedback('Withdrawal rejected with instant wallet credit refund!');
      } else {
        showFeedback(data.error, 'error');
      }
    } catch (err: any) {
      setQueueLoading(false);
      showFeedback(err.message, 'error');
    }
  };

  // 5. Balance Adjustment
  const handleAdjustBalance = async () => {
    if (!selectedPlayerId) {
      showFeedback('Select a player first', 'error');
      return;
    }
    const delta = parseFloat(adjustDelta);
    if (isNaN(delta) || delta === 0) {
      showFeedback('Invalid numeric delta', 'error');
      return;
    }
    try {
      const res = await fetch(`/api/ops/players/${selectedPlayerId}/balance`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ delta, reason: adjustReason }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Wallet adjusted by ${delta > 0 ? '+' : ''}${delta}. New balance: ${formatINR(data.newBalance)}`);
      } else {
        showFeedback(data.error || 'Adjustment failed', 'error');
      }
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const handleToggleFreeze = async (playerId: string, currentlyBanned: boolean) => {
    try {
      const res = await fetch(`/api/ops/players/${playerId}/freeze`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ isBanned: !currentlyBanned }),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback(`Player account ${!currentlyBanned ? 'FROZEN / BANNED' : 'UNFROZEN'}`);
      }
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  // 6. Update Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ops/settings', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify(sysSettings),
      });
      const data = await res.json();
      if (data.success) {
        showFeedback('System settings updated and live immediately!');
      }
    } catch (err: any) {
      showFeedback(err.message, 'error');
    }
  };

  const filteredPlayers = players.filter((p) =>
    p.id.toLowerCase().includes(playerSearch.toLowerCase()) ||
    p.mobile.toLowerCase().includes(playerSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-200 font-mono flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#0b101f] border-b border-amber-500/20 px-4 py-3 flex items-center justify-between shadow-lg sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 to-amber-700 text-slate-950 flex items-center justify-center font-black">
            <ShieldAlert className="w-4 h-4 stroke-[3]" />
          </div>
          <div>
            <h1 className="font-display font-black text-white text-sm tracking-wider flex items-center gap-2">
              APEX OPERATOR WAR ROOM <span className="text-amber-400 text-xs">// STEALTH CONSOLE</span>
            </h1>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>LIVE SERVER SYNC ACTIVE</span>
              <span>·</span>
              <span className="text-amber-300">AUTHORITY: SUPER_ADMIN</span>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Exit Session</span>
        </button>
      </header>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`fixed top-14 right-4 z-50 px-4 py-2.5 rounded-xl border shadow-xl text-xs flex items-center gap-2 animate-in slide-in-from-top ${
            feedback.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-300'
              : 'bg-rose-950/90 border-rose-500/60 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="bg-[#090e1c] border-b border-slate-800 px-4 flex items-center gap-1 overflow-x-auto scrollbar-none py-1.5">
        {[
          { id: 'wingo', label: 'Win Go Override', icon: Target },
          { id: 'aviator', label: 'Aviator Controller', icon: Plane },
          { id: 'deposits', label: `Deposits (${deposits.filter((d) => d.status === 'PENDING').length})`, icon: ArrowDownLeft },
          { id: 'withdrawals', label: `Withdrawals (${withdrawals.filter((w) => w.status === 'PENDING').length})`, icon: ArrowUpRight },
          { id: 'players', label: 'Player Directory', icon: Users },
          { id: 'settings', label: 'System Settings', icon: Settings },
          { id: 'audit', label: 'Audit Trail', icon: FileText },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as OpsTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-4 max-w-7xl w-full mx-auto space-y-4">
        {/* 1. WIN GO OVERRIDE TAB */}
        {activeTab === 'wingo' && (
          <div className="space-y-4">
            {/* Live Round Overview */}
            <div className="bg-[#0b101f] border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
                <div>
                  <h3 className="font-display font-black text-white text-sm">
                    WIN GO 1MIN // ACTIVE PERIOD TELEMETRY
                  </h3>
                  <span className="text-xs text-amber-400 font-mono">
                    Period #{winGoLive?.periodNumber || '---'} · Total Pool: {formatINR(winGoLive?.totalPool || 0)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold">
                    Clock: {winGoLive?.remainingSeconds || 0}s
                  </span>
                  <button
                    onClick={handleToggleWinGoMode}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${
                      winGoLive?.mode === 'AUTO_RISK_MIN'
                        ? 'bg-emerald-950 text-emerald-300 border-emerald-500/50 shadow-sm animate-pulse'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    Mode: {winGoLive?.mode === 'AUTO_RISK_MIN' ? 'AUTO RISK MIN (ACTIVE)' : 'MANUAL OVERRIDE'}
                  </button>
                </div>
              </div>

              {/* Parity Stakes Breakdown */}
              <div className="grid grid-cols-5 gap-2 mb-4 text-center text-xs">
                <div className="bg-rose-950/70 border border-rose-800/60 p-2 rounded-xl">
                  <span className="text-rose-300 block font-bold">RED POOL</span>
                  <span className="font-black text-white mt-1 block">
                    {formatINR(winGoLive?.colors?.RED || 0)}
                  </span>
                </div>
                <div className="bg-emerald-950/70 border border-emerald-800/60 p-2 rounded-xl">
                  <span className="text-emerald-300 block font-bold">GREEN POOL</span>
                  <span className="font-black text-white mt-1 block">
                    {formatINR(winGoLive?.colors?.GREEN || 0)}
                  </span>
                </div>
                <div className="bg-violet-950/70 border border-violet-800/60 p-2 rounded-xl">
                  <span className="text-violet-300 block font-bold">VIOLET POOL</span>
                  <span className="font-black text-white mt-1 block">
                    {formatINR(winGoLive?.colors?.VIOLET || 0)}
                  </span>
                </div>
                <div className="bg-blue-950/70 border border-blue-800/60 p-2 rounded-xl">
                  <span className="text-blue-300 block font-bold">SMALL POOL</span>
                  <span className="font-black text-white mt-1 block">
                    {formatINR(winGoLive?.sizes?.SMALL || 0)}
                  </span>
                </div>
                <div className="bg-amber-950/70 border border-amber-800/60 p-2 rounded-xl">
                  <span className="text-amber-300 block font-bold">BIG POOL</span>
                  <span className="font-black text-white mt-1 block">
                    {formatINR(winGoLive?.sizes?.BIG || 0)}
                  </span>
                </div>
              </div>

              {/* 1-Click Force Result Buttons (Numbers 0-9) & Liability Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-300 uppercase">
                    1-Click Force Outcome (0-9) with Platform Liability Analysis:
                  </span>
                  {winGoLive?.forcedNextNumber !== null && winGoLive?.forcedNextNumber !== undefined && (
                    <span className="text-xs bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full">
                      OVERRIDE LOCKED: BALL #{winGoLive.forcedNextNumber}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
                    const stake = winGoLive?.numbers?.[n] || 0;
                    const liability = winGoLive?.liabilities?.[n] || 0;
                    const isForced = winGoLive?.forcedNextNumber === n;

                    return (
                      <button
                        key={n}
                        onClick={() => handleForceWinGoNumber(n)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-between transition-all ${
                          isForced
                            ? 'bg-amber-500 text-slate-950 border-white shadow-lg scale-105 font-black ring-2 ring-amber-300'
                            : 'bg-[#060a14] border-slate-800 hover:border-amber-500/50 text-slate-300'
                        }`}
                      >
                        <span className="text-lg font-black">{n}</span>
                        <span className="text-[9px] text-slate-400 mt-1">Stk: ₹{stake}</span>
                        <span className={`text-[9px] font-black mt-0.5 ${isForced ? 'text-slate-950' : 'text-rose-400'}`}>
                          Liab: ₹{liability}
                        </span>
                        <span className="text-[8px] bg-slate-800 px-1 py-0.2 rounded mt-1">
                          FORCE
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 2. AVIATOR CONTROLLER TAB */}
        {activeTab === 'aviator' && (
          <div className="space-y-4">
            <div className="bg-[#0b101f] border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-display font-black text-white text-sm">
                    AVIATOR TRAJECTORY CONTROLLER // ROUND #{aviatorLive?.roundNumber || '---'}
                  </h3>
                  <p className="text-xs text-amber-400 font-mono">
                    Status: <span className="font-black">{aviatorLive?.status}</span> · Live Multiplier: <span className="font-black text-white text-base">{aviatorLive?.currentMultiplier}x</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs bg-slate-800 px-2.5 py-1 rounded-lg text-slate-300">
                    Active Bets: {aviatorLive?.activeBetsCount || 0} (Total: {formatINR(aviatorLive?.totalStakes || 0)})
                  </span>
                </div>
              </div>

              {/* Controls Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Preset Next Flight Multiplier */}
                <div className="bg-[#070b16] border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase">
                      Preset Next Crash Multiplier
                    </span>
                    <span className="text-[10px] text-amber-400 font-mono">
                      Current Target: {aviatorLive?.crashMultiplier}x
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      step="0.05"
                      min="1.00"
                      value={presetMultiplier}
                      onChange={(e) => setPresetMultiplier(e.target.value)}
                      placeholder="e.g. 1.15, 4.80, 15.00"
                      className="flex-1 bg-[#0b101f] border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-black text-base focus:border-amber-400 focus:outline-none"
                    />
                    <button
                      onClick={handlePresetAviatorCrash}
                      disabled={aviatorLoading}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase transition-all shadow-md"
                    >
                      LOCK PRESET
                    </button>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
                    <span>Quick presets:</span>
                    {[1.10, 1.50, 2.00, 5.00, 10.00].map((p) => (
                      <button
                        key={p}
                        onClick={() => setPresetMultiplier(String(p))}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
                      >
                        {p}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instant 1.00x Crash Emergency Trigger */}
                <div className="bg-[#070b16] border border-rose-900/40 rounded-xl p-4 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-rose-300 uppercase flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-rose-500" />
                      <span>EMERGENCY 1.00X CRASH TRIGGER</span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Instantly crashes flight at 1.00x (or halts current in-flight aircraft immediately) for 100% platform liquidity retention.
                    </p>
                  </div>

                  <button
                    onClick={handleInstantCrashTrigger}
                    disabled={aviatorLoading}
                    className="w-full h-12 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 hover:from-rose-500 hover:to-red-700 text-white font-display font-black text-xs uppercase tracking-wider shadow-lg shadow-rose-900/30 flex items-center justify-center gap-2 active:scale-98 transition-transform"
                  >
                    <Zap className="w-4 h-4" />
                    <span>⚡ TRIGGER INSTANT 1.00X CRASH NOW</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. DEPOSITS QUEUE TAB */}
        {activeTab === 'deposits' && (
          <div className="bg-[#0b101f] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-display font-black text-white text-sm">
                DEPOSIT QUEUE // UTR VERIFICATION & APPROVAL
              </h3>
              <span className="text-xs text-amber-400 font-mono">
                {deposits.length} Total Requests
              </span>
            </div>

            {deposits.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-8">
                No deposit requests submitted yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-2">ID / Time</th>
                      <th className="py-2 px-2">Account ID</th>
                      <th className="py-2 px-2">Amount</th>
                      <th className="py-2 px-2">UTR Reference</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {deposits.map((dep) => (
                      <tr key={dep.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-2">
                          <div className="font-bold text-slate-300">{dep.id}</div>
                          <div className="text-[10px] text-slate-500">{new Date(dep.created_at).toLocaleTimeString('en-IN')}</div>
                        </td>
                        <td className="py-2.5 px-2 font-bold text-amber-400">{dep.account_id}</td>
                        <td className="py-2.5 px-2 font-black text-white">{formatINR(dep.amount)}</td>
                        <td className="py-2.5 px-2 text-slate-300 font-bold">{dep.utr_number}</td>
                        <td className="py-2.5 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            dep.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300' :
                            dep.status === 'REJECTED' ? 'bg-rose-950 text-rose-300' :
                            'bg-amber-950 text-amber-300 animate-pulse'
                          }`}>
                            {dep.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {dep.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveDeposit(dep.id)}
                                disabled={queueLoading}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px]"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectDeposit(dep.id)}
                                disabled={queueLoading}
                                className="px-2.5 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-300 font-bold text-[11px]"
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. WITHDRAWALS QUEUE TAB */}
        {activeTab === 'withdrawals' && (
          <div className="bg-[#0b101f] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="font-display font-black text-white text-sm">
                WITHDRAWAL QUEUE // 1X TURNOVER AUDIT & PAYOUT
              </h3>
              <span className="text-xs text-amber-400 font-mono">
                {withdrawals.length} Requests
              </span>
            </div>

            {withdrawals.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-8">
                No withdrawal requests queued.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-2">ID / Time</th>
                      <th className="py-2 px-2">Account ID</th>
                      <th className="py-2 px-2">Amount</th>
                      <th className="py-2 px-2">UPI ID</th>
                      <th className="py-2 px-2">1X Turnover Status</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {withdrawals.map((wth) => (
                      <tr key={wth.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-2">
                          <div className="font-bold text-slate-300">{wth.id}</div>
                          <div className="text-[10px] text-slate-500">{new Date(wth.created_at).toLocaleTimeString('en-IN')}</div>
                        </td>
                        <td className="py-2.5 px-2 font-bold text-amber-400">{wth.account_id}</td>
                        <td className="py-2.5 px-2 font-black text-white">{formatINR(wth.amount)}</td>
                        <td className="py-2.5 px-2 text-slate-300 font-bold">{wth.upi_id}</td>
                        <td className="py-2.5 px-2">
                          <div className="text-[10px] text-emerald-400 font-bold">
                            ✓ Verified (Wager: ₹{wth.turnover_at_request})
                          </div>
                        </td>
                        <td className="py-2.5 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            wth.status === 'APPROVED' ? 'bg-emerald-950 text-emerald-300' :
                            wth.status === 'REJECTED' ? 'bg-rose-950 text-rose-300' :
                            'bg-amber-950 text-amber-300 animate-pulse'
                          }`}>
                            {wth.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          {wth.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleApproveWithdrawal(wth.id)}
                                disabled={queueLoading}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-[11px]"
                              >
                                Approve Payout
                              </button>
                              <button
                                onClick={() => handleRejectWithdrawalRefund(wth.id)}
                                disabled={queueLoading}
                                className="px-2.5 py-1 rounded bg-rose-900/80 hover:bg-rose-800 text-rose-300 font-bold text-[11px]"
                                title="Rejects request and immediately credits virtual funds back to player wallet"
                              >
                                Reject & Instant Refund
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">Processed</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5. PLAYER DIRECTORY & BALANCE ADJUSTMENT */}
        {activeTab === 'players' && (
          <div className="space-y-4">
            {/* Direct Balance Adjustment Tool */}
            <div className="bg-[#0b101f] border border-amber-500/30 rounded-2xl p-4 shadow-xl">
              <h3 className="font-display font-black text-white text-sm mb-3">
                DIRECT WALLET BALANCE ADJUSTMENT TOOL // AUDIT RECORDED
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">TARGET PLAYER ID</label>
                  <input
                    type="text"
                    value={selectedPlayerId}
                    onChange={(e) => setSelectedPlayerId(e.target.value)}
                    placeholder="e.g. acc_demo_pilot_01"
                    className="w-full bg-[#070b16] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">DELTA (+ / - INR)</label>
                  <input
                    type="number"
                    value={adjustDelta}
                    onChange={(e) => setAdjustDelta(e.target.value)}
                    placeholder="+500 or -200"
                    className="w-full bg-[#070b16] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">AUDIT REASON</label>
                  <input
                    type="text"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    placeholder="Audit reason note"
                    className="w-full bg-[#070b16] border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleAdjustBalance}
                    className="w-full h-9 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase transition-colors"
                  >
                    EXECUTE MUTATION
                  </button>
                </div>
              </div>
            </div>

            {/* Players Table */}
            <div className="bg-[#0b101f] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-display font-black text-white text-sm">
                  REGISTERED PLAYERS DIRECTORY ({players.length})
                </h3>
                <div className="w-64 relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={playerSearch}
                    onChange={(e) => setPlayerSearch(e.target.value)}
                    placeholder="Search player ID or mobile..."
                    className="w-full bg-[#070b16] border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400">
                      <th className="py-2 px-2">Account ID</th>
                      <th className="py-2 px-2">Mobile</th>
                      <th className="py-2 px-2">Balance</th>
                      <th className="py-2 px-2">Deposited</th>
                      <th className="py-2 px-2">Wagered Turnover</th>
                      <th className="py-2 px-2">Status</th>
                      <th className="py-2 px-2 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredPlayers.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-2 font-bold text-amber-400">{p.id}</td>
                        <td className="py-2.5 px-2 text-slate-300">{p.mobile}</td>
                        <td className="py-2.5 px-2 font-black text-white">{formatINR(p.wallet_balance)}</td>
                        <td className="py-2.5 px-2 text-slate-300">{formatINR(p.total_deposited)}</td>
                        <td className="py-2.5 px-2 text-slate-300">{formatINR(p.total_wagered)}</td>
                        <td className="py-2.5 px-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.is_banned ? 'bg-rose-950 text-rose-400 border border-rose-800' : 'bg-emerald-950 text-emerald-400'
                          }`}>
                            {p.is_banned ? 'FROZEN / BANNED' : 'ACTIVE'}
                          </span>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedPlayerId(p.id)}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-[10px] font-bold"
                            >
                              Select
                            </button>
                            <button
                              onClick={() => handleToggleFreeze(p.id, p.is_banned)}
                              className={`px-2 py-1 rounded text-[10px] font-bold ${
                                p.is_banned
                                  ? 'bg-emerald-900/80 text-emerald-300 hover:bg-emerald-800'
                                  : 'bg-rose-950 text-rose-300 hover:bg-rose-900 border border-rose-800/60'
                              }`}
                            >
                              {p.is_banned ? 'Unfreeze' : 'Freeze / Ban'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. SYSTEM SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-[#0b101f] border border-slate-800 rounded-2xl p-5 shadow-xl max-w-2xl mx-auto">
            <h3 className="font-display font-black text-white text-sm mb-4 border-b border-slate-800 pb-2.5">
              DYNAMIC SYSTEM CONFIGURATION // HOT-RELOADABLE
            </h3>

            <form onSubmit={handleSaveSettings} className="space-y-4 text-xs">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  OFFICIAL UPI RECEIVING ID
                </label>
                <input
                  type="text"
                  value={sysSettings.upi_id}
                  onChange={(e) => setSysSettings({ ...sysSettings, upi_id: e.target.value })}
                  className="w-full bg-[#070b16] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  DEPOSIT QR CODE URL
                </label>
                <input
                  type="text"
                  value={sysSettings.qr_code_url}
                  onChange={(e) => setSysSettings({ ...sysSettings, qr_code_url: e.target.value })}
                  className="w-full bg-[#070b16] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  OFFICIAL TELEGRAM VIP COMMUNITY LINK
                </label>
                <input
                  type="text"
                  value={sysSettings.telegram_link}
                  onChange={(e) => setSysSettings({ ...sysSettings, telegram_link: e.target.value })}
                  className="w-full bg-[#070b16] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                  LIVE MARQUEE BROADCAST MESSAGE
                </label>
                <textarea
                  rows={2}
                  value={sysSettings.marquee_broadcast}
                  onChange={(e) => setSysSettings({ ...sysSettings, marquee_broadcast: e.target.value })}
                  className="w-full bg-[#070b16] border border-slate-800 rounded-xl px-3 py-2 text-white font-mono focus:border-amber-400 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 text-slate-950 font-black uppercase tracking-wider text-xs shadow-md"
              >
                SAVE & HOT-RELOAD SETTINGS
              </button>
            </form>
          </div>
        )}

        {/* 7. AUDIT TRAIL TAB */}
        {activeTab === 'audit' && (
          <div className="bg-[#0b101f] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <h3 className="font-display font-black text-white text-sm border-b border-slate-800 pb-2.5">
              OPERATOR AUDIT LOG // IMMUTABLE TRAIL ({auditLogs.length})
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 px-2">Timestamp</th>
                    <th className="py-2 px-2">Action</th>
                    <th className="py-2 px-2">Target ID</th>
                    <th className="py-2 px-2">Operator IP</th>
                    <th className="py-2 px-2">Parameters</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/30">
                      <td className="py-2 px-2 text-slate-400">
                        {new Date(log.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2 px-2 font-bold text-amber-400">{log.action}</td>
                      <td className="py-2 px-2 text-slate-300">{log.target_id || '---'}</td>
                      <td className="py-2 px-2 text-slate-500">{log.operator_ip}</td>
                      <td className="py-2 px-2 text-slate-400 text-[11px] truncate max-w-xs">
                        {JSON.stringify(log.details)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
