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
  const [logoClicks, setLogoClicks] = useState<number>(0);

  const handleLogoClick = () => {
    soundManager.play('click');
    const next = logoClicks + 1;
    if (next >= 5) {
      setLogoClicks(0);
      if (onSecretOperatorTrigger) onSecretOperatorTrigger();
    } else {
      setLogoClicks(next);
      setTimeout(() => setLogoClicks(0), 3000);
    }
  };

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
      <div className="px-3 py-2 flex items-center justify-between gap-2 max-w-lg mx-auto">
        {/* Left: Clean Brand Identity (Tap 5x triggers stealth operator console in preview) */}
        <div
          onClick={handleLogoClick}
          className="flex items-center gap-2 cursor-pointer select-none active:opacity-85"
          title="Apex Arcade (Tap 5x for Operator Console)"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 flex items-center justify-center font-casino-num font-black text-slate-950 text-base shadow-md shadow-amber-500/20 border-t border-white/50">
            A
          </div>
          <div>
            <div className="font-casino-num font-black text-white text-base tracking-tight leading-none flex items-center gap-1">
              APEX <span className="text-amber-400">ARCADE</span>
            </div>
            <span className="text-[8px] text-amber-400/90 font-bold uppercase tracking-wider block mt-0.5">
              INDIA OFFICIAL
            </span>
          </div>
        </div>

        {/* Right: Subtle Secondary Utility Icons + Clean Balance Pill with "+" + Profile Chip */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Subtle VIP Telegram Link */}
          {onOpenTelegramVIP && (
            <button
              onClick={() => {
                soundManager.play('click');
                onOpenTelegramVIP();
              }}
              aria-label="Telegram VIP"
              className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-sky-400 flex items-center justify-center transition-colors"
              title="Official VIP Telegram Channel"
            >
              <Send className="w-3.5 h-3.5 fill-sky-400" />
            </button>
          )}

          {/* Subtle Language Toggle: EN / हिंदी */}
          <button
            onClick={() => {
              soundManager.play('click');
              toggleLang();
            }}
            aria-label="Language Toggle"
            className="w-7 h-7 rounded-md bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-amber-300 flex items-center justify-center transition-colors font-casino-num font-black text-[10px]"
            title={`Current: ${lang.toUpperCase()} (Click to toggle)`}
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
          </button>

          {/* Subtle Sound Toggle */}
          <button
            onClick={handleToggleSound}
            aria-label={soundEnabled ? 'Mute audio' : 'Enable audio'}
            className={`w-7 h-7 rounded-md border flex items-center justify-center transition-colors ${
              soundEnabled
                ? 'bg-slate-900 border-slate-800 text-amber-400'
                : 'bg-slate-950 border-slate-850 text-slate-600'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Current Balance Pill with Prominent "+" Recharge Button */}
          <div className="bg-[#111728] border border-amber-500/35 rounded-xl pl-2.5 pr-1 py-1 flex items-center gap-1.5 shadow-inner">
            <div className="flex flex-col text-right">
              <span className="text-[7px] text-amber-400/90 font-bold uppercase tracking-wider font-casino-num leading-none">
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
              className="w-6 h-6 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 flex items-center justify-center shadow-md border-t border-white/50 active:scale-95 transition-transform"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
            </button>
          </div>

          {/* User Profile Avatar with Golden Crown */}
          <button
            onClick={() => {
              soundManager.play('click');
              onOpenAccount();
            }}
            aria-label="User Profile"
            className="relative flex items-center bg-gradient-to-r from-amber-950/80 to-[#121929] border border-amber-500/40 rounded-lg p-1 pr-1.5 gap-1 hover:border-amber-400 transition-colors shadow-sm active:scale-95"
          >
            <Crown className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="text-[8px] font-casino-num font-black text-white uppercase">
              VIP 1
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
