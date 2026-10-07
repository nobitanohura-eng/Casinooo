import React, { useState } from 'react';
import { Download, Volume2, RotateCw } from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';

interface Lottery7HeaderProps {
  balance: number;
  onRefreshBalance: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenLuckyWheel: () => void;
}

export const Lottery7Header: React.FC<Lottery7HeaderProps> = ({
  balance,
  onRefreshBalance,
  onOpenDeposit,
  onOpenWithdraw,
  activeCategory,
  onSelectCategory,
  onOpenLuckyWheel,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefreshBalance();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="w-full">
      {/* 1. Top Navbar */}
      <div className="l7-navbar">
        <div className="l7-logo">
          <img src="/assets/lottery7/logo.png" alt="Lottery 7" onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }} />
          <div className="flex items-center gap-1">
            <span className="l7-brand-text">LOTTERY</span>
            <span className="l7-brand-badge">7</span>
            <span className="text-[9px] font-bold text-slate-400 border border-slate-200 px-1 rounded ml-1">APEX</span>
          </div>
        </div>

        <div className="l7-nav-action">
          <button
            onClick={() => alert('Download Lottery7 / Apex APK')}
            className="p-1 rounded-full hover:bg-slate-100 transition-colors"
            title="Download App"
          >
            <Download className="l7-download-icon" />
          </button>
        </div>
      </div>

      {/* 2. Top Banner Slider */}
      <div className="l7-banner-container">
        <img
          src="/assets/lottery7/banner-iphone.jpg"
          alt="Lucky Spin iPhone 17 Pro"
          className="l7-banner-img cursor-pointer"
          onClick={onOpenLuckyWheel}
        />
      </div>

      {/* 3. Speaker Announcement Marquee */}
      <div className="l7-marquee-bar">
        <Volume2 className="l7-speaker-icon" />
        <div className="l7-marquee-content">
          <span>All players registered on this platform must bind their bank card. Apex Official Guarantee!</span>
        </div>
        <button
          onClick={() => alert('Apex Official Notice: Instant 24/7 UPI settlements & fair certified gaming.')}
          className="l7-detail-btn"
        >
          Detail
        </button>
      </div>

      {/* 4. Wallet Balance Card */}
      <div className="l7-wallet-card">
        <div className="l7-balance-info">
          <span className="l7-balance-label">
            <span>Main balance</span>
          </span>
          <div className="l7-balance-amount">
            <span>{formatINR(balance)}</span>
            <button
              onClick={handleRefresh}
              className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
              title="Refresh Balance"
              aria-label="Refresh Balance"
            >
              <RotateCw className={`l7-refresh-icon ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <div className="l7-wallet-actions">
          <button onClick={onOpenWithdraw} className="l7-btn-withdraw">
            Withdraw
          </button>
          <button onClick={onOpenDeposit} className="l7-btn-deposit">
            Deposit
          </button>
        </div>
      </div>

      {/* 5. Category Navigation (Row 1: Top 3 Cards, Row 2: Bottom 5 Tabs) */}
      <div className="l7-cat-section">
        {/* Top 3 High-Priority Cards */}
        <div className="l7-cat-top-row">
          <div
            onClick={() => onSelectCategory('popular')}
            className={`l7-cat-card-top popular ${activeCategory === 'popular' ? 'ring-2 ring-blue-400' : ''}`}
          >
            <img src="/assets/lottery7/cat-popular.png" alt="Popular" />
            <span>Popular</span>
          </div>

          <div
            onClick={() => onSelectCategory('lottery')}
            className={`l7-cat-card-top lottery ${activeCategory === 'lottery' ? 'ring-2 ring-orange-400' : ''}`}
          >
            <img src="/assets/lottery7/cat-lottery.png" alt="Lottery" />
            <span>Lottery</span>
          </div>

          <div
            onClick={() => onSelectCategory('minigames')}
            className={`l7-cat-card-top minigames ${activeCategory === 'minigames' ? 'ring-2 ring-purple-400' : ''}`}
          >
            <img src="/assets/lottery7/cat-minigames.png" alt="Mini games" />
            <span>Mini games</span>
          </div>
        </div>

        {/* Bottom 5 Icon Tabs */}
        <div className="l7-cat-bottom-row">
          <div
            onClick={() => onSelectCategory('slots')}
            className={`l7-cat-item-bottom ${activeCategory === 'slots' ? 'bg-red-50 text-red-500' : ''}`}
          >
            <img src="/assets/lottery7/cat-slots.png" alt="Slots" />
            <span>Slots</span>
          </div>

          <div
            onClick={() => onSelectCategory('fishing')}
            className={`l7-cat-item-bottom ${activeCategory === 'fishing' ? 'bg-red-50 text-red-500' : ''}`}
          >
            <img src="/assets/lottery7/cat-fishing.png" alt="Fishing" />
            <span>Fishing</span>
          </div>

          <div
            onClick={() => onSelectCategory('pvc')}
            className={`l7-cat-item-bottom ${activeCategory === 'pvc' ? 'bg-red-50 text-red-500' : ''}`}
          >
            <img src="/assets/lottery7/cat-pvc.png" alt="PVC" />
            <span>PVC</span>
          </div>

          <div
            onClick={() => onSelectCategory('sports')}
            className={`l7-cat-item-bottom ${activeCategory === 'sports' ? 'bg-red-50 text-red-500' : ''}`}
          >
            <img src="/assets/lottery7/cat-sports.png" alt="Sports" />
            <span>Sports</span>
          </div>

          <div
            onClick={() => onSelectCategory('casino')}
            className={`l7-cat-item-bottom ${activeCategory === 'casino' ? 'bg-red-50 text-red-500' : ''}`}
          >
            <img src="/assets/lottery7/cat-casino.png" alt="Casino" />
            <span>Casino</span>
          </div>
        </div>
      </div>
    </div>
  );
};
