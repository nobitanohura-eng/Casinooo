import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Account,
  LedgerEntry,
  WinGoStatePayload,
  WinGoRoundSummary,
  WinGoBet,
  AviatorStatePayload,
  AviatorRecentCrash,
  AviatorBet,
} from './lib/types.ts';
import { getSocket, identifyUser } from './lib/socket.ts';
import {
  fetchSession,
  fetchWalletSummary,
  fetchWalletLedger,
  fetchWinGoState,
  fetchWinGoHistory,
  fetchWinGoBets,
  fetchAviatorState,
  fetchAviatorHistory,
  fetchAviatorBets,
  topupCredits,
} from './lib/api.ts';
import { AppHeader } from './components/layout/AppHeader.tsx';
import { BottomNav, NavTab } from './components/layout/BottomNav.tsx';
import { GameModule } from './components/layout/GameSelector.tsx';
import { LobbyHero } from './components/lobby/LobbyHero.tsx';
import { CategoryRibbon } from './components/lobby/CategoryRibbon.tsx';
import { RichGameCards } from './components/lobby/RichGameCards.tsx';
import { WinGoGame } from './components/wingo/WinGoGame.tsx';
import { AviatorGame } from './components/aviator/AviatorGame.tsx';
import { WalletView } from './components/wallet/WalletView.tsx';
import { ActivityView } from './components/activity/ActivityView.tsx';
import { AccountView } from './components/account/AccountView.tsx';
import { AgencyHub } from './components/account/AgencyHub.tsx';
import { TopUpModal } from './components/wallet/TopUpModal.tsx';
import { TelegramVipModal } from './components/common/TelegramVipModal.tsx';
import { VictoryModal } from './components/common/VictoryModal.tsx';
import { InstallApkBanner } from './components/common/InstallApkBanner.tsx';
import { DepositBonusModal } from './components/common/DepositBonusModal.tsx';
import { LuckyWheelModal } from './components/common/LuckyWheelModal.tsx';
import { CustomerSupportBubble } from './components/common/CustomerSupportBubble.tsx';
import { OperatorAuthGate } from './components/operator/OperatorAuthGate.tsx';
import { SpribeHeader } from './components/aviator/SpribeHeader.tsx';
import {
  HowToPlayModal,
  ProvablyFairModal,
  AvatarPickerModal,
  GameRulesModal,
  GameLimitsModal,
  SignInModal,
} from './components/aviator/SpribeModals.tsx';
import { Trophy, Flame, ShieldCheck, Zap } from 'lucide-react';
import { soundManager } from './lib/sound.ts';
import { formatINR } from './lib/formatters.ts';

export default function App() {
  const checkIsOperatorPath = useCallback(() => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    return (
      path.startsWith('/sys-ops-console') ||
      path.startsWith('/avinash') ||
      path === '/avinash' ||
      path.startsWith('/admin') ||
      path.startsWith('/ops') ||
      path.startsWith('/operator') ||
      path.includes('operator') ||
      search.includes('ops=true') ||
      search.includes('admin=true')
    );
  }, []);

  const [isOperatorOpen, setIsOperatorOpen] = useState<boolean>(() => {
    return checkIsOperatorPath();
  });

  useEffect(() => {
    const handlePopState = () => {
      setIsOperatorOpen(checkIsOperatorPath());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [checkIsOperatorPath]);

  // Global keyboard shortcut: Alt + O or Ctrl + Shift + O to toggle Operator Console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.altKey && (e.key === 'o' || e.key === 'O')) ||
        (e.ctrlKey && e.shiftKey && (e.key === 'o' || e.key === 'O'))
      ) {
        e.preventDefault();
        setIsOperatorOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [accountId, setAccountId] = useState<string>(() => {
    return localStorage.getItem('apex_arcade_account_id') || 'acc_demo_pilot_01';
  });

  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState<number>(1000.0);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [activeGame, setActiveGame] = useState<GameModule>('wingo');

  const activeTabRef = useRef<NavTab>(activeTab);
  activeTabRef.current = activeTab;
  const activeGameRef = useRef<GameModule>(activeGame);
  activeGameRef.current = activeGame;

  // Modals
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState<boolean>(false);
  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState<boolean>(false);
  const [isDepositBonusOpen, setIsDepositBonusOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return !sessionStorage.getItem('apex_bonus_modal_dismissed');
    }
    return true;
  });

  const handleCloseDepositBonus = () => {
    sessionStorage.setItem('apex_bonus_modal_dismissed', 'true');
    setIsDepositBonusOpen(false);
  };

  const handleBonusWon = async (amount: number, label: string) => {
    try {
      await handleTopUp(amount);
    } catch {
      setBalance((prev) => prev + amount);
    }
    setVictoryData({
      isOpen: true,
      amount,
      game: 'Win Go 1Min',
      details: `Lucky Wheel Prize: ${label}`,
    });
  };

  // Victory Celebration Modal
  const [victoryData, setVictoryData] = useState<{
    isOpen: boolean;
    amount: number;
    game: 'Win Go 1Min' | 'Aviator';
    details?: string;
    multiplier?: number;
  }>({
    isOpen: false,
    amount: 0,
    game: 'Win Go 1Min',
  });

  // Spribe Aviator Modals
  const [avatarId, setAvatarId] = useState<string>(() => {
    return localStorage.getItem('apex_aviator_avatar') || 'av-31';
  });
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isProvablyFairOpen, setIsProvablyFairOpen] = useState<boolean>(false);
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState<boolean>(false);
  const [isGameRulesOpen, setIsGameRulesOpen] = useState<boolean>(false);
  const [isGameLimitsOpen, setIsGameLimitsOpen] = useState<boolean>(false);
  const [isSignInOpen, setIsSignInOpen] = useState<boolean>(false);

  const handleSelectAvatar = (newAvatar: string) => {
    setAvatarId(newAvatar);
    localStorage.setItem('apex_aviator_avatar', newAvatar);
  };

  const handleSwitchAccount = (newId: string) => {
    setAccountId(newId);
    localStorage.setItem('apex_arcade_account_id', newId);
    showToast(`Switched Pilot to ${newId}`, 'success');
  };

  // Win Go State
  const [winGoState, setWinGoState] = useState<WinGoStatePayload>({
    roundId: '',
    periodNumber: 0,
    status: 'OPEN',
    remainingSeconds: 60,
    totalCycleSeconds: 60,
    betLockSeconds: 10,
    serverTime: Date.now(),
    recentResults: [],
  });
  const [winGoHistory, setWinGoHistory] = useState<WinGoRoundSummary[]>([]);
  const [winGoBets, setWinGoBets] = useState<WinGoBet[]>([]);

  // Aviator State
  const [aviatorState, setAviatorState] = useState<AviatorStatePayload>({
    roundId: '',
    roundNumber: 1001,
    status: 'BETTING',
    currentMultiplier: 1.0,
    elapsedSeconds: 0,
    bettingCountdownSeconds: 5,
    crashMultiplier: null,
    recentCrashes: [],
    activeBetsCount: 0,
    serverTime: Date.now(),
  });
  const [aviatorHistory, setAviatorHistory] = useState<AviatorRecentCrash[]>([]);
  const [aviatorBets, setAviatorBets] = useState<AviatorBet[]>([]);

  // Ledger state
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'info' | 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'info' | 'success' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  const refreshUserData = useCallback(async () => {
    try {
      const summary = await fetchWalletSummary(accountId);
      setBalance(summary.wallet_balance);
      setLedger(summary.recentLedger);

      const [wgBets, avBets] = await Promise.all([
        fetchWinGoBets(accountId),
        fetchAviatorBets(accountId),
      ]);
      setWinGoBets(wgBets);
      setAviatorBets(avBets);
    } catch (err) {
      console.warn('Error refreshing user data:', err);
    }
  }, [accountId]);

  const refreshGameStates = useCallback(async () => {
    try {
      const [wgState, wgHist, avState, avHist] = await Promise.all([
        fetchWinGoState(),
        fetchWinGoHistory(),
        fetchAviatorState(),
        fetchAviatorHistory(),
      ]);
      setWinGoState(wgState);
      setWinGoHistory(wgHist);
      setAviatorState(avState);
      setAviatorHistory(avHist);
    } catch (err) {
      console.warn('Error refreshing game states:', err);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('apex_arcade_account_id', accountId);

    fetchSession(accountId)
      .then((acc) => {
        setAccount(acc);
        setBalance(acc.wallet_balance);
      })
      .catch((err) => console.error('Failed to init session:', err));

    refreshUserData();
    refreshGameStates();
  }, [accountId, refreshUserData, refreshGameStates]);

  useEffect(() => {
    const socket = getSocket();

    const onConnect = () => {
      setIsConnected(true);
      identifyUser(accountId);
    };

    const onDisconnect = () => {
      setIsConnected(false);
    };

    if (socket.connected) {
      onConnect();
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    socket.on('sync:full', (data: any) => {
      if (data?.account) {
        setAccount(data.account);
        setBalance(data.account.wallet_balance);
      }
      if (data?.winGoState) setWinGoState(data.winGoState);
      if (data?.aviatorState) setAviatorState(data.aviatorState);
    });

    socket.on('wingo:tick', (data: any) => {
      setWinGoState((prev) => ({
        ...prev,
        roundId: data.roundId,
        periodNumber: data.periodNumber,
        status: data.status,
        remainingSeconds: data.remainingSeconds,
      }));
    });

    socket.on('wingo:round:locked', (data: any) => {
      soundManager.play('lock');
      setWinGoState((prev) => ({
        ...prev,
        status: 'LOCKED',
        remainingSeconds: data.remainingSeconds,
      }));
    });

    socket.on('wingo:round:open', (state: WinGoStatePayload) => {
      setWinGoState(state);
      refreshUserData();
      fetchWinGoHistory().then(setWinGoHistory);
    });

    socket.on('wingo:round:result', (data: any) => {
      // Suppress Win Go settlement toasts completely when user is playing Aviator or on another tab
      if (activeTabRef.current === 'home' && activeGameRef.current === 'wingo') {
        showToast(
          `Win Go #${data.periodNumber} Settled: Number ${data.outcome.number} (${data.outcome.colorDisplay})`,
          'info'
        );
      }
      refreshUserData();
      fetchWinGoHistory().then(setWinGoHistory);
    });

    socket.on('aviator:round:betting', (data: any) => {
      setAviatorState((prev) => ({
        ...prev,
        roundId: data.roundId,
        roundNumber: data.roundNumber,
        status: 'BETTING',
        currentMultiplier: 1.0,
        bettingCountdownSeconds: data.countdown,
        crashMultiplier: null,
      }));
      refreshUserData();
      fetchAviatorHistory().then(setAviatorHistory);
    });

    socket.on('aviator:countdown:tick', (data: any) => {
      setAviatorState((prev) => ({
        ...prev,
        bettingCountdownSeconds: data.countdown,
      }));
    });

    socket.on('aviator:round:takeoff', (data: any) => {
      setAviatorState((prev) => ({
        ...prev,
        status: 'FLYING',
        roundId: data.roundId,
        roundNumber: data.roundNumber,
        currentMultiplier: 1.0,
      }));
    });

    socket.on('aviator:tick', (data: any) => {
      setAviatorState((prev) => ({
        ...prev,
        status: 'FLYING',
        currentMultiplier: data.multiplier,
        elapsedSeconds: data.elapsedSeconds,
      }));
    });

    socket.on('aviator:crash', (data: any) => {
      soundManager.play('crash');
      setAviatorState((prev) => ({
        ...prev,
        status: 'CRASHED',
        crashMultiplier: data.crashMultiplier,
      }));
      // Suppress toast completely whenever the user is NOT actively on the Aviator tab
      if (activeTabRef.current === 'home' && activeGameRef.current === 'aviator') {
        showToast(`Aviator flew away @ ${data.crashMultiplier.toFixed(2)}x`, 'error');
      }
      refreshUserData();
      fetchAviatorHistory().then(setAviatorHistory);
    });

    // Authoritative Wallet Settlement with Victory Modal Trigger
    socket.on('wallet:updated', (data: any) => {
      setBalance(data.balance);
      if (data.reason === 'WIN_GO_WIN') {
        soundManager.play('win');
        setVictoryData({
          isOpen: true,
          amount: data.change,
          game: 'Win Go 1Min',
          details: 'Color & Number Parity Victory',
        });
        showToast(`🎉 Win Go Victory! Credited +${formatINR(data.change)}!`, 'success');
      } else if (data.reason === 'AVIATOR_CASHOUT') {
        soundManager.play('cashout');
        setVictoryData({
          isOpen: true,
          amount: data.change,
          game: 'Aviator',
          details: 'High-Altitude Trajectory Cash Out',
        });
        showToast(`🚀 Aviator Cashed Out! Credited +${formatINR(data.change)}!`, 'success');
      }
      refreshUserData();
    });

    socket.on('bet:accepted', (data: any) => {
      soundManager.play('bet');
      if (data.newBalance !== undefined) setBalance(data.newBalance);
      showToast(`${data.game === 'WIN_GO' ? 'Win Go' : 'Aviator'} bet accepted!`, 'success');
      refreshUserData();
    });

    socket.on('bet:rejected', (data: any) => {
      showToast(`Bet rejected: ${data.error}`, 'error');
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('sync:full');
      socket.off('wingo:tick');
      socket.off('wingo:round:locked');
      socket.off('wingo:round:open');
      socket.off('wingo:round:result');
      socket.off('aviator:round:betting');
      socket.off('aviator:countdown:tick');
      socket.off('aviator:round:takeoff');
      socket.off('aviator:tick');
      socket.off('aviator:crash');
      socket.off('wallet:updated');
      socket.off('bet:accepted');
      socket.off('bet:rejected');
    };
  }, [accountId, refreshUserData]);

  const handleTopUp = async (amount: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await topupCredits(accountId, amount);
      setBalance(result.newBalance);
      showToast(`+${formatINR(amount)} UPI Credits added!`, 'success');
      refreshUserData();
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  if (isOperatorOpen) {
    return (
      <OperatorAuthGate
        onClose={() => {
          setIsOperatorOpen(false);
          if (
            typeof window !== 'undefined' &&
            (window.location.search.includes('ops=true') ||
              window.location.pathname.startsWith('/sys-ops-console'))
          ) {
            window.history.pushState({}, '', '/');
          }
        }}
        defaultUnlocked={true}
      />
    );
  }

  // 1. DEDICATED FULL-FIDELITY SPRIBE AVIATOR GAME EXPERIENCE
  if (activeTab === 'home' && activeGame === 'aviator') {
    return (
      <div className="min-h-[100dvh] h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#101112] text-slate-100 flex flex-col select-none overscroll-none">
        {/* Scoped Toast Alert */}
        {toast && (
          <div
            className={`fixed top-12 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full text-xs font-casino-num font-black shadow-2xl border transition-all animate-in fade-in duration-200 max-w-[90%] text-center pointer-events-none backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/60'
                : toast.type === 'error'
                ? 'bg-rose-950/95 text-rose-200 border-rose-500/60'
                : 'bg-[#121929]/95 text-amber-300 border-amber-500/60'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Official Spribe Aviator Header */}
        <SpribeHeader
          balance={balance}
          accountId={accountId}
          avatarId={avatarId}
          onOpenDeposit={() => setIsTopUpOpen(true)}
          onOpenAvatarPicker={() => setIsAvatarPickerOpen(true)}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onOpenProvablyFair={() => setIsProvablyFairOpen(true)}
          onOpenGameRules={() => setIsGameRulesOpen(true)}
          onOpenBetHistory={() => setActiveTab('activity')}
          onOpenGameLimits={() => setIsGameLimitsOpen(true)}
          onOpenFreeBets={() => setIsLuckyWheelOpen(true)}
          onOpenLoginModal={() => setIsSignInOpen(true)}
        />

        {/* Sub-Header: Game Switcher & Return to Casino Lobby */}
        <div className="bg-[#141516] border-b border-[#282a2e] px-3 py-1 flex items-center justify-between text-xs z-30">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px] border border-rose-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              AVIATOR LIVE
            </span>

            <button
              onClick={() => setActiveGame('wingo')}
              className="px-2.5 py-0.5 rounded-full bg-[#1e2024] hover:bg-[#282a2e] text-slate-400 hover:text-slate-200 font-medium text-[10px] transition-colors"
            >
              🎲 Play Win Go
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('wallet')}
              className="text-[10px] text-emerald-400 font-bold hover:underline"
            >
              Wallet
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={() => setActiveTab('account')}
              className="text-[10px] text-slate-400 hover:text-white"
            >
              Profile
            </button>
          </div>
        </div>

        {/* Main Aviator Arena (Full Responsive Spribe Layout) */}
        <main className="flex-1 overflow-y-auto overscroll-none touch-pan-y max-w-7xl w-full mx-auto p-1 sm:p-2">
          <AviatorGame
            state={aviatorState}
            walletBalance={balance}
            accountId={accountId}
            myBets={aviatorBets}
            history={aviatorHistory}
            onRefreshData={refreshUserData}
            onOpenDeposit={() => setIsTopUpOpen(true)}
            onSwitchAccount={handleSwitchAccount}
          />
        </main>

        {/* Global Modals */}
        <TopUpModal
          isOpen={isTopUpOpen}
          onClose={() => setIsTopUpOpen(false)}
          accountId={accountId}
          onTopUp={handleTopUp}
          onRefreshData={refreshUserData}
        />

        <TelegramVipModal
          isOpen={isTelegramOpen}
          onClose={() => setIsTelegramOpen(false)}
        />

        <DepositBonusModal
          isOpen={isDepositBonusOpen}
          onClose={handleCloseDepositBonus}
          onRecharge={() => setIsTopUpOpen(true)}
        />

        <LuckyWheelModal
          isOpen={isLuckyWheelOpen}
          onClose={() => setIsLuckyWheelOpen(false)}
          onBonusWon={handleBonusWon}
        />

        <VictoryModal
          isOpen={victoryData.isOpen}
          onClose={() => setVictoryData((prev) => ({ ...prev, isOpen: false }))}
          amount={victoryData.amount}
          game={victoryData.game}
          details={victoryData.details}
          multiplier={victoryData.multiplier}
        />

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

        <SignInModal
          isOpen={isSignInOpen}
          currentAccountId={accountId}
          onSelectAccount={handleSwitchAccount}
          onClose={() => setIsSignInOpen(false)}
        />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] max-h-[100dvh] overflow-hidden bg-[#060a12] text-slate-100 flex justify-center overscroll-none select-none">
      {/* Desktop Left Ambient Column (PokerStars / BetWright style) */}
      <div className="hidden lg:flex w-72 p-5 flex-col justify-between border-r border-slate-700/60 bg-[#080d17]/90">
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h2 className="font-casino-num font-black text-xs uppercase tracking-wider text-white">
              VIP Gaming Lounge
            </h2>
          </div>

          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="p-3 rounded-lg bg-[#0b101c] border border-amber-500/25 shadow-sm">
              <span className="text-[10px] text-amber-400 uppercase font-black block font-casino-num">
                Instant UPI Banking
              </span>
              <p className="text-slate-300 font-medium mt-0.5 leading-relaxed">
                Automated credit faucet with sub-second balance settlement.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#0b101c] border border-emerald-500/25 shadow-sm">
              <span className="text-[10px] text-emerald-400 uppercase font-black block font-casino-num">
                Win Go 1Min Cycle
              </span>
              <p className="text-slate-300 font-medium mt-0.5 leading-relaxed">
                Server-synchronized 60s parity rounds. 3D lottery balls with 9x return.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#0b101c] border border-rose-500/25 shadow-sm">
              <span className="text-[10px] text-rose-400 uppercase font-black block font-casino-num">
                Aviator Crash Physics
              </span>
              <p className="text-slate-300 font-medium mt-0.5 leading-relaxed">
                e^(0.065 · t) climb trajectory, 100ms multiplier streaming.
              </p>
            </div>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#0b101c] border border-slate-800 text-[11px] text-slate-400 space-y-1">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>256-Bit Financial Encryption</span>
          </div>
          <span className="block text-[10px] text-slate-500 font-casino-num">
            RNG certified for Indian mobile gaming simulation.
          </span>
        </div>
      </div>

      {/* Main Centered Mobile Gaming Shell (strictly locked to max-w-md and 100dvh) */}
      <div className="w-full max-w-md h-[100dvh] max-h-[100dvh] bg-[#070b14] border-x border-slate-700/60 flex flex-col relative shadow-2xl overflow-hidden overscroll-none select-none">
        {/* Scoped Toast Alert (Positioned at top-14 directly below header, never obscuring canvas flight curve or cashout button) */}
        {toast && (
          <div
            className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-full text-xs font-casino-num font-black shadow-2xl border transition-all animate-in fade-in slide-in-from-top-2 duration-200 max-w-[90%] text-center pointer-events-none backdrop-blur-md ${
              toast.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-500/60 shadow-emerald-950/50'
                : toast.type === 'error'
                ? 'bg-rose-950/95 text-rose-200 border-rose-500/60 shadow-rose-950/50'
                : 'bg-[#121929]/95 text-amber-300 border-amber-500/60 shadow-amber-950/50'
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* 1. Integrated Header with Online Status, Balance, Sound & Language Toggle */}
        <AppHeader
          balance={balance}
          isConnected={isConnected}
          onOpenTopUp={() => setIsTopUpOpen(true)}
          onOpenAccount={() => setActiveTab('account')}
          onOpenTelegramVIP={() => setIsTelegramOpen(true)}
          onSecretOperatorTrigger={() => setIsOperatorOpen(true)}
          accountId={accountId}
        />

        {/* 2. Native "Install APK" Top Banner with ₹50 Free Bonus */}
        <InstallApkBanner
          onBonusClaimed={(bonus) => {
            handleTopUp(bonus);
            setVictoryData({
              isOpen: true,
              amount: bonus,
              game: 'Win Go 1Min',
              details: 'Official Android APK Installation Bonus',
            });
          }}
        />

        {/* 3. Content Area */}
        <main className="flex-1 overflow-y-auto overscroll-none touch-pan-y">
          {activeTab === 'home' && (
            <div className="space-y-3 pb-4">
              {/* 1. Indian Lottery Hero Banner (100% First Deposit Bonus + Quick Action Cards) */}
              <LobbyHero
                onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
                onOpenCheckIn={() => setActiveTab('activity')}
                onOpenDepositBonus={() => setIsDepositBonusOpen(true)}
              />

              {/* 2. Category Taxonomy Ribbon */}
              <CategoryRibbon
                activeGame={activeGame}
                onSelectGame={setActiveGame}
              />

              {/* 3. Rich 3D Game Cards (Bursting balls & climbing red aircraft) */}
              <RichGameCards
                activeGame={activeGame}
                onSelectGame={setActiveGame}
                winGoStatusText={`#${String(winGoState.periodNumber).slice(-4)} · ${winGoState.remainingSeconds}s`}
                aviatorStatusText={
                  aviatorState.status === 'FLYING'
                    ? `${aviatorState.currentMultiplier.toFixed(2)}x`
                    : aviatorState.status === 'BETTING'
                    ? `Takeoff in ${aviatorState.bettingCountdownSeconds}s`
                    : 'Flew Away'
                }
              />

              {/* 4. Active Game Board */}
              <div className="pt-1">
                {activeGame === 'wingo' ? (
                  <WinGoGame
                    state={winGoState}
                    walletBalance={balance}
                    accountId={accountId}
                    myBets={winGoBets}
                    history={winGoHistory}
                    onRefreshData={refreshUserData}
                  />
                ) : (
                  <AviatorGame
                    state={aviatorState}
                    walletBalance={balance}
                    accountId={accountId}
                    myBets={aviatorBets}
                    history={aviatorHistory}
                    onRefreshData={refreshUserData}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="pt-2">
              <ActivityView
                wingoBets={winGoBets}
                aviatorBets={aviatorBets}
                accountId={accountId}
                onRefreshData={refreshUserData}
              />
            </div>
          )}

          {activeTab === 'wallet' && (
            <div className="pt-2">
              <WalletView
                balance={balance}
                ledger={ledger}
                accountId={accountId}
                totalDeposited={account?.total_deposited || 1000}
                totalWagered={account?.total_wagered || 0}
                onTopUp={handleTopUp}
                onRefreshData={refreshUserData}
              />
            </div>
          )}

          {activeTab === 'promotion' && (
            <div className="pt-2 px-3 pb-24">
              <AgencyHub accountId={accountId} onRefreshData={refreshUserData} />
            </div>
          )}

          {activeTab === 'account' && (
            <div className="pt-2">
              <AccountView
                account={account}
                onRefreshData={refreshUserData}
              />
            </div>
          )}
        </main>

        {/* 4. Bottom Navigation with Center Elevated Lucky Wheel Tab */}
        <BottomNav
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
        />

        {/* 5. Fixed Floating Customer Support Bubble on Bottom-Right */}
        <CustomerSupportBubble onOpenTelegram={() => setIsTelegramOpen(true)} />

        {/* 6. Global Modals */}
        <TopUpModal
          isOpen={isTopUpOpen}
          onClose={() => setIsTopUpOpen(false)}
          accountId={accountId}
          onTopUp={handleTopUp}
          onRefreshData={refreshUserData}
        />

        <TelegramVipModal
          isOpen={isTelegramOpen}
          onClose={() => setIsTelegramOpen(false)}
        />

        {/* 100% Deposit Bonus Welcome Modal */}
        <DepositBonusModal
          isOpen={isDepositBonusOpen}
          onClose={handleCloseDepositBonus}
          onRecharge={() => setIsTopUpOpen(true)}
        />

        {/* Interactive Lucky Wheel of Fortune Modal */}
        <LuckyWheelModal
          isOpen={isLuckyWheelOpen}
          onClose={() => setIsLuckyWheelOpen(false)}
          onBonusWon={handleBonusWon}
        />

        {/* Energetic Victory Celebration Modal on Win or Cash-Out */}
        <VictoryModal
          isOpen={victoryData.isOpen}
          onClose={() => setVictoryData((prev) => ({ ...prev, isOpen: false }))}
          amount={victoryData.amount}
          game={victoryData.game}
          details={victoryData.details}
          multiplier={victoryData.multiplier}
        />
      </div>

      {/* Desktop Right Ambient Column */}
      <div className="hidden lg:flex w-72 p-5 flex-col justify-between border-l border-slate-700/60 bg-[#080d17]/90">
        <div>
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-5 h-5 text-rose-500" />
            <h2 className="font-casino-num font-black text-xs uppercase tracking-wider text-white">
              Live Feed
            </h2>
          </div>

          <div className="space-y-2.5">
            <div className="p-3 rounded-lg bg-[#0b101c] border border-amber-500/25 shadow-sm">
              <span className="text-[10px] text-amber-400 uppercase font-black block font-casino-num">
                Win Go Period #{winGoState.periodNumber}
              </span>
              <span className="text-xs text-slate-300 mt-1 block">
                Timer: <span className="font-casino-num font-bold text-white">{winGoState.remainingSeconds}s</span> ({winGoState.status})
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0b101c] border border-rose-500/25 shadow-sm">
              <span className="text-[10px] text-rose-400 uppercase font-black block font-casino-num">
                Flight #{aviatorState.roundNumber}
              </span>
              <span className="text-xs text-slate-300 mt-1 block">
                Multiplier:{' '}
                <span className="font-casino-num font-bold text-amber-400">
                  {aviatorState.status === 'FLYING'
                    ? `${aviatorState.currentMultiplier.toFixed(2)}x`
                    : aviatorState.status}
                </span>
              </span>
            </div>
          </div>
        </div>

        <div className="text-[10px] text-slate-500 font-casino-num text-center">
          Apex Mobile Arcade · INR Sandbox Engine
        </div>
      </div>
    </div>
  );
}
