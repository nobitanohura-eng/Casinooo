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

export interface WinGoBetInput {
  accountId: string;
  roundId: string;
  selectionType: WinGoSelectionType;
  selectionValue: WinGoSelectionValue;
  stakeAmount: number;
  idempotencyKey: string;
}

export interface WinGoStatePayload {
  roundId: string;
  periodNumber: number;
  status: 'OPEN' | 'LOCKED' | 'SETTLING' | 'SETTLED';
  remainingSeconds: number; // authoritative remaining seconds in 60s cycle
  totalCycleSeconds: number; // 60
  betLockSeconds: number; // 10 (locks at remaining <= 10)
  serverTime: number; // UTC ms
  currentResult?: WinGoRoundOutcome | null;
  recentResults: {
    roundId: string;
    periodNumber: number;
    number: number;
    colorDisplay: WinGoColor;
    size: WinGoSize;
    settledAt: string;
  }[];
}
