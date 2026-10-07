import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Plus, Coins, ShieldCheck, Zap, AlertCircle, CheckCircle, RotateCw } from 'lucide-react';
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
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshData) onRefreshData();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const filteredLedger = ledger.filter((item) => {
    if (filterType === 'ALL') return true;
    return item.type === filterType;
  });

  const isTurnoverSatisfied = totalWagered >= totalDeposited;
  const turnoverRemaining = Math.max(0, totalDeposited - totalWagered);
  const turnoverPercent = totalDeposited > 0 ? Math.min(100, Math.round((totalWagered / totalDeposited) * 100)) : 100;

  const getLedgerBadge = (type: LedgerType) => {
    switch (type) {
      case 'TOPUP':
        return 'bg-emerald-50 text-emerald-600 border-emerald-200';
      case 'WIN':
        return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'BET':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'REFUND':
        return 'bg-blue-50 text-blue-600 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatLedgerTag = (ref: string) => {
    if (ref === 'SYSTEM_SIGNUP_GRANT' || ref.includes('SIGNUP')) return 'WELCOME_BONUS';
    if (ref === 'DEMO_FAUCET_GRANT' || ref.includes('FAUCET')) return 'DAILY_REWARD';
    return ref;
  };

  return (
    <div className="space-y-3 px-3 pt-3 pb-24 text-slate-800 select-none">
      {/* 1. Main Wallet Balance Card (Matching Home Balance Style) */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] text-[#768096] font-medium flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            Main Wallet Balance
          </span>
          <button
            onClick={handleRefresh}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            title="Refresh Balance"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="my-2">
          <span className="text-3xl font-black text-slate-900 font-casino-num tracking-tight block">
            {formatINR(balance)}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
            ✓ INR 1:1 Instant Virtual Credit Vault
          </span>
        </div>

        {/* Action Buttons: Withdraw & Deposit */}
        <div className="grid grid-cols-2 gap-2.5 mt-3">
          <button
            onClick={() => setIsWithdrawOpen(true)}
            className="h-10 rounded-xl border border-[#ffbe3f] bg-white hover:bg-amber-50 text-[#fa8c16] font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition-all shadow-xs"
          >
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            <span>Withdraw</span>
          </button>

          <button
            onClick={() => setIsTopUpOpen(true)}
            className="h-10 rounded-xl bg-gradient-to-r from-[#f95959] to-[#ff7979] hover:brightness-105 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-98 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Deposit</span>
          </button>
        </div>
      </div>

      {/* 2. 1X Anti-Money Laundering Turnover Compliance Card */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            1X Wagering Turnover Tracker
          </span>
          {isTurnoverSatisfied ? (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Turnover Completed
            </span>
          ) : (
            <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              ₹{turnoverRemaining.toFixed(2)} Remaining
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isTurnoverSatisfied
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                : 'bg-gradient-to-r from-amber-400 to-amber-500'
            }`}
            style={{ width: `${turnoverPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#768096] font-mono">
          <span>Wagered: {formatINR(totalWagered)}</span>
          <span>Required: {formatINR(totalDeposited)}</span>
        </div>
      </div>

      {/* 3. Fast Banking Features Supported */}
      <div className="bg-white rounded-2xl p-3 shadow-sm border border-slate-100 flex items-center justify-between text-[11px] text-[#768096]">
        <div className="flex items-center gap-1.5 text-slate-700 font-bold">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Instant UPI Channels</span>
        </div>
        <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500">
          <span className="bg-slate-100 px-1.5 py-0.5 rounded">GPay</span>
          <span className="bg-slate-100 px-1.5 py-0.5 rounded">PhonePe</span>
          <span className="bg-slate-100 px-1.5 py-0.5 rounded">Paytm</span>
          <span className="bg-slate-100 px-1.5 py-0.5 rounded">UPI QR</span>
        </div>
      </div>

      {/* 4. Financial Transaction Ledger */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Ledger Header & Filter Pills */}
        <div className="p-3.5 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-800">
              Transaction History
            </span>
            <span className="text-[10px] text-[#768096]">
              {filteredLedger.length} Records
            </span>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {['ALL', 'TOPUP', 'BET', 'WIN'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all shrink-0 ${
                  filterType === type
                    ? 'bg-[#f95959] text-white shadow-xs'
                    : 'bg-slate-100 text-[#768096] hover:bg-slate-200'
                }`}
              >
                {type === 'ALL' ? 'All' : type === 'TOPUP' ? 'Deposit' : type === 'BET' ? 'Bets' : 'Wins'}
              </button>
            ))}
          </div>
        </div>

        {/* Ledger Items List */}
        <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
          {filteredLedger.length === 0 ? (
            <div className="p-6 text-center text-xs text-[#768096]">
              No transactions recorded yet in this category.
            </div>
          ) : (
            filteredLedger.map((item) => (
              <div key={item.id} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center border ${getLedgerBadge(item.type)}`}>
                    {item.amount > 0 ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-slate-800 block text-[11px]">
                      {item.type === 'TOPUP' ? 'UPI Deposit' : item.type === 'WIN' ? 'Game Win' : item.type === 'BET' ? 'Game Bet' : 'Transaction'}
                    </span>
                    <span className="text-[9px] text-[#768096] font-mono block">
                      {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {formatLedgerTag(item.reference_id)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`font-mono font-black text-xs block ${item.amount > 0 ? 'text-emerald-600' : 'text-slate-800'}`}>
                    {item.amount > 0 ? `+${formatINR(item.amount)}` : formatINR(item.amount)}
                  </span>
                  <span className="text-[9px] text-[#768096] font-mono block">
                    Bal: {formatINR(item.closing_balance)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Internal Modals */}
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
