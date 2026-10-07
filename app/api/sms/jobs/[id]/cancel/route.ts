import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';

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

    if (job.status === 'sent' || job.status === 'delivered') {
      return NextResponse.json({ error: 'Cannot cancel an SMS that has already been sent.' }, { status: 400 });
    }

    await db.from('sms_jobs').delete().eq('id', id);

    return NextResponse.json({
      ok: true,
      message: 'SMS Job cancelled and removed from queue.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to cancel job' }, { status: 500 });
  }
}
