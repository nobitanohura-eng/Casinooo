import { db, roundCurrency, LedgerEntry, Account } from '../database/db.ts';

export class WalletService {
  public static async getBalance(accountId: string): Promise<number> {
    const acc = db.getAccount(accountId);
    return acc ? acc.wallet_balance : 0.0;
  }

  public static async getAccount(accountId: string): Promise<Account | null> {
    return db.getAccount(accountId);
  }

  public static async getOrCreateAccount(accountId: string, mobile?: string): Promise<Account> {
    return db.getOrCreateAccount(accountId, mobile);
  }

  /**
   * Deduct bet stake atomically. Checks that amount > 0 and balance >= amount.
   */
  public static async placeBet(params: {
    accountId: string;
    amount: number;
    game: 'WIN_GO' | 'AVIATOR';
    roundId: string;
    betId: string;
    idempotencyKey: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; newBalance: number; error?: string; ledgerEntry?: LedgerEntry }> {
    const { accountId, amount, game, roundId, betId, idempotencyKey, metadata = {} } = params;

    if (amount <= 0) {
      return { success: false, newBalance: 0, error: 'Stake amount must be strictly greater than 0.' };
    }

    const roundedAmount = roundCurrency(amount);

    const mutateResult = await db.mutateWallet({
      accountId,
      amountDelta: -roundedAmount,
      type: 'BET',
      referenceId: betId,
      idempotencyKey,
      metadata: {
        game,
        roundId,
        betId,
        stake: roundedAmount,
        ...metadata,
      },
    });

    if (mutateResult.success) {
      // 1.5% Dynamic Gullak (Piggy Bank) contribution
      const gullakShare = roundCurrency(roundedAmount * 0.015);
      if (gullakShare > 0) {
        db.addGullakContribution(accountId, gullakShare);
      }
      // 3-Level downline referral commission distribution
      db.processAffiliateCommissions(accountId, roundedAmount, game, betId);
    }

    return mutateResult;
  }

  /**
   * Credit winning payout atomically.
   */
  public static async creditWin(params: {
    accountId: string;
    payoutAmount: number;
    game: 'WIN_GO' | 'AVIATOR';
    roundId: string;
    betId: string;
    idempotencyKey: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; newBalance: number; error?: string; ledgerEntry?: LedgerEntry }> {
    const { accountId, payoutAmount, game, roundId, betId, idempotencyKey, metadata = {} } = params;

    if (payoutAmount <= 0) {
      return { success: false, newBalance: 0, error: 'Payout amount must be positive.' };
    }

    const roundedPayout = roundCurrency(payoutAmount);

    return db.mutateWallet({
      accountId,
      amountDelta: roundedPayout,
      type: 'WIN',
      referenceId: betId,
      idempotencyKey,
      metadata: {
        game,
        roundId,
        betId,
        payout: roundedPayout,
        ...metadata,
      },
    });
  }

  /**
   * Refund an accepted bet (e.g. cancelled round or network abort before resolution).
   */
  public static async refundBet(params: {
    accountId: string;
    amount: number;
    game: 'WIN_GO' | 'AVIATOR';
    roundId: string;
    betId: string;
    idempotencyKey: string;
    reason: string;
  }): Promise<{ success: boolean; newBalance: number; error?: string; ledgerEntry?: LedgerEntry }> {
    const { accountId, amount, game, roundId, betId, idempotencyKey, reason } = params;
    const roundedAmount = roundCurrency(amount);

    return db.mutateWallet({
      accountId,
      amountDelta: roundedAmount,
      type: 'REFUND',
      referenceId: betId,
      idempotencyKey,
      metadata: {
        game,
        roundId,
        betId,
        refundAmount: roundedAmount,
        reason,
      },
    });
  }

  /**
   * Top-up virtual credits for demo play (no real monetary value).
   */
  public static async topupDemoCredits(params: {
    accountId: string;
    amount: number;
    idempotencyKey: string;
  }): Promise<{ success: boolean; newBalance: number; error?: string; ledgerEntry?: LedgerEntry }> {
    const { accountId, amount, idempotencyKey } = params;
    if (amount <= 0 || amount > 10000) {
      return { success: false, newBalance: 0, error: 'Top-up amount must be between 1 and 10,000 virtual credits.' };
    }

    const roundedAmount = roundCurrency(amount);

    return db.mutateWallet({
      accountId,
      amountDelta: roundedAmount,
      type: 'TOPUP',
      referenceId: 'DAILY_REWARD',
      idempotencyKey,
      metadata: {
        grantType: 'DAILY_REWARD',
        note: 'Authorized virtual credits for arcade simulation.',
      },
    });
  }

  public static getLedger(accountId: string, limit = 50): LedgerEntry[] {
    return db.getLedger(accountId, limit);
  }
}
