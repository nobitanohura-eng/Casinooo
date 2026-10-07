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
  fetchCurrentAuthUser,
  logoutUser,
} from './lib/api.ts';
import { AppHeader } from './components/layout/AppHeader.tsx';
import { TabHeader } from './components/layout/TabHeader.tsx';
import { BottomNav, NavTab } from './components/layout/BottomNav.tsx';
import { GameModule } from './components/layout/GameSelector.tsx';
import { Lottery7Lobby } from './components/lottery7/Lottery7Lobby.tsx';
import { Lottery7BottomNav } from './components/lottery7/Lottery7BottomNav.tsx';
import { WinGoView } from './components/wingo/WinGoView.tsx';
import { WithdrawModal } from './components/wallet/WithdrawModal.tsx';
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
import { ComingSoonModal } from './components/common/ComingSoonModal.tsx';
import { ApexNoticeModal } from './components/common/ApexNoticeModal.tsx';
import { InstallApkModal } from './components/common/InstallApkModal.tsx';
import { AddToDesktopModal } from './components/common/AddToDesktopModal.tsx';
import { LuckyWheelModal } from './components/common/LuckyWheelModal.tsx';
import { CustomerSupportBubble } from './components/common/CustomerSupportBubble.tsx';
import { AuthModal } from './components/common/AuthModal.tsx';
import { AuthPage } from './components/auth/AuthPage.tsx';
import { GullakModal } from './components/common/GullakModal.tsx';
import { LifelineSpinModal } from './components/common/LifelineSpinModal.tsx';

// Stealth Operator Console Lazy-Loaded to Prevent Public Bundle Inclusion
const OperatorAuthGate = React.lazy(() =>
  import('./components/operator/OperatorAuthGate.tsx').then((m) => ({
    default: m.OperatorAuthGate,
  }))
);

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
    return localStorage.getItem('apex_arcade_account_id') || '';
  });

  const [account, setAccount] = useState<Account | null>(null);
  const [balance, setBalance] = useState<number>(0.0);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const [isAuthPageOpen, setIsAuthPageOpen] = useState<boolean>(false);
  const [authPageMode, setAuthPageMode] = useState<'login' | 'register'>('login');

  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthPageMode(mode);
    setIsAuthPageOpen(true);
  };

  const handleAuthSuccess = (newAccount: Account, token: string) => {
    setAccount(newAccount);
    setAccountId(newAccount.id);
    setBalance(newAccount.wallet_balance);
    localStorage.setItem('apex_auth_token', token);
    localStorage.setItem('apex_arcade_account_id', newAccount.id);
    setIsAuthPageOpen(false);
    setIsAuthOpen(false);
    showToast(`Welcome back, ${newAccount.mobile || 'Player'}!`, 'success');
    refreshUserData();
  };

  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [activeGame, setActiveGame] = useState<GameModule>('lobby');

  const activeTabRef = useRef<NavTab>(activeTab);
  activeTabRef.current = activeTab;
  const activeGameRef = useRef<GameModule>(activeGame);
  activeGameRef.current = activeGame;

  // Modals
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);
  const [isTelegramOpen, setIsTelegramOpen] = useState<boolean>(false);
  const [isLuckyWheelOpen, setIsLuckyWheelOpen] = useState<boolean>(false);
  const [isNoticeOpen, setIsNoticeOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [isAddToDesktopOpen, setIsAddToDesktopOpen] = useState<boolean>(false);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [isGullakOpen, setIsGullakOpen] = useState<boolean>(false);
  const [isLifelineSpinOpen, setIsLifelineSpinOpen] = useState<boolean>(false);
  const [comingSoonData, setComingSoonData] = useState<{
    isOpen: boolean;
    title: string;
    category: string;
  }>({
    isOpen: false,
    title: '',
    category: '',
  });

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
    if (!accountId) {
      setBalance(0);
      setLedger([]);
      setWinGoBets([]);
      setAviatorBets([]);
      return;
    }
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

  const handleLogout = async () => {
    await logoutUser();
    showToast('Logged out of session.', 'info');
    setAccountId('');
    setAccount(null);
    setBalance(0);
    localStorage.removeItem('apex_arcade_account_id');
    localStorage.removeItem('apex_auth_token');
    localStorage.removeItem('apex_account_id');
    setActiveTab('home');
    setActiveGame('lobby');
  };

  useEffect(() => {
    fetchCurrentAuthUser().then((authUser) => {
      if (authUser) {
        setAccountId(authUser.id);
        setAccount(authUser);
        setBalance(authUser.wallet_balance);
        localStorage.setItem('apex_arcade_account_id', authUser.id);
      } else {
        const savedId = localStorage.getItem('apex_arcade_account_id');
        const token = localStorage.getItem('apex_auth_token');
        if (savedId && token) {
          fetchSession(savedId)
            .then((acc) => {
              setAccount(acc);
              setBalance(acc.wallet_balance);
            })
            .catch(() => {
              setAccount(null);
              setBalance(0);
              setAccountId('');
              localStorage.removeItem('apex_arcade_account_id');
              localStorage.removeItem('apex_auth_token');
            });
        } else {
          setAccount(null);
          setBalance(0);
          setAccountId('');
          localStorage.removeItem('apex_arcade_account_id');
        }
      }
    });

    if (accountId) {
      refreshUserData();
    }
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
      if (activeTabRef.current === 'home' && activeGameRef.current === 'wingo') {
        soundManager.play('lock');
      }
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
      setAviatorState((prev) => ({
        ...prev,
        status: 'CRASHED',
        crashMultiplier: data.crashMultiplier,
      }));
      // Only play crash audio and show toast when the user is actively in the Aviator game
      if (activeTabRef.current === 'home' && activeGameRef.current === 'aviator') {
        soundManager.play('crash');
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
      <React.Suspense
        fallback={
          <div className="min-h-screen bg-[#070b14] flex items-center justify-center text-amber-400 font-mono text-xs">
            Authenticating Operator Security Matrix...
          </div>
        }
      >
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
        />

      </React.Suspense>
    );
  }


  // Full-Page Dedicated Login & Register View Matching Apex Coral Lobby
  if (isAuthPageOpen) {
    return (
      <div className="h-[100dvh] max-h-[100dvh] overflow-y-auto bg-[#f7f8ff] flex justify-center items-center select-none">
        <AuthPage
          initialMode={authPageMode}
          onAuthSuccess={handleAuthSuccess}
          onBackToHome={() => setIsAuthPageOpen(false)}
          onOpenSupport={() => setIsTelegramOpen(true)}
        />
      </div>
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
          accountId={accountId || 'Guest'}
          avatarId={avatarId}
          onOpenDeposit={() => {
            if (!account) {
              handleOpenAuth('login');
            } else {
              setIsTopUpOpen(true);
            }
          }}
          onOpenAvatarPicker={() => setIsAvatarPickerOpen(true)}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
          onOpenProvablyFair={() => setIsProvablyFairOpen(true)}
          onOpenGameRules={() => setIsGameRulesOpen(true)}
          onOpenBetHistory={() => setActiveTab('activity')}
          onOpenGameLimits={() => setIsGameLimitsOpen(true)}
          onOpenFreeBets={() => setIsLuckyWheelOpen(true)}
          onOpenLoginModal={() => handleOpenAuth('login')}
        />


        {/* Sub-Header: Game Switcher & Return to Casino Lobby */}
        <div className="bg-[#141516] border-b border-[#282a2e] px-3 py-1 flex items-center justify-between text-xs z-30">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-bold text-[10px] border border-rose-500/30 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
              AVIATOR LIVE
            </span>

            <button
              onClick={() => setActiveGame('lobby')}
              className="px-2.5 py-0.5 rounded-full bg-[#1e2024] hover:bg-[#282a2e] text-slate-300 hover:text-white font-medium text-[10px] transition-colors"
            >
              🏛️ Apex Lobby
            </button>

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
            onOpenDeposit={() => {
              if (!account) {
                handleOpenAuth('login');
              } else {
                setIsTopUpOpen(true);
              }
            }}
            onSwitchAccount={handleSwitchAccount}
            onOpenAuth={handleOpenAuth}
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

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          initialMode={authModalMode}
          onAuthSuccess={(acc) => {
            setAccount(acc);
            setAccountId(acc.id);
            setBalance(acc.wallet_balance);
            showToast(`Welcome, ${acc.mobile || 'Player'}!`, 'success');
            refreshUserData();
          }}
        />
      </div>

    );
  }

  const isLobbyView = activeTab === 'home' && activeGame === 'lobby';

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
                Instant UPI credit settlement with sub-second balance updates.
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
      <div className={`w-full max-w-md h-[100dvh] max-h-[100dvh] ${activeTab === 'home' && activeGame === 'wingo' ? 'bg-[#070b14] border-x border-slate-700/60 text-slate-100' : 'bg-[#f7f8ff] text-[#1e2637] border-x border-slate-200'} flex flex-col relative shadow-2xl overflow-hidden overscroll-none select-none`}>
        {/* Scoped Toast Alert */}
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

        {/* 1. Official Sticky Tab Header for Secondary Views */}
        {activeTab !== 'home' && (
          <TabHeader
            title={
              activeTab === 'promotion'
                ? 'Agency Commission Hub'
                : activeTab === 'activity'
                ? 'Activity & Attendance'
                : activeTab === 'wallet'
                ? 'Wallet & Banking'
                : activeTab === 'account'
                ? account
                  ? 'VIP Member Profile'
                  : 'Guest Profile'
                : 'Apex Arcade'
            }
            onBackToHome={() => {
              setActiveTab('home');
              setActiveGame('lobby');
            }}
            balance={balance}
            onOpenDeposit={() => (!account ? handleOpenAuth('login') : setIsTopUpOpen(true))}
            onRefreshBalance={refreshUserData}
          />
        )}

        {/* 2. Content Area */}
        <main className="flex-1 overflow-y-auto overscroll-none touch-pan-y">
          {activeTab === 'home' && (
            <>
              {activeGame === 'lobby' && (
                <Lottery7Lobby
                  balance={balance}
                  isLoggedIn={!!account}
                  userMobile={account?.mobile}
                  onRefreshBalance={refreshUserData}
                  onOpenDeposit={() => (!account ? handleOpenAuth('login') : setIsTopUpOpen(true))}
                  onOpenWithdraw={() => (!account ? handleOpenAuth('login') : setIsWithdrawOpen(true))}
                  onOpenAuth={handleOpenAuth}
                  onSelectGame={(g) => setActiveGame(g)}
                  winGoStatusText={`#${String(winGoState.periodNumber).slice(-4)} · ${winGoState.remainingSeconds}s`}
                  aviatorStatusText={
                    aviatorState.status === 'FLYING'
                      ? `${aviatorState.currentMultiplier.toFixed(2)}x`
                      : aviatorState.status === 'BETTING'
                      ? `Takeoff in ${aviatorState.bettingCountdownSeconds}s`
                      : 'Flew Away'
                  }
                  onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
                  onOpenDepositBonus={() => setIsDepositBonusOpen(true)}
                  onOpenTelegram={() => setIsTelegramOpen(true)}
                  onOpenSupport={() => setIsTelegramOpen(true)}
                  onOpenNotice={() => setIsNoticeOpen(true)}
                  onOpenApkModal={() => setIsApkModalOpen(true)}
                  onOpenComingSoon={(title, category) => {
                    setComingSoonData({
                      isOpen: true,
                      title,
                      category,
                    });
                  }}
                  onOpenAddToDesktop={() => setIsAddToDesktopOpen(true)}
                />
              )}

              {activeGame === 'wingo' && (
                <WinGoView
                  state={winGoState}
                  walletBalance={balance}
                  accountId={accountId}
                  myBets={winGoBets}
                  history={winGoHistory}
                  onRefreshData={refreshUserData}
                  onBackToLobby={() => setActiveGame('lobby')}
                  onOpenDeposit={() => (!account ? handleOpenAuth('login') : setIsTopUpOpen(true))}
                  onOpenAuth={handleOpenAuth}
                />
              )}
            </>
          )}

          {activeTab === 'activity' && (
            <div>
              <ActivityView
                wingoBets={winGoBets}
                aviatorBets={aviatorBets}
                accountId={accountId}
                onRefreshData={refreshUserData}
                onOpenDepositBonus={() => setIsDepositBonusOpen(true)}
                onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
              />
            </div>
          )}

          {activeTab === 'wallet' && (
            <div>
              <WalletView
                balance={balance}
                ledger={ledger}
                accountId={accountId}
                totalDeposited={account?.total_deposited || 0}
                totalWagered={account?.total_wagered || 0}
                onTopUp={handleTopUp}
                onRefreshData={refreshUserData}
                onOpenAuth={handleOpenAuth}
              />
            </div>
          )}

          {activeTab === 'promotion' && (
            <div className="pt-2 px-3 pb-24">
              <AgencyHub accountId={accountId} onRefreshData={refreshUserData} />
            </div>
          )}

          {activeTab === 'account' && (
            <div>
              <AccountView
                account={account}
                balance={balance}
                onRefreshData={refreshUserData}
                onOpenDeposit={() => (!account ? handleOpenAuth('login') : setIsTopUpOpen(true))}
                onOpenWithdraw={() => (!account ? handleOpenAuth('login') : setIsWithdrawOpen(true))}
                onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
                onOpenTelegram={() => setIsTelegramOpen(true)}
                onOpenSupport={() => setIsTelegramOpen(true)}
                onOpenGullak={() => setIsGullakOpen(true)}
                onOpenAuth={handleOpenAuth}
                onLogout={handleLogout}
                onSwitchAccount={handleSwitchAccount}
                onNavigateTab={(tab) => {
                  setActiveTab(tab);
                  if (tab === 'home') setActiveGame('lobby');
                }}
              />

            </div>
          )}
        </main>

        {/* 3. Official Lottery 7 Bottom Navigation Bar (Hidden during Win Go gameplay to prevent overlap) */}
        {activeGame !== 'wingo' && (
          <Lottery7BottomNav
            activeTab={activeTab}
            onChangeTab={(tab) => {
              setActiveTab(tab);
              if (tab === 'home') {
                setActiveGame('lobby');
              }
            }}
            onSelectLobby={() => {
              setActiveTab('home');
              setActiveGame('lobby');
            }}
            onOpenLuckyWheel={() => setIsLuckyWheelOpen(true)}
          />
        )}

        {/* 5. Global Modals */}
        <TopUpModal
          isOpen={isTopUpOpen}
          onClose={() => setIsTopUpOpen(false)}
          accountId={accountId}
          onTopUp={handleTopUp}
          onRefreshData={refreshUserData}
        />

        <WithdrawModal
          isOpen={isWithdrawOpen}
          onClose={() => setIsWithdrawOpen(false)}
          walletBalance={balance}
          accountId={accountId}
          totalDeposited={account?.total_deposited || 1000}
          totalWagered={account?.total_wagered || 0}
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

        {/* Official Apex Security Notice Modal */}
        <ApexNoticeModal
          isOpen={isNoticeOpen}
          onClose={() => setIsNoticeOpen(false)}
        />

        {/* Official Android APK Download & ₹50 Bonus Modal */}
        <InstallApkModal
          isOpen={isApkModalOpen}
          onClose={() => setIsApkModalOpen(false)}
          onClaimBonus={(bonus) => {
            handleTopUp(bonus);
            setVictoryData({
              isOpen: true,
              amount: bonus,
              game: 'Win Go 1Min',
              details: 'Official Android APK Installation Bonus',
            });
          }}
        />

        {/* Add to Desktop Guide & ₹25 Bonus Modal */}
        <AddToDesktopModal
          isOpen={isAddToDesktopOpen}
          onClose={() => setIsAddToDesktopOpen(false)}
          onRewardClaimed={(bonus) => {
            handleTopUp(bonus);
            setVictoryData({
              isOpen: true,
              amount: bonus,
              game: 'Win Go 1Min',
              details: 'Add to Home Screen Bonus',
            });
          }}
        />

        {/* Upcoming Game Under Audit Modal with Direct Play Switchers */}
        <ComingSoonModal
          isOpen={comingSoonData.isOpen}
          gameTitle={comingSoonData.title}
          gameCategory={comingSoonData.category}
          onClose={() => setComingSoonData((prev) => ({ ...prev, isOpen: false }))}
          onPlayWinGo={() => setActiveGame('wingo')}
          onPlayAviator={() => setActiveGame('aviator')}
        />

        {/* Member Mobile Authentication Modal */}
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          initialMode={authModalMode}
          onAuthSuccess={(acc) => {
            setAccount(acc);
            setAccountId(acc.id);
            setBalance(acc.wallet_balance);
            showToast(`Welcome back, ${acc.mobile || 'Player'}!`, 'success');
            refreshUserData();
          }}
        />

        {/* Golden Gullak Piggy Bank Vault Modal */}
        <GullakModal
          isOpen={isGullakOpen}
          onClose={() => setIsGullakOpen(false)}
          accountId={accountId}
          gullakBalance={account?.gullak_balance || 0}
          onGullakSmashed={(transferredAmount) => {
            setBalance((prev) => prev + transferredAmount);
            showToast(`Gullak smashed! +${formatINR(transferredAmount)} credited to balance!`, 'success');
            refreshUserData();
          }}
        />

        {/* Second Chance Lifeline Spin Wheel Modal */}
        <LifelineSpinModal
          isOpen={isLifelineSpinOpen}
          onClose={() => setIsLifelineSpinOpen(false)}
          accountId={accountId}
          onRewardClaimed={(reward) => {
            if (reward.value > 0) {
              setBalance((prev) => prev + reward.value);
              showToast(`Lifeline prize: +${formatINR(reward.value)} added to balance!`, 'success');
            } else {
              showToast(`Lifeline voucher: ${reward.label} claimed!`, 'success');
            }
            refreshUserData();
          }}
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
          Apex Mobile Arcade · Official India Gaming Edition
        </div>
      </div>
    </div>
  );
}
