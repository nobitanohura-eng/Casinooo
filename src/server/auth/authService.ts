import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || process.env.APP_SECRET || 'apex-arcade-super-secure-production-jwt-token-2026';

export interface SessionPayload {
  accountId: string;
  mobile: string;
  createdAt: number;
  expiresAt: number;
}

export class AuthService {
  /**
   * Hashes a user password using bcrypt with salt rounds 10.
   */
  public static hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }

  /**
   * Verifies plain text password against hash.
   */
  public static verifyPassword(password: string, hash: string): boolean {
    if (!password || !hash) return false;
    return bcrypt.compareSync(password, hash);
  }

  /**
   * Creates a signed, secure session token containing user payload.
   */
  public static createSessionToken(accountId: string, mobile: string, expiresInMs = 7 * 24 * 60 * 60 * 1000): string {
    const now = Date.now();
    const payload: SessionPayload = {
      accountId,
      mobile,
      createdAt: now,
      expiresAt: now + expiresInMs,
    };
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(payloadBase64)
      .digest('base64url');

    return `${payloadBase64}.${signature}`;
  }

  /**
   * Verifies and decodes a signed session token. Returns null if expired or invalid signature.
   */
  public static verifySessionToken(token: string): SessionPayload | null {
    if (!token || !token.includes('.')) return null;

    try {
      const [payloadBase64, signature] = token.split('.');
      if (!payloadBase64 || !signature) return null;

      const expectedSignature = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(payloadBase64)
        .digest('base64url');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return null;
      }

      const payload: SessionPayload = JSON.parse(Buffer.from(payloadBase64, 'base64url').toString('utf-8'));
      if (Date.now() > payload.expiresAt) {
        return null;
      }

      return payload;
    } catch {
      return null;
    }
  }

  /**
   * Validates Indian mobile number format (10 digits starting with 6, 7, 8, or 9).
   */
  public static isValidIndianMobile(mobile: string): boolean {
    const clean = mobile.replace(/\D/g, '');
    const tenDigits = clean.length > 10 ? clean.slice(-10) : clean;
    return /^[6-9]\d{9}$/.test(tenDigits);
  }

  /**
   * Formats 10-digit mobile to standard Indian format: +91 XXXXX XXXXX
   */
  public static formatMobile(mobile: string): string {
    const clean = mobile.replace(/\D/g, '');
    const tenDigits = clean.length > 10 ? clean.slice(-10) : clean;
    return `+91 ${tenDigits.substring(0, 5)} ${tenDigits.substring(5)}`;
  }
}
