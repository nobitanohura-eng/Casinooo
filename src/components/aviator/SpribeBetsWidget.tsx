import React, { useState } from 'react';
import { AviatorBet } from '../../lib/types.ts';
import { ShieldCheck, Trophy, Sparkles } from 'lucide-react';

interface SimulatedPlayer {
  id: string;
  avatar: string;
  username: string;
  stake: number;
  targetMultiplier: number;
  cashedOut: boolean;
  cashoutMultiplier?: number;
}

interface SpribeBetsWidgetProps {
  status: string;
  currentMultiplier: number;
  roundNumber: number;
  multiplayerBets: SimulatedPlayer[];
  myBets: AviatorBet[];
  onOpenProvablyFair: () => void;
}

export const SpribeBetsWidget: React.FC<SpribeBetsWidgetProps> = ({
  status,
  currentMultiplier,
  roundNumber,
  multiplayerBets,
  myBets,
  onOpenProvablyFair,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'my' | 'top'>('all');

  const totalCashedOutCount = multiplayerBets.filter((p) => p.cashedOut).length;
  const totalRoundPayout = multiplayerBets
    .filter((p) => p.cashedOut)
    .reduce((sum, p) => sum + Math.round(p.stake * (p.cashoutMultiplier || 1)), 0);

  const topWinsMock = [
    { avatar: 'av-70', user: '77***99', stake: 2000, mult: 184.25, win: 368500, date: 'Today' },
    { avatar: 'av-31', user: '91***12', stake: 1000, mult: 96.50, win: 96500, date: 'Today' },
    { avatar: 'av-48', user: '34***55', stake: 500, mult: 62.10, win: 31050, date: 'Yesterday' },
    { avatar: 'av-54', user: '82***04', stake: 1500, mult: 45.80, win: 68700, date: 'Yesterday' },
    { avatar: 'av-69', user: '19***88', stake: 3000, mult: 32.40, win: 97200, date: '2 days ago' },
  ];

  const getMultiplierStyle = (mult: number) => {
    if (mult < 2.0) return 'text-[#34b4ff] bg-[#34b4ff]/10 border-[#34b4ff]/30';
    if (mult < 10.0) return 'text-[#913ef8] bg-[#913ef8]/10 border-[#913ef8]/30';
    return 'text-[#c017b4] bg-[#c017b4]/15 border-[#c017b4]/40';
  };

  return (
    <div className="flex flex-col h-full bg-[#1b1c1d] border border-[#2a2b2e] rounded-2xl p-2.5 shadow-xl">
      {/* 1. Navigation Switcher: All Bets / My Bets / Top */}
      <div className="spribe-navigation-switcher">
        <button
          onClick={() => setActiveTab('all')}
          className={`spribe-nav-tab ${activeTab === 'all' ? 'active' : ''}`}
        >
          All Bets
        </button>
        <button
          onClick={() => setActiveTab('my')}
          className={`spribe-nav-tab ${activeTab === 'my' ? 'active' : ''}`}
        >
          My Bets ({myBets.length})
        </button>
        <button
          onClick={() => setActiveTab('top')}
          className={`spribe-nav-tab ${activeTab === 'top' ? 'active' : ''}`}
        >
          Top
        </button>
      </div>

      {/* 2. Total Win Widget Banner (Shown on All Bets) */}
      {activeTab === 'all' && (
        <div className="spribe-total-win">
          <div className="spribe-total-win-header">
            <div className="spribe-avatars-stack">
              <img src="/assets/avatars/av-70.png" alt="Top" className="spribe-avatar-circle z-30" />
              <img src="/assets/avatars/av-31.png" alt="Top" className="spribe-avatar-circle z-20" />
              <img src="/assets/avatars/av-48.png" alt="Top" className="spribe-avatar-circle z-10" />
            </div>

            <span className="spribe-total-win-amount">
              {totalRoundPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })} INR
            </span>
          </div>

          <div className="spribe-total-win-stats">
            <span>
              {totalCashedOutCount}/{multiplayerBets.length} Bets
            </span>
            <span>Total win INR</span>
          </div>

          <div className="spribe-progress-track">
            <div
              className="spribe-progress-bar"
              style={{
                width: `${multiplayerBets.length ? (totalCashedOutCount / multiplayerBets.length) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* 3. Bets Content Area */}
      <div className="flex-1 overflow-y-auto mt-2 min-h-48 max-h-72 lg:max-h-96 pr-0.5">
        {activeTab === 'all' && (
          <div>
            {/* Table Header */}
            <div className="spribe-bets-table-header">
              <span>Player</span>
              <span>Bet INR</span>
              <span>X</span>
              <span className="text-right">Win INR</span>
            </div>

            {/* Rows */}
            <div className="space-y-0.5 mt-1">
              {multiplayerBets.map((player) => (
                <div
                  key={player.id}
                  className={`spribe-bets-table-row ${player.cashedOut ? 'cashed-out' : ''}`}
                >
                  <div className="spribe-player-cell">
                    <img
                      src={`/assets/avatars/${player.avatar}.png`}
                      alt={player.username}
                      className="spribe-player-avatar"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/avatars/av-31.png';
                      }}
                    />
                    <span className="spribe-player-name">{player.username}</span>
                  </div>

                  <div className="spribe-bet-cell">
                    {player.stake.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </div>

                  <div className="spribe-multiplier-cell">
                    {player.cashedOut ? (
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold border ${getMultiplierStyle(
                          player.cashoutMultiplier || 1
                        )}`}
                      >
                        {player.cashoutMultiplier?.toFixed(2)}x
                      </span>
                    ) : status === 'CRASHED' ? (
                      <span className="text-rose-500/70 text-[10px]">Flew away</span>
                    ) : (
                      <span className="text-amber-400 text-[10px] animate-pulse">In flight</span>
                    )}
                  </div>

                  <div className="spribe-win-cell">
                    {player.cashedOut
                      ? Math.round(player.stake * (player.cashoutMultiplier || 1)).toLocaleString(
                          'en-IN',
                          { minimumFractionDigits: 2 }
                        )
                      : '-'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'my' && (
          <div className="space-y-1.5 p-1">
            {myBets.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No personal bets placed yet in this session.
              </div>
            ) : (
              myBets.map((bet) => (
                <div
                  key={bet.id}
                  className="p-2 rounded-xl bg-[#141516] border border-[#2a2b2e] flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-bold text-white">
                      ₹{bet.stake_amount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {bet.auto_cashout_multiplier
                        ? `Auto: ${bet.auto_cashout_multiplier.toFixed(2)}x`
                        : 'Manual'}
                    </div>
                  </div>

                  <div className="text-right">
                    {bet.status === 'WON' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                        Cashed {bet.cashout_multiplier?.toFixed(2)}x (+₹{bet.payout_amount})
                      </span>
                    ) : bet.status === 'IN_FLIGHT' ? (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                        In Flight
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                        Lost
                      </span>
                    )}
                    <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                      {new Date(bet.created_at).toLocaleTimeString('en-IN')}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'top' && (
          <div className="space-y-1.5 p-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-400" />
              <span>Highest Multipliers</span>
            </div>

            {topWinsMock.map((win, i) => (
              <div
                key={i}
                className="p-2 rounded-xl bg-[#141516] border border-[#2a2b2e] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={`/assets/avatars/${win.avatar}.png`}
                    alt={win.user}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                  <div>
                    <span className="font-bold text-white">{win.user}</span>
                    <span className="block text-[9px] text-slate-500">{win.date}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-pink-500/20 text-pink-400 border border-pink-500/40 inline-block">
                    {win.mult.toFixed(2)}x
                  </span>
                  <div className="text-[10px] font-bold text-emerald-400 mt-0.5">
                    +₹{win.win.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Provably Fair Footer */}
      <div className="spribe-bets-footer">
        <button onClick={onOpenProvablyFair} className="spribe-pf-btn">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Provably Fair Game</span>
        </button>

        <div className="spribe-powered-by">
          <span>Powered by</span>
          <img src="/assets/aviator/logo-icon.svg" alt="Spribe" className="h-3.5 w-auto" />
        </div>
      </div>
    </div>
  );
};
