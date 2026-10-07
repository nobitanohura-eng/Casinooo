import React from 'react';
import { Award, Gift, Gamepad2, Wallet, User } from 'lucide-react';
import { NavTab } from '../layout/BottomNav.tsx';
import { soundManager } from '../../lib/sound.ts';

interface Lottery7BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  onOpenLuckyWheel?: () => void;
  onSelectLobby?: () => void;
}

export const Lottery7BottomNav: React.FC<Lottery7BottomNavProps> = ({
  activeTab,
  onChangeTab,
  onSelectLobby,
}) => {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] h-14 bg-white border-t border-[#ebedf0] shadow-[0_-2px_10px_rgba(0,0,0,0.06)] z-50 flex items-center justify-around px-2 select-none">
      {/* 1. Promotion */}
      <button
        onClick={() => {
          soundManager.play('click');
          onChangeTab('promotion');
        }}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'promotion' ? 'text-[#f95959] font-bold' : 'text-[#768096]'
        }`}
      >
        <Award className={`w-5 h-5 ${activeTab === 'promotion' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] mt-0.5 font-medium">Promotion</span>
      </button>

      {/* 2. Activity */}
      <button
        onClick={() => {
          soundManager.play('click');
          onChangeTab('activity');
        }}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'activity' ? 'text-[#f95959] font-bold' : 'text-[#768096]'
        }`}
      >
        <Gift className={`w-5 h-5 ${activeTab === 'activity' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] mt-0.5 font-medium">Activity</span>
      </button>

      {/* 3. Center Elevated Home / Game button */}
      <div className="flex-1 flex flex-col items-center justify-center relative -top-3">
        <button
          onClick={() => {
            soundManager.play('click');
            onChangeTab('home');
            if (onSelectLobby) onSelectLobby();
          }}
          className="w-12 h-10 rounded-full bg-gradient-to-b from-[#f95959] to-[#ff9a8e] flex items-center justify-center text-white shadow-[0_4px_12px_rgba(249,89,89,0.45)] border-2 border-white active:scale-95 transition-transform"
        >
          <Gamepad2 className="w-6 h-6 fill-white/20 stroke-white" />
        </button>
        <span className={`text-[10px] mt-0.5 font-medium ${activeTab === 'home' ? 'text-[#f95959] font-bold' : 'text-[#768096]'}`}>
          Game
        </span>
      </div>

      {/* 4. Wallet */}
      <button
        onClick={() => {
          soundManager.play('click');
          onChangeTab('wallet');
        }}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'wallet' ? 'text-[#f95959] font-bold' : 'text-[#768096]'
        }`}
      >
        <Wallet className={`w-5 h-5 ${activeTab === 'wallet' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] mt-0.5 font-medium">Wallet</span>
      </button>

      {/* 5. Account */}
      <button
        onClick={() => {
          soundManager.play('click');
          onChangeTab('account');
        }}
        className={`flex-1 flex flex-col items-center justify-center py-1 transition-colors ${
          activeTab === 'account' ? 'text-[#f95959] font-bold' : 'text-[#768096]'
        }`}
      >
        <User className={`w-5 h-5 ${activeTab === 'account' ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
        <span className="text-[10px] mt-0.5 font-medium">Account</span>
      </button>
    </nav>
  );
};
