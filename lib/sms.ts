import { adminDb } from '@/lib/admin';
import { SmsDevice, SmsJob, SmsSettings, SmsTemplate } from '@/lib/types';
import { isEmailSuppressed } from '@/lib/suppression';
import { logActivity } from '@/lib/activity';
import crypto from 'crypto';

export const DEFAULT_SMS_SETTINGS: SmsSettings = {
  enabled: false, // Off by default until explicitly enabled
  daily_limit: 50, // Safe threshold for personal SIM without triggering telecom spam limits
  sent_today: 0,
  min_delay_seconds: 15,
  followup_mode: 'manual_approval_sms',
  day0_channel: 'email',
  day2_delay_days: 2,
  day4_delay_days: 4,
  dlt_disclaimer_acknowledged: false,
  test_phone_number: '',
};

export const DEFAULT_SMS_TEMPLATES: SmsTemplate[] = [
  {
    id: 'tata_ace_intro_hinglish',
    name: 'Tata Ace Gold Quick Pitch (Hinglish)',
    language: 'hinglish',
    category: 'Commercial Transport',
    template_text:
      'Namaste ji, NCR Transport Logistics Noida se. Hamara Tata Ace Gold Chota Hathi Noida-Delhi NCR factory dispatch ke liye available hai. Per-trip & regular rates ke liye sampark karein: +91 98110 00000. Stop lkr reply kre opt-out k liye.',
  },
  {
    id: 'tata_ace_followup_hinglish',
    name: 'Delivery Follow-up (Hinglish)',
    language: 'hinglish',
    category: 'Follow-up',
    template_text:
      'Namaste, NCR Transport Logistics se follow-up. Kya aapka local goods movement consignments schedule ho gaya? Safe load & on-time delivery ke liye call karein: +91 98110 00000.',
  },
  {
    id: 'tata_ace_quote_english',
    name: 'Local Transport Availability (English)',
    language: 'english',
    category: 'Direct Offer',
    template_text:
      'Greetings! NCR Transport Logistics offers dedicated Tata Ace Gold for local Delhi NCR industrial cargo delivery. Contact +91 98110 00000 for competitive trip rates.',
  },
];

// Helper to hash device tokens securely
export function hashDeviceToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Generate 6-digit pairing code
export function generatePairingCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Get or initialize SMS Settings
export async function getSmsSettings(): Promise<SmsSettings> {
  const db = adminDb();
  const { data } = await db
    .from('app_settings')
    .select('value')
    .eq('key', 'sms_gateway_settings')
    .maybeSingle();

  if (data && data.value) {
    return { ...DEFAULT_SMS_SETTINGS, ...data.value };
  }
  return DEFAULT_SMS_SETTINGS;
}

// Save SMS Settings
export async function updateSmsSettings(updates: Partial<SmsSettings>): Promise<SmsSettings> {
  const db = adminDb();
  const current = await getSmsSettings();
  const next = { ...current, ...updates };

  const { data: existing } = await db
    .from('app_settings')
    .select('*')
    .eq('key', 'sms_gateway_settings')
    .maybeSingle();

  if (existing) {
    await db.from('app_settings').update({ value: next }).eq('key', 'sms_gateway_settings');
  } else {
    await db.from('app_settings').insert({ key: 'sms_gateway_settings', value: next });
  }

  return next;
}

// Get all pre-loaded templates
export async function getSmsTemplates(): Promise<SmsTemplate[]> {
  const db = adminDb();
  const { data } = await db.from('sms_templates').select('*');
  if (data && data.length > 0) {
    return data;
  }
  // Initialize defaults
  for (const t of DEFAULT_SMS_TEMPLATES) {
    await db.from('sms_templates').insert(t);
  }
  return DEFAULT_SMS_TEMPLATES;
}

// Check daily SMS send limits
export async function checkDailySmsLimit(): Promise<{ allowed: boolean; sentToday: number; limit: number }> {
  const db = adminDb();
  const settings = await getSmsSettings();

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const { data: sentJobs } = await db
    .from('sms_jobs')
    .select('id, sent_at')
    .in('status', ['sent', 'delivered'])
    .gte('sent_at', startOfDay.toISOString());

  const sentToday = sentJobs?.length || 0;
  return {
    allowed: sentToday < settings.daily_limit,
    sentToday,
    limit: settings.daily_limit,
  };
}

// Verify a device bearer token
export async function authenticateDevice(bearerHeader: string | null): Promise<SmsDevice | null> {
  if (!bearerHeader || !bearerHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = bearerHeader.slice(7).trim();
  if (!token) return null;

  const tokenHash = hashDeviceToken(token);
  const db = adminDb();
  const { data: device } = await db
    .from('sms_devices')
    .select('*')
    .eq('auth_token_hash', tokenHash)
    .eq('status', 'online')
    .maybeSingle();

  return device || null;
}

// Queue an SMS Job with full safety guards
export async function queueSmsJob(params: {
  lead_id: string;
  lead_company_name: string;
  recipient_phone: string;
  message_text: string;
  sim_slot?: number;
  requires_manual_approval?: boolean;
  idempotency_key?: string;
}): Promise<{ ok: boolean; job?: SmsJob; error?: string }> {
  const db = adminDb();
  const settings = await getSmsSettings();

  if (!settings.enabled) {
    return { ok: false, error: 'SMS Gateway is currently disabled in Settings.' };
  }

  // Normalize phone
  const cleanPhone = params.recipient_phone.replace(/[^\d+]/g, '');
  if (cleanPhone.length < 10) {
    return { ok: false, error: 'Invalid phone number format.' };
  }

  // Check phone suppression / opt-out
  const { data: lead } = await db
    .from('leads')
    .select('opted_out, status')
    .eq('id', params.lead_id)
    .maybeSingle();

  if (lead && (lead.opted_out || lead.status === 'do_not_contact')) {
    return { ok: false, error: 'Recipient is marked as opted-out or do-not-contact.' };
  }

  // Check daily limit
  const limitCheck = await checkDailySmsLimit();
  if (!limitCheck.allowed) {
    return {
      ok: false,
      error: `Daily SMS limit reached (${limitCheck.sentToday}/${limitCheck.limit}). Increase limit in Settings.`,
    };
  }

  // Idempotency check: prevent duplicate queued jobs for the same lead and text within 24 hours
  const idempotencyKey =
    params.idempotency_key ||
    `sms_${params.lead_id}_${cleanPhone}_${crypto.createHash('md5').update(params.message_text).digest('hex')}`;

  const { data: existingJob } = await db
    .from('sms_jobs')
    .select('*')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (existingJob) {
    if (existingJob.status === 'queued' || existingJob.status === 'sent' || existingJob.status === 'delivered') {
      return { ok: true, job: existingJob };
    }
  }

  const manualApproval =
    params.requires_manual_approval ??
    (settings.followup_mode === 'manual_approval_sms' || !settings.enabled);

  const newJob: SmsJob = {
    id: `sms_job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    lead_id: params.lead_id,
    lead_company_name: params.lead_company_name,
    recipient_phone: cleanPhone,
    message_text: params.message_text,
    status: 'queued',
    device_id: null,
    sim_slot: params.sim_slot ?? 0,
    idempotency_key: idempotencyKey,
    created_at: new Date().toISOString(),
    claimed_at: null,
    sent_at: null,
    delivered_at: null,
    failed_at: null,
    error_code: null,
    error_message: null,
    retry_count: 0,
    max_retries: 3,
    requires_manual_approval: manualApproval,
    approved_at: manualApproval ? null : new Date().toISOString(),
  };

  await db.from('sms_jobs').insert(newJob);

  await logActivity({
    lead_id: params.lead_id,
    action: 'sms_queued',
    description: `SMS queued for ${params.lead_company_name} (${cleanPhone}) via SIM Gateway`,
    actor: 'System/Owner',
    metadata: { jobId: newJob.id, phone: cleanPhone },
  });

  return { ok: true, job: newJob };
}
