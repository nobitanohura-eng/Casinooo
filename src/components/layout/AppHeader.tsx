import React, { useState, useEffect } from 'react';
import { Plus, Volume2, VolumeX, Send, Crown, Globe } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';
import { formatINR } from '../../lib/formatters.ts';
import { useTranslation } from '../../lib/i18n.ts';

interface AppHeaderProps {
  balance: number;
  isConnected: boolean;
  onOpenTopUp: () => void;
  onOpenAccount: () => void;
  onOpenTelegramVIP?: () => void;
  onSecretOperatorTrigger?: () => void;
  accountId: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  balance,
  isConnected,
  onOpenTopUp,
  onOpenAccount,
  onOpenTelegramVIP,
  onSecretOperatorTrigger,
  accountId,
}) => {
  const { lang, toggleLang } = useTranslation();
  const [soundEnabled, setSoundEnabled] = useState<boolean>(soundManager.isEnabled());

  useEffect(() => {
    return soundManager.subscribe((enabled) => {
      setSoundEnabled(enabled);
    });
  }, []);

  const handleToggleSound = () => {
    soundManager.toggle();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#070b14]/98 backdrop-blur-md border-b border-slate-700/60 shadow-md">
      <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 flex items-center justify-between gap-1.5 max-w-lg mx-auto">
        {/* Left: Clean Brand Identity */}
        <div
          className="flex items-center gap-1.5 cursor-pointer select-none active:opacity-85 shrink-0"
        >
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center font-casino-num font-black text-slate-950 text-xs sm:text-sm shadow-md shadow-amber-500/20 border-t border-white/50">
            A
          </div>
          <div>
            <div className="font-casino-num font-black text-white text-xs sm:text-sm tracking-tight leading-none flex items-center gap-0.5">
              APEX <span className="text-amber-400">ARCADE</span>
            </div>
            <span className="text-[7px] sm:text-[8px] text-amber-400/90 font-bold uppercase tracking-wider block mt-0.5">
              INDIA OFFICIAL
            </span>
          </div>
        </div>

        {/* Right: Subtle Secondary Utility Icons + Clean Balance Pill with "+" + Profile Chip */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {/* Subtle VIP Telegram Link */}
          {onOpenTelegramVIP && (
            <button
              onClick={() => {
                soundManager.play('click');
                onOpenTelegramVIP();
              }}
              aria-label="Telegram VIP"
              className="hidden sm:flex w-6 h-6 rounded-md bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-sky-400 items-center justify-center transition-colors"
              title="Official VIP Telegram Channel"
            >
              <Send className="w-3 h-3 fill-sky-400" />
            </button>
          )}

          {/* Subtle Language Toggle: EN / हिंदी */}
          <button
            onClick={() => {
              soundManager.play('click');
              toggleLang();
            }}
            aria-label="Language Toggle"
            className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-amber-300 flex items-center justify-center transition-colors font-casino-num font-black text-[9px]"
            title={`Current: ${lang.toUpperCase()} (Click to toggle)`}
          >
            <Globe className="w-3 h-3 text-amber-400" />
          </button>

          {/* Subtle Sound Toggle */}
          <button
            onClick={handleToggleSound}
            aria-label={soundEnabled ? 'Mute audio' : 'Enable audio'}
            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors ${
              soundEnabled
                ? 'bg-slate-900 border-slate-800 text-amber-400'
                : 'bg-slate-950 border-slate-850 text-slate-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3 h-3" /> : <VolumeX className="w-3 h-3" />}
          </button>

          {/* Current Balance Pill with Prominent "+" Recharge Button */}
          <div className="bg-[#111728] border border-amber-500/35 rounded-lg px-1.5 py-0.5 sm:py-1 flex items-center gap-1 sm:gap-1.5 shadow-inner">
            <div className="flex flex-col text-right">
              <span className="text-[6.5px] text-amber-400/90 font-bold uppercase tracking-wider font-casino-num leading-none">
                WALLET
              </span>
              <span className="font-casino-num font-black text-amber-300 text-xs sm:text-sm leading-tight">
                {formatINR(balance)}
              </span>
            </div>

            <button
              onClick={() => {
                soundManager.play('click');
                onOpenTopUp();
              }}
              aria-label="Recharge UPI Credits"
              className="w-5 h-5 sm:w-5.5 sm:h-5.5 rounded-md bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 flex items-center justify-center shadow-md border-t border-white/50 active:scale-95 transition-transform"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
            </button>
          </div>

          {/* User Profile Avatar with Golden Crown */}
          <button
            onClick={() => {
              soundManager.play('click');
              onOpenAccount();
            }}
            aria-label="User Profile"
            className="relative flex items-center bg-gradient-to-r from-amber-950/80 to-[#121929] border border-amber-500/40 rounded-lg px-1.5 py-1 gap-1 hover:border-amber-400 transition-colors shadow-sm active:scale-95 shrink-0"
          >
            <Crown className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
            <span className="text-[8px] font-casino-num font-black text-white uppercase whitespace-nowrap">
              VIP 1
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
