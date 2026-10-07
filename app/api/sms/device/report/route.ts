import { NextResponse } from 'next/server';
import { authenticateDevice } from '@/lib/sms';
import { adminDb } from '@/lib/admin';
import { logActivity } from '@/lib/activity';

export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  const device = await authenticateDevice(authHeader);

  if (!device) {
    return NextResponse.json({ error: 'Unauthorized device.' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { job_id, status, error_code, error_message, carrier_reference } = body;

    if (!job_id || !status) {
      return NextResponse.json({ error: 'job_id and status are required.' }, { status: 400 });
    }

    const validStatuses = ['sent', 'delivered', 'failed', 'unknown'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}. Must be one of: ${validStatuses.join(', ')}` }, { status: 400 });
    }

    const db = adminDb();
    const { data: job } = await db.from('sms_jobs').select('*').eq('id', job_id).maybeSingle();

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    const now = new Date().toISOString();
    const updates: any = {
      status,
    };

    if (status === 'sent') {
      updates.sent_at = now;
      updates.error_code = null;
      updates.error_message = null;
    } else if (status === 'delivered') {
      updates.delivered_at = now;
    } else if (status === 'failed') {
      updates.failed_at = now;
      updates.error_code = error_code || 'SMS_SEND_FAILED';
      updates.error_message = error_message || 'Android SIM sending failed';
      updates.retry_count = (job.retry_count || 0) + 1;
    }

    await db.from('sms_jobs').update(updates).eq('id', job_id);

    // If job succeeded, log activity & update lead status
    if (status === 'sent') {
      if (job.lead_id) {
        await db
          .from('leads')
          .update({
            status: 'contacted',
            last_contact_date: now,
            updated_at: now,
          })
          .eq('id', job.lead_id);
      }

      await logActivity({
        lead_id: job.lead_id,
        action: 'sms_sent',
        description: `SMS successfully sent to ${job.lead_company_name} (${job.recipient_phone}) via SIM`,
        actor: `Android SIM (${device.device_name})`,
        metadata: { jobId: job_id, carrierRef: carrier_reference },
      });
    }

    return NextResponse.json({
      ok: true,
      job_id,
      status,
      updated_at: now,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Report processing failed' }, { status: 500 });
  }
}
