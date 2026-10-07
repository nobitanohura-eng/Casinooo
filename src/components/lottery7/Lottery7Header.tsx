import React, { useState } from 'react';
import { Download, Volume2, RotateCw, ShieldCheck, Sparkles } from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';

interface Lottery7HeaderProps {
  balance: number;
  onRefreshBalance: () => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  activeCategory: string;
  onSelectCategory: (cat: string) => void;
  onOpenLuckyWheel: () => void;
  onOpenNotice?: () => void;
  onOpenApkModal?: () => void;
}

export const Lottery7Header: React.FC<Lottery7HeaderProps> = ({
  balance,
  onRefreshBalance,
  onOpenDeposit,
  onOpenWithdraw,
  activeCategory,
  onSelectCategory,
  onOpenLuckyWheel,
  onOpenNotice,
  onOpenApkModal,
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    onRefreshBalance();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  return (
    <div className="w-full">
      {/* 1. Top Navbar with Apex Arcade Brand */}
      <div className="l7-navbar">
        <div className="flex items-center gap-2">
          {/* Stylized Apex Shield Icon */}
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#f95959] via-[#ff7979] to-amber-400 flex items-center justify-center text-white font-black text-sm shadow-sm border border-white">
            A
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-base font-black italic tracking-tight bg-gradient-to-r from-[#f95959] to-[#d93025] bg-clip-text text-transparent">
              APEX
            </span>
            <span className="text-base font-black tracking-tight text-slate-800">
              ARCADE
            </span>
            <span className="text-[8px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white px-1.5 py-0.5 rounded shadow-xs uppercase tracking-wider">
              OFFICIAL
            </span>
          </div>
        </div>

        <div className="l7-nav-action">
          <button
            onClick={onOpenApkModal}
            className="p-1 rounded-full hover:bg-slate-100 transition-colors flex items-center gap-1 text-[#f95959]"
            title="Download Android App"
            aria-label="Download Android App"
          >
            <Download className="w-5 h-5 text-[#f95959]" />
            <span className="text-[10px] font-bold hidden sm:inline">APP</span>
          </button>
        </div>
      </div>

      {/* 2. Top Banner Slider (iPhone 17 Pro Max Lucky Spin) */}
      <div className="l7-banner-container">
        <div
          onClick={onOpenLuckyWheel}
          className="relative cursor-pointer group overflow-hidden rounded-xl"
        >
          <img
            src="/assets/lottery7/banner-iphone.jpg"
            alt="Lucky Spin iPhone 17 Pro"
            className="l7-banner-img group-hover:scale-101 transition-transform duration-300"
          />
          {/* Subtle click me pill */}
          <div className="absolute bottom-2.5 right-3 bg-slate-900/80 backdrop-blur-md text-amber-300 font-casino-num font-black text-[10px] px-2 py-0.5 rounded-full border border-amber-400/40 flex items-center gap-1 shadow-md">
            <Sparkles className="w-3 h-3 text-amber-400 animate-spin" />
            <span>TAP TO SPIN</span>
          </div>
        </div>
      </div>

      {/* 3. Speaker Announcement Marquee Bar */}
      <div className="l7-marquee-bar">
        <Volume2 className="l7-speaker-icon" />
        <div className="l7-marquee-content">
          <span>Apex Arcade Official Guarantee: Instant 24/7 UPI settlements & fair certified gaming. High-multiplier Win Go 1Min & Aviator rounds are live!</span>
        </div>
        <button
          onClick={onOpenNotice}
          className="l7-detail-btn hover:brightness-105 active:scale-95 transition-all"
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
          <button onClick={onOpenWithdraw} className="l7-btn-withdraw active:scale-95 transition-transform">
            Withdraw
          </button>
          <button onClick={onOpenDeposit} className="l7-btn-deposit active:scale-95 transition-transform">
            Deposit
          </button>
        </div>
      </div>

      {/* 5. Category Navigation */}
      <div className="l7-cat-section">
        {/* Top 3 High-Priority Cards */}
        <div className="l7-cat-top-row">
          <div
            onClick={() => onSelectCategory('popular')}
            className={`l7-cat-card-top popular cursor-pointer transition-all ${activeCategory === 'popular' ? 'ring-2 ring-blue-500 shadow-md scale-[1.02]' : 'hover:opacity-90'}`}
          >
            <img src="/assets/lottery7/cat-popular.png" alt="Popular" />
            <span>Popular</span>
          </div>

          <div
            onClick={() => onSelectCategory('lottery')}
            className={`l7-cat-card-top lottery cursor-pointer transition-all ${activeCategory === 'lottery' ? 'ring-2 ring-orange-500 shadow-md scale-[1.02]' : 'hover:opacity-90'}`}
          >
            <img src="/assets/lottery7/cat-lottery.png" alt="Lottery" />
            <span>Lottery</span>
          </div>

          <div
            onClick={() => onSelectCategory('minigames')}
            className={`l7-cat-card-top minigames cursor-pointer transition-all ${activeCategory === 'minigames' ? 'ring-2 ring-purple-500 shadow-md scale-[1.02]' : 'hover:opacity-90'}`}
          >
            <img src="/assets/lottery7/cat-minigames.png" alt="Mini games" />
            <span>Mini games</span>
          </div>
        </div>

        {/* Bottom 5 Icon Tabs */}
        <div className="l7-cat-bottom-row">
          <div
            onClick={() => onSelectCategory('slots')}
            className={`l7-cat-item-bottom cursor-pointer transition-all ${activeCategory === 'slots' ? 'bg-red-50 text-red-500 font-bold border-b-2 border-red-500' : 'hover:bg-slate-50'}`}
          >
            <img src="/assets/lottery7/cat-slots.png" alt="Slots" />
            <span>Slots</span>
          </div>

          <div
            onClick={() => onSelectCategory('fishing')}
            className={`l7-cat-item-bottom cursor-pointer transition-all ${activeCategory === 'fishing' ? 'bg-red-50 text-red-500 font-bold border-b-2 border-red-500' : 'hover:bg-slate-50'}`}
          >
            <img src="/assets/lottery7/cat-fishing.png" alt="Fishing" />
            <span>Fishing</span>
          </div>

          <div
            onClick={() => onSelectCategory('pvc')}
            className={`l7-cat-item-bottom cursor-pointer transition-all ${activeCategory === 'pvc' ? 'bg-red-50 text-red-500 font-bold border-b-2 border-red-500' : 'hover:bg-slate-50'}`}
          >
            <img src="/assets/lottery7/cat-pvc.png" alt="PVC" />
            <span>PVC</span>
          </div>

          <div
            onClick={() => onSelectCategory('sports')}
            className={`l7-cat-item-bottom cursor-pointer transition-all ${activeCategory === 'sports' ? 'bg-red-50 text-red-500 font-bold border-b-2 border-red-500' : 'hover:bg-slate-50'}`}
          >
            <img src="/assets/lottery7/cat-sports.png" alt="Sports" />
            <span>Sports</span>
          </div>

          <div
            onClick={() => onSelectCategory('casino')}
            className={`l7-cat-item-bottom cursor-pointer transition-all ${activeCategory === 'casino' ? 'bg-red-50 text-red-500 font-bold border-b-2 border-red-500' : 'hover:bg-slate-50'}`}
          >
            <img src="/assets/lottery7/cat-casino.png" alt="Casino" />
            <span>Casino</span>
          </div>
        </div>
      </div>
    </div>
  );
};
