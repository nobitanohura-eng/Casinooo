import React from 'react';
import { Headphones, Send, Gift, Download } from 'lucide-react';

interface Lottery7FloatingBadgesProps {
  onOpenLuckyWheel: () => void;
  onOpenTelegram: () => void;
  onOpenBonusModal: () => void;
  onOpenSupport: () => void;
}

export const Lottery7FloatingBadges: React.FC<Lottery7FloatingBadgesProps> = ({
  onOpenLuckyWheel,
  onOpenTelegram,
  onOpenBonusModal,
  onOpenSupport,
}) => {
  return (
    <div className="l7-floating-badges">
      {/* 1. Customer Service Headset */}
      <div
        onClick={onOpenSupport}
        className="l7-float-badge border border-slate-100 shadow-lg"
        title="Customer Support"
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
        onClick={onOpenLuckyWheel}
        className="l7-float-badge border border-amber-200 shadow-lg animate-bounce"
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
        onClick={onOpenTelegram}
        className="l7-float-badge border border-sky-200 bg-sky-500 shadow-lg"
        title="Official Telegram"
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
        onClick={onOpenBonusModal}
        className="l7-float-badge border border-rose-200 shadow-lg"
        title="Deposit Bonus"
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
        onClick={() => alert('Download Lottery7 Official APK')}
        className="l7-float-badge border border-slate-200 bg-white shadow-lg"
        title="Install APK"
      >
        <Download className="w-4 h-4 text-rose-500" />
      </div>
    </div>
  );
};
