import React from 'react';
import { Headphones, Send, Gift, Download } from 'lucide-react';
import { soundManager } from '../../lib/sound.ts';

interface Lottery7FloatingBadgesProps {
  onOpenLuckyWheel: () => void;
  onOpenTelegram: () => void;
  onOpenBonusModal: () => void;
  onOpenSupport: () => void;
  onOpenApkModal: () => void;
}

export const Lottery7FloatingBadges: React.FC<Lottery7FloatingBadgesProps> = ({
  onOpenLuckyWheel,
  onOpenTelegram,
  onOpenBonusModal,
  onOpenSupport,
  onOpenApkModal,
}) => {
  return (
    <div className="l7-floating-badges z-30 select-none">
      {/* 1. Customer Service Headset */}
      <div
        onClick={() => {
          soundManager.play('click');
          onOpenSupport();
        }}
        className="l7-float-badge border border-slate-100 shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        title="24/7 Customer Support"
      >
        <img
          src="/assets/lottery7/avatar-BTjdxpts.png"
          alt="CS"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <Headphones className="w-5 h-5 text-rose-500 absolute" />
      </div>

      {/* 2. Lucky Spin Wheel */}
      <div
        onClick={() => {
          soundManager.play('click');
          onOpenLuckyWheel();
        }}
        className="l7-float-badge border border-amber-200 shadow-lg animate-bounce cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        title="Lucky Spin iPhone 17"
      >
        <img
          src="/assets/lottery7/turntable_icon-BEB6XBBJ.png"
          alt="Lucky Spin"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>

      {/* 3. Official Telegram Channel */}
      <div
        onClick={() => {
          soundManager.play('click');
          onOpenTelegram();
        }}
        className="l7-float-badge border border-sky-200 bg-sky-500 shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        title="Apex VIP Telegram"
      >
        <img
          src="/assets/lottery7/tg_bg-B9t7Lek8.png"
          alt="Telegram"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <Send className="w-4 h-4 text-white absolute" />
      </div>

      {/* 4. First Deposit Gift Box */}
      <div
        onClick={() => {
          soundManager.play('click');
          onOpenBonusModal();
        }}
        className="l7-float-badge border border-rose-200 shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        title="100% Deposit Bonus"
      >
        <img
          src="/assets/lottery7/reBenefits-CbKT8tNB.png"
          alt="Bonus"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
        <Gift className="w-4 h-4 text-rose-500 absolute" />
      </div>

      {/* 5. Install App APK */}
      <div
        onClick={() => {
          soundManager.play('click');
          onOpenApkModal();
        }}
        className="l7-float-badge border border-slate-200 bg-white shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-transform"
        title="Download Official App"
      >
        <Download className="w-4 h-4 text-rose-500" />
      </div>
    </div>
  );
};
