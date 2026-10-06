import {
  Account,
  LedgerEntry,
  WinGoStatePayload,
  WinGoRoundSummary,
  WinGoBet,
  AviatorStatePayload,
  AviatorRecentCrash,
  AviatorBet,
} from './types.ts';

export async function fetchSession(accountId: string): Promise<Account> {
  const res = await fetch(`/api/auth/session?accountId=${encodeURIComponent(accountId)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch session');
  return data.account;
}

export async function fetchWalletSummary(accountId: string): Promise<{
  wallet_balance: number;
  recentLedger: LedgerEntry[];
}> {
  const res = await fetch(`/api/wallet/summary?accountId=${encodeURIComponent(accountId)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch wallet summary');
  return {
    wallet_balance: data.wallet_balance,
    recentLedger: data.recentLedger,
  };
}

export async function fetchWalletLedger(accountId: string, limit = 50): Promise<LedgerEntry[]> {
  const res = await fetch(`/api/wallet/ledger?accountId=${encodeURIComponent(accountId)}&limit=${limit}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch ledger');
  return data.ledger;
}

export async function topupCredits(accountId: string, amount: number): Promise<{ newBalance: number }> {
  const idempotencyKey = `topup_${accountId}_${Date.now()}`;
  const res = await fetch('/api/wallet/topup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ accountId, amount, idempotencyKey }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to top up virtual credits');
  return { newBalance: data.newBalance };
}

export async function fetchWinGoState(): Promise<WinGoStatePayload> {
  const res = await fetch('/api/wingo/state');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch Win Go state');
  return data.state;
}

export async function fetchWinGoHistory(limit = 30): Promise<WinGoRoundSummary[]> {
  const res = await fetch(`/api/wingo/history?limit=${limit}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch Win Go history');
  return data.history.map((r: any) => ({
    roundId: r.id,
    periodNumber: r.period_number,
    number: r.result_number ?? 0,
    colorDisplay: r.result_color ?? 'RED',
    size: r.result_size ?? 'SMALL',
    settledAt: r.settled_at || r.created_at,
  }));
}

export async function fetchWinGoBets(accountId: string, limit = 50): Promise<WinGoBet[]> {
  const res = await fetch(`/api/wingo/my-bets?accountId=${encodeURIComponent(accountId)}&limit=${limit}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch Win Go bets');
  return data.bets;
}

export async function fetchAviatorState(): Promise<AviatorStatePayload> {
  const res = await fetch('/api/aviator/state');
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch Aviator state');
  return data.state;
}

export async function fetchAviatorHistory(limit = 30): Promise<AviatorRecentCrash[]> {
  const res = await fetch(`/api/aviator/history?limit=${limit}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch Aviator history');
  return data.history.map((r: any) => ({
    roundNumber: r.round_number,
    crashMultiplier: r.crash_multiplier,
    crashedAt: r.crashed_at || r.created_at,
  }));
}

export async function fetchAviatorBets(accountId: string, limit = 50): Promise<AviatorBet[]> {
  const res = await fetch(`/api/aviator/my-bets?accountId=${encodeURIComponent(accountId)}&limit=${limit}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch Aviator bets');
  return data.bets;
}

export async function fetchAllActivity(accountId: string): Promise<{
  wingoBets: WinGoBet[];
  aviatorBets: AviatorBet[];
  ledger: LedgerEntry[];
}> {
  const res = await fetch(`/api/activity/all?accountId=${encodeURIComponent(accountId)}`);
  const data = await res.json();
  if (!data.success) throw new Error(data.error || 'Failed to fetch activity');
  return {
    wingoBets: data.wingoBets,
    aviatorBets: data.aviatorBets,
    ledger: data.ledger,
  };
}
