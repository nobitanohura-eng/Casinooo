import { adminDb } from './admin';
import { logActivity } from './activity';
import { checkDailySendLimit } from './settings';

export interface PhoneGatewayConfig {
  enabled: boolean;
  baseUrl: string;
  username: string;
  password: string;
  simNumber: number;
  dailyLimit: number;
}

const DEFAULT_CONFIG: PhoneGatewayConfig = {
  enabled: true,
  baseUrl: 'http://10.108.104.59:8080',
  username: 'sms',
  password: 'Tz3tO82d',
  simNumber: 1,
  dailyLimit: 50,
};

/**
 * Get active configuration for the user's Android SMS Gateway app
 */
export async function getPhoneGatewayConfig(): Promise<PhoneGatewayConfig> {
  try {
    const db = adminDb();
    const { data } = await db
      .from('app_settings')
      .select('*')
      .eq('key', 'android_phone_gateway_config')
      .maybeSingle();

    if (data?.value) {
      return {
        ...DEFAULT_CONFIG,
        ...(data.value as Partial<PhoneGatewayConfig>),
      };
    }
  } catch {
    // fallback
  }
  return DEFAULT_CONFIG;
}

/**
 * Save configuration for the user's Android SMS Gateway app
 */
export async function savePhoneGatewayConfig(cfg: Partial<PhoneGatewayConfig>): Promise<PhoneGatewayConfig> {
  const current = await getPhoneGatewayConfig();
  const updated: PhoneGatewayConfig = {
    ...current,
    ...cfg,
  };

  const db = adminDb();
  await db.from('app_settings').upsert(
    {
      key: 'android_phone_gateway_config',
      value: updated,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key' }
  );

  return updated;
}

/**
 * Ping the user's Android phone gateway to get real-time battery, connection, and health
 */
export async function checkPhoneGatewayHealth(customConfig?: Partial<PhoneGatewayConfig>): Promise<{
  online: boolean;
  battery: number | null;
  charging: boolean;
  version: string | null;
  statusText: string;
  latencyMs: number;
  baseUrl: string;
}> {
  const cfg = customConfig ? { ...(await getPhoneGatewayConfig()), ...customConfig } : await getPhoneGatewayConfig();
  const startTime = Date.now();

  try {
    const url = cfg.baseUrl.replace(/\/$/, '') + '/health';
    const authHeader = 'Basic ' + Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      return {
        online: false,
        battery: null,
        charging: false,
        version: null,
        statusText: `Gateway responded with HTTP ${res.status} (${res.statusText})`,
        latencyMs,
        baseUrl: cfg.baseUrl,
      };
    }

    const data = await res.json();
    const batteryLevel = data.checks?.['battery:level']?.observedValue ?? null;
    const isCharging = (data.checks?.['battery:charging']?.observedValue ?? 0) > 0;
    const version = data.version || '1.77';

    return {
      online: true,
      battery: batteryLevel,
      charging: isCharging,
      version,
      statusText: `Online • Battery ${batteryLevel ?? '—'}% ${isCharging ? '(Charging)' : ''}`,
      latencyMs,
      baseUrl: cfg.baseUrl,
    };
  } catch (err: any) {
    return {
      online: false,
      battery: null,
      charging: false,
      version: null,
      statusText: err?.name === 'AbortError' ? 'Connection timed out (Check phone Wi-Fi)' : (err?.message || 'Offline'),
      latencyMs: Date.now() - startTime,
      baseUrl: cfg.baseUrl,
    };
  }
}

/**
 * Clean & normalize Indian telephone number to international format (e.g. +919811000000)
 */
export function formatPhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  if (digits.length === 11 && digits.startsWith('0')) return `+91${digits.slice(1)}`;
  return phone.startsWith('+') ? phone : `+${digits}`;
}

/**
 * Send an SMS message directly through the user's Android phone SIM card
 */
export async function sendSmsViaPhoneGateway(params: {
  phoneNumber: string;
  message: string;
  simNumber?: number;
  leadId?: string;
  senderActor?: string;
}): Promise<{
  ok: boolean;
  messageId?: string;
  error?: string;
}> {
  const cfg = await getPhoneGatewayConfig();
  if (!cfg.enabled) {
    return { ok: false, error: 'Phone SMS Gateway is currently disabled in settings.' };
  }

  const cleanPhone = formatPhoneNumber(params.phoneNumber);
  const targetSim = params.simNumber || cfg.simNumber || 1;

  try {
    const url = cfg.baseUrl.replace(/\/$/, '') + '/message';
    const authHeader = 'Basic ' + Buffer.from(`${cfg.username}:${cfg.password}`).toString('base64');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: params.message,
        phoneNumbers: [cleanPhone],
        simNumber: targetSim,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    const data = await res.json().catch(() => ({}));

    if (res.status === 200 || res.status === 201 || res.status === 202) {
      const messageId = data.id || `msg_${Date.now()}`;

      // Log activity
      await logActivity({
        lead_id: params.leadId || null,
        action: 'sms_sent',
        description: `SMS dispatched via Android Phone SIM ${targetSim} to ${cleanPhone}: "${params.message.slice(0, 40)}..."`,
        actor: params.senderActor || 'Owner',
        metadata: {
          phone: cleanPhone,
          messageId,
          simNumber: targetSim,
          gateway: 'android-sms-gateway',
        },
      });

      return {
        ok: true,
        messageId,
      };
    } else {
      return {
        ok: false,
        error: data.message || `Phone gateway error (HTTP ${res.status})`,
      };
    }
  } catch (err: any) {
    return {
      ok: false,
      error: `Failed to connect to phone gateway at ${cfg.baseUrl}: ${err.message}`,
    };
  }
}
