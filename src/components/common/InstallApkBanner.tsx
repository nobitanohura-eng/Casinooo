import React, { useState, useEffect } from 'react';
import { Smartphone, Download, X, Gift, CheckCircle } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';
import { useTranslation } from '../../lib/i18n.ts';

interface InstallApkBannerProps {
  onBonusClaimed?: (amount: number) => void;
}

export const InstallApkBanner: React.FC<InstallApkBannerProps> = ({ onBonusClaimed }) => {
  const { t } = useTranslation();
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    return localStorage.getItem('apex_apk_banner_dismissed') === 'true';
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installSuccess, setInstallSuccess] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleDismiss = () => {
    soundManager.play('click');
    setIsDismissed(true);
    localStorage.setItem('apex_apk_banner_dismissed', 'true');
  };

  const handleInstall = async () => {
    soundManager.play('click');
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setInstallSuccess(true);
        if (onBonusClaimed) onBonusClaimed(50);
      }
      setDeferredPrompt(null);
    } else {
      // Direct APK Simulation Download for standard mobile / desktop testing
      setInstallSuccess(true);
      if (onBonusClaimed) onBonusClaimed(50);
      setTimeout(() => {
        setIsDismissed(true);
      }, 3500);
    }
  };

  if (isDismissed) return null;

  return (
    <div className="w-full bg-gradient-to-r from-emerald-950 via-[#0d1726] to-[#0b121e] border-b border-emerald-500/30 px-3 py-1.5 flex items-center justify-between gap-2 shadow-sm text-xs">
      <div className="flex items-center gap-2 min-w-0">
        {/* Android Bot Icon */}
        <div className="w-7 h-7 rounded-md bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-1.0001 0-.5515.4482-1.0001.9993-1.0001.5516 0 1.0001.4486 1.0001 1.0001 0 .5515-.4485 1.0001-1.0001 1.0001m-11.046 0c-.5515 0-1.0001-.4486-1.0001-1.0001 0-.5515.4486-1.0001 1.0001-1.0001.5511 0 .9993.4486.9993 1.0001 0 .5515-.4482 1.0001-.9993 1.0001m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.568.1523l-2.0223 3.503C15.5902 8.4124 13.8533 8 12 8s-3.5902.4124-5.1365 1.0504L4.8413 5.5474a.416.416 0 00-.568-.1523.416.416 0 00-.1522.5676l1.9974 3.4592C2.6889 11.1867.3432 14.6589 0 18.8248h24c-.3432-4.1659-2.6889-7.6381-6.1185-9.5034" />
          </svg>
        </div>

        {/* Copy */}
        <div className="truncate">
          <div className="flex items-center gap-1.5 font-bold text-white text-[11px] leading-tight truncate">
            <span>{t('installTitle')}</span>
            <span className="text-[10px] text-amber-300 font-extrabold bg-amber-500/20 border border-amber-500/40 px-1 rounded font-casino-num">
              +₹50 Free
            </span>
          </div>
          <span className="text-[9px] text-emerald-400 font-medium block truncate">
            {t('installBonus')} · Fast 1-Tap Launch
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-1.5 shrink-0">
        {installSuccess ? (
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-1 rounded-md">
            <CheckCircle className="w-3 h-3" />
            <span>₹50 Added!</span>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="flex items-center gap-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 px-2.5 py-1 rounded-md font-casino-num font-black text-[10px] uppercase tracking-wider shadow-md transition-transform active:scale-95"
          >
            <Download className="w-3 h-3 stroke-[3]" />
            <span>{t('installBtn')}</span>
          </button>
        )}

        <button
          onClick={handleDismiss}
          aria-label="Dismiss banner"
          className="w-5 h-5 rounded flex items-center justify-center text-slate-400 hover:text-white"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
