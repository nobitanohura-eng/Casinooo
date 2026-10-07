import React, { useState } from 'react';
import { Lottery7Header } from './Lottery7Header.tsx';
import { Lottery7FloatingBadges } from './Lottery7FloatingBadges.tsx';
import { Lottery7GameShelves } from './Lottery7GameShelves.tsx';
import { Lottery7WinningFeed } from './Lottery7WinningFeed.tsx';
import { Lottery7EarningsChart } from './Lottery7EarningsChart.tsx';

interface Lottery7LobbyProps {
  balance: number;
  onRefreshBalance: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onSelectGame: (game: 'aviator' | 'wingo') => void;
  winGoStatusText?: string;
  aviatorStatusText?: string;
  onOpenLuckyWheel: () => void;
  onOpenDepositBonus: () => void;
  onOpenTelegram: () => void;
  onOpenSupport: () => void;
}

export const Lottery7Lobby: React.FC<Lottery7LobbyProps> = ({
  balance,
  onRefreshBalance,
  onOpenDeposit,
  onOpenWithdraw,
  onSelectGame,
  winGoStatusText,
  aviatorStatusText,
  onOpenLuckyWheel,
  onOpenDepositBonus,
  onOpenTelegram,
  onOpenSupport,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('popular');

  return (
    <div className="lottery7-root pb-20 select-none">
      {/* 1. Official Header (Navbar, Slider, Marquee, Balance Card, Category Grid) */}
      <Lottery7Header
        balance={balance}
        onRefreshBalance={onRefreshBalance}
        onOpenDeposit={onOpenDeposit}
        onOpenWithdraw={onOpenWithdraw}
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        onOpenLuckyWheel={onOpenLuckyWheel}
      />

      {/* 2. Floating Action Badges (Customer Service, Lucky Wheel, Telegram, Bonus, APK) */}
      <Lottery7FloatingBadges
        onOpenSupport={onOpenSupport}
        onOpenLuckyWheel={onOpenLuckyWheel}
        onOpenTelegram={onOpenTelegram}
        onOpenBonusModal={onOpenDepositBonus}
      />

      {/* 3. Game Shelves (Popular, Lottery, Mini games) */}
      <div className="px-3">
        <Lottery7GameShelves
          onSelectGame={onSelectGame}
          winGoStatusText={winGoStatusText}
          aviatorStatusText={aviatorStatusText}
        />
      </div>

      {/* 4. Live Winning Information Marquee Ticker */}
      <div className="mt-4 px-3">
        <Lottery7WinningFeed />
      </div>

      {/* 5. Today's Earnings Chart (Podium + Ranks 4-10) */}
      <div className="mt-4 px-3 mb-6">
        <Lottery7EarningsChart />
      </div>

      {/* 6. Footer Information & Security Certification */}
      <div className="px-4 py-6 text-center text-[#768096] text-[11px] space-y-2 border-t border-[#ebedf0] bg-white mx-3 rounded-xl mb-4 shadow-sm">
        <div className="flex items-center justify-center gap-2 font-bold text-slate-700">
          <span>LOTTERY 7</span>
          <span>•</span>
          <span className="text-[#f95959]">APEX ARCADE</span>
        </div>
        <p className="text-[10px] leading-relaxed text-[#acafb7]">
          Certified RNG simulation platform. Sub-second instant UPI credit settlement.
          Play responsibly. Strictly 18+.
        </p>
      </div>
    </div>
  );
};
