import { NextResponse } from 'next/server';
import { authenticateDevice } from '@/lib/sms';
import { adminDb } from '@/lib/admin';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const device = await authenticateDevice(authHeader);

  if (!device) {
    return NextResponse.json({ error: 'Unauthorized device.' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { battery_level, is_charging, selected_sim_slot, sim_carrier, sim_count, app_version } = body;

    const db = adminDb();
    const now = new Date().toISOString();

    const updates: any = {
      last_seen_at: now,
      status: 'online',
    };

    if (typeof battery_level === 'number') updates.battery_level = Math.max(0, Math.min(100, battery_level));
    if (typeof is_charging === 'boolean') updates.is_charging = is_charging;
    if (typeof selected_sim_slot === 'number') updates.selected_sim_slot = selected_sim_slot;
    if (sim_carrier) updates.sim_carrier = sim_carrier;
    if (typeof sim_count === 'number') updates.sim_count = sim_count;
    if (app_version) updates.app_version = app_version;

    await db.from('sms_devices').update(updates).eq('id', device.id);

    return NextResponse.json({
      ok: true,
      last_seen_at: now,
      status: 'online',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Heartbeat update failed' }, { status: 500 });
  }
}
