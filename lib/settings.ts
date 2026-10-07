import { adminDb } from './admin';
import { AppSettings } from './types';

const DEFAULT_SETTINGS: AppSettings = {
  global_email_paused: process.env.GLOBAL_EMAIL_PAUSED !== 'false',
  daily_send_limit: 25,
  company_profile: {
    name: 'Papa Transport Services',
    phone: '+91 98110 00000',
    base_city: 'Noida',
    service_area: 'Noida–Delhi NCR',
    vehicle_type: 'Tata Ace Gold (Chota Hathi)',
  },
};

export async function getAppSettings(): Promise<AppSettings> {
  try {
    const db = adminDb();
    const { data, error } = await db.from('app_settings').select('*');
    if (error || !data || data.length === 0) {
      return DEFAULT_SETTINGS;
    }

    const settings: Record<string, unknown> = {};
    for (const row of data) {
      settings[row.key] = row.value;
    }

    let isPaused = true;
    if (process.env.GLOBAL_EMAIL_PAUSED !== undefined) {
      isPaused = process.env.GLOBAL_EMAIL_PAUSED === 'true';
    } else if (settings.global_email_paused !== undefined) {
      isPaused = settings.global_email_paused === true;
    }

    return {
      global_email_paused: isPaused,
      daily_send_limit: typeof settings.daily_send_limit === 'number' ? settings.daily_send_limit : 25,
      company_profile: (settings.company_profile as AppSettings['company_profile']) || DEFAULT_SETTINGS.company_profile,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function updateAppSetting(key: string, value: unknown): Promise<void> {
  const db = adminDb();
  await db
    .from('app_settings')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
}

export async function checkDailySendLimit(): Promise<{ allowed: boolean; sentToday: number; limit: number }> {
  try {
    const db = adminDb();
    const settings = await getAppSettings();
    const limit = settings.daily_send_limit || 25;

    // Count sends in the last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error } = await db
      .from('send_attempts')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('attempted_at', oneDayAgo);

    if (error) {
      console.error('Failed to count daily sends:', error);
      return { allowed: true, sentToday: 0, limit };
    }

    const sentToday = count || 0;
    return {
      allowed: sentToday < limit,
      sentToday,
      limit,
    };
  } catch {
    return { allowed: true, sentToday: 0, limit: 25 };
  }
}
