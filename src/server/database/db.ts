import { v4 as uuidv4 } from 'uuid';

export type LedgerType = 'TOPUP' | 'BET' | 'WIN' | 'WITHDRAW' | 'REFUND' | 'COMMISSION' | 'ATTENDANCE' | 'OPERATOR_ADJUSTMENT';

export interface Account {
  id: string;
  mobile: string;
  wallet_balance: number; // Stored as decimal number with 2 decimals precision
  is_demo: boolean;
  is_banned: boolean; // Freeze / Ban toggle
  total_deposited: number;
  total_wagered: number;
  total_won: number;
  referred_by?: string | null;
  referral_code: string;
  claimable_commission: number;
  total_commission: number;
  attendance_days: number;
  last_attendance_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  account_id: string;
  type: LedgerType;
  amount: number; // Signed or absolute (+ for credit, - for debit)
  closing_balance: number;
  reference_id: string;
  idempotency_key: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface WinGoRoundRecord {
  id: string;
  period_number: number;
  status: 'OPEN' | 'LOCKED' | 'SETTLED';
  result_number: number | null;
  result_color: string | null;
  result_size: string | null;
  started_at: string;
  locked_at: string;
  settled_at: string | null;
  total_bets_count: number;
  total_bets_amount: number;
  total_payout_amount: number;
  created_at: string;
}

export interface WinGoBetRecord {
  id: string;
  account_id: string;
  round_id: string;
  selection_type: 'COLOR' | 'NUMBER' | 'SIZE';
  selection_value: string;
  stake_amount: number;
  multiplier: number;
  payout_amount: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'REFUNDED';
  idempotency_key: string;
  created_at: string;
}

export interface AviatorRoundRecord {
  id: string;
  round_number: number;
  status: 'COUNTDOWN' | 'FLYING' | 'CRASHED';
  crash_multiplier: number;
  started_at: string;
  crashed_at: string | null;
  total_bets_count: number;
  total_bets_amount: number;
  total_payout_amount: number;
  created_at: string;
}

export interface AviatorBetRecord {
  id: string;
  account_id: string;
  round_id: string;
  stake_amount: number;
  auto_cashout_multiplier: number | null;
  cashout_multiplier: number | null;
  payout_amount: number;
  status: 'IN_FLIGHT' | 'WON' | 'CRASHED' | 'REFUNDED';
  cashed_out_at: string | null;
  idempotency_key: string;
  created_at: string;
}

export interface DepositRequest {
  id: string;
  account_id: string;
  amount: number;
  utr_number: string;
  payment_method: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  operator_note?: string;
  created_at: string;
  processed_at?: string | null;
}

export interface WithdrawalRequest {
  id: string;
  account_id: string;
  amount: number;
  upi_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  turnover_at_request: number;
  required_turnover: number;
  operator_note?: string;
  created_at: string;
  processed_at?: string | null;
}

export interface AgencyCommissionRecord {
  id: string;
  inviter_id: string;
  bettor_id: string;
  tier_level: 1 | 2 | 3;
  bet_amount: number;
  commission_rate: number;
  commission_amount: number;
  game: string;
  reference_bet_id: string;
  created_at: string;
}

export interface SystemSettings {
  upi_id: string;
  qr_code_url: string;
  telegram_link: string;
  marquee_broadcast: string;
  wingo_mode: 'MANUAL' | 'AUTO_RISK_MIN';
  wingo_forced_number: number | null;
  aviator_mode: 'STATISTICAL' | 'MANUAL';
  aviator_forced_crash: number | null;
}

export interface OperatorAuditLog {
  id: string;
  operator_ip: string;
  action: string;
  target_id?: string;
  details: Record<string, any>;
  created_at: string;
}

/**
 * Strict 2-decimal rounded financial math utility
 */
export function roundCurrency(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

class DatabaseManager {
  private accounts = new Map<string, Account>();
  private ledger: LedgerEntry[] = [];
  private idempotencyKeys = new Set<string>();

  private winGoRounds = new Map<string, WinGoRoundRecord>();
  private winGoBets = new Map<string, WinGoBetRecord>();

  private aviatorRounds = new Map<string, AviatorRoundRecord>();
  private aviatorBets = new Map<string, AviatorBetRecord>();

  private deposits = new Map<string, DepositRequest>();
  private withdrawals = new Map<string, WithdrawalRequest>();
  private commissions: AgencyCommissionRecord[] = [];
  private auditLogs: OperatorAuditLog[] = [];

  private settings: SystemSettings = {
    upi_id: 'apexarcade.pay@upi',
    qr_code_url: 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=apexarcade.pay@upi&pn=ApexArcade&cu=INR',
    telegram_link: 'https://t.me/apexarcade_vip',
    marquee_broadcast: '🇮🇳 Welcome to Apex Arcade VIP Server. 100% Provably Fair Sandbox Gaming with Instant Settlements.',
    wingo_mode: 'MANUAL',
    wingo_forced_number: null,
    aviator_mode: 'STATISTICAL',
    aviator_forced_crash: null,
  };

  // Mutex lock to serialize wallet transactions and prevent race conditions (SELECT FOR UPDATE semantics)
  private accountLocks = new Map<string, Promise<void>>();

  constructor() {
    this.seedDemoAccount();
    this.seedAffiliateDownline();
  }

  private seedDemoAccount() {
    const demoId = 'acc_demo_pilot_01';
    const now = new Date().toISOString();
    const demoAccount: Account = {
      id: demoId,
      mobile: '+91 98765 43210',
      wallet_balance: 1000.0,
      is_demo: true,
      is_banned: false,
      total_deposited: 1000.0,
      total_wagered: 1250.0,
      total_won: 1100.0,
      referred_by: 'acc_master_agency',
      referral_code: 'APEX777',
      claimable_commission: 84.5,
      total_commission: 320.0,
      attendance_days: 3,
      last_attendance_date: null,
      created_at: now,
      updated_at: now,
    };
    this.accounts.set(demoId, demoAccount);

    // Initial Ledger entry
    const initialLedgerId = 'led_init_' + demoId;
    this.ledger.push({
      id: initialLedgerId,
      account_id: demoId,
      type: 'TOPUP',
      amount: 1000.0,
      closing_balance: 1000.0,
      reference_id: 'WELCOME_BONUS',
      idempotency_key: 'idem_signup_' + demoId,
      metadata: { reason: 'Welcome Virtual Credits' },
      created_at: now,
    });
    this.idempotencyKeys.add('idem_signup_' + demoId);

    // Add a demo pending deposit
    const depId = 'dep_sample_01';
    this.deposits.set(depId, {
      id: depId,
      account_id: demoId,
      amount: 500.0,
      utr_number: '429184019284',
      payment_method: 'GPay UPI',
      status: 'PENDING',
      created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    });

    // Add a demo pending withdrawal
    const wId = 'wth_sample_01';
    this.withdrawals.set(wId, {
      id: wId,
      account_id: demoId,
      amount: 250.0,
      upi_id: 'pilot98@oksbi',
      status: 'PENDING',
      turnover_at_request: 1250.0,
      required_turnover: 1000.0,
      created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    });
  }

  private seedAffiliateDownline() {
    const now = new Date().toISOString();
    // Master Inviter
    this.accounts.set('acc_master_agency', {
      id: 'acc_master_agency',
      mobile: '+91 99000 11223',
      wallet_balance: 5400.0,
      is_demo: true,
      is_banned: false,
      total_deposited: 5000.0,
      total_wagered: 18000.0,
      total_won: 17200.0,
      referred_by: null,
      referral_code: 'APEX_MASTER',
      claimable_commission: 1420.0,
      total_commission: 9800.0,
      attendance_days: 7,
      last_attendance_date: now.split('T')[0],
      created_at: now,
      updated_at: now,
    });

    // Sub player 1 invited by demo
    this.accounts.set('acc_sub_pilot_02', {
      id: 'acc_sub_pilot_02',
      mobile: '+91 91234 56789',
      wallet_balance: 750.0,
      is_demo: true,
      is_banned: false,
      total_deposited: 500.0,
      total_wagered: 3200.0,
      total_won: 2800.0,
      referred_by: 'acc_demo_pilot_01',
      referral_code: 'PILOT02',
      claimable_commission: 15.0,
      total_commission: 15.0,
      attendance_days: 2,
      last_attendance_date: null,
      created_at: now,
      updated_at: now,
    });
  }

  private async acquireAccountLock(accountId: string): Promise<() => void> {
    while (this.accountLocks.has(accountId)) {
      await this.accountLocks.get(accountId);
    }
    let releaseLock: () => void = () => {};
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.accountLocks.set(accountId, lockPromise);

    return () => {
      this.accountLocks.delete(accountId);
      releaseLock();
    };
  }

  // --- ACCOUNTS & WALLET MUTATIONS ---

  public getAccount(accountId: string): Account | null {
    const acc = this.accounts.get(accountId);
    if (!acc) return null;
    return { ...acc };
  }

  public updateAccount(accountId: string, updates: Partial<Account>): Account | null {
    const acc = this.accounts.get(accountId);
    if (!acc) return null;
    Object.assign(acc, updates);
    acc.updated_at = new Date().toISOString();
    return { ...acc };
  }

  public getAllAccounts(): Account[] {
    return Array.from(this.accounts.values()).map((a) => ({ ...a }));
  }

  public getOrCreateAccount(accountId: string, mobile?: string): Account {
    let acc = this.accounts.get(accountId);
    if (!acc) {
      const now = new Date().toISOString();
      const code = 'APEX' + Math.floor(1000 + Math.random() * 9000);
      acc = {
        id: accountId,
        mobile: mobile || `+91 9${Math.floor(100000000 + Math.random() * 900000000)}`,
        wallet_balance: 1000.0,
        is_demo: true,
        is_banned: false,
        total_deposited: 1000.0,
        total_wagered: 0.0,
        total_won: 0.0,
        referred_by: 'acc_demo_pilot_01',
        referral_code: code,
        claimable_commission: 0.0,
        total_commission: 0.0,
        attendance_days: 0,
        last_attendance_date: null,
        created_at: now,
        updated_at: now,
      };
      this.accounts.set(accountId, acc);

      this.recordLedgerEntryDirect({
        account_id: accountId,
        type: 'TOPUP',
        amount: 1000.0,
        closing_balance: 1000.0,
        reference_id: 'WELCOME_BONUS',
        idempotency_key: 'idem_init_' + accountId,
        metadata: { reason: 'Initial Welcome Bonus' },
      });
    }
    return { ...acc };
  }

  public setAccountBanned(accountId: string, banned: boolean, operatorIp: string): { success: boolean; error?: string } {
    const acc = this.accounts.get(accountId);
    if (!acc) return { success: false, error: 'Account not found' };
    acc.is_banned = banned;
    acc.updated_at = new Date().toISOString();
    this.logAudit({
      operator_ip: operatorIp,
      action: banned ? 'BAN_ACCOUNT' : 'UNBAN_ACCOUNT',
      target_id: accountId,
      details: { is_banned: banned },
    });
    return { success: true };
  }

  public hasIdempotencyKey(key: string): boolean {
    return this.idempotencyKeys.has(key);
  }

  /**
   * Atomic wallet modification with concurrency lock and ledger recording (SELECT FOR UPDATE emulation)
   */
  public async mutateWallet(params: {
    accountId: string;
    amountDelta: number; // Negative for BET/WITHDRAW, positive for WIN/TOPUP/REFUND
    type: LedgerType;
    referenceId: string;
    idempotencyKey: string;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; newBalance: number; error?: string; ledgerEntry?: LedgerEntry }> {
    const { accountId, amountDelta, type, referenceId, idempotencyKey, metadata = {} } = params;

    // Check idempotency first
    if (this.idempotencyKeys.has(idempotencyKey)) {
      const existingEntry = this.ledger.find((l) => l.idempotency_key === idempotencyKey);
      const acc = this.accounts.get(accountId);
      return {
        success: true,
        newBalance: acc ? acc.wallet_balance : (existingEntry?.closing_balance ?? 0),
        ledgerEntry: existingEntry,
      };
    }

    const release = await this.acquireAccountLock(accountId);
    try {
      const account = this.accounts.get(accountId);
      if (!account) {
        return { success: false, newBalance: 0, error: 'Account not found' };
      }

      if (account.is_banned && type !== 'REFUND') {
        return { success: false, newBalance: account.wallet_balance, error: 'Account is frozen / banned by operator.' };
      }

      const currentBalance = account.wallet_balance;
      const calculatedNewBalance = roundCurrency(currentBalance + amountDelta);

      if (calculatedNewBalance < 0) {
        return {
          success: false,
          newBalance: currentBalance,
          error: `Insufficient virtual credit balance. Current: ₹${currentBalance.toFixed(2)}, required: ₹${Math.abs(amountDelta).toFixed(2)}`,
        };
      }

      // Update account balance and turnover metrics
      account.wallet_balance = calculatedNewBalance;
      if (type === 'BET') {
        account.total_wagered = roundCurrency(account.total_wagered + Math.abs(amountDelta));
      } else if (type === 'WIN') {
        account.total_won = roundCurrency(account.total_won + amountDelta);
      } else if (type === 'TOPUP') {
        account.total_deposited = roundCurrency(account.total_deposited + amountDelta);
      }
      account.updated_at = new Date().toISOString();

      // Record in ledger
      const entryId = 'led_' + uuidv4().substring(0, 12);
      const ledgerRecord: LedgerEntry = {
        id: entryId,
        account_id: accountId,
        type,
        amount: roundCurrency(amountDelta),
        closing_balance: calculatedNewBalance,
        reference_id: referenceId,
        idempotency_key: idempotencyKey,
        metadata,
        created_at: new Date().toISOString(),
      };

      this.ledger.push(ledgerRecord);
      this.idempotencyKeys.add(idempotencyKey);

      return {
        success: true,
        newBalance: calculatedNewBalance,
        ledgerEntry: ledgerRecord,
      };
    } finally {
      release();
    }
  }

  private recordLedgerEntryDirect(entry: Omit<LedgerEntry, 'id' | 'created_at'>): LedgerEntry {
    const id = 'led_' + uuidv4().substring(0, 12);
    const fullEntry: LedgerEntry = {
      ...entry,
      id,
      created_at: new Date().toISOString(),
    };
    this.ledger.push(fullEntry);
    this.idempotencyKeys.add(entry.idempotency_key);
    return fullEntry;
  }

  public getLedger(accountId: string, limit = 50): LedgerEntry[] {
    return this.ledger
      .filter((l) => l.account_id === accountId)
      .slice(-limit)
      .reverse();
  }

  // --- MULTI-TIER AGENCY / AFFILIATE COMMISSIONS ---

  /**
   * 3-tier commission distribution:
   * Level 1 (Direct Inviter): 0.6%
   * Level 2 (2nd Tier): 0.3%
   * Level 3 (3rd Tier): 0.1%
   */
  public processAffiliateCommissions(bettorId: string, betAmount: number, game: string, betId: string) {
    if (betAmount <= 0) return;

    let currentChildId = bettorId;
    const rates: { tier: 1 | 2 | 3; rate: number }[] = [
      { tier: 1, rate: 0.006 }, // 0.6%
      { tier: 2, rate: 0.003 }, // 0.3%
      { tier: 3, rate: 0.001 }, // 0.1%
    ];

    for (const { tier, rate } of rates) {
      const child = this.accounts.get(currentChildId);
      if (!child || !child.referred_by) break;

      const inviter = this.accounts.get(child.referred_by);
      if (!inviter) break;

      const commAmount = roundCurrency(betAmount * rate);
      if (commAmount > 0) {
        inviter.claimable_commission = roundCurrency(inviter.claimable_commission + commAmount);
        inviter.total_commission = roundCurrency(inviter.total_commission + commAmount);
        inviter.updated_at = new Date().toISOString();

        this.commissions.push({
          id: 'comm_' + uuidv4().substring(0, 10),
          inviter_id: inviter.id,
          bettor_id: bettorId,
          tier_level: tier,
          bet_amount: betAmount,
          commission_rate: rate,
          commission_amount: commAmount,
          game,
          reference_bet_id: betId,
          created_at: new Date().toISOString(),
        });
      }

      currentChildId = inviter.id;
    }
  }

  public async claimAffiliateCommission(accountId: string): Promise<{ success: boolean; amount: number; error?: string }> {
    const acc = this.accounts.get(accountId);
    if (!acc) return { success: false, amount: 0, error: 'Account not found' };
    const amountToClaim = acc.claimable_commission;
    if (amountToClaim <= 0) return { success: false, amount: 0, error: 'No claimable commission available.' };

    const idempotencyKey = `comm_claim_${accountId}_${Date.now()}`;
    const result = await this.mutateWallet({
      accountId,
      amountDelta: amountToClaim,
      type: 'COMMISSION',
      referenceId: 'AFFILIATE_REWARD_CLAIM',
      idempotencyKey,
      metadata: { claimedCommission: amountToClaim },
    });

    if (result.success) {
      acc.claimable_commission = 0;
      return { success: true, amount: amountToClaim };
    }
    return { success: false, amount: 0, error: result.error };
  }

  public getAffiliateSummary(accountId: string) {
    const acc = this.accounts.get(accountId);
    if (!acc) return null;

    // Direct downlines (Level 1)
    const level1 = Array.from(this.accounts.values()).filter((a) => a.referred_by === accountId);
    const level1Ids = new Set(level1.map((a) => a.id));

    // Level 2
    const level2 = Array.from(this.accounts.values()).filter((a) => a.referred_by && level1Ids.has(a.referred_by));
    const level2Ids = new Set(level2.map((a) => a.id));

    // Level 3
    const level3 = Array.from(this.accounts.values()).filter((a) => a.referred_by && level2Ids.has(a.referred_by));

    const totalTeamCount = level1.length + level2.length + level3.length;
    const teamTurnover = roundCurrency(
      [...level1, ...level2, ...level3].reduce((sum, a) => sum + a.total_wagered, 0)
    );

    return {
      referralCode: acc.referral_code,
      claimableCommission: acc.claimable_commission,
      totalCommission: acc.total_commission,
      totalTeamCount,
      level1Count: level1.length,
      level2Count: level2.length,
      level3Count: level3.length,
      teamTurnover,
    };
  }

  // --- 7-DAY ATTENDANCE REWARD CALENDAR ---

  public claimAttendanceReward(accountId: string): {
    success: boolean;
    rewardAmount: number;
    currentDay: number;
    error?: string;
  } {
    const acc = this.accounts.get(accountId);
    if (!acc) return { success: false, rewardAmount: 0, currentDay: 0, error: 'Account not found' };

    const todayStr = new Date().toISOString().split('T')[0];
    if (acc.last_attendance_date === todayStr) {
      return { success: false, rewardAmount: 0, currentDay: acc.attendance_days, error: 'Attendance reward already claimed today.' };
    }

    // Check if consecutive day
    let nextDay = 1;
    if (acc.last_attendance_date) {
      const lastDate = new Date(acc.last_attendance_date);
      const currDate = new Date(todayStr);
      const diffDays = Math.round((currDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        nextDay = (acc.attendance_days % 7) + 1;
      } else {
        nextDay = 1; // Streak broken
      }
    }

    const rewardMap: Record<number, number> = {
      1: 5.0,
      2: 10.0,
      3: 15.0,
      4: 25.0,
      5: 40.0,
      6: 60.0,
      7: 100.0,
    };
    const rewardAmount = rewardMap[nextDay] || 5.0;

    acc.attendance_days = nextDay;
    acc.last_attendance_date = todayStr;
    acc.wallet_balance = roundCurrency(acc.wallet_balance + rewardAmount);
    acc.updated_at = new Date().toISOString();

    const idempotencyKey = `att_${accountId}_${todayStr}`;
    this.recordLedgerEntryDirect({
      account_id: accountId,
      type: 'ATTENDANCE',
      amount: rewardAmount,
      closing_balance: acc.wallet_balance,
      reference_id: `DAY_${nextDay}_REWARD`,
      idempotency_key: idempotencyKey,
      metadata: { day: nextDay, rewardAmount },
    });

    return {
      success: true,
      rewardAmount,
      currentDay: nextDay,
    };
  }

  public getAttendanceStatus(accountId: string) {
    const acc = this.accounts.get(accountId);
    if (!acc) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const claimedToday = acc.last_attendance_date === todayStr;

    return {
      currentDay: acc.attendance_days,
      claimedToday,
      lastDate: acc.last_attendance_date,
      rewards: [
        { day: 1, reward: 5 },
        { day: 2, reward: 10 },
        { day: 3, reward: 15 },
        { day: 4, reward: 25 },
        { day: 5, reward: 40 },
        { day: 6, reward: 60 },
        { day: 7, reward: 100 },
      ],
    };
  }

  // --- FINANCIAL LEDGER & QUEUES (DEPOSITS & WITHDRAWALS) ---

  public createDepositRequest(accountId: string, amount: number, utrNumber: string, method = 'UPI'): { success: boolean; request?: DepositRequest; error?: string } {
    const acc = this.accounts.get(accountId);
    if (!acc) return { success: false, error: 'Account not found' };
    if (amount <= 0) return { success: false, error: 'Deposit amount must be positive' };
    if (!utrNumber || utrNumber.trim().length < 6) return { success: false, error: 'Valid 12-digit UPI UTR reference required' };

    const depId = 'dep_' + uuidv4().substring(0, 10);
    const request: DepositRequest = {
      id: depId,
      account_id: accountId,
      amount: roundCurrency(amount),
      utr_number: utrNumber.trim(),
      payment_method: method,
      status: 'PENDING',
      created_at: new Date().toISOString(),
    };
    this.deposits.set(depId, request);
    return { success: true, request };
  }

  public getDeposits(): DepositRequest[] {
    return Array.from(this.deposits.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public async approveDeposit(depositId: string, operatorIp: string, note?: string): Promise<{ success: boolean; error?: string }> {
    const dep = this.deposits.get(depositId);
    if (!dep) return { success: false, error: 'Deposit request not found' };
    if (dep.status !== 'PENDING') return { success: false, error: `Deposit already ${dep.status}` };

    dep.status = 'APPROVED';
    dep.operator_note = note || 'Verified via Banking UTR';
    dep.processed_at = new Date().toISOString();

    const result = await this.mutateWallet({
      accountId: dep.account_id,
      amountDelta: dep.amount,
      type: 'TOPUP',
      referenceId: dep.id,
      idempotencyKey: `dep_apprv_${dep.id}`,
      metadata: { utr: dep.utr_number, note: dep.operator_note },
    });

    this.logAudit({
      operator_ip: operatorIp,
      action: 'APPROVE_DEPOSIT',
      target_id: depositId,
      details: { accountId: dep.account_id, amount: dep.amount, utr: dep.utr_number },
    });

    return { success: result.success, error: result.error };
  }

  public rejectDeposit(depositId: string, operatorIp: string, note?: string): { success: boolean; error?: string } {
    const dep = this.deposits.get(depositId);
    if (!dep) return { success: false, error: 'Deposit request not found' };
    if (dep.status !== 'PENDING') return { success: false, error: `Deposit already ${dep.status}` };

    dep.status = 'REJECTED';
    dep.operator_note = note || 'Invalid UTR reference';
    dep.processed_at = new Date().toISOString();

    this.logAudit({
      operator_ip: operatorIp,
      action: 'REJECT_DEPOSIT',
      target_id: depositId,
      details: { accountId: dep.account_id, amount: dep.amount, utr: dep.utr_number, note: dep.operator_note },
    });

    return { success: true };
  }

  /**
   * 1X Turnover Requirement check for withdrawals:
   * Block withdrawal requests if total_wagered < total_deposited with status pill: "Turnover Remaining: ₹X"
   */
  public async createWithdrawalRequest(accountId: string, amount: number, upiId: string): Promise<{
    success: boolean;
    request?: WithdrawalRequest;
    turnoverRemaining?: number;
    error?: string;
  }> {
    const acc = this.accounts.get(accountId);
    if (!acc) return { success: false, error: 'Account not found' };
    if (acc.is_banned) return { success: false, error: 'Account frozen by compliance operator.' };
    if (amount <= 0) return { success: false, error: 'Amount must be positive' };
    if (acc.wallet_balance < amount) return { success: false, error: 'Insufficient wallet balance' };
    if (!upiId || !upiId.includes('@')) return { success: false, error: 'Valid UPI ID required (e.g. mobile@upi)' };

    // 1X Turnover Check: total_wagered must be >= total_deposited
    const requiredTurnover = acc.total_deposited;
    const currentTurnover = acc.total_wagered;
    if (currentTurnover < requiredTurnover) {
      const turnoverRemaining = roundCurrency(requiredTurnover - currentTurnover);
      return {
        success: false,
        turnoverRemaining,
        error: `1X Turnover Requirement Unmet. Turnover Remaining: ₹${turnoverRemaining.toFixed(2)} (Wagered: ₹${currentTurnover.toFixed(2)} / Deposited: ₹${requiredTurnover.toFixed(2)})`,
      };
    }

    const wthId = 'wth_' + uuidv4().substring(0, 10);

    // Atomically debit wallet during withdrawal lock
    const mutateRes = await this.mutateWallet({
      accountId,
      amountDelta: -roundCurrency(amount),
      type: 'WITHDRAW',
      referenceId: wthId,
      idempotencyKey: `wth_req_${wthId}`,
      metadata: { upiId, status: 'PENDING_OPERATOR_APPROVAL' },
    });

    if (!mutateRes.success) {
      return { success: false, error: mutateRes.error };
    }

    const request: WithdrawalRequest = {
      id: wthId,
      account_id: accountId,
      amount: roundCurrency(amount),
      upi_id: upiId.trim(),
      status: 'PENDING',
      turnover_at_request: currentTurnover,
      required_turnover: requiredTurnover,
      created_at: new Date().toISOString(),
    };
    this.withdrawals.set(wthId, request);

    return { success: true, request };
  }

  public getWithdrawals(): WithdrawalRequest[] {
    return Array.from(this.withdrawals.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  public approveWithdrawal(withdrawalId: string, operatorIp: string, note?: string): { success: boolean; error?: string } {
    const wth = this.withdrawals.get(withdrawalId);
    if (!wth) return { success: false, error: 'Withdrawal not found' };
    if (wth.status !== 'PENDING') return { success: false, error: `Withdrawal already ${wth.status}` };

    wth.status = 'APPROVED';
    wth.operator_note = note || 'Processed via Banking UPI Payout API';
    wth.processed_at = new Date().toISOString();

    this.logAudit({
      operator_ip: operatorIp,
      action: 'APPROVE_WITHDRAWAL',
      target_id: withdrawalId,
      details: { accountId: wth.account_id, amount: wth.amount, upiId: wth.upi_id },
    });

    return { success: true };
  }

  /**
   * Reject withdrawal with INSTANT 1-CLICK WALLET REFUND
   */
  public async rejectWithdrawal(withdrawalId: string, operatorIp: string, note?: string): Promise<{ success: boolean; error?: string }> {
    const wth = this.withdrawals.get(withdrawalId);
    if (!wth) return { success: false, error: 'Withdrawal not found' };
    if (wth.status !== 'PENDING') return { success: false, error: `Withdrawal already ${wth.status}` };

    wth.status = 'REJECTED';
    wth.operator_note = note || 'Rejected with instant wallet refund';
    wth.processed_at = new Date().toISOString();

    // Instant refund to wallet
    const refundRes = await this.mutateWallet({
      accountId: wth.account_id,
      amountDelta: wth.amount,
      type: 'REFUND',
      referenceId: wth.id,
      idempotencyKey: `wth_rfnd_${wth.id}`,
      metadata: { reason: 'Withdrawal rejected by operator; instant refund', note: wth.operator_note },
    });

    this.logAudit({
      operator_ip: operatorIp,
      action: 'REJECT_WITHDRAWAL_REFUND',
      target_id: withdrawalId,
      details: { accountId: wth.account_id, amount: wth.amount, note: wth.operator_note },
    });

    return { success: refundRes.success, error: refundRes.error };
  }

  // --- DIRECT BALANCE ADJUSTMENT TOOL ---

  public async adjustUserBalance(
    accountId: string,
    delta: number,
    auditReason: string,
    operatorIp: string
  ): Promise<{ success: boolean; newBalance?: number; error?: string }> {
    const acc = this.accounts.get(accountId);
    if (!acc) return { success: false, error: 'Account not found' };
    if (delta === 0) return { success: false, error: 'Delta cannot be 0' };

    const idempotencyKey = `adj_${accountId}_${Date.now()}`;
    const result = await this.mutateWallet({
      accountId,
      amountDelta: roundCurrency(delta),
      type: 'OPERATOR_ADJUSTMENT',
      referenceId: 'OPERATOR_DESK_ADJUST',
      idempotencyKey,
      metadata: { auditReason, operatorIp },
    });

    if (result.success) {
      this.logAudit({
        operator_ip: operatorIp,
        action: 'DIRECT_BALANCE_ADJUST',
        target_id: accountId,
        details: { delta, auditReason, newBalance: result.newBalance },
      });
      return { success: true, newBalance: result.newBalance };
    }
    return { success: false, error: result.error };
  }

  // --- DYNAMIC SYSTEM SETTINGS ---

  public getSettings(): SystemSettings {
    return { ...this.settings };
  }

  public updateSettings(partial: Partial<SystemSettings>, operatorIp: string): SystemSettings {
    this.settings = { ...this.settings, ...partial };
    this.logAudit({
      operator_ip: operatorIp,
      action: 'UPDATE_SYSTEM_SETTINGS',
      details: partial,
    });
    return { ...this.settings };
  }

  // --- AUDIT LOGS ---

  public logAudit(log: Omit<OperatorAuditLog, 'id' | 'created_at'>) {
    this.auditLogs.unshift({
      id: 'audit_' + uuidv4().substring(0, 10),
      ...log,
      created_at: new Date().toISOString(),
    });
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  public getAuditLogs(limit = 50): OperatorAuditLog[] {
    return this.auditLogs.slice(0, limit);
  }

  // --- WIN GO ROUNDS & BETS ---

  public saveWinGoRound(round: WinGoRoundRecord) {
    this.winGoRounds.set(round.id, { ...round });
  }

  public getWinGoRound(id: string): WinGoRoundRecord | null {
    const r = this.winGoRounds.get(id);
    return r ? { ...r } : null;
  }

  public getRecentWinGoRounds(limit = 30): WinGoRoundRecord[] {
    return Array.from(this.winGoRounds.values())
      .filter((r) => r.status === 'SETTLED')
      .sort((a, b) => b.period_number - a.period_number)
      .slice(0, limit);
  }

  public saveWinGoBet(bet: WinGoBetRecord) {
    this.winGoBets.set(bet.id, { ...bet });
  }

  public getWinGoBetsForRound(roundId: string): WinGoBetRecord[] {
    return Array.from(this.winGoBets.values()).filter((b) => b.round_id === roundId);
  }

  public getWinGoBetsForAccount(accountId: string, limit = 50): WinGoBetRecord[] {
    return Array.from(this.winGoBets.values())
      .filter((b) => b.account_id === accountId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }

  // --- AVIATOR ROUNDS & BETS ---

  public saveAviatorRound(round: AviatorRoundRecord) {
    this.aviatorRounds.set(round.id, { ...round });
  }

  public getAviatorRound(id: string): AviatorRoundRecord | null {
    const r = this.aviatorRounds.get(id);
    return r ? { ...r } : null;
  }

  public getRecentAviatorRounds(limit = 30): AviatorRoundRecord[] {
    return Array.from(this.aviatorRounds.values())
      .filter((r) => r.status === 'CRASHED')
      .sort((a, b) => b.round_number - a.round_number)
      .slice(0, limit);
  }

  public saveAviatorBet(bet: AviatorBetRecord) {
    this.aviatorBets.set(bet.id, { ...bet });
  }

  public getAviatorBet(id: string): AviatorBetRecord | null {
    const b = this.aviatorBets.get(id);
    return b ? { ...b } : null;
  }

  public getAviatorBetsForRound(roundId: string): AviatorBetRecord[] {
    return Array.from(this.aviatorBets.values()).filter((b) => b.round_id === roundId);
  }

  public getAviatorBetsForAccount(accountId: string, limit = 50): AviatorBetRecord[] {
    return Array.from(this.aviatorBets.values())
      .filter((b) => b.account_id === accountId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, limit);
  }
}

export const db = new DatabaseManager();
