import React, { useState, useEffect } from 'react';
import { Users, Copy, Check, TrendingUp, Sparkles, ShieldCheck, Share2, Award, ChevronRight } from 'lucide-react';
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
        setClaimMessage(`+${formatINR(data.amount)} Commission credited to your wallet!`);
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
      <div className="bg-white rounded-2xl p-6 text-center text-slate-400 text-xs shadow-sm border border-slate-100">
        Loading Agency Commission Hub...
      </div>
    );
  }

  return (
    <div className="space-y-3.5 pb-24 text-slate-800 select-none">
      {/* 1. Commission Hero Banner (Gradient Coral/Red) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#f95959] via-[#fa6c6c] to-[#ff8579] p-4 text-white shadow-md relative overflow-hidden">
        {/* Subtle Ambient Circle */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black tracking-wide font-casino-num">
                Agency Promotion
              </h2>
              <span className="text-[10px] text-white/90">
                3-Tier Downline Rebate System
              </span>
            </div>
          </div>
          <span className="text-[10px] bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-full font-bold">
            Up to 1% Rebate
          </span>
        </div>

        {/* Claimable Balance Box */}
        <div className="mt-3 p-3.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/25 flex items-center justify-between">
          <div>
            <span className="text-[10px] text-white/80 uppercase font-bold block">
              Claimable Commission
            </span>
            <span className="text-2xl font-black text-white font-casino-num block mt-0.5">
              {formatINR(summary.claimableCommission)}
            </span>
            <span className="text-[10px] text-white/90 block mt-0.5">
              Total Earned: {formatINR(summary.totalCommission)}
            </span>
          </div>

          <button
            onClick={handleClaimCommission}
            disabled={summary.claimableCommission <= 0 || isClaiming}
            className={`px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all ${
              summary.claimableCommission > 0
                ? 'bg-amber-300 hover:bg-amber-400 text-slate-900 active:scale-95'
                : 'bg-white/20 text-white/60 cursor-not-allowed'
            }`}
          >
            {isClaiming ? 'Claiming...' : 'Claim Now'}
          </button>
        </div>

        {claimMessage && (
          <div className="mt-2.5 p-2 rounded-lg bg-emerald-500/90 text-white text-xs font-bold text-center">
            {claimMessage}
          </div>
        )}
      </div>

      {/* 2. Invitation Link & Code Card (Clean White) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Share2 className="w-4 h-4 text-[#f95959]" />
            Your Invitation Code
          </span>
          <span className="text-sm font-black font-mono text-[#f95959] bg-red-50 border border-red-100 px-2.5 py-0.5 rounded-lg">
            {summary.referralCode}
          </span>
        </div>

        <div>
          <span className="text-[11px] text-[#768096] block mb-1">
            Direct Invitation Link
          </span>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 truncate select-all">
              {`${typeof window !== 'undefined' ? window.location.origin : ''}/?ref=${summary.referralCode}`}
            </div>
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#f95959] to-[#ff7979] text-white text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 transition-all shrink-0"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* 3. 3-Tier Downline Breakdown (Clean White Cards) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Downline Tier Structure
          </span>
          <span className="text-[11px] text-[#768096] font-medium">
            Total Team: <strong className="text-slate-800 font-casino-num">{summary.totalTeamCount}</strong>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-center">
          {/* Level 1 */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-black text-rose-500 uppercase block font-casino-num">
              Level 1 (0.6%)
            </span>
            <span className="text-base font-black text-slate-900 font-casino-num block mt-1">
              {summary.level1Count}
            </span>
            <span className="text-[9px] text-[#768096] block mt-0.5">Direct Invites</span>
          </div>

          {/* Level 2 */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-black text-orange-500 uppercase block font-casino-num">
              Level 2 (0.3%)
            </span>
            <span className="text-base font-black text-slate-900 font-casino-num block mt-1">
              {summary.level2Count}
            </span>
            <span className="text-[9px] text-[#768096] block mt-0.5">Tier 2 Team</span>
          </div>

          {/* Level 3 */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] font-black text-purple-500 uppercase block font-casino-num">
              Level 3 (0.1%)
            </span>
            <span className="text-base font-black text-slate-900 font-casino-num block mt-1">
              {summary.level3Count}
            </span>
            <span className="text-[9px] text-[#768096] block mt-0.5">Tier 3 Team</span>
          </div>
        </div>
      </div>

      {/* 4. Commission Rules & Perks (Clean White Card) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-xs text-slate-600 space-y-2">
        <h4 className="font-bold text-slate-800 text-xs mb-1.5 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          Agency Rules & Commission Settlement
        </h4>
        <p className="text-[11px] leading-relaxed text-[#768096]">
          1. <strong>Sub-Second Auto Settlement:</strong> Whenever your downline members place bets in Win Go 1Min or Aviator, your commission is calculated and credited instantly.
        </p>
        <p className="text-[11px] leading-relaxed text-[#768096]">
          2. <strong>No Upper Limit:</strong> Invite unlimited friends. Lifelong commissions on all betting volume.
        </p>
        <p className="text-[11px] leading-relaxed text-[#768096]">
          3. <strong>Instant Withdrawal:</strong> Claimed commission goes directly to your main balance and can be withdrawn to UPI anytime!
        </p>
      </div>
    </div>
  );
};
