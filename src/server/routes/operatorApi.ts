import { Router, Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db, roundCurrency } from '../database/db.ts';
import { winGoManager } from '../games/win-go/WinGoRoundManager.ts';
import { aviatorManager } from '../games/aviator/AviatorRoundManager.ts';

export const operatorRouter = Router();

// Master Operator Credentials from Environment or hardened defaults
const MASTER_PIN = process.env.OPERATOR_MASTER_PIN || '779911';
const MASTER_PASSPHRASE = process.env.OPERATOR_PASSPHRASE || 'ApexSuperOps2026!';

// Allowed valid PINs and Passphrases (strictly Master credentials)
const ALLOWED_PINS = ['779911', MASTER_PIN];
const ALLOWED_PASSPHRASES = ['ApexSuperOps2026!', MASTER_PASSPHRASE];

// Rate Limiting Map: IP -> { attempts: number, resetAt: number }
const loginAttempts = new Map<string, { attempts: number; resetAt: number }>();

// Active operator session tokens: token -> { createdAt: number, expiresAt: number, ip: string }
const activeSessions = new Map<string, { createdAt: number; expiresAt: number; ip: string }>();

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket.remoteAddress || '127.0.0.1';
}

function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = loginAttempts.get(ip);

  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { attempts: 0, resetAt: now + 15 * 60 * 1000 });
    return { allowed: true, remainingAttempts: 3 };
  }

  if (record.attempts >= 3) {
    const retryAfter = Math.ceil((record.resetAt - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds: retryAfter };
  }

  return { allowed: true, remainingAttempts: Math.max(0, 3 - record.attempts) };
}

function recordFailedAttempt(ip: string) {
  const now = Date.now();
  const record = loginAttempts.get(ip);
  if (!record || now > record.resetAt) {
    loginAttempts.set(ip, { attempts: 1, resetAt: now + 15 * 60 * 1000 });
  } else {
    record.attempts += 1;
  }
}

function resetAttempts(ip: string) {
  loginAttempts.delete(ip);
}

// Authentication Middleware for Operator Routes
export function requireOperatorAuth(req: Request, res: Response, next: NextFunction) {
  const token = (req.headers['x-operator-token'] as string) || (req.query.token as string);

  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized: Operator credentials required.' });
  }

  const session = activeSessions.get(token);
  if (!session || Date.now() > session.expiresAt) {
    if (session) activeSessions.delete(token);
    return res.status(401).json({ success: false, error: 'Operator session expired or invalid.' });
  }

  // Attach operator context
  (req as any).operatorIp = session.ip;
  next();
}

// 1. Operator Login
operatorRouter.post('/login', async (req: Request, res: Response) => {
  const ip = getClientIp(req);
  const { pin, passphrase } = req.body;

  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return res.status(429).json({
      success: false,
      error: `Security Lockout: Maximum 3 attempts exceeded. Try again in ${Math.ceil((rate.retryAfterSeconds || 900) / 60)} minutes.`,
      lockoutSeconds: rate.retryAfterSeconds,
    });
  }

  if (!pin || !passphrase) {
    recordFailedAttempt(ip);
    return res.status(400).json({ success: false, error: 'Master PIN (779911) and Passphrase required.' });
  }

  // Check against authorized master credentials
  const pinMatch = ALLOWED_PINS.includes(String(pin).trim());
  const passMatch = ALLOWED_PASSPHRASES.includes(String(passphrase).trim());

  if (!pinMatch || !passMatch) {
    recordFailedAttempt(ip);
    const updatedRate = checkRateLimit(ip);
    db.logAudit({
      operator_ip: ip,
      action: 'FAILED_OPERATOR_LOGIN',
      details: { remainingAttempts: updatedRate.remainingAttempts },
    });
    return res.status(401).json({
      success: false,
      error: `Invalid operator credentials. Remaining attempts before lockout: ${updatedRate.remainingAttempts}.`,
      remainingAttempts: updatedRate.remainingAttempts,
    });
  }

  // Login successful
  resetAttempts(ip);
  const token = 'ops_' + crypto.randomBytes(32).toString('hex');
  const now = Date.now();
  activeSessions.set(token, {
    createdAt: now,
    expiresAt: now + 24 * 60 * 60 * 1000, // 24 hours
    ip,
  });

  db.logAudit({
    operator_ip: ip,
    action: 'OPERATOR_LOGIN_SUCCESS',
    details: { tokenPreview: token.substring(0, 8) + '...' },
  });

  res.json({
    success: true,
    token,
    expiresIn: 86400,
    operatorRoute: process.env.OPERATOR_SECRET_ROUTE || '/sys-ops-console-91x',
  });
});

// 2. Operator Session Verification
operatorRouter.get('/verify', requireOperatorAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    authorized: true,
    operatorIp: (req as any).operatorIp,
  });
});

// 3. Operator Logout
operatorRouter.post('/logout', requireOperatorAuth, (req: Request, res: Response) => {
  const token = (req.headers['x-operator-token'] as string) || (req.query.token as string);
  if (token) activeSessions.delete(token);
  res.json({ success: true, message: 'Logged out of operator console.' });
});

// 4. Win Go 1Min Override Engine
operatorRouter.get('/wingo/live', requireOperatorAuth, (_req: Request, res: Response) => {
  const liveData = winGoManager.getLiveStakesBreakdown();
  res.json({ success: true, data: liveData });
});

operatorRouter.post('/wingo/override', requireOperatorAuth, (req: Request, res: Response) => {
  const { forcedNumber, mode } = req.body;
  const ip = (req as any).operatorIp || getClientIp(req);

  if (forcedNumber !== undefined) {
    if (forcedNumber === null || (typeof forcedNumber === 'number' && forcedNumber >= 0 && forcedNumber <= 9)) {
      winGoManager.setForcedNumber(forcedNumber);
    } else {
      return res.status(400).json({ success: false, error: 'Forced number must be 0-9 or null' });
    }
  }

  if (mode && (mode === 'MANUAL' || mode === 'AUTO_RISK_MIN')) {
    winGoManager.setMode(mode);
    db.updateSettings({ wingo_mode: mode }, ip);
  }

  db.logAudit({
    operator_ip: ip,
    action: 'WINGO_OVERRIDE_UPDATED',
    details: { forcedNumber: winGoManager.getForcedNumber(), mode: winGoManager.getMode() },
  });

  res.json({
    success: true,
    forcedNumber: winGoManager.getForcedNumber(),
    mode: winGoManager.getMode(),
  });
});

// 5. Aviator Trajectory Controller
operatorRouter.get('/aviator/live', requireOperatorAuth, (_req: Request, res: Response) => {
  const liveState = aviatorManager.getLiveOperatorState();
  res.json({ success: true, data: liveState });
});

operatorRouter.post('/aviator/override', requireOperatorAuth, (req: Request, res: Response) => {
  const { forcedCrashMultiplier, mode } = req.body;
  const ip = (req as any).operatorIp || getClientIp(req);

  if (forcedCrashMultiplier !== undefined) {
    if (forcedCrashMultiplier === null || (typeof forcedCrashMultiplier === 'number' && forcedCrashMultiplier >= 1.0)) {
      aviatorManager.setForcedCrashMultiplier(forcedCrashMultiplier);
    } else {
      return res.status(400).json({ success: false, error: 'Forced crash multiplier must be >= 1.00 or null' });
    }
  }

  if (mode && (mode === 'STATISTICAL' || mode === 'MANUAL')) {
    aviatorManager.setMode(mode);
    db.updateSettings({ aviator_mode: mode }, ip);
  }

  db.logAudit({
    operator_ip: ip,
    action: 'AVIATOR_OVERRIDE_UPDATED',
    details: {
      forcedCrashMultiplier: aviatorManager.getForcedCrashMultiplier(),
      mode: aviatorManager.getMode(),
    },
  });

  res.json({
    success: true,
    forcedCrashMultiplier: aviatorManager.getForcedCrashMultiplier(),
    mode: aviatorManager.getMode(),
  });
});

// Instant 1.00x Crash Trigger Button
operatorRouter.post('/aviator/instant-crash', requireOperatorAuth, async (req: Request, res: Response) => {
  const ip = (req as any).operatorIp || getClientIp(req);
  const result = await aviatorManager.triggerInstantCrash();

  db.logAudit({
    operator_ip: ip,
    action: 'AVIATOR_INSTANT_CRASH_TRIGGERED',
    details: { result },
  });

  res.json(result);
});

// 6. Deposit Queue
operatorRouter.get('/deposits', requireOperatorAuth, (_req: Request, res: Response) => {
  const deposits = db.getDeposits();
  res.json({ success: true, deposits });
});

operatorRouter.post('/deposits/:id/approve', requireOperatorAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;
  const ip = (req as any).operatorIp || getClientIp(req);

  const result = await db.approveDeposit(id, ip, note);
  res.json(result);
});

operatorRouter.post('/deposits/:id/reject', requireOperatorAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;
  const ip = (req as any).operatorIp || getClientIp(req);

  const result = db.rejectDeposit(id, ip, note);
  res.json(result);
});

// 7. Withdrawal Queue
operatorRouter.get('/withdrawals', requireOperatorAuth, (_req: Request, res: Response) => {
  const withdrawals = db.getWithdrawals();
  res.json({ success: true, withdrawals });
});

operatorRouter.post('/withdrawals/:id/approve', requireOperatorAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;
  const ip = (req as any).operatorIp || getClientIp(req);

  const result = db.approveWithdrawal(id, ip, note);
  res.json(result);
});

// 1-Click Reject with Instant Wallet Refund
operatorRouter.post('/withdrawals/:id/reject', requireOperatorAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { note } = req.body;
  const ip = (req as any).operatorIp || getClientIp(req);

  const result = await db.rejectWithdrawal(id, ip, note);
  res.json(result);
});

// 8. Player Directory & Direct Balance Adjustment
operatorRouter.get('/players', requireOperatorAuth, (_req: Request, res: Response) => {
  const players = db.getAllAccounts();
  res.json({ success: true, players });
});

operatorRouter.post('/players/:id/balance', requireOperatorAuth, async (req: Request, res: Response) => {
  const { id } = req.params;
  const { delta, reason } = req.body;
  const ip = (req as any).operatorIp || getClientIp(req);

  if (typeof delta !== 'number' || delta === 0) {
    return res.status(400).json({ success: false, error: 'Numeric delta (+ or -) required' });
  }
  if (!reason || !reason.trim()) {
    return res.status(400).json({ success: false, error: 'Audit reason required for direct balance adjustment' });
  }

  const result = await db.adjustUserBalance(id, delta, reason.trim(), ip);
  res.json(result);
});

operatorRouter.post('/players/:id/freeze', requireOperatorAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { isBanned } = req.body;
  const ip = (req as any).operatorIp || getClientIp(req);

  const result = db.setAccountBanned(id, Boolean(isBanned), ip);
  res.json(result);
});

// 9. Dynamic System Settings
operatorRouter.get('/settings', requireOperatorAuth, (_req: Request, res: Response) => {
  res.json({ success: true, settings: db.getSettings() });
});

operatorRouter.post('/settings', requireOperatorAuth, (req: Request, res: Response) => {
  const ip = (req as any).operatorIp || getClientIp(req);
  const updated = db.updateSettings(req.body, ip);
  res.json({ success: true, settings: updated });
});

// 10. Operator Audit Logs
operatorRouter.get('/audit-logs', requireOperatorAuth, (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string, 10) || 50;
  res.json({ success: true, logs: db.getAuditLogs(limit) });
});
