import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, TrendingUp, Sparkles, ShieldCheck } from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';
import { soundManager } from '../../lib/sound.ts';
import { useTranslation } from '../../lib/i18n.ts';

interface AgencySummary {
  referralCode: string;
  claimableCommission: number;
  totalCommission: number;
  totalTeamCount: number;
  level1Count: number;
  level2Count: number;
  level3Count: number;
  teamTurnover: number;
}

interface AgencyHubProps {
  accountId: string;
  onRefreshData?: () => void;
}

export const AgencyHub: React.FC<AgencyHubProps> = ({ accountId, onRefreshData }) => {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<AgencySummary | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const fetchAgencySummary = async () => {
    try {
      const res = await fetch(`/api/agency/summary?accountId=${encodeURIComponent(accountId)}`);
      const data = await res.json();
      if (data.success && data.summary) {
        setSummary(data.summary);
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchAgencySummary();
  }, [accountId]);

  const handleCopyLink = () => {
    if (!summary) return;
    const url = `${window.location.origin}/?ref=${summary.referralCode}`;
    navigator.clipboard.writeText(url).catch(() => {});
    setIsCopied(true);
    soundManager.play('click');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleClaimCommission = async () => {
    if (!summary || summary.claimableCommission <= 0) return;
    setIsClaiming(true);
    setClaimMessage(null);

    try {
      const res = await fetch('/api/agency/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();
      setIsClaiming(false);

      if (data.success) {
        soundManager.play('bet');
        setClaimMessage(`+${formatINR(data.amount)} Commission credited to Master Vault!`);
        fetchAgencySummary();
        if (onRefreshData) onRefreshData();
      } else {
        setClaimMessage(data.error || 'Failed to claim commission.');
      }
    } catch (err: any) {
      setIsClaiming(false);
      setClaimMessage(err.message);
    }
  };

  if (!summary) {
    return (
      <div className="bg-[#0b101c] border border-slate-700/60 rounded-lg p-3 text-center text-slate-500 text-xs font-casino-num">
        Loading Agency Hub data...
      </div>
    );
  }

  return (
    <div className="bg-[#0b101c] border border-amber-500/30 rounded-lg p-3 shadow-md space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-amber-700 text-slate-950 flex items-center justify-center font-bold shadow-sm">
            <Users className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-casino-num font-black text-white text-xs uppercase tracking-wider">
              {t('agencyReferral')}
            </h4>
            <p className="text-[9px] text-amber-400 font-casino-num font-bold">
              3-Level Downline Commission Schema
            </p>
          </div>
        </div>

        <span className="text-[9px] bg-emerald-950 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded font-casino-num font-bold">
          L1: 0.6% | L2: 0.3% | L3: 0.1%
        </span>
      </div>

      {/* Claimable Commission Card */}
      <div className="bg-[#070b14] border border-amber-500/30 rounded-md p-3 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400 font-casino-num uppercase font-bold block">
            Claimable Commission
          </span>
          <span className="font-casino-num font-black text-amber-300 text-xl block mt-0.5">
            {formatINR(summary.claimableCommission)}
          </span>
          <span className="text-[10px] text-slate-400 font-casino-num block mt-0.5">
            Total Earned: {formatINR(summary.totalCommission)}
          </span>
        </div>

        <button
          onClick={handleClaimCommission}
          disabled={summary.claimableCommission <= 0 || isClaiming}
          className={`px-3 py-2 rounded-md font-casino-num font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            summary.claimableCommission > 0
              ? 'bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Claim</span>
        </button>
      </div>

      {claimMessage && (
        <div className="p-2 rounded-md bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-casino-num font-bold text-center">
          {claimMessage}
        </div>
      )}

      {/* Referral Link & Code */}
      <div className="bg-[#070b14] border border-slate-800 rounded-md p-2.5">
        <span className="text-[10px] text-slate-400 font-casino-num uppercase font-bold block mb-1">
          Your Direct Inviter Link
        </span>
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            readOnly
            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${summary.referralCode}`}
            className="flex-1 bg-[#0b101c] border border-slate-800 rounded-md px-2.5 py-1.5 text-xs text-slate-300 font-casino-num select-all focus:outline-none"
          />
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-casino-num font-black text-xs uppercase tracking-wider flex items-center gap-1 transition-colors"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{isCopied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* 3-Tier Downline Breakdown */}
      <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
        <div className="bg-[#070b14] border border-slate-800/80 p-2 rounded-md">
          <span className="text-[9px] text-amber-400 font-casino-num font-bold uppercase block">
            Level 1 (0.6%)
          </span>
          <span className="font-casino-num font-black text-white text-sm mt-0.5 block">
            {summary.level1Count}
          </span>
          <span className="text-[9px] text-slate-500 font-casino-num">Direct Users</span>
        </div>

        <div className="bg-[#070b14] border border-slate-800/80 p-2 rounded-md">
          <span className="text-[9px] text-purple-400 font-casino-num font-bold uppercase block">
            Level 2 (0.3%)
          </span>
          <span className="font-casino-num font-black text-white text-sm mt-0.5 block">
            {summary.level2Count}
          </span>
          <span className="text-[9px] text-slate-500 font-casino-num">Sub-team</span>
        </div>

        <div className="bg-[#070b14] border border-slate-800/80 p-2 rounded-md">
          <span className="text-[9px] text-sky-400 font-casino-num font-bold uppercase block">
            Level 3 (0.1%)
          </span>
          <span className="font-casino-num font-black text-white text-sm mt-0.5 block">
            {summary.level3Count}
          </span>
          <span className="text-[9px] text-slate-500 font-casino-num">Network</span>
        </div>
      </div>
    </div>
  );
};
