import React, { useState, useEffect } from 'react';
import { Gift, CheckCircle2, Sparkles } from 'lucide-react';
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
    { day: 1, reward: 5 },
    { day: 2, reward: 10 },
    { day: 3, reward: 15 },
    { day: 4, reward: 25 },
    { day: 5, reward: 40 },
    { day: 6, reward: 60 },
    { day: 7, reward: 100 },
  ]);
  const [isClaiming, setIsClaiming] = useState<boolean>(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);

  const fetchAttendance = async () => {
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
    if (claimedToday) return;
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
        soundManager.play('bet');
        setClaimedToday(true);
        setCurrentDay(data.currentDay);
        setClaimMessage(`+${formatINR(data.rewardAmount)} Day ${data.currentDay} Reward Claimed!`);
        if (onRefreshData) onRefreshData();
      } else {
        setClaimMessage(data.error || 'Failed to claim attendance reward.');
      }
    } catch (err: any) {
      setIsClaiming(false);
      setClaimMessage(err.message);
    }
  };

  const nextDayToClaim = claimedToday ? (currentDay % 7) + 1 : Math.min(7, (currentDay % 7) + 1);
  const nextRewardAmount = rewards.find((r) => r.day === nextDayToClaim)?.reward || 5;

  return (
    <div className="bg-[#0b101c] border border-slate-700/60 rounded-lg p-3 shadow-md">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-gradient-to-br from-amber-400 to-amber-700 text-slate-950 flex items-center justify-center font-bold shadow-sm">
            <Gift className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
          <div>
            <h4 className="font-casino-num font-black text-white text-xs uppercase tracking-wider">
              {t('attendance')}
            </h4>
            <p className="text-[9px] text-amber-400 font-casino-num font-bold">
              Progressive Virtual Credits (Day 1: ₹5 to Day 7: ₹100)
            </p>
          </div>
        </div>

        <span className="text-[9px] bg-amber-500/15 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded font-casino-num font-black">
          Streak: {currentDay} Days
        </span>
      </div>

      {/* 7-Day Grid */}
      <div className="grid grid-cols-7 gap-1 mb-2.5">
        {rewards.map((r) => {
          const isCompleted = currentDay >= r.day;
          const isTodayNext = !claimedToday && nextDayToClaim === r.day;

          return (
            <div
              key={r.day}
              className={`p-1 rounded-md border flex flex-col items-center justify-between text-center transition-all ${
                isCompleted
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : isTodayNext
                  ? 'bg-amber-950/40 border-amber-400 text-amber-200 animate-pulse'
                  : 'bg-[#070b14] border-slate-800 text-slate-400'
              }`}
            >
              <span className="text-[8px] font-casino-num uppercase font-bold">
                D{r.day}
              </span>

              <div className="my-0.5">
                {isCompleted ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mx-auto" />
                ) : (
                  <span className="font-casino-num font-black text-xs block text-white">
                    ₹{r.reward}
                  </span>
                )}
              </div>

              <span className="text-[7px] font-casino-num font-bold">
                {isCompleted ? 'CLAIM' : isTodayNext ? 'READY' : 'LOCK'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Action / Feedback */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-casino-num font-medium">
          {claimedToday
            ? `Claimed for today! Next: Day ${nextDayToClaim} (+₹${nextRewardAmount})`
            : `Available today: Day ${nextDayToClaim} (+₹${nextRewardAmount})`}
        </span>

        <button
          onClick={handleClaim}
          disabled={claimedToday || isClaiming}
          className={`px-3 py-1.5 rounded-md font-casino-num font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 ${
            !claimedToday
              ? 'bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95'
              : 'bg-slate-800 text-slate-500 cursor-not-allowed'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{claimedToday ? 'Claimed' : `Claim ₹${nextRewardAmount}`}</span>
        </button>
      </div>

      {claimMessage && (
        <div className="mt-2 p-1.5 rounded-md bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-casino-num font-bold text-center">
          {claimMessage}
        </div>
      )}
    </div>
  );
};
