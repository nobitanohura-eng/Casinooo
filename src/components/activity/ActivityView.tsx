import React, { useState } from 'react';
import { WinGoBet, AviatorBet } from '../../lib/types.ts';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';
import { AttendanceCard } from './AttendanceCard.tsx';
import { useTranslation } from '../../lib/i18n.ts';

interface ActivityViewProps {
  wingoBets: WinGoBet[];
  aviatorBets: AviatorBet[];
  accountId?: string;
  onRefreshData?: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  wingoBets,
  aviatorBets,
  accountId = 'acc_demo_pilot_01',
  onRefreshData,
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
    <div className="space-y-3 px-3 pb-24">
      {/* 1. 7-Day Attendance Streak Card */}
      <AttendanceCard accountId={accountId} onRefreshData={onRefreshData} />

      {/* 2. Performance Metric Tiles */}
      <div className="bg-[#0b101c] border border-slate-700/60 rounded-lg p-3 shadow-md grid grid-cols-3 gap-1.5 text-center">
        <div className="bg-[#070b14] p-2 rounded-md border border-slate-800">
          <span className="text-[9px] text-slate-400 uppercase font-bold block font-casino-num">
            Total Bets
          </span>
          <span className="font-casino-num font-black text-white text-base mt-0.5 block">
            {filteredItems.length}
          </span>
        </div>
        <div className="bg-[#070b14] p-2 rounded-md border border-slate-800">
          <span className="text-[9px] text-slate-400 uppercase font-bold block font-casino-num">
            Total Wager
          </span>
          <span className="font-casino-num font-black text-slate-200 text-xs mt-0.5 block">
            {formatINR(totalWagered)}
          </span>
        </div>
        <div className="bg-[#070b14] p-2 rounded-md border border-slate-800">
          <span className="text-[9px] text-slate-400 uppercase font-bold block font-casino-num">
            Net Return
          </span>
          <span
            className={`font-casino-num font-black text-xs mt-0.5 block ${
              netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {netProfit >= 0 ? `+${formatINR(netProfit)}` : `-${formatINR(Math.abs(netProfit))}`}
          </span>
        </div>
      </div>

      {/* 3. Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 bg-[#0b101c] p-1 rounded-md border border-slate-700/60">
          <button
            onClick={() => setFilterGame('ALL')}
            className={`px-2.5 py-1 rounded text-xs font-casino-num font-bold transition-all ${
              filterGame === 'ALL'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            All Games
          </button>
          <button
            onClick={() => setFilterGame('WINGO')}
            className={`px-2.5 py-1 rounded text-xs font-casino-num font-bold transition-all ${
              filterGame === 'WINGO'
                ? 'bg-emerald-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Win Go
          </button>
          <button
            onClick={() => setFilterGame('AVIATOR')}
            className={`px-2.5 py-1 rounded text-xs font-casino-num font-bold transition-all ${
              filterGame === 'AVIATOR'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Aviator
          </button>
        </div>

        <span className="text-[10px] text-amber-400 font-casino-num font-bold">
          {filteredItems.length} Records
        </span>
      </div>

      {/* 4. Activity List */}
      <div className="space-y-1.5">
        {filteredItems.length === 0 ? (
          <div className="bg-[#0b101c] border border-slate-800 rounded-lg p-6 text-center text-slate-500 text-xs font-casino-num">
            No wagering records found.
          </div>
        ) : (
          filteredItems.map((item) => {
            const isWon = item.status === 'WON';
            const isPending = item.status === 'PENDING' || item.status === 'IN_FLIGHT';

            return (
              <div
                key={item.id}
                className="bg-[#0b101c] border border-slate-700/60 rounded-md p-2.5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs ${
                      item.game === 'Win Go 1Min'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        : 'bg-rose-950 text-rose-400 border border-rose-800/60'
                    }`}
                  >
                    {item.game === 'Win Go 1Min' ? 'WG' : 'AV'}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-casino-num font-bold text-white">
                        {item.game}
                      </span>
                      <span className="text-[10px] text-amber-300 font-casino-num">
                        {item.selectionOrDetail}
                      </span>
                    </div>
                    <span className="text-[9px] text-slate-500 font-casino-num block">
                      {new Date(item.timestamp).toLocaleTimeString('en-IN')} · Stake: {formatINR(item.stake)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className={`font-casino-num font-black text-xs ${
                      isWon
                        ? 'text-emerald-400'
                        : isPending
                        ? 'text-amber-400'
                        : 'text-slate-500'
                    }`}
                  >
                    {isWon
                      ? `+${formatINR(item.payout)}`
                      : isPending
                      ? 'IN FLIGHT'
                      : `-${formatINR(item.stake)}`}
                  </div>
                  <span
                    className={`text-[8px] font-casino-num font-black px-1.5 py-0.2 rounded uppercase ${
                      isWon
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                        : isPending
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        : 'bg-slate-900 text-slate-500'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
