import { v4 as uuidv4 } from 'uuid';
import { db, WinGoRoundRecord, WinGoBetRecord, roundCurrency } from '../../database/db.ts';
import { WalletService } from '../../wallet/WalletService.ts';
import { ParityEngine } from './ParityEngine.ts';
import { PayoutEngine } from './PayoutEngine.ts';
import { WinGoBetInput, WinGoStatePayload, WinGoRoundOutcome, WinGoColor, WinGoSize } from './types.ts';

export class WinGoRoundManager {
  private currentRound: WinGoRoundRecord | null = null;
  private currentOutcome: WinGoRoundOutcome | null = null;
  private timer: NodeJS.Timeout | null = null;
  private cycleSecondsTotal = 60;
  private lockDurationSeconds = 10;
  private roundStartTimestamp: number = 0;
  private broadcastCallback?: (event: string, data: any, targetUser?: string) => void;

  // Pillar 1: Operator War Room Overrides
  private forcedNextNumber: number | null = null;
  private mode: 'MANUAL' | 'AUTO_RISK_MIN' = 'MANUAL';

  constructor() {
    this.startNewRound();
    this.startClock();
  }

  public setBroadcaster(callback: (event: string, data: any, targetUser?: string) => void) {
    this.broadcastCallback = callback;
  }

  private broadcast(event: string, data: any, targetUser?: string) {
    if (this.broadcastCallback) {
      this.broadcastCallback(event, data, targetUser);
    }
  }

  public setForcedNumber(num: number | null) {
    this.forcedNextNumber = num;
  }

  public getForcedNumber(): number | null {
    return this.forcedNextNumber;
  }

  public setMode(mode: 'MANUAL' | 'AUTO_RISK_MIN') {
    this.mode = mode;
  }

  public getMode(): 'MANUAL' | 'AUTO_RISK_MIN' {
    return this.mode;
  }

  private generatePeriodNumber(): number {
    const now = new Date();
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(now.getUTCDate()).padStart(2, '0');
    const totalMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    return parseInt(`${yyyy}${mm}${dd}${String(totalMinutes).padStart(4, '0')}`, 10);
  }

  private startNewRound() {
    const nowMs = Date.now();
    this.roundStartTimestamp = nowMs;
    const periodNumber = this.generatePeriodNumber();
    const roundId = `wg_${periodNumber}_${Math.floor(Math.random() * 1000)}`;

    const round: WinGoRoundRecord = {
      id: roundId,
      period_number: periodNumber,
      status: 'OPEN',
      result_number: null,
      result_color: null,
      result_size: null,
      started_at: new Date(nowMs).toISOString(),
      locked_at: new Date(nowMs + (this.cycleSecondsTotal - this.lockDurationSeconds) * 1000).toISOString(),
      settled_at: null,
      total_bets_count: 0,
      total_bets_amount: 0,
      total_payout_amount: 0,
      created_at: new Date(nowMs).toISOString(),
    };

    this.currentRound = round;
    this.currentOutcome = null;
    db.saveWinGoRound(round);

    this.broadcast('wingo:round:open', this.getState());
  }

  private startClock() {
    if (this.timer) clearInterval(this.timer);

    this.timer = setInterval(() => {
      if (!this.currentRound) return;

      const elapsedMs = Date.now() - this.roundStartTimestamp;
      const elapsedSeconds = Math.floor(elapsedMs / 1000);
      const remainingSeconds = Math.max(0, this.cycleSecondsTotal - elapsedSeconds);

      // Check transition to LOCKED
      if (remainingSeconds <= this.lockDurationSeconds && this.currentRound.status === 'OPEN') {
        this.currentRound.status = 'LOCKED';
        db.saveWinGoRound(this.currentRound);
        this.broadcast('wingo:round:locked', {
          roundId: this.currentRound.id,
          periodNumber: this.currentRound.period_number,
          remainingSeconds,
        });
      }

      // Check settlement boundary (at cycle end)
      if (remainingSeconds <= 0 && this.currentRound.status === 'LOCKED') {
        this.settleCurrentRound();
        this.startNewRound();
      } else {
        // Broadcast tick every second
        this.broadcast('wingo:tick', {
          roundId: this.currentRound.id,
          periodNumber: this.currentRound.period_number,
          status: this.currentRound.status,
          remainingSeconds,
          serverTime: Date.now(),
        });
      }
    }, 1000);
  }

  /**
   * Real-time breakdown showing live active stakes pooled on every color, number (0-9), and Big/Small.
   */
  public getLiveStakesBreakdown() {
    if (!this.currentRound) {
      return {
        roundId: '',
        periodNumber: 0,
        status: 'OPEN',
        remainingSeconds: 0,
        colors: { RED: 0, GREEN: 0, VIOLET: 0 },
        numbers: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        sizes: { SMALL: 0, BIG: 0 },
        totalPool: 0,
        liabilities: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        forcedNextNumber: this.forcedNextNumber,
        mode: this.mode,
      };
    }

    const bets = db.getWinGoBetsForRound(this.currentRound.id);
    const colors = { RED: 0, GREEN: 0, VIOLET: 0 };
    const numbers = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const sizes = { SMALL: 0, BIG: 0 };
    let totalPool = 0;

    for (const bet of bets) {
      totalPool += bet.stake_amount;
      if (bet.selection_type === 'COLOR') {
        if (bet.selection_value === 'RED') colors.RED += bet.stake_amount;
        if (bet.selection_value === 'GREEN') colors.GREEN += bet.stake_amount;
        if (bet.selection_value === 'VIOLET') colors.VIOLET += bet.stake_amount;
      } else if (bet.selection_type === 'NUMBER') {
        const n = parseInt(bet.selection_value, 10);
        if (n >= 0 && n <= 9) numbers[n] += bet.stake_amount;
      } else if (bet.selection_type === 'SIZE') {
        if (bet.selection_value === 'SMALL') sizes.SMALL += bet.stake_amount;
        if (bet.selection_value === 'BIG') sizes.BIG += bet.stake_amount;
      }
    }

    // Calculate platform payout liability for each candidate number 0-9
    const liabilities: number[] = [];
    for (let candidate = 0; candidate <= 9; candidate++) {
      const outcome = ParityEngine.evaluateOutcome(candidate);
      let candidatePayout = 0;
      for (const bet of bets) {
        const ev = PayoutEngine.evaluateBet(
          bet.selection_type,
          bet.selection_value as any,
          bet.stake_amount,
          outcome
        );
        if (ev.isWon) candidatePayout += ev.payoutAmount;
      }
      liabilities.push(roundCurrency(candidatePayout));
    }

    const elapsedMs = Date.now() - this.roundStartTimestamp;
    const remainingSeconds = Math.max(0, this.cycleSecondsTotal - Math.floor(elapsedMs / 1000));

    return {
      roundId: this.currentRound.id,
      periodNumber: this.currentRound.period_number,
      status: this.currentRound.status,
      remainingSeconds,
      colors: {
        RED: roundCurrency(colors.RED),
        GREEN: roundCurrency(colors.GREEN),
        VIOLET: roundCurrency(colors.VIOLET),
      },
      numbers: numbers.map((n) => roundCurrency(n)),
      sizes: {
        SMALL: roundCurrency(sizes.SMALL),
        BIG: roundCurrency(sizes.BIG),
      },
      totalPool: roundCurrency(totalPool),
      liabilities,
      forcedNextNumber: this.forcedNextNumber,
      mode: this.mode,
    };
  }

  private async settleCurrentRound() {
    if (!this.currentRound) return;

    const round = this.currentRound;
    round.status = 'SETTLED';

    const bets = db.getWinGoBetsForRound(round.id);

    // Outcome selection strategy:
    // 1. Force Result (1-click operator override)
    // 2. Auto Risk Minimization Mode (picks outcome yielding lowest platform payout liability)
    // 3. Normal / Provably Uniform RNG
    let outcomeNumber: number;

    if (this.forcedNextNumber !== null && this.forcedNextNumber >= 0 && this.forcedNextNumber <= 9) {
      outcomeNumber = this.forcedNextNumber;
      this.forcedNextNumber = null; // Reset after one-time override
    } else if (this.mode === 'AUTO_RISK_MIN' && bets.length > 0) {
      // Pick number with lowest platform payout liability
      let minLiability = Infinity;
      const bestCandidates: number[] = [];

      for (let cand = 0; cand <= 9; cand++) {
        const candOutcome = ParityEngine.evaluateOutcome(cand);
        let candLiability = 0;
        for (const bet of bets) {
          const ev = PayoutEngine.evaluateBet(
            bet.selection_type,
            bet.selection_value as any,
            bet.stake_amount,
            candOutcome
          );
          if (ev.isWon) candLiability += ev.payoutAmount;
        }

        if (candLiability < minLiability) {
          minLiability = candLiability;
          bestCandidates.length = 0;
          bestCandidates.push(cand);
        } else if (candLiability === minLiability) {
          bestCandidates.push(cand);
        }
      }

      outcomeNumber = bestCandidates[Math.floor(Math.random() * bestCandidates.length)];
    } else {
      outcomeNumber = ParityEngine.generateUniformOutcome();
    }

    const outcome = ParityEngine.evaluateOutcome(outcomeNumber);
    this.currentOutcome = outcome;

    round.result_number = outcome.number;
    round.result_color = outcome.colorDisplay;
    round.result_size = outcome.size;
    round.settled_at = new Date().toISOString();

    let totalBetsAmount = 0;
    let totalPayoutAmount = 0;

    for (const bet of bets) {
      totalBetsAmount += bet.stake_amount;
      const evalResult = PayoutEngine.evaluateBet(
        bet.selection_type,
        bet.selection_value as any,
        bet.stake_amount,
        outcome
      );

      if (evalResult.isWon) {
        bet.status = 'WON';
        bet.multiplier = evalResult.multiplier;
        bet.payout_amount = evalResult.payoutAmount;
        totalPayoutAmount += evalResult.payoutAmount;

        // Atomically credit winnings to account
        const winResult = await WalletService.creditWin({
          accountId: bet.account_id,
          payoutAmount: evalResult.payoutAmount,
          game: 'WIN_GO',
          roundId: round.id,
          betId: bet.id,
          idempotencyKey: `win_${bet.id}`,
          metadata: {
            roundPeriod: round.period_number,
            selection: bet.selection_value,
            outcomeNumber: outcome.number,
            multiplier: evalResult.multiplier,
          },
        });

        // Notify user privately of their win and updated balance
        this.broadcast(
          'wallet:updated',
          {
            accountId: bet.account_id,
            balance: winResult.newBalance,
            change: evalResult.payoutAmount,
            reason: 'WIN_GO_WIN',
          },
          bet.account_id
        );
      } else {
        bet.status = 'LOST';
        bet.multiplier = 0;
        bet.payout_amount = 0;
      }

      db.saveWinGoBet(bet);
    }

    round.total_bets_count = bets.length;
    round.total_bets_amount = roundCurrency(totalBetsAmount);
    round.total_payout_amount = roundCurrency(totalPayoutAmount);
    db.saveWinGoRound(round);

    // Broadcast outcome publicly to all connected clients
    this.broadcast('wingo:round:result', {
      roundId: round.id,
      periodNumber: round.period_number,
      outcome,
      settledAt: round.settled_at,
    });
  }

  public async placeBet(input: WinGoBetInput): Promise<{
    success: boolean;
    bet?: WinGoBetRecord;
    error?: string;
    newBalance?: number;
  }> {
    if (!this.currentRound) {
      return { success: false, error: 'No active game round' };
    }

    if (this.currentRound.status !== 'OPEN') {
      return { success: false, error: 'Betting is locked for this period' };
    }

    const elapsedMs = Date.now() - this.roundStartTimestamp;
    const remainingSeconds = Math.max(0, this.cycleSecondsTotal - Math.floor(elapsedMs / 1000));
    if (remainingSeconds <= this.lockDurationSeconds) {
      return { success: false, error: 'Betting window closed for this period' };
    }

    if (input.stakeAmount <= 0) {
      return { success: false, error: 'Stake must be strictly positive' };
    }

    const betId = 'wgb_' + uuidv4().substring(0, 12);

    const deduction = await WalletService.placeBet({
      accountId: input.accountId,
      amount: input.stakeAmount,
      game: 'WIN_GO',
      roundId: this.currentRound.id,
      betId,
      idempotencyKey: input.idempotencyKey,
      metadata: {
        periodNumber: this.currentRound.period_number,
        selectionType: input.selectionType,
        selectionValue: input.selectionValue,
      },
    });

    if (!deduction.success) {
      return { success: false, error: deduction.error };
    }

    const betRecord: WinGoBetRecord = {
      id: betId,
      account_id: input.accountId,
      round_id: this.currentRound.id,
      selection_type: input.selectionType,
      selection_value: input.selectionValue,
      stake_amount: roundCurrency(input.stakeAmount),
      multiplier: 0,
      payout_amount: 0,
      status: 'PENDING',
      idempotency_key: input.idempotencyKey,
      created_at: new Date().toISOString(),
    };

    db.saveWinGoBet(betRecord);

    return {
      success: true,
      bet: betRecord,
      newBalance: deduction.newBalance,
    };
  }

  public getState(): WinGoStatePayload {
    const elapsedMs = Date.now() - this.roundStartTimestamp;
    const remainingSeconds = Math.max(0, this.cycleSecondsTotal - Math.floor(elapsedMs / 1000));

    return {
      roundId: this.currentRound?.id || '',
      periodNumber: this.currentRound?.period_number || 0,
      status: this.currentRound?.status || 'OPEN',
      remainingSeconds,
      totalCycleSeconds: this.cycleSecondsTotal,
      betLockSeconds: this.lockDurationSeconds,
      serverTime: Date.now(),
      recentResults: db.getRecentWinGoRounds(10).map((r) => ({
        roundId: r.id,
        periodNumber: r.period_number,
        number: r.result_number ?? 0,
        colorDisplay: (r.result_color as WinGoColor) || 'RED',
        size: (r.result_size as WinGoSize) || 'SMALL',
        settledAt: r.settled_at || r.created_at,
      })),
    };
  }
}

export const winGoManager = new WinGoRoundManager();
