import React, { useState } from 'react';
import { AviatorRoundStatus, AviatorBet } from '../../lib/types.ts';
import { soundManager } from '../../lib/sound.ts';
import { Plus, Minus, X, AlertCircle } from 'lucide-react';

interface SingleBetControlProps {
  panelIndex: 1 | 2;
  status: AviatorRoundStatus;
  currentMultiplier: number;
  walletBalance: number;
  activeUserBet: AviatorBet | null;
  isSubmitting: boolean;
  onPlaceBet: (stake: number, autoCashout?: number) => void;
  onCashOut: (betId: string) => void;
  canRemove?: boolean;
  onRemovePanel?: () => void;
}

const SingleBetPanel: React.FC<SingleBetControlProps> = ({
  panelIndex,
  status,
  currentMultiplier,
  walletBalance,
  activeUserBet,
  isSubmitting,
  onPlaceBet,
  onCashOut,
  canRemove,
  onRemovePanel,
}) => {
  const [tab, setTab] = useState<'bet' | 'auto'>('bet');
  const [stake, setStake] = useState<number>(100);
  const [isAutoBet, setIsAutoBet] = useState<boolean>(false);
  const [isAutoCashout, setIsAutoCashout] = useState<boolean>(false);
  const [autoCashoutMultiplier, setAutoCashoutMultiplier] = useState<number>(2.0);

  const isFlying = status === 'FLYING';
  const isBetting = status === 'BETTING';

  const hasInFlightBet = activeUserBet && activeUserBet.status === 'IN_FLIGHT';
  const liveCashoutPayout = hasInFlightBet
    ? Math.round(activeUserBet.stake_amount * currentMultiplier * 100) / 100
    : 0;

  const handleMinus = () => {
    soundManager.play('click');
    setStake((prev) => Math.max(10, prev - (prev <= 100 ? 10 : 50)));
  };

  const handlePlus = () => {
    soundManager.play('click');
    setStake((prev) => Math.min(walletBalance || 50000, prev + (prev < 100 ? 10 : 50)));
  };

  const handlePreset = (val: number) => {
    soundManager.play('chip');
    setStake(val);
  };

  const handleBetClick = () => {
    if (hasInFlightBet) {
      soundManager.play('cashout');
      onCashOut(activeUserBet.id);
    } else {
      soundManager.play('bet');
      onPlaceBet(stake, isAutoCashout ? autoCashoutMultiplier : undefined);
    }
  };

  return (
    <div className="spribe-bet-panel-card">
      {/* Top Header: Bet/Auto Tabs & Optional Remove/Add Button */}
      <div className="spribe-bet-panel-header">
        <div className="spribe-panel-tab-pill">
          <button
            onClick={() => setTab('bet')}
            className={`spribe-panel-tab-btn ${tab === 'bet' ? 'active' : ''}`}
          >
            Bet
          </button>
          <button
            onClick={() => setTab('auto')}
            className={`spribe-panel-tab-btn ${tab === 'auto' ? 'active' : ''}`}
          >
            Auto
          </button>
        </div>

        {canRemove && onRemovePanel && (
          <button
            onClick={onRemovePanel}
            className="spribe-second-panel-toggle"
            title="Remove second bet panel"
            aria-label="Remove second bet panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Main Controls Body: Spinner + Presets on Left, Big Action Button on Right */}
      <div className="spribe-panel-body">
        {/* Left Column */}
        <div className="flex flex-col gap-1.5">
          {/* Stepper Spinner */}
          <div className="spribe-spinner">
            <button
              onClick={handleMinus}
              disabled={Boolean(isFlying && hasInFlightBet)}
              className="spribe-spinner-btn"
              aria-label="Decrease stake"
            >
              <Minus className="w-3 h-3 stroke-[3]" />
            </button>

            <input
              type="number"
              min={10}
              max={50000}
              value={stake}
              disabled={Boolean(isFlying && hasInFlightBet)}
              onChange={(e) => setStake(Math.max(10, Number(e.target.value)))}
              className="spribe-spinner-input"
            />

            <button
              onClick={handlePlus}
              disabled={Boolean(isFlying && hasInFlightBet)}
              className="spribe-spinner-btn"
              aria-label="Increase stake"
            >
              <Plus className="w-3 h-3 stroke-[3]" />
            </button>
          </div>

          {/* Quick Presets: 100, 200, 500, 1,000 */}
          <div className="spribe-presets-row">
            {[100, 200, 500, 1000].map((val) => (
              <button
                key={val}
                onClick={() => handlePreset(val)}
                disabled={Boolean(isFlying && hasInFlightBet)}
                className={`spribe-preset-chip ${stake === val ? 'active' : ''}`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Massive Action Button */}
        <div>
          {hasInFlightBet ? (
            <button
              onClick={handleBetClick}
              disabled={isSubmitting}
              className="spribe-action-btn cashout-state"
            >
              <span className="spribe-btn-main-label">CASH OUT</span>
              <span className="spribe-btn-sub-label">
                {liveCashoutPayout.toFixed(2)} INR
              </span>
            </button>
          ) : isBetting ? (
            <button
              onClick={handleBetClick}
              disabled={isSubmitting || walletBalance < stake}
              className="spribe-action-btn bet-state"
            >
              <span className="spribe-btn-main-label">
                {isSubmitting ? 'PLACING...' : 'BET'}
              </span>
              <span className="spribe-btn-sub-label">
                {stake.toFixed(2)} INR
              </span>
            </button>
          ) : (
            <button disabled className="spribe-action-btn waiting-state">
              <span className="spribe-btn-main-label">WAITING</span>
              <span className="spribe-btn-sub-label text-[11px]">
                {status === 'FLYING' ? 'Flight in progress' : 'Next round'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Auto Settings Drawer if Auto Tab is Selected */}
      {tab === 'auto' && (
        <div className="spribe-auto-row">
          {/* Auto Bet Toggle */}
          <div className="spribe-toggle-group">
            <span className="spribe-toggle-label">Auto Bet</span>
            <div
              className={`spribe-switch ${isAutoBet ? 'active' : ''}`}
              onClick={() => setIsAutoBet((prev) => !prev)}
            >
              <div className="spribe-switch-thumb" />
            </div>
          </div>

          {/* Auto Cash Out Toggle + Target Multiplier */}
          <div className="spribe-toggle-group">
            <span className="spribe-toggle-label">Auto Cash Out</span>
            <div
              className={`spribe-switch ${isAutoCashout ? 'active' : ''}`}
              onClick={() => setIsAutoCashout((prev) => !prev)}
            >
              <div className="spribe-switch-thumb" />
            </div>

            {isAutoCashout && (
              <div className="flex items-center gap-1 bg-[#141516] border border-[#2a2b2e] rounded-md px-1.5 py-0.5 ml-1">
                <input
                  type="number"
                  step="0.1"
                  min="1.1"
                  max="100"
                  value={autoCashoutMultiplier}
                  onChange={(e) => setAutoCashoutMultiplier(Math.max(1.1, Number(e.target.value)))}
                  className="w-10 bg-transparent text-center font-bold text-xs text-white outline-none"
                />
                <span className="text-[10px] text-slate-400 font-bold">X</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

interface SpribeBetControlsProps {
  status: AviatorRoundStatus;
  currentMultiplier: number;
  walletBalance: number;
  activeUserBet: AviatorBet | null;
  isSubmitting: boolean;
  errorMessage: string | null;
  onPlaceBet: (stake: number, autoCashout?: number) => void;
  onCashOut: (betId: string) => void;
}

export const SpribeBetControls: React.FC<SpribeBetControlsProps> = ({
  status,
  currentMultiplier,
  walletBalance,
  activeUserBet,
  isSubmitting,
  errorMessage,
  onPlaceBet,
  onCashOut,
}) => {
  const [showSecondPanel, setShowSecondPanel] = useState<boolean>(false);

  return (
    <div className="w-full space-y-2">
      {errorMessage && (
        <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2 justify-center">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className={`spribe-bet-controls-wrapper ${showSecondPanel ? 'two-panels' : ''}`}>
        {/* Panel 1 (Always Visible) */}
        <div className="relative">
          <SingleBetPanel
            panelIndex={1}
            status={status}
            currentMultiplier={currentMultiplier}
            walletBalance={walletBalance}
            activeUserBet={activeUserBet}
            isSubmitting={isSubmitting}
            onPlaceBet={onPlaceBet}
            onCashOut={onCashOut}
          />

          {!showSecondPanel && (
            <button
              onClick={() => setShowSecondPanel(true)}
              className="absolute -top-3 right-3 bg-[#252528] hover:bg-[#2c2d30] border border-[#36363c] text-white rounded-full p-1 shadow-md text-[10px] font-bold flex items-center gap-1 z-10 transition-transform active:scale-95"
              title="Add second bet panel"
            >
              <Plus className="w-3 h-3 text-emerald-400 stroke-[3]" />
              <span className="text-[9px] uppercase tracking-wider pr-1">Bet 2</span>
            </button>
          )}
        </div>

        {/* Panel 2 (Conditional Second Bet Panel) */}
        {showSecondPanel && (
          <SingleBetPanel
            panelIndex={2}
            status={status}
            currentMultiplier={currentMultiplier}
            walletBalance={walletBalance}
            activeUserBet={null} // Panel 2 can handle secondary bet in future expansion
            isSubmitting={isSubmitting}
            onPlaceBet={onPlaceBet}
            onCashOut={onCashOut}
            canRemove={true}
            onRemovePanel={() => setShowSecondPanel(false)}
          />
        )}
      </div>
    </div>
  );
};
