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

    if (job.status !== 'queued') {
      return NextResponse.json({ error: `Cannot approve job with status ${job.status}.` }, { status: 409 });
    }

    const now = new Date().toISOString();
    await db
      .from('sms_jobs')
      .update({
        requires_manual_approval: false,
        approved_at: now,
      })
      .eq('id', id);

    await logActivity({
      lead_id: job.lead_id,
      action: 'sms_approved',
      description: `Approved queued SMS to ${job.recipient_phone} (${job.lead_company_name})`,
      actor: auth.user.email || 'Owner',
    });

    return NextResponse.json({
      ok: true,
      message: 'SMS Job approved and ready for Android SIM dispatch.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to approve job' }, { status: 500 });
  }
}
