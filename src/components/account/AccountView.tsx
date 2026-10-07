import React, { useState, useEffect } from 'react';
import { Account } from '../../lib/types.ts';
import {
  Crown,
  Smartphone,
  Volume2,
  VolumeX,
  ShieldCheck,
  User,
  Sparkles,
  ChevronRight,
  History,
  Wallet,
  Gift,
  Send,
  Headphones,
  RotateCcw,
  CheckCircle,
  Copy,
  PlusCircle,
  ArrowUpRight,
} from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';
import { formatINR } from '../../lib/formatters.ts';

interface AccountViewProps {
  account: Account | null;
  balance?: number;
  onRefreshData?: () => void;
  onOpenDeposit?: () => void;
  onOpenWithdraw?: () => void;
  onOpenLuckyWheel?: () => void;
  onOpenGullak?: () => void;
  onOpenTelegram?: () => void;
  onOpenSupport?: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onLogout?: () => void;
  onSwitchAccount?: (id: string) => void;
  onNavigateTab?: (tab: any) => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  account,
  balance = 0,
  onRefreshData,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenLuckyWheel,
  onOpenGullak,
  onOpenTelegram,
  onOpenSupport,
  onOpenAuth,
  onLogout,
  onSwitchAccount,
  onNavigateTab,
}) => {
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.isEnabled());
  const [isCopied, setIsCopied] = useState<boolean>(false);

  useEffect(() => {
    return soundManager.subscribe((enabled) => {
      setSoundEnabled(enabled);
    });
  }, []);

  const handleToggleSound = () => {
    const next = soundManager.toggle();
    setSoundEnabled(next);
  };

  const handleCopyId = () => {
    if (!account) return;
    navigator.clipboard.writeText(account.id).catch(() => {});
    setIsCopied(true);
    soundManager.play('click');
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (!account) {
    return (
      <div className="space-y-3 px-3 pt-3 pb-24 text-slate-800 select-none">
        {/* Guest Profile Banner */}
        <div className="rounded-2xl bg-gradient-to-r from-[#f95959] via-[#fa6c6c] to-[#ff8579] p-4 text-white shadow-md relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div className="flex items-center gap-3.5 relative z-10">
            <div className="relative w-14 h-14 rounded-2xl bg-white/20 border-2 border-white flex items-center justify-center shadow-md">
              <User className="w-8 h-8 text-white stroke-[2.2]" />
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="font-casino-num font-black text-white text-base leading-tight truncate">
                  Guest Visitor
                </h2>
                <span className="bg-white/20 text-white font-casino-num font-bold text-[9px] px-2 py-0.5 rounded-full uppercase tracking-wide">
                  Unverified
                </span>
              </div>
              <p className="text-xs text-white/90 mt-1 leading-snug">
                Log in with your Indian phone number to access instant UPI deposits, 24/7 withdrawals & VIP rank rewards.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 relative z-10">
            <button
              onClick={() => onOpenAuth ? onOpenAuth('login') : onOpenDeposit?.()}
              className="py-2.5 px-3 rounded-xl bg-white text-[#f95959] font-bold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-4 h-4" />
              <span>Log In</span>
            </button>
            <button
              onClick={() => onOpenAuth ? onOpenAuth('register') : onOpenDeposit?.()}
              className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-black text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-slate-900" />
              <span>Register (+₹25)</span>
            </button>
          </div>
        </div>

        {/* Feature Overview Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xs uppercase tracking-wide">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Official India Arcade Guarantee</span>
          </div>

          <div className="space-y-2 text-xs text-slate-600">
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium">⚡ Instant UPI Banking</span>
              <span className="font-bold text-emerald-600">Zero Fees</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium">🎲 Certified Fair Games</span>
              <span className="font-bold text-slate-700">Win Go & Aviator</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-medium">🎁 New Player Welcome Gift</span>
              <span className="font-bold text-amber-600">₹25 Free Credit</span>
            </div>
          </div>
        </div>

        {/* Audio Preferences Toggle */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
              </div>
              <div>
                <span className="font-bold text-slate-900 text-xs block">Audio Effects</span>
                <span className="text-[10px] text-[#768096] block">Haptic feedback & game audio</span>
              </div>
            </div>

            <button
              onClick={handleToggleSound}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center px-0.5 ${
                soundEnabled ? 'bg-emerald-500' : 'bg-slate-300'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Customer Support CTA */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#f95959] to-[#ff7979] text-white flex items-center justify-center font-bold shadow-sm">
              <Headphones className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-900 text-xs block">24/7 VIP Customer Service</span>
              <span className="text-[10px] text-[#768096] block">Direct live Telegram representative</span>
            </div>
          </div>
          <button
            onClick={onOpenTelegram || onOpenSupport}
            className="px-3 py-1.5 rounded-lg bg-[#f95959] text-white font-bold text-xs shadow-xs active:scale-95 transition-all"
          >
            Connect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-3 pt-3 pb-24 text-slate-800 select-none">
      {/* 1. VIP Profile Header Banner (Gradient Coral/Red) */}
      <div className="rounded-2xl bg-gradient-to-r from-[#f95959] via-[#fa6c6c] to-[#ff8579] p-4 text-white shadow-md relative overflow-hidden">
        {/* Subtle Ambient Circle */}
        <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-xl pointer-events-none" />

        <div className="flex items-center gap-3.5 relative z-10">
          {/* Avatar with Metallic Golden Crown */}
          <div className="relative w-14 h-14 rounded-2xl bg-white/20 border-2 border-white flex items-center justify-center shadow-md">
            <User className="w-8 h-8 text-white stroke-[2.2]" />
            <div className="absolute -top-2 -right-2 bg-amber-400 border border-white rounded-full p-1 shadow-sm">
              <Crown className="w-3.5 h-3.5 text-slate-900 fill-slate-900" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h2 className="font-casino-num font-black text-white text-base leading-tight truncate">
                VIP Pilot
              </h2>
              <span className="bg-amber-300 text-slate-900 font-casino-num font-black text-[9px] px-2 py-0.5 rounded-full shadow-xs uppercase tracking-wide">
                VIP 1
              </span>
            </div>

            {/* User ID with Copy */}
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xs text-white/90 font-mono font-medium">
                ID: {account.id}
              </span>
              <button
                onClick={handleCopyId}
                className="text-white/80 hover:text-white transition-colors"
                title="Copy ID"
              >
                {isCopied ? (
                  <CheckCircle className="w-3 h-3 text-emerald-300" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[9px] backdrop-blur-xs">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-300" />
                KYC Verified
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-white font-bold text-[9px] backdrop-blur-xs">
                <Smartphone className="w-2.5 h-2.5 text-amber-200" />
                {account.mobile}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Wallet Overview Card (Matching Home Balance Card Style) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
        <div>
          <span className="text-[11px] text-[#768096] font-medium block">
            Total Balance
          </span>
          <span className="text-2xl font-black text-slate-900 font-casino-num block mt-0.5">
            {formatINR(balance)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenWithdraw && (
            <button
              onClick={onOpenWithdraw}
              className="border border-[#ffbe3f] bg-white text-[#fa8c16] text-xs font-bold px-3.5 py-1.5 rounded-lg hover:bg-amber-50 active:scale-95 transition-all shadow-xs"
            >
              Withdraw
            </button>
          )}
          {onOpenDeposit && (
            <button
              onClick={onOpenDeposit}
              className="bg-gradient-to-r from-[#f95959] to-[#ff7979] text-white text-xs font-bold px-4 py-1.5 rounded-lg shadow-sm hover:brightness-105 active:scale-95 transition-all"
            >
              Deposit
            </button>
          )}
        </div>
      </div>

      {/* 3. Account Menu / Quick Links List */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 divide-y divide-slate-100 overflow-hidden">
        {/* Game History */}
        <div
          onClick={() => {
            soundManager.play('click');
            if (onNavigateTab) onNavigateTab('activity');
          }}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-500 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Game Bet History</span>
              <span className="text-[10px] text-slate-400">Win Go 1Min & Aviator records</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Financial Ledger / Wallet */}
        <div
          onClick={() => {
            soundManager.play('click');
            if (onNavigateTab) onNavigateTab('wallet');
          }}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Transaction Ledger</span>
              <span className="text-[10px] text-slate-400">Deposit, withdrawal & win history</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Lucky Wheel */}
        <div
          onClick={() => {
            soundManager.play('click');
            if (onOpenLuckyWheel) onOpenLuckyWheel();
          }}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-500 flex items-center justify-center">
              <Gift className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Lucky Wheel of Fortune</span>
              <span className="text-[10px] text-slate-400">Spin to win iPhone 17 & cash prizes</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Telegram VIP Channel */}
        <div
          onClick={() => {
            soundManager.play('click');
            if (onOpenTelegram) onOpenTelegram();
          }}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Official Telegram VIP</span>
              <span className="text-[10px] text-slate-400">Daily gift codes & predictive analysis</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>

        {/* Customer Support */}
        <div
          onClick={() => {
            soundManager.play('click');
            if (onOpenSupport) onOpenSupport();
          }}
          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Headphones className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-800 block">Customer Service</span>
              <span className="text-[10px] text-slate-400">24/7 instant resolution</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </div>
      </div>

      {/* 4. Audio & Sound Settings Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${soundEnabled ? 'bg-amber-50 text-amber-500' : 'bg-slate-100 text-slate-400'}`}>
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">
                Game Sound Effects
              </h4>
              <p className="text-[10px] text-slate-400">
                {soundEnabled ? 'Win chimes, flight cues & tactile pops active' : 'Audio muted'}
              </p>
            </div>
          </div>

          <button
            onClick={handleToggleSound}
            aria-label="Toggle sound settings"
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              soundEnabled ? 'bg-[#f95959]' : 'bg-slate-200'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform shadow-md ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {soundEnabled && (
          <div className="pt-2.5 border-t border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 font-casino-num">
              Preview Audio Cues
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => soundManager.play('click')}
                className="py-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 transition-colors"
              >
                Pop Click
              </button>
              <button
                onClick={() => soundManager.play('win')}
                className="py-1.5 px-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold border border-emerald-200 transition-colors"
              >
                Win Chime
              </button>
              <button
                onClick={() => soundManager.play('crash')}
                className="py-1.5 px-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold border border-rose-200 transition-colors"
              >
                Crash Thud
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Auxiliary Piggy Bank Vault (Gullak) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-sm">
            🪙
          </div>
          <div>
            <span className="font-bold text-slate-900 text-xs block">
              Gullak Piggy Bank Vault
            </span>
            <span className="text-[10px] text-[#768096] block">
              1.5% saved automatically from every game round
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            soundManager.play('chip');
            if (onOpenGullak) onOpenGullak();
          }}
          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-casino-num font-black text-xs shadow-sm active:scale-95 transition-all"
        >
          ₹{(account.gullak_balance || 0).toFixed(2)}
        </button>
      </div>

      {/* 6. Official Member Logout Action */}
      <div className="pt-2 text-center pb-4">
        {onLogout && (
          <button
            onClick={() => {
              soundManager.play('click');
              onLogout();
            }}
            className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center justify-center gap-1.5 mx-auto py-2 px-4 rounded-xl hover:bg-rose-50 transition-colors border border-rose-200"
          >
            <span>Sign Out of Member Account</span>
          </button>
        )}
        <p className="text-[10px] text-slate-400 mt-3 font-casino-num">
          Apex Arcade • Official India Edition • 256-Bit Financial Encryption
        </p>
      </div>
    </div>
  );
};
