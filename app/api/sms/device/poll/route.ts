import { NextResponse } from 'next/server';
import { authenticateDevice, getSmsSettings } from '@/lib/sms';
import { adminDb } from '@/lib/admin';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const device = await authenticateDevice(authHeader);

  if (!device) {
    return NextResponse.json({ error: 'Unauthorized device. Please re-pair your Android phone.' }, { status: 401 });
  }

  const db = adminDb();
  const settings = await getSmsSettings();

  // If SMS gateway is globally disabled, return empty jobs
  if (!settings.enabled) {
    return NextResponse.json({
      ok: true,
      paused: true,
      jobs: [],
      message: 'SMS Gateway is paused by admin.',
    });
  }

  // Update last seen
  const now = new Date().toISOString();
  await db.from('sms_devices').update({ last_seen_at: now, status: 'online' }).eq('id', device.id);

  // Fetch pending queued jobs that are approved
  const { data: queuedJobs } = await db
    .from('sms_jobs')
    .select('*')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(5);

  const eligibleJobs = (queuedJobs || []).filter(
    (j: any) => !j.requires_manual_approval || j.approved_at !== null
  );

  // Claim eligible jobs
  const claimedJobs = [];
  for (const job of eligibleJobs) {
    await db
      .from('sms_jobs')
      .update({
        status: 'claimed',
        claimed_at: now,
        device_id: device.id,
      })
      .eq('id', job.id);

    claimedJobs.push({
      ...job,
      status: 'claimed',
      claimed_at: now,
      device_id: device.id,
    });
  }

  return NextResponse.json({
    ok: true,
    device_id: device.id,
    jobs_count: claimedJobs.length,
    jobs: claimedJobs,
  });
}
