import React, { useState } from 'react';
import { WinGoBet, AviatorBet } from '../../lib/types.ts';
import { ArrowDownLeft, ArrowUpRight, Trophy, Flame, Sparkles, Filter, CheckCircle2, XCircle } from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';
import { AttendanceCard } from './AttendanceCard.tsx';
import { useTranslation } from '../../lib/i18n.ts';

interface ActivityViewProps {
  wingoBets: WinGoBet[];
  aviatorBets: AviatorBet[];
  accountId?: string;
  onRefreshData?: () => void;
  onOpenDepositBonus?: () => void;
  onOpenLuckyWheel?: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  wingoBets,
  aviatorBets,
  accountId = 'acc_demo_pilot_01',
  onRefreshData,
  onOpenDepositBonus,
  onOpenLuckyWheel,
}) => {
  const { t } = useTranslation();
  const [filterGame, setFilterGame] = useState<'ALL' | 'WINGO' | 'AVIATOR'>('ALL');

  interface ActivityItem {
    id: string;
    game: 'Win Go 1Min' | 'Aviator';
    roundRef: string;
    selectionOrDetail: string;
    stake: number;
    payout: number;
    profit: number;
    status: 'WON' | 'LOST' | 'PENDING' | 'IN_FLIGHT';
    timestamp: string;
  }

  const wingoItems: ActivityItem[] = wingoBets.map((b) => ({
    id: b.id,
    game: 'Win Go 1Min',
    roundRef: b.round_id,
    selectionOrDetail: `${b.selection_value} (${b.selection_type})`,
    stake: b.stake_amount,
    payout: b.payout_amount,
    profit: b.payout_amount - b.stake_amount,
    status: b.status as any,
    timestamp: b.created_at,
  }));

  const aviatorItems: ActivityItem[] = aviatorBets.map((b) => ({
    id: b.id,
    game: 'Aviator',
    roundRef: b.round_id,
    selectionOrDetail: b.cashout_multiplier
      ? `Cashed @ ${b.cashout_multiplier.toFixed(2)}x`
      : 'In Flight / Crash',
    stake: b.stake_amount,
    payout: b.payout_amount,
    profit: b.payout_amount - b.stake_amount,
    status: (b.status === 'CRASHED' ? 'LOST' : b.status) as any,
    timestamp: b.created_at,
  }));

  const combinedItems = [...wingoItems, ...aviatorItems].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const filteredItems = combinedItems.filter((item) => {
    if (filterGame === 'WINGO') return item.game === 'Win Go 1Min';
    if (filterGame === 'AVIATOR') return item.game === 'Aviator';
    return true;
  });

  const totalWagered = filteredItems.reduce((acc, cur) => acc + cur.stake, 0);
  const totalPayout = filteredItems.reduce((acc, cur) => acc + cur.payout, 0);
  const netProfit = totalPayout - totalWagered;

  return (
    <div className="space-y-3 px-3 pt-3 pb-24 text-slate-800 select-none">
      {/* 1. 7-Day Attendance Streak Card */}
      <AttendanceCard accountId={accountId} onRefreshData={onRefreshData} />

      {/* 2. Performance Metric Tiles (Clean White Card) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-500" />
            Gaming Activity Stats
          </span>
          <span className="text-[10px] text-[#768096] font-medium">
            Live Settlement
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-1">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-[#768096] font-bold block uppercase">
              Total Bets
            </span>
            <span className="text-base font-black text-slate-900 font-casino-num block mt-0.5">
              {filteredItems.length}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-[#768096] font-bold block uppercase">
              Total Wager
            </span>
            <span className="text-xs font-black text-slate-900 font-casino-num block mt-1">
              {formatINR(totalWagered)}
            </span>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
            <span className="text-[10px] text-[#768096] font-bold block uppercase">
              Net Profit
            </span>
            <span className={`text-xs font-black font-casino-num block mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
              {netProfit >= 0 ? `+${formatINR(netProfit)}` : formatINR(netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Promotional Activity Banners */}
      <div className="grid grid-cols-2 gap-2.5">
        <div
          onClick={onOpenDepositBonus}
          className="bg-gradient-to-br from-rose-50 to-orange-50 border border-rose-200 rounded-2xl p-3 shadow-xs cursor-pointer hover:shadow-sm active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center font-bold text-xs">
              🎁
            </div>
            <span className="text-xs font-bold text-slate-800">100% Bonus</span>
          </div>
          <p className="text-[10px] text-[#768096]">First deposit doubled up to ₹10,000</p>
        </div>

        <div
          onClick={onOpenLuckyWheel}
          className="bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-3 shadow-xs cursor-pointer hover:shadow-sm active:scale-98 transition-all"
        >
          <div className="flex items-center gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold text-xs">
              🎡
            </div>
            <span className="text-xs font-bold text-slate-800">Lucky Spin</span>
          </div>
          <p className="text-[10px] text-[#768096]">Win iPhone 17 Pro & cash rewards</p>
        </div>
      </div>

      {/* 4. Bet Records History (Clean White Card) */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header & Filter Pills */}
        <div className="p-3.5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800">
              Live Round Records
            </span>
            <span className="text-[10px] text-[#768096]">
              {filteredItems.length} Rounds
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[
              { key: 'ALL', label: 'All Games' },
              { key: 'WINGO', label: '🎲 Win Go 1Min' },
              { key: 'AVIATOR', label: '✈️ Aviator' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterGame(tab.key as any)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all ${
                  filterGame === tab.key
                    ? 'bg-[#f95959] text-white shadow-xs'
                    : 'bg-slate-100 text-[#768096] hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Bets List */}
        <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
          {filteredItems.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#768096]">
              No game rounds recorded in this filter.
            </div>
          ) : (
            filteredItems.map((item) => (
              <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs ${
                    item.game === 'Aviator' ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-600'
                  }`}>
                    {item.game === 'Aviator' ? '✈️' : '🎲'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">
                      {item.game}
                    </span>
                    <span className="text-[9px] text-[#768096] font-mono block">
                      {item.selectionOrDetail}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-mono font-black text-xs block ${
                    item.status === 'WON'
                      ? 'text-emerald-600'
                      : item.status === 'LOST'
                      ? 'text-rose-500'
                      : 'text-amber-500'
                  }`}>
                    {item.status === 'WON'
                      ? `+${formatINR(item.payout)}`
                      : item.status === 'LOST'
                      ? `-${formatINR(item.stake)}`
                      : 'In Round'}
                  </span>
                  <span className="text-[9px] text-[#768096] font-mono block">
                    Stake: {formatINR(item.stake)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
