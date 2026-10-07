import { Router, Request, Response } from 'express';
import { WalletService } from '../wallet/WalletService.ts';
import { winGoManager } from '../games/win-go/WinGoRoundManager.ts';
import { aviatorManager } from '../games/aviator/AviatorRoundManager.ts';
import { db } from '../database/db.ts';
import { TopUpSchema, WinGoBetSchema, AviatorBetSchema, AviatorCashOutSchema } from '../validation/schemas.ts';
import { AuthService } from '../auth/authService.ts';

export const apiRouter = Router();

// Throttling: Enforce an API rate-limit of 1 action per 500ms on interactive round entries
const betRateLimits = new Map<string, number>();

function checkBetThrottle(accountId: string): boolean {
  const now = Date.now();
  const lastTime = betRateLimits.get(accountId) || 0;
  if (now - lastTime < 500) {
    return false;
  }
  betRateLimits.set(accountId, now);
  return true;
}

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Apex Arcade Game Engine',
    version: '1.0.0',
  });
});

// 1. Mobile Registration with Math Challenge & Invitation
apiRouter.post('/auth/register', (req: Request, res: Response) => {
  try {
    const { mobile, password, confirmPassword, mathChallenge, referralCode } = req.body;

    if (!mobile || !AuthService.isValidIndianMobile(mobile)) {
      return res.status(400).json({ success: false, error: 'Valid 10-digit Indian mobile number (+91) required.' });
    }

    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
    }

    if (confirmPassword && password !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'Passwords do not match.' });
    }

    // Verify visual math challenge if provided
    if (mathChallenge) {
      const { num1, num2, answer } = mathChallenge;
      if (typeof num1 === 'number' && typeof num2 === 'number') {
        if (parseInt(answer, 10) !== num1 + num2) {
          return res.status(400).json({ success: false, error: 'Incorrect visual math challenge answer. Please retry.' });
        }
      }
    }

    const passwordHash = AuthService.hashPassword(password);
    const regResult = db.registerUser({
      mobile,
      passwordHash,
      referralCode,
    });

    if (!regResult.success || !regResult.account) {
      return res.status(400).json({ success: false, error: regResult.error });
    }

    const token = AuthService.createSessionToken(regResult.account.id, regResult.account.mobile);

    res.json({
      success: true,
      token,
      account: regResult.account,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Mobile Login
apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { mobile, password } = req.body;

    if (!mobile || !password) {
      return res.status(400).json({ success: false, error: 'Mobile number and password are required.' });
    }

    const account = db.getAccountByMobile(mobile);
    if (!account) {
      return res.status(401).json({ success: false, error: 'Account not found with this mobile number.' });
    }

    if (account.password_hash) {
      const valid = AuthService.verifyPassword(password, account.password_hash);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
      }
    }

    const token = AuthService.createSessionToken(account.id, account.mobile);

    res.json({
      success: true,
      token,
      account,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Current User Session Verification
apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : (req.query.token as string);

  if (!token) {
    return res.json({ success: true, authenticated: false, account: null });
  }

  const payload = AuthService.verifySessionToken(token);
  if (!payload) {
    return res.json({ success: true, authenticated: false, account: null });
  }

  const account = db.getAccount(payload.accountId);
  if (!account) {
    return res.json({ success: true, authenticated: false, account: null });
  }

  res.json({
    success: true,
    authenticated: true,
    account,
  });
});

// 4. Logout
apiRouter.post('/auth/logout', (_req: Request, res: Response) => {
  res.json({ success: true, message: 'Logged out successfully.' });
});

// 5. Auth / Session bootstrapping (Legacy Fallback)
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

    if (!checkBetThrottle(parsed.data.accountId)) {
      return res.status(429).json({ success: false, error: 'Throttled: Maximum 1 bet per 500ms to eliminate multi-tap drain.' });
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

    if (!checkBetThrottle(parsed.data.accountId)) {
      return res.status(429).json({ success: false, error: 'Throttled: Maximum 1 bet per 500ms to eliminate multi-tap drain.' });
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

// --- RETENTION & LOSS-SOFTENING ENGINE ROUTES ---

// 1. Smash Gullak (Piggy Bank Vault)
apiRouter.post('/retention/smash-gullak', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Account ID required.' });
    }
    const result = await db.smashGullak(accountId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 2. Zero-Balance Lifeline Contingency Spin
apiRouter.post('/retention/lifeline-spin', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Account ID required.' });
    }
    const result = await db.claimLifelineSpin(accountId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Daily Loss Rebate Summary
apiRouter.get('/retention/daily-rebate', (req: Request, res: Response) => {
  try {
    const accountId = (req.query.accountId as string) || 'acc_demo_pilot_01';
    const rebateInfo = db.calculateDailyRebate(accountId);
    res.json({ success: true, ...rebateInfo });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Claim Daily Loss Rebate
apiRouter.post('/retention/claim-rebate', async (req: Request, res: Response) => {
  try {
    const { accountId } = req.body;
    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Account ID required.' });
    }
    const result = await db.claimDailyRebate(accountId);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

