import { v4 as uuidv4 } from 'uuid';
import { db, AviatorRoundRecord, AviatorBetRecord, roundCurrency } from '../../database/db.ts';
import { WalletService } from '../../wallet/WalletService.ts';
import { CrashEngine } from './CrashEngine.ts';
import { TrajectoryEngine } from './TrajectoryEngine.ts';
import { AviatorBetInput, AviatorRoundStatus, AviatorStatePayload } from './types.ts';

export class AviatorRoundManager {
  private currentRound: AviatorRoundRecord | null = null;
  private currentStatus: AviatorRoundStatus = 'BETTING';
  private roundNumberCounter = 1001;

  private flightStartTimestamp: number = 0;
  private bettingCountdownRemaining: number = 5;
  private tickInterval: NodeJS.Timeout | null = null;

  // Pillar 1: Operator War Room Overrides
  private forcedNextCrashMultiplier: number | null = null;
  private mode: 'STATISTICAL' | 'MANUAL' = 'STATISTICAL';

  private broadcastCallback?: (event: string, data: any, targetUser?: string) => void;

  constructor() {
    this.initFirstRound();
  }

  public setBroadcaster(callback: (event: string, data: any, targetUser?: string) => void) {
    this.broadcastCallback = callback;
  }

  private broadcast(event: string, data: any, targetUser?: string) {
    if (this.broadcastCallback) {
      this.broadcastCallback(event, data, targetUser);
    }
  }

  public setForcedCrashMultiplier(mult: number | null) {
    this.forcedNextCrashMultiplier = mult !== null ? Math.max(1.0, roundCurrency(mult)) : null;
    if (this.currentRound && this.currentStatus === 'BETTING' && this.forcedNextCrashMultiplier !== null) {
      this.currentRound.crash_multiplier = this.forcedNextCrashMultiplier;
      db.saveAviatorRound(this.currentRound);
    }
  }

  public getForcedCrashMultiplier(): number | null {
    return this.forcedNextCrashMultiplier;
  }

  public setMode(mode: 'STATISTICAL' | 'MANUAL') {
    this.mode = mode;
  }

  public getMode(): 'STATISTICAL' | 'MANUAL' {
    return this.mode;
  }

  /**
   * Instant 1.00x crash trigger button
   */
  public async triggerInstantCrash(): Promise<{ success: boolean; message: string }> {
    if (!this.currentRound) {
      return { success: false, message: 'No active round' };
    }

    if (this.currentStatus === 'FLYING') {
      if (this.tickInterval) clearInterval(this.tickInterval);
      await this.handleCrash(1.00);
      return { success: true, message: 'In-flight round crashed instantly at 1.00x!' };
    } else if (this.currentStatus === 'BETTING') {
      this.currentRound.crash_multiplier = 1.00;
      this.forcedNextCrashMultiplier = 1.00;
      db.saveAviatorRound(this.currentRound);
      return { success: true, message: 'Current betting round preset to instant 1.00x crash!' };
    }

    return { success: false, message: 'Round is currently in post-crash countdown' };
  }

  private initFirstRound() {
    this.prepareBettingPhase();
  }

  /**
   * Phase 1: 5-second countdown to place bets before takeoff
   */
  private prepareBettingPhase() {
    this.currentStatus = 'BETTING';
    this.roundNumberCounter += 1;
    this.bettingCountdownRemaining = 5;

    const roundId = `av_${this.roundNumberCounter}_${Date.now()}`;

    // Apply forced multiplier if preset by operator
    let crashMultiplier: number;
    if (this.forcedNextCrashMultiplier !== null) {
      crashMultiplier = this.forcedNextCrashMultiplier;
      this.forcedNextCrashMultiplier = null; // Reset after one-time override
    } else {
      crashMultiplier = CrashEngine.generateCrashPoint();
    }

    const round: AviatorRoundRecord = {
      id: roundId,
      round_number: this.roundNumberCounter,
      status: 'COUNTDOWN',
      crash_multiplier: crashMultiplier,
      started_at: new Date().toISOString(),
      crashed_at: null,
      total_bets_count: 0,
      total_bets_amount: 0,
      total_payout_amount: 0,
      created_at: new Date().toISOString(),
    };

    this.currentRound = round;
    db.saveAviatorRound(round);

    this.broadcast('aviator:round:betting', {
      roundId: round.id,
      roundNumber: round.round_number,
      countdown: this.bettingCountdownRemaining,
      serverTime: Date.now(),
    });

    const countdownTimer = setInterval(() => {
      this.bettingCountdownRemaining -= 1;

      if (this.bettingCountdownRemaining > 0) {
        this.broadcast('aviator:countdown:tick', {
          roundId: this.currentRound?.id,
          countdown: this.bettingCountdownRemaining,
        });
      } else {
        clearInterval(countdownTimer);
        this.startFlightPhase();
      }
    }, 1000);
  }

  /**
   * Phase 2: Flight takeoff & 100ms trajectory ticks
   */
  private startFlightPhase() {
    if (!this.currentRound) return;

    // Check for instant 1.00x crash immediately at takeoff
    if (this.currentRound.crash_multiplier <= 1.00) {
      this.currentStatus = 'FLYING';
      this.flightStartTimestamp = Date.now();
      this.handleCrash(1.00);
      return;
    }

    this.currentStatus = 'FLYING';
    this.currentRound.status = 'FLYING';
    this.flightStartTimestamp = Date.now();
    db.saveAviatorRound(this.currentRound);

    this.broadcast('aviator:round:takeoff', {
      roundId: this.currentRound.id,
      roundNumber: this.currentRound.round_number,
      startTimestamp: this.flightStartTimestamp,
    });

    // 100ms real-time loop as specified in PRD
    this.tickInterval = setInterval(() => {
      this.handleFlightTick();
    }, 100);
  }

  private async handleFlightTick() {
    if (!this.currentRound || this.currentStatus !== 'FLYING') {
      if (this.tickInterval) clearInterval(this.tickInterval);
      return;
    }

    const elapsedSeconds = (Date.now() - this.flightStartTimestamp) / 1000;
    const currentMultiplier = TrajectoryEngine.getMultiplierAtTime(elapsedSeconds);

    // Check if flight reached crash threshold
    if (currentMultiplier >= this.currentRound.crash_multiplier) {
      if (this.tickInterval) clearInterval(this.tickInterval);
      await this.handleCrash(this.currentRound.crash_multiplier);
      return;
    }

    // Process auto-cashouts for any in-flight bets whose threshold is reached
    const activeBets = db.getAviatorBetsForRound(this.currentRound.id).filter((b) => b.status === 'IN_FLIGHT');
    for (const bet of activeBets) {
      if (bet.auto_cashout_multiplier && currentMultiplier >= bet.auto_cashout_multiplier) {
        await this.cashOutBet(bet.account_id, bet.id, bet.auto_cashout_multiplier);
      }
    }

    // Stream authoritative 100ms tick to all clients
    this.broadcast('aviator:tick', {
      roundId: this.currentRound.id,
      roundNumber: this.currentRound.round_number,
      multiplier: currentMultiplier,
      elapsedSeconds: roundCurrency(elapsedSeconds),
      serverTime: Date.now(),
    });
  }

  /**
   * Phase 3: Crash settlement
   */
  private async handleCrash(finalCrashMultiplier: number) {
    if (!this.currentRound) return;

    this.currentStatus = 'CRASHED';
    this.currentRound.status = 'CRASHED';
    this.currentRound.crashed_at = new Date().toISOString();

    // Finalize all remaining unresolved bets as lost (CRASHED)
    const inFlightBets = db.getAviatorBetsForRound(this.currentRound.id).filter((b) => b.status === 'IN_FLIGHT');
    for (const bet of inFlightBets) {
      bet.status = 'CRASHED';
      bet.cashout_multiplier = null;
      bet.payout_amount = 0;
      db.saveAviatorBet(bet);
    }

    db.saveAviatorRound(this.currentRound);

    // Broadcast crash event with "Flew Away" as mandated by PRD
    this.broadcast('aviator:crash', {
      roundId: this.currentRound.id,
      roundNumber: this.currentRound.round_number,
      crashMultiplier: finalCrashMultiplier,
      statusText: 'Flew Away',
      crashedAt: this.currentRound.crashed_at,
    });

    // PRD rule: "Keep the crashed result visible for five seconds. Start the next round."
    setTimeout(() => {
      this.prepareBettingPhase();
    }, 5000);
  }

  /**
   * Player bet placement during BETTING phase
   */
  public async placeBet(input: AviatorBetInput): Promise<{
    success: boolean;
    bet?: AviatorBetRecord;
    error?: string;
    newBalance?: number;
  }> {
    if (!this.currentRound) {
      return { success: false, error: 'Round not available.' };
    }

    if (this.currentStatus !== 'BETTING') {
      return {
        success: false,
        error: 'Flight is already in progress or has crashed. Please place bets during the countdown.',
      };
    }

    if (input.stakeAmount < 1) {
      return { success: false, error: 'Minimum stake is 1 virtual credit.' };
    }

    const betId = `avb_${uuidv4().substring(0, 10)}`;

    const deduction = await WalletService.placeBet({
      accountId: input.accountId,
      amount: input.stakeAmount,
      game: 'AVIATOR',
      roundId: this.currentRound.id,
      betId,
      idempotencyKey: input.idempotencyKey,
      metadata: {
        roundNumber: this.currentRound.round_number,
        autoCashout: input.autoCashoutMultiplier,
      },
    });

    if (!deduction.success) {
      return { success: false, error: deduction.error || 'Failed to place bet.' };
    }

    const betRecord: AviatorBetRecord = {
      id: betId,
      account_id: input.accountId,
      round_id: this.currentRound.id,
      stake_amount: roundCurrency(input.stakeAmount),
      auto_cashout_multiplier: input.autoCashoutMultiplier ? roundCurrency(input.autoCashoutMultiplier) : null,
      cashout_multiplier: null,
      payout_amount: 0,
      status: 'IN_FLIGHT',
      cashed_out_at: null,
      idempotency_key: input.idempotencyKey,
      created_at: new Date().toISOString(),
    };

    db.saveAviatorBet(betRecord);

    return {
      success: true,
      bet: betRecord,
      newBalance: deduction.newBalance,
    };
  }

  /**
   * Atomic cash-out calculation and balance credit
   */
  public async cashOutBet(
    accountId: string,
    betId: string,
    requestedMultiplier?: number
  ): Promise<{
    success: boolean;
    multiplier?: number;
    payoutAmount?: number;
    newBalance?: number;
    error?: string;
  }> {
    if (!this.currentRound || this.currentStatus !== 'FLYING') {
      return {
        success: false,
        error: 'Cannot cash out: Flight is not active.',
      };
    }

    const bet = db.getAviatorBet(betId);
    if (!bet) {
      return { success: false, error: 'Bet record not found.' };
    }

    if (bet.account_id !== accountId) {
      return { success: false, error: 'Unauthorized bet ownership.' };
    }

    if (bet.status !== 'IN_FLIGHT') {
      return { success: false, error: `Bet is already resolved (${bet.status}).` };
    }

    const elapsedSeconds = (Date.now() - this.flightStartTimestamp) / 1000;
    const authoritativeCurrentMultiplier = TrajectoryEngine.getMultiplierAtTime(elapsedSeconds);

    let effectiveMultiplier = requestedMultiplier
      ? Math.min(requestedMultiplier, authoritativeCurrentMultiplier)
      : authoritativeCurrentMultiplier;

    // Reject late cash-outs if plane already exceeded crash threshold
    if (authoritativeCurrentMultiplier >= this.currentRound.crash_multiplier) {
      bet.status = 'CRASHED';
      db.saveAviatorBet(bet);
      return { success: false, error: 'Plane crashed before cash-out confirmed!' };
    }

    effectiveMultiplier = roundCurrency(effectiveMultiplier);
    const payoutAmount = roundCurrency(bet.stake_amount * effectiveMultiplier);

    // Atomically credit winnings to account
    const winResult = await WalletService.creditWin({
      accountId: bet.account_id,
      payoutAmount,
      game: 'AVIATOR',
      roundId: this.currentRound.id,
      betId: bet.id,
      idempotencyKey: `av_win_${bet.id}_${effectiveMultiplier}`,
      metadata: {
        roundNumber: this.currentRound.round_number,
        stake: bet.stake_amount,
        cashoutMultiplier: effectiveMultiplier,
      },
    });

    if (!winResult.success) {
      return { success: false, error: winResult.error };
    }

    // Update bet status to WON
    bet.status = 'WON';
    bet.cashout_multiplier = effectiveMultiplier;
    bet.payout_amount = payoutAmount;
    bet.cashed_out_at = new Date().toISOString();
    db.saveAviatorBet(bet);

    // Notify user privately of their win and updated balance
    this.broadcast(
      'wallet:updated',
      {
        accountId: bet.account_id,
        balance: winResult.newBalance,
        change: payoutAmount,
        reason: 'AVIATOR_CASHOUT',
      },
      bet.account_id
    );

    // Broadcast social proof win to other players
    this.broadcast('aviator:bet:cashed_out', {
      roundId: this.currentRound.id,
      roundNumber: this.currentRound.round_number,
      accountId: bet.account_id,
      stake: bet.stake_amount,
      multiplier: effectiveMultiplier,
      payout: payoutAmount,
    });

    return {
      success: true,
      multiplier: effectiveMultiplier,
      payoutAmount,
      newBalance: winResult.newBalance,
    };
  }

  public getLiveOperatorState() {
    const elapsedSeconds = this.flightStartTimestamp ? (Date.now() - this.flightStartTimestamp) / 1000 : 0;
    const currentMultiplier = this.currentStatus === 'FLYING' ? TrajectoryEngine.getMultiplierAtTime(elapsedSeconds) : 1.0;
    const activeBets = this.currentRound ? db.getAviatorBetsForRound(this.currentRound.id) : [];

    return {
      roundId: this.currentRound?.id || '',
      roundNumber: this.currentRound?.round_number || 1001,
      status: this.currentStatus,
      currentMultiplier: roundCurrency(currentMultiplier),
      crashMultiplier: this.currentRound?.crash_multiplier || 1.0,
      forcedNextCrashMultiplier: this.forcedNextCrashMultiplier,
      mode: this.mode,
      activeBetsCount: activeBets.length,
      totalStakes: roundCurrency(activeBets.reduce((acc, b) => acc + b.stake_amount, 0)),
      inFlightCount: activeBets.filter((b) => b.status === 'IN_FLIGHT').length,
    };
  }

  public getState(): AviatorStatePayload {
    const elapsedSeconds = this.flightStartTimestamp ? (Date.now() - this.flightStartTimestamp) / 1000 : 0;
    const currentMultiplier = this.currentStatus === 'FLYING' ? TrajectoryEngine.getMultiplierAtTime(elapsedSeconds) : 1.0;
    const recentRounds = db.getRecentAviatorRounds(15);
    const activeBets = this.currentRound ? db.getAviatorBetsForRound(this.currentRound.id) : [];

    return {
      roundId: this.currentRound?.id || '',
      roundNumber: this.currentRound?.round_number || 1001,
      status: this.currentStatus,
      currentMultiplier: roundCurrency(currentMultiplier),
      elapsedSeconds: roundCurrency(elapsedSeconds),
      bettingCountdownSeconds: this.bettingCountdownRemaining,
      crashMultiplier: this.currentRound?.crash_multiplier || null,
      recentCrashes: recentRounds.map((r) => ({
        roundNumber: r.round_number,
        crashMultiplier: r.crash_multiplier,
        crashedAt: r.crashed_at || r.created_at,
      })),
      activeBetsCount: activeBets.length,
      serverTime: Date.now(),
    };
  }
}

export const aviatorManager = new AviatorRoundManager();
