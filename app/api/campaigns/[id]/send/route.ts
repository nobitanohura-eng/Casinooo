import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { getAppSettings, checkDailySendLimit } from '@/lib/settings';
import { isEmailSuppressed } from '@/lib/suppression';
import { logActivity } from '@/lib/activity';
import { formatEmailBodyToHtml } from '@/lib/email-templates';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await ctx.params; // draft id
    const body = await req.json().catch(() => ({}));
    const { confirm, idempotency_key } = body;

    if (confirm !== true) {
      return NextResponse.json({ error: 'Explicit final confirmation required.' }, { status: 400 });
    }

    const db = adminDb();

    // 1. Global pause switch
    const settings = await getAppSettings();
    if (settings.global_email_paused) {
      return NextResponse.json(
        { error: 'All outbound email is currently PAUSED by global safety control.' },
        { status: 403 }
      );
    }

    // 2. Daily send limit
    const rateLimit = await checkDailySendLimit();
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: `Daily sending limit reached (${rateLimit.sentToday}/${rateLimit.limit}).` },
        { status: 429 }
      );
    }

    // 3. Draft check
    const { data: draft, error: draftErr } = await db
      .from('email_drafts')
      .select('*, lead:leads(*)')
      .eq('id', id)
      .single();

    if (draftErr || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    // Idempotency check
    const effectiveKey = idempotency_key || `send_draft_${id}_${Date.now()}`;
    const { data: existingAttempt } = await db
      .from('send_attempts')
      .select('*')
      .eq('idempotency_key', effectiveKey)
      .maybeSingle();

    if (existingAttempt && existingAttempt.status === 'sent') {
      return NextResponse.json({
        message: 'Email already sent (idempotent)',
        resendId: existingAttempt.provider_message_id,
      });
    }

    if (draft.status !== 'approved') {
      return NextResponse.json({ error: 'Draft must be approved before sending.' }, { status: 409 });
    }

    if (draft.lead?.opted_out || draft.lead?.status === 'do_not_contact') {
      return NextResponse.json({ error: 'Recipient is suppressed from outreach.' }, { status: 409 });
    }

    if (await isEmailSuppressed(draft.recipient_email)) {
      return NextResponse.json({ error: 'Recipient is globally suppressed.' }, { status: 409 });
    }

    const { data: attemptRecord, error: attemptErr } = await db
      .from('send_attempts')
      .upsert(
        {
          idempotency_key: effectiveKey,
          draft_id: id,
          lead_id: draft.lead_id,
          recipient_email: draft.recipient_email,
          status: 'pending',
          provider: 'resend',
          attempted_at: new Date().toISOString(),
        },
        { onConflict: 'idempotency_key' }
      )
      .select('*')
      .single();

    if (attemptErr) throw attemptErr;

    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      await db
        .from('send_attempts')
        .update({ status: 'failed', error_message: 'Resend credentials missing' })
        .eq('id', attemptRecord.id);

      return NextResponse.json({ error: 'Email configuration incomplete.' }, { status: 503 });
    }

    const baseUrl = (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const optoutUrl = `${baseUrl}/api/optout/${draft.lead?.optout_token}`;
    const htmlContent = formatEmailBodyToHtml(draft.body, optoutUrl);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const sendResult = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: draft.recipient_email,
      subject: draft.subject,
      text: `${draft.body}\n\nUnsubscribe: ${optoutUrl}`,
      html: htmlContent,
      headers: {
        'List-Unsubscribe': `<${optoutUrl}>`,
      },
    });

    if (sendResult.error) {
      await db
        .from('send_attempts')
        .update({ status: 'failed', error_message: sendResult.error.message })
        .eq('id', attemptRecord.id);

      return NextResponse.json({ error: sendResult.error.message }, { status: 400 });
    }

    const providerMessageId = sendResult.data?.id || `resend_${Date.now()}`;
    const sentAt = new Date().toISOString();

    await db.from('send_attempts').update({ status: 'sent', provider_message_id: providerMessageId }).eq('id', attemptRecord.id);
    await db.from('email_drafts').update({ status: 'sent', sent_at: sentAt, updated_at: sentAt }).eq('id', id);

    if (draft.lead_id) {
      const defaultNextFollowup = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
      await db
        .from('leads')
        .update({
          status: 'contacted',
          sent_at: sentAt,
          last_contact_date: sentAt,
          next_follow_up_date: defaultNextFollowup,
          updated_at: sentAt,
        })
        .eq('id', draft.lead_id);

      await db.from('follow_ups').insert({
        lead_id: draft.lead_id,
        scheduled_at: defaultNextFollowup,
        notes: 'Outreach email sent. Scheduled follow-up in 5 days.',
        status: 'pending',
      });
    }

    await logActivity({
      lead_id: draft.lead_id,
      action: 'email_sent',
      description: `Sent outreach to ${draft.recipient_email}`,
      actor: auth.user.email || 'Owner',
      metadata: { resendId: providerMessageId },
    });

    return NextResponse.json({ success: true, resendId: providerMessageId });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Sending failed' },
      { status: 400 }
    );
  }
}
