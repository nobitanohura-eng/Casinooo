import React from 'react';
import { ChevronLeft, Plus, RotateCw } from 'lucide-react';
import { formatINR } from '../../lib/formatters.ts';

interface TabHeaderProps {
  title: string;
  onBackToHome: () => void;
  balance: number;
  onOpenDeposit: () => void;
  onRefreshBalance?: () => void;
}

export const TabHeader: React.FC<TabHeaderProps> = ({
  title,
  onBackToHome,
  balance,
  onOpenDeposit,
  onRefreshBalance,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full h-12 bg-white border-b border-[#ebedf0] shadow-xs px-3 flex items-center justify-between select-none">
      {/* Left: Back Arrow + Title */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBackToHome}
          className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
          title="Back to Home"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-black text-slate-800 tracking-wide font-casino-num">
          {title}
        </h1>
      </div>

      {/* Right: Balance Pill & Quick Deposit Button */}
      <div className="flex items-center gap-1.5">
        <div className="bg-[#f7f8ff] border border-slate-200 px-2 py-1 rounded-full flex items-center gap-1 text-xs">
          <span className="text-[10px] text-slate-400 font-medium">Bal:</span>
          <span className="font-casino-num font-black text-slate-800 text-xs">
            {formatINR(balance)}
          </span>
          {onRefreshBalance && (
            <RotateCw
              className="w-3 h-3 text-slate-400 cursor-pointer hover:text-slate-600 transition-colors ml-0.5"
              onClick={onRefreshBalance}
            />
          )}
        </div>

        <button
          onClick={onOpenDeposit}
          className="h-7 px-2.5 rounded-full bg-gradient-to-r from-[#f95959] to-[#ff7979] text-white text-[11px] font-bold shadow-xs hover:brightness-105 active:scale-95 transition-all flex items-center gap-1"
        >
          <Plus className="w-3 h-3 stroke-[3]" />
          <span>Deposit</span>
        </button>
      </div>
    </header>
  );
};
