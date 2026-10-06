import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, Coins, ShieldCheck, Zap, AlertCircle, CheckCircle } from 'lucide-react';
import { LedgerEntry, LedgerType } from '../../lib/types.ts';
import { TopUpModal } from './TopUpModal.tsx';
import { WithdrawModal } from './WithdrawModal.tsx';
import { formatINR } from '../../lib/formatters.ts';
import { useTranslation } from '../../lib/i18n.ts';

interface WalletViewProps {
  balance: number;
  ledger: LedgerEntry[];
  accountId: string;
  totalDeposited?: number;
  totalWagered?: number;
  onTopUp: (amount: number) => Promise<{ success: boolean; error?: string }>;
  onRefreshData?: () => void;
}

export const WalletView: React.FC<WalletViewProps> = ({
  balance,
  ledger,
  accountId,
  totalDeposited = 1000,
  totalWagered = 0,
  onTopUp,
  onRefreshData,
}) => {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isTopUpOpen, setIsTopUpOpen] = useState<boolean>(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState<boolean>(false);

  const filteredLedger = ledger.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  const isTurnoverSatisfied = totalWagered >= totalDeposited;
  const turnoverRemaining = Math.max(0, totalDeposited - totalWagered);

  const getLedgerBadge = (type: LedgerType) => {
    switch (type) {
      case 'TOPUP':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60';
      case 'WIN':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
      case 'BET':
        return 'bg-slate-800 text-slate-300 border-slate-700/60';
      case 'REFUND':
        return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const formatLedgerTag = (ref: string) => {
    if (ref === 'SYSTEM_SIGNUP_GRANT' || ref.includes('SIGNUP')) return 'WELCOME_BONUS';
    if (ref === 'DEMO_FAUCET_GRANT' || ref.includes('FAUCET')) return 'DAILY_REWARD';
    return ref;
  };

  return (
    <div className="space-y-3.5 px-3 pb-24">
      {/* 1. Luxury Matte-Charcoal Titanium Card (#111622) with Fine Brushed-Gold Typography */}
      <div className="bg-[#111622] border border-amber-500/25 rounded-xl p-4.5 shadow-2xl relative overflow-hidden">
        {/* Subtle Ambient Sheen */}
        <div className="absolute -top-16 -right-16 w-44 h-44 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider font-casino-num text-amber-300">
              VIP Master Wallet
            </span>
          </div>
          <span className="text-[10px] bg-slate-900 text-amber-300/90 border border-amber-500/30 px-2 py-0.5 rounded-full font-casino-num font-bold">
            INR PLAY ACCOUNT
          </span>
        </div>

        {/* Balance Display with Brushed-Gold Metallic Sheen */}
        <div className="my-2.5">
          <span className="metallic-gold-text font-casino-num font-black text-3xl sm:text-4xl tracking-tight block drop-shadow-md">
            {formatINR(balance)}
          </span>
          <span className="text-xs text-slate-400 font-casino-num font-semibold block mt-0.5">
            Available Balance
          </span>
        </div>

        {/* Glowing Badge on Wallet Card: ⚡ 24/7 Instant UPI Settlement */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-casino-num font-bold shadow-[0_0_12px_rgba(245,158,11,0.12)] mb-3">
          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0 animate-pulse" />
          <span>⚡ 24/7 Instant UPI Settlement (GPay • PhonePe • Paytm)</span>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mt-2">
          <button
            onClick={() => setIsTopUpOpen(true)}
            className="h-11 rounded-lg bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-slate-950 font-casino-num font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-98 transition-transform border-t border-white/40"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Recharge UPI</span>
          </button>

          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="h-11 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-amber-300 font-casino-num font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors border border-amber-500/30 hover:border-amber-400 active:scale-98"
          >
            <ArrowUpRight className="w-4 h-4 text-amber-400 stroke-[2.5]" />
            <span>Withdraw UPI</span>
          </button>
        </div>
      </div>

      {/* 2. Micro Trust Badges Row */}
      <div className="grid grid-cols-2 gap-2 text-[10px] font-casino-num">
        <div className="bg-[#0b101c] border border-slate-700/60 rounded-lg p-2.5 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-300 font-medium">Instant UPI Auto Settlement</span>
        </div>
        <div className="bg-[#0b101c] border border-slate-700/60 rounded-lg p-2.5 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-300 font-medium">Provably Fair SHA-256 RNG</span>
        </div>
      </div>

      {/* 3. 1X Turnover Requirement Status */}
      <div className="bg-[#0b101c] border border-slate-700/60 rounded-lg p-3 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-bold uppercase text-[10px] font-casino-num">
          1X Turnover Status:
        </span>
        {isTurnoverSatisfied ? (
          <span className="text-emerald-400 font-black text-xs flex items-center gap-1 font-casino-num">
            <CheckCircle className="w-3.5 h-3.5" />
            Turnover Completed
          </span>
        ) : (
          <span className="text-amber-300 font-black text-xs flex items-center gap-1 font-casino-num">
            <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
            {t('turnoverRemaining')}: {formatINR(turnoverRemaining)}
          </span>
        )}
      </div>

      {/* 4. Ledger Transaction History */}
      <div className="bg-[#0b101c] border border-slate-700/60 rounded-lg p-3.5 shadow-md">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-casino-num font-black text-white text-xs uppercase tracking-wider">
            Transaction Ledger
          </h4>
          <span className="text-[11px] text-amber-400 font-casino-num font-bold">
            {filteredLedger.length} Records
          </span>
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
          {['ALL', 'TOPUP', 'BET', 'WIN', 'REFUND'].map((ft) => (
            <button
              key={ft}
              onClick={() => setFilterType(ft)}
              className={`px-3 py-1 rounded-md text-xs font-casino-num font-bold transition-all whitespace-nowrap border ${
                filterType === ft
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {ft}
            </button>
          ))}
        </div>

        {/* Ledger List */}
        {filteredLedger.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-xs font-casino-num">
            No transaction records found for this filter.
          </div>
        ) : (
          <div className="space-y-2">
            {filteredLedger.map((item) => {
              const isPositive = item.amount > 0;
              return (
                <div
                  key={item.id}
                  className="p-3 rounded-lg bg-[#070b14] border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-8 h-8 rounded-md flex items-center justify-center ${
                        isPositive
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isPositive ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-casino-num font-bold border ${getLedgerBadge(
                            item.type
                          )}`}
                        >
                          {item.type}
                        </span>
                        <span className="text-[11px] text-slate-300 font-casino-num font-semibold">
                          {formatLedgerTag(item.reference_id)}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 font-casino-num">
                        {new Date(item.created_at).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-casino-num font-black text-sm ${
                        isPositive ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {isPositive
                        ? `+${formatINR(item.amount)}`
                        : `-${formatINR(Math.abs(item.amount))}`}
                    </div>
                    <div className="text-[10px] text-amber-400/80 font-casino-num mt-0.5">
                      Bal: {formatINR(item.closing_balance)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <TopUpModal
        isOpen={isTopUpOpen}
        onClose={() => setIsTopUpOpen(false)}
        accountId={accountId}
        onTopUp={onTopUp}
        onRefreshData={onRefreshData}
      />
      <WithdrawModal
        isOpen={isWithdrawOpen}
        onClose={() => setIsWithdrawOpen(false)}
        walletBalance={balance}
        accountId={accountId}
        totalDeposited={totalDeposited}
        totalWagered={totalWagered}
        onRefreshData={onRefreshData || (() => {})}
      />
    </div>
  );
};
