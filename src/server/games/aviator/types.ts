export type AviatorRoundStatus = 'BETTING' | 'FLYING' | 'CRASHED';

export interface AviatorBetInput {
  accountId: string;
  roundId: string;
  stakeAmount: number;
  autoCashoutMultiplier?: number | null;
  idempotencyKey: string;
}

export interface AviatorStatePayload {
  roundId: string;
  roundNumber: number;
  status: AviatorRoundStatus;
  currentMultiplier: number;
  elapsedSeconds: number;
  bettingCountdownSeconds?: number;
  crashMultiplier?: number | null;
  recentCrashes: {
    roundNumber: number;
    crashMultiplier: number;
    crashedAt: string;
  }[];
  activeBetsCount: number;
  serverTime: number;
}
