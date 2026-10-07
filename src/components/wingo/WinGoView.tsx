import React from 'react';
import { ChevronLeft, RotateCw, PlusCircle, ShieldCheck } from 'lucide-react';
import { WinGoGame } from './WinGoGame.tsx';
import { WinGoStatePayload, WinGoRoundSummary, WinGoBet } from '../../lib/types.ts';
import { formatINR } from '../../lib/formatters.ts';

interface WinGoViewProps {
  state: WinGoStatePayload;
  walletBalance: number;
  accountId: string;
  myBets: WinGoBet[];
  history: WinGoRoundSummary[];
  onRefreshData: () => void;
  onBackToLobby: () => void;
  onOpenDeposit: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const WinGoView: React.FC<WinGoViewProps> = ({
  state,
  walletBalance,
  accountId,
  myBets,
  history,
  onRefreshData,
  onBackToLobby,
  onOpenDeposit,
  onOpenAuth,
}) => {
  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col select-none">
      {/* 1. Lottery 7 Official Win Go Header */}
      <header className="sticky top-0 z-40 bg-[#0b101c]/95 backdrop-blur-md border-b border-slate-700/60 px-3 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={onBackToLobby}
            className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-slate-200 transition-colors"
            title="Back to Lobby"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-casino-num font-black text-sm tracking-wide text-white flex items-center gap-1.5">
              <span>APEX WIN GO 1MIN</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                LIVE
              </span>
            </h1>
            <span className="text-[10px] text-slate-400 font-casino-num">
              Round #{String(state.periodNumber).slice(-6)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-[#121929] border border-amber-500/30 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="text-[10px] text-slate-400 font-medium">Bal:</span>
            <span className="text-xs font-casino-num font-black text-amber-300">
              {formatINR(walletBalance)}
            </span>
            <button
              onClick={onRefreshData}
              className="text-slate-400 hover:text-white transition-colors"
              title="Refresh Balance"
              aria-label="Refresh Balance"
            >
              <RotateCw className="w-3 h-3" />
            </button>
          </div>

          <button
            onClick={() => {
              if (!accountId && onOpenAuth) {
                onOpenAuth('login');
              } else {
                onOpenDeposit();
              }
            }}
            className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#f95959] to-[#ff7979] text-white text-[11px] font-bold shadow-sm hover:brightness-105 transition-all flex items-center gap-1"
          >
            <PlusCircle className="w-3 h-3" />
            <span>Deposit</span>
          </button>
        </div>
      </header>

      {/* 2. Main Win Go Game Canvas */}
      <main className="flex-1 max-w-md w-full mx-auto pt-2">
        <WinGoGame
          state={state}
          walletBalance={walletBalance}
          accountId={accountId}
          myBets={myBets}
          history={history}
          onRefreshData={onRefreshData}
          onOpenAuth={onOpenAuth}
        />
      </main>
    </div>
  );
};
