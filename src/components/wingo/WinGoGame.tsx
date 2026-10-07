import React, { useState } from 'react';
import {
  WinGoStatePayload,
  WinGoSelectionType,
  WinGoSelectionValue,
  WinGoRoundSummary,
  WinGoBet,
} from '../../lib/types.ts';
import { WinGoCountdown } from './WinGoCountdown.tsx';
import { WinGoWinningTicker } from './WinGoWinningTicker.tsx';
import { WinGoBetDrawer } from './WinGoBetDrawer.tsx';
import { WinGoRecentHistory } from './WinGoRecentHistory.tsx';
import { WinGoTrendChart } from './WinGoTrendChart.tsx';
import { WinGoMyBets } from './WinGoMyBets.tsx';
import { getSocket } from '../../lib/socket.ts';
import { soundManager } from '../../lib/sound.ts';
import { useTranslation } from '../../lib/i18n.ts';

interface WinGoGameProps {
  state: WinGoStatePayload;
  walletBalance: number;
  accountId: string;
  myBets: WinGoBet[];
  history: WinGoRoundSummary[];
  onRefreshData: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const WinGoGame: React.FC<WinGoGameProps> = ({
  state,
  walletBalance,
  accountId,
  myBets,
  history,
  onRefreshData,
  onOpenAuth,
}) => {
  const { t } = useTranslation();
  const [selectedDrawer, setSelectedDrawer] = useState<{
    isOpen: boolean;
    type: WinGoSelectionType;
    value: WinGoSelectionValue;
  }>({
    isOpen: false,
    type: 'COLOR',
    value: 'GREEN',
  });

  const [activeTab, setActiveTab] = useState<'records' | 'trend' | 'mybets'>('records');

  const isLocked = state.remainingSeconds <= state.betLockSeconds || state.status === 'LOCKED';

  const handleOpenDrawer = (type: WinGoSelectionType, value: WinGoSelectionValue) => {
    soundManager.play('chip');
    setSelectedDrawer({
      isOpen: true,
      type,
      value,
    });
  };

  const handleConfirmBet = async (params: {
    selectionType: WinGoSelectionType;
    selectionValue: WinGoSelectionValue;
    stakeAmount: number;
  }): Promise<{ success: boolean; error?: string }> => {
    if (!accountId) {
      if (onOpenAuth) onOpenAuth('login');
      return { success: false, error: 'Please log in to place real bets.' };
    }
    const socket = getSocket();
    const idempotencyKey = `wgb_${accountId}_${state.roundId}_${Date.now()}`;

    return new Promise((resolve) => {
      if (socket.connected) {
        socket.emit(
          'wingo:bet:place',
          {
            accountId,
            roundId: state.roundId,
            selectionType: params.selectionType,
            selectionValue: params.selectionValue,
            stakeAmount: params.stakeAmount,
            idempotencyKey,
          },
          (res: any) => {
            if (res && res.success) {
              onRefreshData();
              resolve({ success: true });
            } else {
              resolve({ success: false, error: res?.error || 'Bet placement failed' });
            }
          }
        );
      } else {
        fetch('/api/wingo/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            accountId,
            roundId: state.roundId,
            selectionType: params.selectionType,
            selectionValue: params.selectionValue,
            stakeAmount: params.stakeAmount,
            idempotencyKey,
          }),
        })
          .then((r) => r.json())
          .then((data) => {
            if (data.success) {
              onRefreshData();
              resolve({ success: true });
            } else {
              resolve({ success: false, error: data.error || 'Bet placement failed' });
            }
          })
          .catch((err) => resolve({ success: false, error: err.message }));
      }
    });
  };

  // Helper for 3D lottery balls with radial highlights
  const getBallStyle = (num: number) => {
    if (num === 0) {
      return 'bg-[linear-gradient(135deg,#e11d48_50%,#8b5cf6_50%)] border border-white/30';
    }
    if (num === 5) {
      return 'bg-[linear-gradient(135deg,#059669_50%,#8b5cf6_50%)] border border-white/30';
    }
    if (num % 2 === 0) {
      // Red: Radial gradient bright crimson to dark maroon
      return 'bg-[radial-gradient(circle_at_35%_25%,#fb7185,#e11d48_55%,#881337)] border border-rose-400/50';
    }
    // Green: Radial gradient neon emerald to deep forest
    return 'bg-[radial-gradient(circle_at_35%_25%,#34d399,#059669_55%,#064e3b)] border border-emerald-400/50';
  };

  return (
    <div className="space-y-3 px-3 pb-24">
      {/* 1. Ultra-Compact 44px Slim Glassmorphic Timer Ribbon */}
      <WinGoCountdown
        periodNumber={state.periodNumber}
        remainingSeconds={state.remainingSeconds}
        status={state.status}
        totalCycleSeconds={state.totalCycleSeconds}
        betLockSeconds={state.betLockSeconds}
      />

      {/* 2. Realtime Winning Marquee Ticker */}
      <WinGoWinningTicker />

      {/* 3. Flat, Borderless Seamless Canvas (NO CONTAINER INCEPTION) */}
      <div className="space-y-3 pt-1">
        {/* Row A: Tactile 3D Color Selection Buttons floating directly on canvas */}
        <div className="grid grid-cols-3 gap-2">
          {/* Green Button */}
          <button
            onClick={() => handleOpenDrawer('COLOR', 'GREEN')}
            disabled={isLocked}
            className={`py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all tap-highlight-none border-t border-white/40 ${
              isLocked
                ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-b from-emerald-500 via-emerald-600 to-emerald-800 text-white shadow-[0_4px_0_#065f46] hover:brightness-105 active:translate-y-1 active:shadow-none'
            }`}
          >
            <span className="font-casino-num font-black text-sm uppercase tracking-wide drop-shadow-sm leading-tight">
              {t('green')}
            </span>
            <span className="mt-1 bg-white text-slate-950 font-casino-num font-black text-[10px] px-2 py-0.5 rounded shadow-sm">
              2X
            </span>
          </button>

          {/* Violet Button */}
          <button
            onClick={() => handleOpenDrawer('COLOR', 'VIOLET')}
            disabled={isLocked}
            className={`py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all tap-highlight-none border-t border-white/40 ${
              isLocked
                ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-b from-violet-500 via-violet-600 to-violet-800 text-white shadow-[0_4px_0_#5b21b6] hover:brightness-105 active:translate-y-1 active:shadow-none'
            }`}
          >
            <span className="font-casino-num font-black text-sm uppercase tracking-wide drop-shadow-sm leading-tight">
              {t('violet')}
            </span>
            <span className="mt-1 bg-amber-300 text-slate-950 font-casino-num font-black text-[10px] px-2 py-0.5 rounded shadow-sm">
              4.5X
            </span>
          </button>

          {/* Red Button */}
          <button
            onClick={() => handleOpenDrawer('COLOR', 'RED')}
            disabled={isLocked}
            className={`py-2.5 px-2 rounded-lg flex flex-col items-center justify-center transition-all tap-highlight-none border-t border-white/40 ${
              isLocked
                ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-b from-rose-500 via-rose-600 to-rose-800 text-white shadow-[0_4px_0_#9f1239] hover:brightness-105 active:translate-y-1 active:shadow-none'
            }`}
          >
            <span className="font-casino-num font-black text-sm uppercase tracking-wide drop-shadow-sm leading-tight">
              {t('red')}
            </span>
            <span className="mt-1 bg-white text-slate-950 font-casino-num font-black text-[10px] px-2 py-0.5 rounded shadow-sm">
              2X
            </span>
          </button>
        </div>

        {/* Row B: 3D Spherical Lottery Balls (0-9) floating directly on deep obsidian canvas */}
        <div className="py-1">
          <div className="grid grid-cols-5 gap-3 sm:gap-4 max-w-sm mx-auto">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              const ballStyle = getBallStyle(num);

              return (
                <button
                  key={num}
                  onClick={() => handleOpenDrawer('NUMBER', String(num) as any)}
                  disabled={isLocked}
                  className={`relative aspect-square rounded-full flex flex-col items-center justify-center transition-all tap-highlight-none ${
                    isLocked
                      ? 'bg-slate-800/20 text-slate-600 cursor-not-allowed border border-slate-800 shadow-none'
                      : `${ballStyle} shadow-[0_4px_0_rgba(0,0,0,0.6)] hover:scale-105 active:translate-y-1 active:shadow-none`
                  }`}
                >
                  {/* Gloss highlight arc on upper curvature */}
                  <div className="absolute top-1.5 left-2.5 w-3 h-1.5 bg-white/45 rounded-full blur-[0.3px] pointer-events-none" />

                  <span className="font-casino-num font-black text-xl text-white drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)] leading-none">
                    {num}
                  </span>
                  <span className="text-[9px] font-black text-amber-200 leading-none mt-0.5 drop-shadow font-casino-num">
                    9X
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row C: Tactile Big & Small Action Buttons floating directly on canvas */}
        <div className="grid grid-cols-2 gap-2">
          {/* Big Button */}
          <button
            onClick={() => handleOpenDrawer('SIZE', 'BIG')}
            disabled={isLocked}
            className={`py-3 px-4 rounded-lg flex items-center justify-between transition-all tap-highlight-none border-t border-white/40 ${
              isLocked
                ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800 text-white shadow-[0_4px_0_#78350f] hover:brightness-105 active:translate-y-1 active:shadow-none'
            }`}
          >
            <span className="font-casino-num font-black text-sm uppercase tracking-wide">
              {t('big')} (5-9)
            </span>
            <span className="bg-slate-950/80 text-amber-300 font-casino-num font-black text-[10px] px-2 py-0.5 rounded shadow-sm">
              1.96X
            </span>
          </button>

          {/* Small Button */}
          <button
            onClick={() => handleOpenDrawer('SIZE', 'SMALL')}
            disabled={isLocked}
            className={`py-3 px-4 rounded-lg flex items-center justify-between transition-all tap-highlight-none border-t border-white/40 ${
              isLocked
                ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-b from-blue-600 via-blue-700 to-blue-900 text-white shadow-[0_4px_0_#1e3a8a] hover:brightness-105 active:translate-y-1 active:shadow-none'
            }`}
          >
            <span className="font-casino-num font-black text-sm uppercase tracking-wide">
              {t('small')} (0-4)
            </span>
            <span className="bg-slate-950/80 text-blue-300 font-casino-num font-black text-[10px] px-2 py-0.5 rounded shadow-sm">
              1.96X
            </span>
          </button>
        </div>
      </div>

      {/* 4. Tabbed Parity History & Trend Records */}
      <div className="bg-[#0b101c]/90 border border-slate-700/60 rounded-lg p-2.5 shadow-md mt-4">
        {/* Tab Headers */}
        <div className="grid grid-cols-3 gap-1 bg-[#070b14] p-1 rounded-md border border-slate-800 mb-2.5">
          <button
            onClick={() => {
              soundManager.play('click');
              setActiveTab('records');
            }}
            className={`py-1.5 rounded-md text-xs font-casino-num font-black uppercase tracking-wider transition-all ${
              activeTab === 'records'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('gameRecord')}
          </button>
          <button
            onClick={() => {
              soundManager.play('click');
              setActiveTab('trend');
            }}
            className={`py-1.5 rounded-md text-xs font-casino-num font-black uppercase tracking-wider transition-all ${
              activeTab === 'trend'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('trendChart')}
          </button>
          <button
            onClick={() => {
              soundManager.play('click');
              setActiveTab('mybets');
            }}
            className={`py-1.5 rounded-md text-xs font-casino-num font-black uppercase tracking-wider transition-all ${
              activeTab === 'mybets'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t('myBets')}
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'records' && <WinGoRecentHistory history={history} />}
        {activeTab === 'trend' && <WinGoTrendChart history={history} />}
        {activeTab === 'mybets' && <WinGoMyBets bets={myBets} />}
      </div>

      {/* 5. Authoritative Bet Slip Drawer */}
      <WinGoBetDrawer
        isOpen={selectedDrawer.isOpen}
        onClose={() => setSelectedDrawer((prev) => ({ ...prev, isOpen: false }))}
        selectionType={selectedDrawer.type}
        selectionValue={selectedDrawer.value}
        periodNumber={state.periodNumber}
        walletBalance={walletBalance}
        isLocked={isLocked}
        onConfirmBet={handleConfirmBet}
      />
    </div>
  );
};
