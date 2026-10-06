import React, { useState, useEffect, useRef } from 'react';
import { AviatorStatePayload, AviatorBet, AviatorRecentCrash } from '../../lib/types.ts';
import { AviatorCanvas } from './AviatorCanvas.tsx';
import { AviatorHistory } from './AviatorHistory.tsx';
import { AviatorBetPanel } from './AviatorBetPanel.tsx';
import { getSocket } from '../../lib/socket.ts';
import { formatINR } from '../../lib/formatters.ts';
import { soundManager } from '../../lib/sound.ts';
import { Users, History } from 'lucide-react';

interface AviatorGameProps {
  state: AviatorStatePayload;
  walletBalance: number;
  accountId: string;
  myBets: AviatorBet[];
  history: AviatorRecentCrash[];
  onRefreshData: () => void;
}

interface SimulatedMultiplayerBet {
  id: string;
  user: string;
  stake: number;
  targetMultiplier: number;
  cashedOut: boolean;
  cashoutMultiplier?: number;
}

export const AviatorGame: React.FC<AviatorGameProps> = ({
  state,
  walletBalance,
  accountId,
  myBets,
  history,
  onRefreshData,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [betsTab, setBetsTab] = useState<'all' | 'my'>('all');

  // Simulated multiplayer participants for the current round
  const [multiplayerBets, setMultiplayerBets] = useState<SimulatedMultiplayerBet[]>([]);
  const prevRoundIdRef = useRef<string>('');

  // Generate new simulated multiplayer bets when a new round starts
  useEffect(() => {
    if (state.roundId && state.roundId !== prevRoundIdRef.current) {
      prevRoundIdRef.current = state.roundId;
      const seedUsers = [
        { user: '98***21', stake: 500, target: 1.45 },
        { user: '76***14', stake: 200, target: 2.10 },
        { user: '82***90', stake: 1000, target: 1.30 },
        { user: '44***12', stake: 100, target: 3.50 },
        { user: '55***88', stake: 250, target: 1.80 },
        { user: '33***67', stake: 50, target: 5.20 },
        { user: '91***34', stake: 2000, target: 1.25 },
        { user: '19***75', stake: 300, target: 2.80 },
        { user: '62***09', stake: 150, target: 4.10 },
        { user: '88***41', stake: 800, target: 1.65 },
        { user: '70***55', stake: 100, target: 7.50 },
        { user: '27***93', stake: 400, target: 2.30 },
      ];

      const bets: SimulatedMultiplayerBet[] = seedUsers.map((u, i) => ({
        id: `mp_${state.roundId}_${i}`,
        user: u.user,
        stake: u.stake,
        targetMultiplier: u.target,
        cashedOut: false,
      }));

      setMultiplayerBets(bets);
    }
  }, [state.roundId]);

  // Handle dynamic multiplayer cashout updates during flight
  useEffect(() => {
    if (state.status === 'FLYING') {
      setMultiplayerBets((prev) =>
        prev.map((bet) => {
          if (!bet.cashedOut && state.currentMultiplier >= bet.targetMultiplier) {
            return {
              ...bet,
              cashedOut: true,
              cashoutMultiplier: bet.targetMultiplier,
            };
          }
          return bet;
        })
      );
    }
  }, [state.status, state.currentMultiplier]);

  // Pillar 3: Dynamic Web Audio API Turbine Hum Pitch Climbing
  const prevStatusRef = useRef<string>(state.status);
  useEffect(() => {
    if (state.status === 'FLYING') {
      if (prevStatusRef.current !== 'FLYING') {
        soundManager.startTurbineHum();
      }
      soundManager.updateTurbinePitch(state.currentMultiplier);
    } else if (state.status === 'CRASHED') {
      if (prevStatusRef.current === 'FLYING') {
        soundManager.stopTurbineHum(true); // Stop with soft descending crash whoosh
      }
    } else if (state.status === 'BETTING') {
      soundManager.stopTurbineHum(false);
    }
    prevStatusRef.current = state.status;
  }, [state.status, state.currentMultiplier]);

  // Stop turbine on unmount
  useEffect(() => {
    return () => {
      soundManager.stopTurbineHum(false);
    };
  }, []);

  // Find active bet for current round if any
  const currentRoundBet = myBets.find((b) => b.round_id === state.roundId) || null;

  const handlePlaceBet = async (stake: number, autoCashout?: number) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const socket = getSocket();
    const idempotencyKey = `avb_${accountId}_${state.roundId}_${Date.now()}`;

    const payload = {
      accountId,
      roundId: state.roundId,
      stakeAmount: stake,
      autoCashoutMultiplier: autoCashout ?? null,
      idempotencyKey,
    };

    if (socket.connected) {
      socket.emit('aviator:bet:place', payload, (res: any) => {
        setIsSubmitting(false);
        if (res?.success) {
          onRefreshData();
        } else {
          setErrorMessage(res?.error || 'Failed to place Aviator bet');
        }
      });
    } else {
      try {
        const res = await fetch('/api/aviator/bet', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setIsSubmitting(false);
        if (data.success) {
          onRefreshData();
        } else {
          setErrorMessage(data.error || 'Failed to place Aviator bet');
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setErrorMessage(err.message);
      }
    }
  };

  const handleCashOut = async (betId: string) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const socket = getSocket();
    const payload = {
      accountId,
      betId,
    };

    if (socket.connected) {
      socket.emit('aviator:cashout', payload, (res: any) => {
        setIsSubmitting(false);
        if (res?.success) {
          onRefreshData();
        } else {
          setErrorMessage(res?.error || 'Cash out rejected by server');
        }
      });
    } else {
      try {
        const res = await fetch('/api/aviator/cashout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        setIsSubmitting(false);
        if (data.success) {
          onRefreshData();
        } else {
          setErrorMessage(data.error || 'Cash out rejected');
        }
      } catch (err: any) {
        setIsSubmitting(false);
        setErrorMessage(err.message);
      }
    }
  };

  const cashedOutMultiplayerCount = multiplayerBets.filter((b) => b.cashedOut).length;

  return (
    <div className="space-y-3 px-4 pb-24">
      {/* 1. Recent Crash Multipliers Bar (1xBet Parity Tiered Colors) */}
      <AviatorHistory recentCrashes={history.length > 0 ? history : state.recentCrashes} />

      {/* 2. Interactive Canvas */}
      <AviatorCanvas
        status={state.status}
        currentMultiplier={state.currentMultiplier}
        bettingCountdownSeconds={state.bettingCountdownSeconds}
        crashMultiplier={state.crashMultiplier}
      />

      {/* 3. Betting Panel */}
      <AviatorBetPanel
        status={state.status}
        currentMultiplier={state.currentMultiplier}
        walletBalance={walletBalance}
        activeUserBet={currentRoundBet}
        isSubmitting={isSubmitting}
        errorMessage={errorMessage}
        onPlaceBet={handlePlaceBet}
        onCashOut={handleCashOut}
      />

      {/* 4. Tabbed Bets Section: [ All Bets (1xBet Live Multiplayer) | My Bets ] */}
      <div className="bg-[#0e1424] border border-slate-800 rounded-2xl p-3 shadow-xl">
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#090d18] rounded-xl border border-slate-800 mb-3">
          <button
            onClick={() => setBetsTab('all')}
            className={`py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
              betsTab === 'all'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>All Bets ({multiplayerBets.length})</span>
          </button>
          <button
            onClick={() => setBetsTab('my')}
            className={`py-2 rounded-lg text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-1.5 ${
              betsTab === 'my'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>My Bets ({myBets.length})</span>
          </button>
        </div>

        {betsTab === 'all' ? (
          <div>
            <div className="flex items-center justify-between px-1 mb-2 text-[10px] text-slate-400 font-mono">
              <span>ROUND #{state.roundNumber} PARTICIPANTS</span>
              <span className="text-emerald-400 font-bold">
                {cashedOutMultiplayerCount} Cashed Out
              </span>
            </div>

            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {multiplayerBets.map((mp) => (
                <div
                  key={mp.id}
                  className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-colors duration-300 ${
                    mp.cashedOut
                      ? 'bg-emerald-950/70 border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.15)] text-emerald-200'
                      : state.status === 'CRASHED'
                      ? 'bg-[#0a0f1b] border-slate-800/60 text-slate-500'
                      : 'bg-[#101728] border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-300">
                      User {mp.user}
                    </span>
                    <span className="text-[10px] font-mono-nums text-slate-400">
                      {formatINR(mp.stake)}
                    </span>
                  </div>

                  <div>
                    {mp.cashedOut ? (
                      <span className="bg-emerald-500 text-slate-950 font-mono-nums font-black text-[11px] px-2 py-0.5 rounded-full shadow-sm animate-in fade-in">
                        {mp.cashoutMultiplier?.toFixed(2)}x (+{formatINR(Math.round(mp.stake * (mp.cashoutMultiplier || 1)))})
                      </span>
                    ) : state.status === 'CRASHED' ? (
                      <span className="text-[10px] text-rose-400 font-mono font-bold">
                        Flew Away
                      </span>
                    ) : (
                      <span className="text-[10px] text-amber-400/80 font-mono font-bold animate-pulse">
                        In Flight...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {myBets.length === 0 ? (
              <p className="text-slate-500 text-xs text-center py-5">
                No personal bets placed yet. Bet during countdown to participate!
              </p>
            ) : (
              myBets.slice(0, 10).map((bet) => (
                <div
                  key={bet.id}
                  className="p-2.5 rounded-xl bg-[#080d17] border border-slate-800/80 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="font-mono font-black text-slate-200">
                      Wager: {formatINR(bet.stake_amount)}
                    </div>
                    <div className="text-[10px] text-amber-400/90 mt-0.5 font-mono">
                      {bet.auto_cashout_multiplier
                        ? `Auto @ ${bet.auto_cashout_multiplier.toFixed(2)}x`
                        : 'Manual Cash Out'}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-black ${
                        bet.status === 'WON'
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60'
                          : bet.status === 'IN_FLIGHT'
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-800/60 animate-pulse'
                          : 'bg-rose-950/80 text-rose-400 border border-rose-900/60'
                      }`}
                    >
                      {bet.status === 'WON'
                        ? `CASHED @ ${bet.cashout_multiplier?.toFixed(2)}x (+${formatINR(bet.payout_amount)})`
                        : bet.status === 'IN_FLIGHT'
                        ? 'IN FLIGHT'
                        : 'FLEW AWAY (LOST)'}
                    </span>
                    <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                      {new Date(bet.created_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
