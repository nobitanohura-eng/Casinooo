import React from 'react';
import { Home, History, Gift, Users, User, Disc3, Sparkles } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';
import { useTranslation } from '../../lib/i18n.ts';

export type NavTab = 'home' | 'activity' | 'wallet' | 'promotion' | 'account';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenLuckyWheel?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onOpenLuckyWheel,
}) => {
  const { t } = useTranslation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070b14]/98 backdrop-blur-xl border-t border-slate-700/60 pb-safe">
      <div className="max-w-lg mx-auto relative flex items-center justify-between h-14 px-2">
        {/* 1. Home Tab */}
        <button
          onClick={() => {
            soundManager.play('click');
            onChangeTab('home');
          }}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors tap-highlight-none ${
            activeTab === 'home' ? 'text-amber-400 font-casino-num font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className={`w-5 h-5 transition-transform ${activeTab === 'home' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 uppercase tracking-tight font-casino-num font-bold">
            Home
          </span>
        </button>

        {/* 2. Activity Tab */}
        <button
          onClick={() => {
            soundManager.play('click');
            onChangeTab('activity');
          }}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors tap-highlight-none ${
            activeTab === 'activity' ? 'text-amber-400 font-casino-num font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className={`w-5 h-5 transition-transform ${activeTab === 'activity' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 uppercase tracking-tight font-casino-num font-bold">
            Activity
          </span>
        </button>

        {/* 3. CENTER ELEVATED LUCKY WHEEL TAB (Protruding 16px above the bar with 3D colorful spinning wheel) */}
        <div className="relative flex-1 flex flex-col items-center justify-center -top-3.5">
          <button
            onClick={() => {
              soundManager.play('win');
              if (onOpenLuckyWheel) onOpenLuckyWheel();
            }}
            aria-label="Lucky Wheel of Fortune"
            className="group relative w-14 h-14 rounded-full p-1 bg-gradient-to-tr from-yellow-500 via-amber-300 to-yellow-600 shadow-[0_4px_20px_rgba(245,158,11,0.6)] border-2 border-amber-300 flex items-center justify-center active:scale-95 transition-transform hover:scale-105"
          >
            {/* Outer Radiant Glow */}
            <div className="absolute inset-0 rounded-full bg-amber-400/30 blur-sm pointer-events-none group-hover:bg-amber-400/50" />

            <div className="relative z-10 w-full h-full rounded-full bg-gradient-to-br from-[#240b36] via-[#3a0d5c] to-[#1a0528] flex flex-col items-center justify-center border border-amber-300 shadow-inner">
              <Disc3 className="w-7 h-7 text-yellow-300 animate-[spin_10s_linear_infinite] drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" />
              <span className="absolute -bottom-1 text-[7px] font-casino-num font-black text-amber-300 uppercase px-1 rounded bg-slate-950/90 tracking-tighter">
                SPIN
              </span>
            </div>
          </button>
          <span className="text-[9px] font-casino-num font-black text-amber-300 uppercase tracking-tight mt-0.5">
            Lucky Wheel
          </span>
        </div>

        {/* 4. Promotion (Agency / Invite) Tab */}
        <button
          onClick={() => {
            soundManager.play('click');
            onChangeTab('promotion');
          }}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors tap-highlight-none ${
            activeTab === 'promotion' ? 'text-amber-400 font-casino-num font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className={`w-5 h-5 transition-transform ${activeTab === 'promotion' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 uppercase tracking-tight font-casino-num font-bold">
            Promotion
          </span>
        </button>

        {/* 5. Me (Account / Profile / Wallet) Tab */}
        <button
          onClick={() => {
            soundManager.play('click');
            onChangeTab('account');
          }}
          className={`flex-1 flex flex-col items-center justify-center min-h-[48px] py-1 transition-colors tap-highlight-none ${
            activeTab === 'account' ? 'text-amber-400 font-casino-num font-black' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className={`w-5 h-5 transition-transform ${activeTab === 'account' ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className="text-[10px] mt-0.5 uppercase tracking-tight font-casino-num font-bold">
            Me
          </span>
        </button>
      </div>
    </nav>
  );
};
