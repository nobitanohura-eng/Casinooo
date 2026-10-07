import React, { useState, useEffect, useRef } from 'react';
import { AviatorStatePayload, AviatorBet, AviatorRecentCrash } from '../../lib/types.ts';
import { AviatorCanvas } from './AviatorCanvas.tsx';
import { SpribeHistoryBar } from './SpribeHistoryBar.tsx';
import { SpribeBetControls } from './SpribeBetControls.tsx';
import { SpribeBetsWidget } from './SpribeBetsWidget.tsx';
import {
  HowToPlayModal,
  ProvablyFairModal,
  AvatarPickerModal,
  GameRulesModal,
  GameLimitsModal,
  SignInModal,
} from './SpribeModals.tsx';
import { getSocket } from '../../lib/socket.ts';
import { soundManager } from '../../lib/sound.ts';

interface AviatorGameProps {
  state: AviatorStatePayload;
  walletBalance: number;
  accountId: string;
  myBets: AviatorBet[];
  history: AviatorRecentCrash[];
  onRefreshData: () => void;
  onOpenDeposit?: () => void;
  onSwitchAccount?: (newId: string) => void;
}

interface SimulatedMultiplayerBet {
  id: string;
  avatar: string;
  username: string;
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
  onOpenDeposit,
  onSwitchAccount,
}) => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Avatar customization
  const [avatarId, setAvatarId] = useState<string>(() => {
    return localStorage.getItem('apex_aviator_avatar') || 'av-31';
  });

  const handleSelectAvatar = (newAvatar: string) => {
    setAvatarId(newAvatar);
    localStorage.setItem('apex_aviator_avatar', newAvatar);
  };

  // Modals state
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState(false);
  const [isProvablyFairOpen, setIsProvablyFairOpen] = useState(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isGameRulesOpen, setIsGameRulesOpen] = useState(false);
  const [isGameLimitsOpen, setIsGameLimitsOpen] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);

  // Simulated multiplayer participants for the current round
  const [multiplayerBets, setMultiplayerBets] = useState<SimulatedMultiplayerBet[]>([]);
  const prevRoundIdRef = useRef<string>('');

  // Generate new simulated multiplayer bets when a new round starts
  useEffect(() => {
    if (state.roundId && state.roundId !== prevRoundIdRef.current) {
      prevRoundIdRef.current = state.roundId;

      const avatarPool = [
        'av-70', 'av-31', 'av-48', 'av-54', 'av-69', 'av-17',
        'av-55', 'av-9',  'av-49', 'av-8',  'av-1',  'av-21',
        'av-15', 'av-24', 'av-40', 'av-25', 'av-72', 'av-42'
      ];

      const seedUsers = [
        { user: '98***21', stake: 500, target: 1.45, avatar: avatarPool[0] },
        { user: '76***14', stake: 200, target: 2.10, avatar: avatarPool[1] },
        { user: '82***90', stake: 1000, target: 1.30, avatar: avatarPool[2] },
        { user: '44***12', stake: 100, target: 3.50, avatar: avatarPool[3] },
        { user: '55***88', stake: 250, target: 1.80, avatar: avatarPool[4] },
        { user: '33***67', stake: 50, target: 5.20, avatar: avatarPool[5] },
        { user: '91***34', stake: 2000, target: 1.25, avatar: avatarPool[6] },
        { user: '19***75', stake: 300, target: 2.80, avatar: avatarPool[7] },
        { user: '62***09', stake: 150, target: 4.10, avatar: avatarPool[8] },
        { user: '88***41', stake: 800, target: 1.65, avatar: avatarPool[9] },
        { user: '70***55', stake: 100, target: 7.50, avatar: avatarPool[10] },
        { user: '27***93', stake: 400, target: 2.30, avatar: avatarPool[11] },
        { user: '65***18', stake: 1500, target: 1.55, avatar: avatarPool[12] },
        { user: '49***32', stake: 700, target: 3.10, avatar: avatarPool[13] },
      ];

      const bets: SimulatedMultiplayerBet[] = seedUsers.map((u, i) => ({
        id: `mp_${state.roundId}_${i}`,
        avatar: u.avatar,
        username: u.user,
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

  // Dynamic Web Audio API Turbine Pitch modulation
  const prevStatusRef = useRef<string>(state.status);
  useEffect(() => {
    if (state.status === 'FLYING') {
      if (prevStatusRef.current !== 'FLYING') {
        soundManager.startTurbineHum();
      }
      soundManager.updateTurbinePitch(state.currentMultiplier);
    } else if (state.status === 'CRASHED') {
      if (prevStatusRef.current === 'FLYING') {
        soundManager.stopTurbineHum(true);
      }
    } else if (state.status === 'BETTING') {
      soundManager.stopTurbineHum(false);
    }
    prevStatusRef.current = state.status;
  }, [state.status, state.currentMultiplier]);

  useEffect(() => {
    return () => {
      soundManager.stopTurbineHum(false);
    };
  }, []);

  // Find active bet for current round
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

  return (
    <div className="w-full flex flex-col gap-2.5 pb-20 select-none">
      {/* 1. Multiplier History Bar */}
      <SpribeHistoryBar
        recentCrashes={history.length > 0 ? history : state.recentCrashes}
        onOpenDetailedHistory={() => setIsProvablyFairOpen(true)}
      />

      {/* 2. Responsive 2-Column Grid on Desktop / Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 px-2 sm:px-3">
        {/* Left Column on Desktop: Bets Widget (All Bets / My Bets / Top) */}
        <div className="order-2 lg:order-1 lg:col-span-4 xl:col-span-4">
          <SpribeBetsWidget
            status={state.status}
            currentMultiplier={state.currentMultiplier}
            roundNumber={state.roundNumber}
            multiplayerBets={multiplayerBets}
            myBets={myBets}
            onOpenProvablyFair={() => setIsProvablyFairOpen(true)}
          />
        </div>

        {/* Right Column on Desktop: Stage Board + Bet Controls */}
        <div className="order-1 lg:order-2 lg:col-span-8 xl:col-span-8 flex flex-col gap-2.5">
          {/* Canvas Flight Board */}
          <AviatorCanvas
            status={state.status}
            currentMultiplier={state.currentMultiplier}
            bettingCountdownSeconds={state.bettingCountdownSeconds}
            crashMultiplier={state.crashMultiplier}
          />

          {/* Dual Bet Controls */}
          <SpribeBetControls
            status={state.status}
            currentMultiplier={state.currentMultiplier}
            walletBalance={walletBalance}
            activeUserBet={currentRoundBet}
            isSubmitting={isSubmitting}
            errorMessage={errorMessage}
            onPlaceBet={handlePlaceBet}
            onCashOut={handleCashOut}
          />
        </div>
      </div>

      {/* 3. Official Modals */}
      <HowToPlayModal
        isOpen={isHowToPlayOpen}
        onClose={() => setIsHowToPlayOpen(false)}
      />

      <ProvablyFairModal
        isOpen={isProvablyFairOpen}
        onClose={() => setIsProvablyFairOpen(false)}
      />

      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        currentAvatar={avatarId}
        onSelectAvatar={handleSelectAvatar}
        onClose={() => setIsAvatarPickerOpen(false)}
      />

      <GameRulesModal
        isOpen={isGameRulesOpen}
        onClose={() => setIsGameRulesOpen(false)}
      />

      <GameLimitsModal
        isOpen={isGameLimitsOpen}
        onClose={() => setIsGameLimitsOpen(false)}
      />

      {onSwitchAccount && (
        <SignInModal
          isOpen={isSignInOpen}
          currentAccountId={accountId}
          onSelectAccount={onSwitchAccount}
          onClose={() => setIsSignInOpen(false)}
        />
      )}
    </div>
  );
};
