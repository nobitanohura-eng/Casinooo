import React, { useState, useEffect } from 'react';
import { Account } from '../../lib/types.ts';
import { Crown, Smartphone, KeyRound, Volume2, VolumeX, ShieldCheck, User, Sparkles } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';
import { AgencyHub } from './AgencyHub.tsx';
import { useTranslation } from '../../lib/i18n.ts';

interface AccountViewProps {
  account: Account | null;
  onResetDemoBalance: () => void;
  onSwitchDemoAccount: () => void;
  onRefreshData?: () => void;
  onOpenOperatorConsole?: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  account,
  onResetDemoBalance,
  onSwitchDemoAccount,
  onRefreshData,
  onOpenOperatorConsole,
}) => {
  const { t } = useTranslation();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.isEnabled());

  useEffect(() => {
    return soundManager.subscribe((enabled) => {
      setSoundEnabled(enabled);
    });
  }, []);

  const handleToggleSound = () => {
    const next = soundManager.toggle();
    setSoundEnabled(next);
  };

  if (!account) return null;

  return (
    <div className="space-y-3 px-3 pb-24">
      {/* 1. Gamified VIP Profile Avatar Card with Metallic Crown & VIP 1 Pill */}
      <div className="bg-[#0b101c] border border-slate-700/60 rounded-lg p-4 shadow-md">
        <div className="flex items-center gap-3.5 mb-3">
          {/* Luxury Profile Avatar Chip without random numbers */}
          <div className="relative w-14 h-14 rounded-lg bg-gradient-to-tr from-amber-600 via-amber-400 to-yellow-200 text-slate-950 flex items-center justify-center shadow-lg shadow-amber-500/25 border-t border-white/60">
            <User className="w-8 h-8 text-slate-950 stroke-[2.5]" />
            {/* Metallic Golden Crown Badge */}
            <div className="absolute -top-2.5 -right-2 bg-slate-950 border border-amber-400/80 rounded-full p-1 shadow-md">
              <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="font-casino-num font-black text-white text-base leading-tight truncate">
                VIP Pilot
              </h3>
              <span className="bg-gradient-to-r from-amber-500 to-amber-700 text-slate-950 font-casino-num font-black text-[9px] px-2 py-0.5 rounded shadow-sm uppercase tracking-wide">
                VIP 1
              </span>
            </div>

            <span className="text-xs text-amber-400 font-casino-num font-bold block mt-0.5">
              ID: {account.id}
            </span>

            {/* Clean Player Trust Badges */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-casino-num font-bold text-[10px]">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                KYC Verified
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-casino-num font-bold text-[10px]">
                <Sparkles className="w-3 h-3 text-amber-400" />
                VIP Member
              </span>
            </div>
          </div>
        </div>

        {/* Profile Info Details */}
        <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-slate-800 text-xs">
          <div className="bg-[#070b14] p-2 rounded-md border border-slate-800/80">
            <span className="text-[9px] text-slate-400 uppercase font-bold block font-casino-num flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-slate-400" />
              Verified Mobile
            </span>
            <span className="font-casino-num font-bold text-slate-200 mt-0.5 block">
              {account.mobile}
            </span>
          </div>

          <div className="bg-[#070b14] p-2 rounded-md border border-slate-800/80">
            <span className="text-[9px] text-slate-400 uppercase font-bold block font-casino-num flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-400" />
              Tier Status
            </span>
            <span className="font-casino-num font-black text-amber-400 mt-0.5 block">
              VIP LEVEL 1
            </span>
          </div>
        </div>
      </div>

      {/* 2. Multi-Tier Agency / Affiliate Hub */}
      <AgencyHub accountId={account.id} onRefreshData={onRefreshData} />

      {/* 3. Audio & Sound Settings */}
      <div className="bg-[#0b101c] border border-slate-700/60 rounded-lg p-3 shadow-md space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-md flex items-center justify-center ${
                soundEnabled
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </div>
            <div>
              <h4 className="font-casino-num font-black text-white text-xs uppercase tracking-wider">
                Sound Effects & Audio
              </h4>
              <p className="text-[10px] text-slate-400">
                {soundEnabled ? 'Tactile clicks, win chimes & crash alerts on' : 'Arcade audio muted'}
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <button
            onClick={handleToggleSound}
            aria-label="Toggle sound settings"
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 ${
              soundEnabled ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-slate-950 transition-transform shadow-md ${
                soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Audio Previews */}
        {soundEnabled && (
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 font-casino-num">
              Preview Sound Effects
            </span>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={() => soundManager.play('click')}
                className="py-1 px-2 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 font-casino-num text-[10px] font-bold border border-slate-700/60 transition-colors"
              >
                Pop Click
              </button>
              <button
                onClick={() => soundManager.play('win')}
                className="py-1 px-2 rounded-md bg-emerald-950 hover:bg-emerald-900 text-emerald-300 font-casino-num text-[10px] font-bold border border-emerald-800/60 transition-colors"
              >
                Win Chime
              </button>
              <button
                onClick={() => soundManager.play('crash')}
                className="py-1 px-2 rounded-md bg-rose-950 hover:bg-rose-900 text-rose-300 font-casino-num text-[10px] font-bold border border-rose-800/60 transition-colors"
              >
                Crash Thud
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Sandbox Utilities */}
      <div className="bg-[#0b101c] border border-slate-700/60 rounded-lg p-3 shadow-md space-y-2">
        <h4 className="font-casino-num font-black text-white text-xs uppercase tracking-wider">
          Testing Session Controls
        </h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onResetDemoBalance}
            className="py-2 px-3 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 font-casino-num font-bold text-xs transition-colors"
          >
            Reset ₹1,000 Balance
          </button>
          <button
            onClick={onSwitchDemoAccount}
            className="py-2 px-3 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 font-casino-num font-bold text-xs transition-colors"
          >
            New Pilot Session
          </button>
        </div>

        {onOpenOperatorConsole && (
          <button
            onClick={onOpenOperatorConsole}
            className="w-full mt-2 py-2 px-3 rounded-md bg-amber-950/40 hover:bg-amber-900/50 border border-amber-500/40 text-amber-300 font-casino-num font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-400" />
            <span>Launch Operator War Room (Admin Console)</span>
          </button>
        )}
      </div>
    </div>
  );
};
