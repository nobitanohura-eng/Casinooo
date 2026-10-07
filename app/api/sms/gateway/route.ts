import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { getSmsSettings, updateSmsSettings, getSmsTemplates, checkDailySmsLimit } from '@/lib/sms';

export async function GET() {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const db = adminDb();
    const settings = await getSmsSettings();
    const templates = await getSmsTemplates();
    const dailyLimit = await checkDailySmsLimit();

    // Fetch all paired devices
    const { data: devices } = await db.from('sms_devices').select('*').order('paired_at', { ascending: false });

    // Mark devices offline if last seen > 3 minutes ago
    const now = Date.now();
    const updatedDevices = (devices || []).map((d: any) => {
      const lastSeenTime = new Date(d.last_seen_at).getTime();
      const isOnline = d.status !== 'revoked' && now - lastSeenTime < 3 * 60 * 1000;
      return {
        ...d,
        status: d.status === 'revoked' ? 'revoked' : isOnline ? 'online' : 'offline',
      };
    });

    // Fetch SMS jobs counts
    const { data: allJobs } = await db.from('sms_jobs').select('*').order('created_at', { ascending: false });

    const counts = {
      queued: 0,
      claimed: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      unknown: 0,
      total: 0,
    };

    (allJobs || []).forEach((j: any) => {
      counts.total += 1;
      if (j.status in counts) {
        counts[j.status as keyof typeof counts] += 1;
      }
    });

    return NextResponse.json({
      ok: true,
      settings,
      daily_usage: {
        sent_today: dailyLimit.sentToday,
        daily_limit: dailyLimit.limit,
        remaining: Math.max(0, dailyLimit.limit - dailyLimit.sentToday),
      },
      counts,
      devices: updatedDevices,
      active_device: updatedDevices.find((d: any) => d.status === 'online') || null,
      templates,
      recent_jobs: (allJobs || []).slice(0, 15),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch gateway status' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const updated = await updateSmsSettings(body);

    return NextResponse.json({
      ok: true,
      settings: updated,
      message: 'SMS Gateway settings updated successfully.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 });
  }
}
