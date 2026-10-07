import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/admin';
import { hashDeviceToken } from '@/lib/sms';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { pin, device_name, device_model, phone_number, sim_carrier, sim_count, app_version } = body;

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json({ error: 'Valid 6-digit PIN required.' }, { status: 400 });
    }

    const db = adminDb();
    const { data: pairingRecord } = await db
      .from('app_settings')
      .select('value')
      .eq('key', `sms_pairing_${pin}`)
      .maybeSingle();

    if (!pairingRecord || !pairingRecord.value) {
      return NextResponse.json({ error: 'Invalid or expired pairing PIN. Please generate a new code.' }, { status: 401 });
    }

    const { expires_at } = pairingRecord.value;
    if (new Date(expires_at).getTime() < Date.now()) {
      return NextResponse.json({ error: 'Pairing PIN has expired. Please generate a fresh code on the dashboard.' }, { status: 410 });
    }

    // Clean up pairing record
    await db.from('app_settings').delete().eq('key', `sms_pairing_${pin}`);

    // Generate permanent device token
    const rawDeviceToken = `sms_dev_tok_${crypto.randomBytes(32).toString('hex')}`;
    const tokenHash = hashDeviceToken(rawDeviceToken);
    const deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newDevice = {
      id: deviceId,
      device_name: device_name || 'Android Phone',
      device_model: device_model || 'Generic Android',
      phone_number: phone_number || '',
      auth_token_hash: tokenHash,
      status: 'online',
      paired_at: now,
      last_seen_at: now,
      battery_level: 100,
      is_charging: false,
      selected_sim_slot: 0,
      sim_carrier: sim_carrier || 'SIM 1',
      sim_count: sim_count || 1,
      app_version: app_version || '1.0.0',
    };

    await db.from('sms_devices').insert(newDevice);

    return NextResponse.json({
      ok: true,
      device_id: deviceId,
      token: rawDeviceToken,
      message: 'Android Phone successfully paired with Papa Transport SMS Gateway!',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Pairing completion failed' }, { status: 500 });
  }
}
