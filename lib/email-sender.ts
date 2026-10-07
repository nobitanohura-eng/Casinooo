import nodemailer from 'nodemailer';
import { Resend } from 'resend';
import { adminDb } from './admin';

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
  unsubscribeUrl?: string;
}

export interface SendEmailResult {
  ok: boolean;
  provider: 'gmail_smtp' | 'resend' | 'custom_smtp' | 'none';
  messageId?: string;
  error?: string;
}

export interface StoredEmailConfig {
  provider: 'gmail' | 'resend' | 'custom_smtp' | 'none';
  gmail_user?: string;
  gmail_app_password?: string;
  smtp_host?: string;
  smtp_port?: number;
  resend_api_key?: string;
  resend_from_email?: string;
  company_sender_name?: string;
}

/**
 * Retrieves the currently active email provider configuration.
 * Priority:
 * 1. Saved configuration in `app_settings` (key: 'smtp_config')
 * 2. Environment variables (GMAIL_USER / GMAIL_APP_PASSWORD or RESEND_API_KEY)
 */
export async function getEmailConfig(): Promise<{
  configured: boolean;
  provider: 'gmail_smtp' | 'resend' | 'custom_smtp' | 'none';
  fromEmail: string;
  source: 'database' | 'environment' | 'none';
  gmailUser?: string;
  resendFromEmail?: string;
}> {
  try {
    const db = adminDb();
    const { data } = await db.from('app_settings').select('*').eq('key', 'smtp_config').maybeSingle();

    if (data?.value) {
      const cfg = data.value as StoredEmailConfig;
      if (cfg.provider === 'gmail' && cfg.gmail_user && cfg.gmail_app_password) {
        return {
          configured: true,
          provider: 'gmail_smtp',
          fromEmail: cfg.gmail_user,
          source: 'database',
          gmailUser: cfg.gmail_user,
        };
      }
      if (cfg.provider === 'resend' && cfg.resend_api_key && cfg.resend_from_email) {
        return {
          configured: true,
          provider: 'resend',
          fromEmail: cfg.resend_from_email,
          source: 'database',
          resendFromEmail: cfg.resend_from_email,
        };
      }
    }
  } catch {
    // Database query fallback
  }

  // Fallback to environment variables
  const gmailUser = process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;

  if (gmailUser && gmailPass) {
    return {
      configured: true,
      provider: 'gmail_smtp',
      fromEmail: gmailUser,
      source: 'environment',
      gmailUser,
    };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const resendFromEmail = process.env.RESEND_FROM_EMAIL;

  if (resendApiKey && resendFromEmail) {
    return {
      configured: true,
      provider: 'resend',
      fromEmail: resendFromEmail,
      source: 'environment',
      resendFromEmail,
    };
  }

  return {
    configured: false,
    provider: 'none',
    fromEmail: '',
    source: 'none',
  };
}

/**
 * Sends an email using either Gmail SMTP or Resend API.
 */
export async function sendEmailMessage(options: SendEmailOptions): Promise<SendEmailResult> {
  // Check database first
  let dbConfig: StoredEmailConfig | null = null;
  try {
    const db = adminDb();
    const { data } = await db.from('app_settings').select('*').eq('key', 'smtp_config').maybeSingle();
    if (data?.value) {
      dbConfig = data.value as StoredEmailConfig;
    }
  } catch {
    // ignore
  }

  const senderName = process.env.COMPANY_NAME || 'NCR Transport Logistics';

  // 1. GMAIL SMTP (from DB or ENV)
  const gmailUser = dbConfig?.gmail_user || process.env.GMAIL_USER || process.env.SMTP_USER;
  const gmailPass = dbConfig?.gmail_app_password || process.env.GMAIL_APP_PASSWORD || process.env.SMTP_PASS;
  const smtpHost = dbConfig?.smtp_host || process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = Number(dbConfig?.smtp_port || process.env.SMTP_PORT || 465);

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // SSL for 465, STARTTLS for 587
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"${senderName}" <${gmailUser}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        headers: options.unsubscribeUrl
          ? { 'List-Unsubscribe': `<${options.unsubscribeUrl}>` }
          : undefined,
      });

      return {
        ok: true,
        provider: 'gmail_smtp',
        messageId: info.messageId,
      };
    } catch (err: any) {
      return {
        ok: false,
        provider: 'gmail_smtp',
        error: `Gmail sending failed: ${err.message}. Make sure 2-Step Verification is enabled and you are using a 16-character Google App Password (not your normal Gmail password).`,
      };
    }
  }

  // 2. RESEND API (from DB or ENV)
  const resendApiKey = dbConfig?.resend_api_key || process.env.RESEND_API_KEY;
  const resendFromEmail = dbConfig?.resend_from_email || process.env.RESEND_FROM_EMAIL;

  if (resendApiKey && resendFromEmail) {
    try {
      const resend = new Resend(resendApiKey);
      const resendResult = await resend.emails.send({
        from: resendFromEmail,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        headers: options.unsubscribeUrl
          ? { 'List-Unsubscribe': `<${options.unsubscribeUrl}>` }
          : undefined,
      });

      if (resendResult.error) {
        return {
          ok: false,
          provider: 'resend',
          error: resendResult.error.message,
        };
      }

      return {
        ok: true,
        provider: 'resend',
        messageId: resendResult.data?.id,
      };
    } catch (err: any) {
      return {
        ok: false,
        provider: 'resend',
        error: `Resend API failed: ${err.message}`,
      };
    }
  }

  // 3. NEITHER CONFIGURED
  return {
    ok: false,
    provider: 'none',
    error:
      'Email credentials missing. Please set your Gmail & App Password in the Settings tab or add GMAIL_USER & GMAIL_APP_PASSWORD in your environment.',
  };
}
