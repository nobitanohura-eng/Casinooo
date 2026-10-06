import { Router, Request, Response } from 'express';
import { WalletService } from '../wallet/WalletService.ts';
import { winGoManager } from '../games/win-go/WinGoRoundManager.ts';
import { aviatorManager } from '../games/aviator/AviatorRoundManager.ts';
import { db } from '../database/db.ts';
import { TopUpSchema, WinGoBetSchema, AviatorBetSchema, AviatorCashOutSchema } from '../validation/schemas.ts';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Apex Arcade Game Engine',
    version: '1.0.0',
  });
});

// Auth / Session bootstrapping
apiRouter.get('/auth/session', async (req: Request, res: Response) => {
  try {
    const accountId = (req.query.accountId as string) || 'acc_demo_pilot_01';
    const mobile = req.query.mobile as string | undefined;
    const account = await WalletService.getOrCreateAccount(accountId, mobile);
    res.json({ success: true, account });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Wallet Summary
apiRouter.get('/wallet/summary', async (req: Request, res: Response) => {
  try {
    const accountId = (req.query.accountId as string) || 'acc_demo_pilot_01';
    const account = await WalletService.getAccount(accountId);
    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' });
    }
    const balance = account.wallet_balance;
    const recentLedger = WalletService.getLedger(accountId, 10);

    res.json({
      success: true,
      accountId,
      wallet_balance: balance,
      is_demo: account.is_demo,
      recentLedger,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Wallet Ledger History
apiRouter.get('/wallet/ledger', async (req: Request, res: Response) => {
  try {
    const accountId = (req.query.accountId as string) || 'acc_demo_pilot_01';
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const ledger = WalletService.getLedger(accountId, limit);
    res.json({ success: true, ledger });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Virtual Credits Demo Top-up
apiRouter.post('/wallet/topup', async (req: Request, res: Response) => {
  try {
    const parsed = TopUpSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    }

    const { accountId, amount, idempotencyKey } = parsed.data;
    const result = await WalletService.topupDemoCredits({
      accountId,
      amount,
      idempotencyKey,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json({
      success: true,
      newBalance: result.newBalance,
      ledgerEntry: result.ledgerEntry,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Win Go State & History
apiRouter.get('/wingo/state', (_req: Request, res: Response) => {
  res.json({ success: true, state: winGoManager.getState() });
});

apiRouter.get('/wingo/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 30;
  res.json({ success: true, history: db.getRecentWinGoRounds(limit) });
});

apiRouter.get('/wingo/my-bets', (req: Request, res: Response) => {
  const accountId = (req.query.accountId as string) || 'acc_demo_pilot_01';
  const limit = parseInt(req.query.limit as string, 10) || 50;
  res.json({ success: true, bets: db.getWinGoBetsForAccount(accountId, limit) });
});

apiRouter.post('/wingo/bet', async (req: Request, res: Response) => {
  try {
    const parsed = WinGoBetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    }

    const result = await winGoManager.placeBet(parsed.data as any);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Aviator State & History
apiRouter.get('/aviator/state', (_req: Request, res: Response) => {
  res.json({ success: true, state: aviatorManager.getState() });
});

apiRouter.get('/aviator/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 30;
  res.json({ success: true, history: db.getRecentAviatorRounds(limit) });
});

apiRouter.get('/aviator/my-bets', (req: Request, res: Response) => {
  const accountId = (req.query.accountId as string) || 'acc_demo_pilot_01';
  const limit = parseInt(req.query.limit as string, 10) || 50;
  res.json({ success: true, bets: db.getAviatorBetsForAccount(accountId, limit) });
});

apiRouter.post('/aviator/bet', async (req: Request, res: Response) => {
  try {
    const parsed = AviatorBetSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    }

    const result = await aviatorManager.placeBet(parsed.data as any);
    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

apiRouter.post('/aviator/cashout', async (req: Request, res: Response) => {
  try {
    const parsed = AviatorCashOutSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, error: parsed.error.issues[0]?.message });
    }

    const result = await aviatorManager.cashOutBet(
      parsed.data.accountId,
      parsed.data.betId,
      parsed.data.requestedMultiplier
    );

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.error });
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Comprehensive Activity Feed (combined Win Go + Aviator + Ledger)
apiRouter.get('/activity/all', (req: Request, res: Response) => {
  try {
    const accountId = (req.query.accountId as string) || 'acc_demo_pilot_01';
    const limit = parseInt(req.query.limit as string, 10) || 50;

    const wingoBets = db.getWinGoBetsForAccount(accountId, limit);
    const aviatorBets = db.getAviatorBetsForAccount(accountId, limit);
    const ledger = db.getLedger(accountId, limit);

    res.json({
      success: true,
      wingoBets,
      aviatorBets,
      ledger,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Dynamic Public Platform Settings (UPI ID, QR code, Telegram VIP, Marquee)
apiRouter.get('/settings/public', (_req: Request, res: Response) => {
  const s = db.getSettings();
  res.json({
    success: true,
    settings: {
      upi_id: s.upi_id,
      qr_code_url: s.qr_code_url,
      telegram_link: s.telegram_link,
      marquee_broadcast: s.marquee_broadcast,
    },
  });
});

// Player Deposit Request (UTR Submission)
apiRouter.post('/wallet/deposit-request', (req: Request, res: Response) => {
  const { accountId, amount, utrNumber, method } = req.body;
  if (!accountId || !amount || !utrNumber) {
    return res.status(400).json({ success: false, error: 'Account ID, amount, and UPI UTR reference required.' });
  }

  const result = db.createDepositRequest(accountId, Number(amount), String(utrNumber), method);
  if (!result.success) {
    return res.status(400).json({ success: false, error: result.error });
  }
  res.json(result);
});

// Player Withdrawal Request (1X Turnover Enforced)
apiRouter.post('/wallet/withdraw-request', async (req: Request, res: Response) => {
  const { accountId, amount, upiId } = req.body;
  if (!accountId || !amount || !upiId) {
    return res.status(400).json({ success: false, error: 'Account ID, amount, and UPI ID required.' });
  }

  const result = await db.createWithdrawalRequest(accountId, Number(amount), String(upiId));
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// Agency Hub: 3-Level Affiliate Downline Summary
apiRouter.get('/agency/summary', (req: Request, res: Response) => {
  const accountId = (req.query.accountId as string) || 'acc_demo_pilot_01';
  const summary = db.getAffiliateSummary(accountId);
  if (!summary) {
    return res.status(404).json({ success: false, error: 'Account not found' });
  }
  res.json({ success: true, summary });
});

// Agency Commission Claim
apiRouter.post('/agency/claim', async (req: Request, res: Response) => {
  const { accountId } = req.body;
  if (!accountId) {
    return res.status(400).json({ success: false, error: 'Account ID required' });
  }
  const result = await db.claimAffiliateCommission(accountId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

// 7-Day Attendance Calendar Status
apiRouter.get('/attendance', (req: Request, res: Response) => {
  const accountId = (req.query.accountId as string) || 'acc_demo_pilot_01';
  const status = db.getAttendanceStatus(accountId);
  if (!status) {
    return res.status(404).json({ success: false, error: 'Account not found' });
  }
  res.json({ success: true, status });
});

// 7-Day Attendance Reward Claim
apiRouter.post('/attendance/claim', (req: Request, res: Response) => {
  const { accountId } = req.body;
  if (!accountId) {
    return res.status(400).json({ success: false, error: 'Account ID required' });
  }
  const result = db.claimAttendanceReward(accountId);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});

