export type LedgerType = 'TOPUP' | 'BET' | 'WIN' | 'WITHDRAW' | 'REFUND' | 'COMMISSION' | 'ATTENDANCE' | 'OPERATOR_ADJUSTMENT' | 'GULLAK_BREAK' | 'LIFELINE_SPIN' | 'DAILY_REBATE';

export interface Account {
  id: string;
  mobile: string;
  wallet_balance: number;
  is_demo: boolean;
  is_banned?: boolean;
  total_deposited?: number;
  total_wagered?: number;
  total_won?: number;
  referred_by?: string | null;
  referral_code?: string;
  claimable_commission?: number;
  total_commission?: number;
  attendance_days?: number;
  last_attendance_date?: string | null;
  gullak_balance?: number;
  consecutive_losses?: number;
  lifeline_spin_used?: boolean;
  last_rebate_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  account_id: string;
  type: LedgerType;
  amount: number;
  closing_balance: number;
  reference_id: string;
  idempotency_key: string;
  metadata: Record<string, any>;
  created_at: string;
}

export type WinGoColor = 'RED' | 'GREEN' | 'VIOLET' | 'RED_VIOLET' | 'GREEN_VIOLET';
export type WinGoSize = 'SMALL' | 'BIG';
export type WinGoSelectionType = 'COLOR' | 'NUMBER' | 'SIZE';
export type WinGoSelectionValue = 'RED' | 'GREEN' | 'VIOLET' | '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'SMALL' | 'BIG';

export interface WinGoRoundOutcome {
  number: number;
  colors: ('RED' | 'GREEN' | 'VIOLET')[];
  colorDisplay: WinGoColor;
  size: WinGoSize;
  parity: 'EVEN' | 'ODD';
}

export interface WinGoRoundSummary {
  roundId: string;
  periodNumber: number;
  number: number;
  colorDisplay: WinGoColor;
  size: WinGoSize;
  settledAt: string;
}

export interface WinGoStatePayload {
  roundId: string;
  periodNumber: number;
  status: 'OPEN' | 'LOCKED' | 'SETTLING' | 'SETTLED';
  remainingSeconds: number;
  totalCycleSeconds: number;
  betLockSeconds: number;
  serverTime: number;
  currentResult?: WinGoRoundOutcome | null;
  recentResults: WinGoRoundSummary[];
}

export interface WinGoBet {
  id: string;
  account_id: string;
  round_id: string;
  selection_type: WinGoSelectionType;
  selection_value: string;
  stake_amount: number;
  multiplier: number;
  payout_amount: number;
  status: 'PENDING' | 'WON' | 'LOST' | 'REFUNDED';
  created_at: string;
}

export type AviatorRoundStatus = 'BETTING' | 'FLYING' | 'CRASHED';

export interface AviatorRecentCrash {
  roundNumber: number;
  crashMultiplier: number;
  crashedAt: string;
}

export interface AviatorStatePayload {
  roundId: string;
  roundNumber: number;
  status: AviatorRoundStatus;
  currentMultiplier: number;
  elapsedSeconds: number;
  bettingCountdownSeconds?: number;
  crashMultiplier?: number | null;
  recentCrashes: AviatorRecentCrash[];
  activeBetsCount: number;
  serverTime: number;
}

export interface AviatorBet {
  id: string;
  account_id: string;
  round_id: string;
  stake_amount: number;
  auto_cashout_multiplier: number | null;
  cashout_multiplier: number | null;
  payout_amount: number;
  status: 'IN_FLIGHT' | 'WON' | 'CRASHED' | 'REFUNDED';
  cashed_out_at: string | null;
  created_at: string;
}
