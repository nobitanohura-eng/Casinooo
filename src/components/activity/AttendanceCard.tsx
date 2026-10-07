import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle2, Sparkles, Lock, Trophy, Zap, Flame, Star, Coins } from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';
import { soundManager } from '../../lib/sound.ts';
import { useTranslation } from '../../lib/i18n.ts';

interface AttendanceReward {
  day: number;
  reward: number;
}

interface AttendanceCardProps {
  accountId: string;
  onRefreshData?: () => void;
}

export const AttendanceCard: React.FC<AttendanceCardProps> = ({ accountId, onRefreshData }) => {
  const { t } = useTranslation();
  const [currentDay, setCurrentDay] = useState<number>(0);
  const [claimedToday, setClaimedToday] = useState<boolean>(false);
  const [rewards, setRewards] = useState<AttendanceReward[]>([
    { day: 1, reward: 10 },
    { day: 2, reward: 15 },
    { day: 3, reward: 20 },
    { day: 4, reward: 30 },
    { day: 5, reward: 50 },
    { day: 6, reward: 70 },
    { day: 7, reward: 100 },
  ]);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  const fetchAttendance = async () => {
    if (!accountId) return;
    try {
      const res = await fetch(`/api/attendance?accountId=${encodeURIComponent(accountId)}`);
      const data = await res.json();
      if (data.success && data.status) {
        setCurrentDay(data.status.currentDay);
        setClaimedToday(data.status.claimedToday);
        if (data.status.rewards) {
          setRewards(data.status.rewards);
        }
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [accountId]);

  const handleClaim = async () => {
    if (claimedToday || isClaiming) return;
    setIsClaiming(true);
    setClaimMessage(null);

    try {
      const res = await fetch('/api/attendance/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId }),
      });
      const data = await res.json();
      setIsClaiming(false);

      if (data.success) {
        soundManager.play('win');
        setShowCelebration(true);
        setClaimedToday(true);
        setCurrentDay(data.currentDay);
        setClaimMessage(`🎉 +${formatINR(data.rewardAmount)} Day ${data.currentDay} Reward Claimed!`);
        if (onRefreshData) onRefreshData();

        setTimeout(() => {
          setShowCelebration(false);
        }, 4000);
      } else {
        setClaimMessage(data.error || 'Failed to claim attendance reward.');
      }
    } catch (err: any) {
      setIsClaiming(false);
      setClaimMessage(err.message || 'Network error');
    }
  };

  const nextDayToClaim = claimedToday ? (currentDay % 7) + 1 : Math.min(7, (currentDay % 7) + 1);
  const nextReward = rewards.find((r) => r.day === nextDayToClaim)?.reward || 10;
  const day7Reward = rewards.find((r) => r.day === 7)?.reward || 100;
  const days1to6 = rewards.filter((r) => r.day <= 6);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-100 p-3.5 sm:p-4 shadow-sm text-slate-800">

      {/* Celebratory Flying Coins / Confetti Shower Overlay */}
      {showCelebration && (
        <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-amber-500/10 backdrop-blur-[1px] animate-pulse" />
          {[...Array(14)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                top: `${10 + Math.random() * 70}%`,
                left: `${5 + Math.random() * 90}%`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: `${0.8 + Math.random() * 0.6}s`,
              }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-500 via-amber-300 to-yellow-600 border border-white/80 shadow-[0_0_15px_rgba(245,158,11,0.8)] flex items-center justify-center font-casino-num font-black text-slate-950 text-xs transform rotate-12">
                ₹
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header: Title, Streak Pill & Rules */}
      <div className="relative z-10 flex items-center justify-between gap-2 mb-3 border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 text-slate-950 flex items-center justify-center font-bold shadow-md shadow-amber-500/20 border-t border-white/40">
            <Trophy className="w-4 h-4 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-casino-num font-black text-slate-800 text-xs sm:text-sm uppercase tracking-wide flex items-center gap-1.5">
              <span>DAILY CHEST VAULT</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </h4>
            <p className="text-[9px] text-[#768096] font-medium">
              Check in daily for 7 days to unlock the Grand Mega Chest!
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 shadow-xs">
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span className="text-[10px] text-amber-700 font-casino-num font-black whitespace-nowrap">
            {currentDay}/7 Days
          </span>
        </div>
      </div>

      {/* Days 1 to 6 Grid (Interactive 3D Treasure Chests) */}
      <div className="relative z-10 grid grid-cols-3 gap-2 mb-3">
        {days1to6.map((r) => {
          const isCompleted = currentDay >= r.day;
          const isReady = !claimedToday && nextDayToClaim === r.day;
          const isLocked = !isCompleted && !isReady;

          return (
            <div
              key={r.day}
              onClick={() => {
                if (isReady) handleClaim();
              }}
              className={`relative rounded-xl p-2 flex flex-col items-center justify-between text-center transition-all duration-300 select-none ${
                isCompleted
                  ? 'bg-emerald-50 border border-emerald-300 shadow-xs'
                  : isReady
                  ? 'bg-amber-50 border-2 border-amber-400 shadow-md cursor-pointer active:scale-95 animate-pulse'
                  : 'bg-slate-50 border border-slate-200 opacity-80'
              }`}
            >
              {/* Day Header Tag */}
              <div className="w-full flex items-center justify-between text-[8px] font-casino-num font-black uppercase mb-1">
                <span className={isCompleted ? 'text-emerald-700' : isReady ? 'text-amber-800' : 'text-slate-500'}>
                  DAY {r.day}
                </span>
                {isCompleted ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : isReady ? (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                ) : (
                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                )}
              </div>

              {/* 3D Illustrated Treasure Chest Graphic */}
              <div className="relative my-1 w-12 h-10 flex items-center justify-center">
                {isCompleted ? (
                  /* Opened Chest Graphic */
                  <div className="relative flex flex-col items-center">
                    {/* Open Lid Angle */}
                    <div className="w-10 h-3 rounded-t-md bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 border-t border-yellow-200 transform -rotate-12 -translate-y-1 shadow-sm" />
                    {/* Radiant Coins Bursting Out */}
                    <div className="absolute -top-1 w-8 h-3 flex items-center justify-center gap-0.5 z-10">
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-300 border border-amber-500 shadow-[0_0_6px_rgba(253,224,71,0.8)]" />
                      <div className="w-2 h-2 rounded-full bg-amber-400 border border-yellow-200" />
                    </div>
                    {/* Chest Box Base */}
                    <div className="w-10 h-6 rounded-b-md bg-gradient-to-b from-amber-700 via-amber-800 to-amber-950 border-x border-b border-amber-500/80 shadow-inner flex items-center justify-center relative">
                      <div className="w-2 h-2.5 rounded-sm bg-gradient-to-b from-yellow-300 to-amber-500 border border-yellow-100" />
                    </div>
                  </div>
                ) : isReady ? (
                  /* Ready / Pulsating Animated Silver Chest Graphic with Particle Aura */
                  <div className="relative flex flex-col items-center transform transition-transform hover:scale-105">
                    {/* Aura Glow */}
                    <div className="absolute -inset-1 rounded-full bg-amber-400/30 blur-md pointer-events-none" />
                    {/* Silver/Amber Chest Lid */}
                    <div className="w-10 h-4 rounded-t-lg bg-gradient-to-r from-slate-300 via-yellow-200 to-slate-400 border-t border-white shadow-md relative flex items-center justify-center">
                      <div className="w-5 h-1 bg-amber-500 rounded-full" />
                    </div>
                    {/* Chest Base */}
                    <div className="w-10 h-6 rounded-b-md bg-gradient-to-b from-slate-400 via-slate-600 to-slate-800 border-x border-b border-yellow-400/80 shadow-lg flex items-center justify-center relative">
                      {/* Glowing Golden Keyhole Lock */}
                      <div className="w-2.5 h-3 rounded-sm bg-gradient-to-b from-yellow-300 via-amber-400 to-yellow-500 border border-white flex items-center justify-center shadow-[0_0_8px_rgba(250,204,21,1)]">
                        <div className="w-1 h-1.5 rounded-full bg-slate-950" />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Closed Bronze/Iron Locked Chest Graphic */
                  <div className="relative flex flex-col items-center opacity-70">
                    <div className="w-9 h-3.5 rounded-t-md bg-gradient-to-r from-stone-600 via-amber-900 to-stone-700 border-t border-stone-500 relative flex items-center justify-center">
                      <div className="w-4 h-1 bg-stone-800 rounded-full" />
                    </div>
                    <div className="w-9 h-5 rounded-b-md bg-gradient-to-b from-stone-700 via-stone-800 to-stone-900 border-x border-b border-stone-600 flex items-center justify-center relative">
                      <Lock className="w-2.5 h-2.5 text-stone-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* Reward Amount Pill */}
              <div
                className={`mt-1 px-2 py-0.5 rounded-md font-casino-num font-black text-xs ${
                  isCompleted
                    ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/40'
                    : isReady
                    ? 'bg-amber-400 text-slate-950 shadow-md font-black shadow-amber-400/30'
                    : 'bg-slate-900 text-slate-300 border border-slate-800'
                }`}
              >
                ₹{r.reward}
              </div>

              {/* Status Subtitle */}
              <span className="text-[7.5px] font-casino-num font-bold mt-1 uppercase tracking-wider text-slate-400">
                {isCompleted ? 'CLAIMED' : isReady ? 'CLAIM' : 'LOCKED'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Day 7: Grand Mega Chest Card */}
      {(() => {
        const isDay7Completed = currentDay >= 7;
        const isDay7Ready = !claimedToday && nextDayToClaim === 7;

        return (
          <div
            onClick={() => {
              if (isDay7Ready) handleClaim();
            }}
            className={`relative rounded-xl p-3 border-2 overflow-hidden transition-all duration-300 select-none ${
              isDay7Completed
                ? 'bg-gradient-to-r from-[#0c2e1f] via-[#092218] to-[#04120c] border-emerald-400 shadow-lg shadow-emerald-950/50'
                : isDay7Ready
                ? 'bg-gradient-to-r from-[#381a06] via-[#4d2407] to-[#260e02] border-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.6)] cursor-pointer animate-pulse'
                : 'bg-gradient-to-r from-[#1b1206] via-[#140d04] to-[#0d0903] border-amber-500/40 opacity-90'
            }`}
          >
            {/* Shimmer Ambient Aura */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/25 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between gap-3">
              {/* Left Massive 3D Golden Royal Treasure Chest */}
              <div className="relative w-16 h-14 flex items-center justify-center shrink-0">
                {/* 3D Golden Chest Body Overflowing with Coins */}
                <div className="relative flex flex-col items-center">
                  {/* Glowing Aura Ring */}
                  <div className="absolute -inset-2 bg-yellow-400/30 rounded-full blur-md" />

                  {/* Arched Royal Gold Lid */}
                  <div className="w-14 h-5 rounded-t-xl bg-gradient-to-r from-yellow-500 via-amber-200 to-yellow-600 border-t-2 border-white shadow-md flex items-center justify-center relative">
                    <div className="w-7 h-1.5 bg-amber-800 rounded-full border border-yellow-300" />
                  </div>

                  {/* Overflowing Gold Coins Layer */}
                  <div className="absolute top-3.5 w-12 h-3 flex items-center justify-center gap-1 z-10">
                    <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-200 border border-white shadow-[0_0_8px_rgba(250,204,21,1)] font-casino-num font-black text-[7px] text-slate-950 flex items-center justify-center">
                      ₹
                    </div>
                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-300 border border-amber-600" />
                    <div className="w-3 h-3 rounded-full bg-gradient-to-tr from-yellow-500 to-amber-200 border border-white shadow-[0_0_8px_rgba(250,204,21,1)] font-casino-num font-black text-[7px] text-slate-950 flex items-center justify-center">
                      ₹
                    </div>
                  </div>

                  {/* Rich Diamond-Studded Chest Base */}
                  <div className="w-14 h-8 rounded-b-xl bg-gradient-to-b from-amber-600 via-yellow-600 to-amber-900 border-x-2 border-b-2 border-yellow-300 shadow-2xl flex items-center justify-center relative">
                    {/* Big Golden Padlock / Emblem */}
                    <div className="w-4 h-4 rounded-md bg-gradient-to-tr from-yellow-200 via-amber-400 to-yellow-500 border border-white flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,1)]">
                      <Star className="w-2.5 h-2.5 text-slate-950 fill-slate-950" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Center Info Text */}
              <div className="flex-1">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 font-casino-num font-black text-[8px] uppercase tracking-wider">
                    DAY 7 GRAND FINALE
                  </span>
                  <span className="text-[9px] text-amber-300 font-casino-num font-bold">
                    Streak Bonus
                  </span>
                </div>

                <h3 className="font-casino-num font-black text-white text-sm sm:text-base leading-tight uppercase tracking-tight">
                  MEGA CHEST: <span className="text-amber-300 font-black">₹{day7Reward}</span>
                </h3>
                <p className="text-[9.5px] text-amber-200/80 font-medium">
                  Continuous 7-Day login grand cash bounty
                </p>
              </div>

              {/* Right Action Badge / Button */}
              <div className="shrink-0">
                {isDay7Completed ? (
                  <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-950/90 border border-emerald-400 text-emerald-300 font-casino-num font-black text-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>CLAIMED</span>
                  </div>
                ) : isDay7Ready ? (
                  <button
                    onClick={handleClaim}
                    disabled={isClaiming}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 text-slate-950 font-casino-num font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.7)] border-t border-white/60 active:scale-95 transition-transform"
                  >
                    CLAIM ₹{day7Reward}
                  </button>
                ) : (
                  <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-slate-400 font-casino-num font-black text-[10px]">
                    <Lock className="w-3 h-3 text-slate-500" />
                    <span>LOCKED</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Bottom Main Action Bar */}
      <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
        <span className="text-[10px] text-slate-400 font-casino-num font-medium">
          {claimedToday
            ? `Claimed for today! Next: Day ${nextDayToClaim} (+₹${nextReward})`
            : `Available today: Day ${nextDayToClaim} (+₹${nextReward})`}
        </span>

        <button
          onClick={handleClaim}
          disabled={claimedToday || isClaiming}
          className={`px-4 py-2 rounded-xl font-casino-num font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            !claimedToday
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 text-slate-950 shadow-lg shadow-amber-500/30 border-t border-white/50 active:scale-95'
              : 'bg-slate-900 text-slate-500 border border-slate-800 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{claimedToday ? 'Claimed Today' : `Claim Day ${nextDayToClaim} (₹${nextReward})`}</span>
        </button>
      </div>

      {/* Claim Success Feedback Toast Strip */}
      {claimMessage && (
        <div className="mt-2.5 p-2 rounded-xl bg-gradient-to-r from-emerald-950 via-[#06241a] to-emerald-950 border border-emerald-400/60 text-emerald-300 text-xs font-casino-num font-black text-center shadow-md animate-in zoom-in-95">
          {claimMessage}
        </div>
      )}
    </div>
  );
};
