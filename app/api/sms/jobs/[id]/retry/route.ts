import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { logActivity } from '@/lib/activity';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    const db = adminDb();

    const { data: job } = await db.from('sms_jobs').select('*').eq('id', id).maybeSingle();
    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    if (job.status !== 'failed' && job.status !== 'unknown') {
      return NextResponse.json({ error: `Only failed or unknown jobs can be retried. Current: ${job.status}` }, { status: 400 });
    }

    if (job.retry_count >= job.max_retries) {
      return NextResponse.json({ error: `Max retry limit (${job.max_retries}) reached for this job.` }, { status: 400 });
    }

    const now = new Date().toISOString();
    await db
      .from('sms_jobs')
      .update({
        status: 'queued',
        device_id: null,
        claimed_at: null,
        failed_at: null,
        error_code: null,
        error_message: null,
        requires_manual_approval: false,
        approved_at: now,
      })
      .eq('id', id);

    await logActivity({
      lead_id: job.lead_id,
      action: 'sms_retried',
      description: `Retried failed SMS to ${job.recipient_phone} (${job.lead_company_name})`,
      actor: auth.user.email || 'Owner',
    });

    return NextResponse.json({
      ok: true,
      message: 'Job re-queued for dispatch.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to retry job' }, { status: 500 });
  }
}
