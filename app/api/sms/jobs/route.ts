import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { queueSmsJob } from '@/lib/sms';

export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const leadId = url.searchParams.get('lead_id');

    const db = adminDb();
    let query = db.from('sms_jobs').select('*').order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    const { data: jobs } = await query.limit(50);

    return NextResponse.json({
      ok: true,
      jobs: jobs || [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to list SMS jobs' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const { lead_id, lead_company_name, recipient_phone, message_text, sim_slot, requires_manual_approval, idempotency_key } = body;

    if (!lead_id || !recipient_phone || !message_text) {
      return NextResponse.json({ error: 'lead_id, recipient_phone, and message_text are required.' }, { status: 400 });
    }

    const result = await queueSmsJob({
      lead_id,
      lead_company_name: lead_company_name || 'Commercial Lead',
      recipient_phone,
      message_text,
      sim_slot: sim_slot ?? 0,
      requires_manual_approval: requires_manual_approval ?? false,
      idempotency_key,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      job: result.job,
      message: 'SMS Job successfully queued for paired Android phone.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to queue SMS job' }, { status: 500 });
  }
}
