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
    const { id } = await ctx.params;
    const body = await req.json().catch(() => ({}));
    const { confirm, idempotency_key } = body;

    // 1. MANDATORY CONFIRMATION CHECK
    if (confirm !== true) {
      return NextResponse.json(
        { error: 'Explicit final confirmation is required before sending an email.' },
        { status: 400 }
      );
    }

    const db = adminDb();

    // 2. GLOBAL PAUSE SWITCH CHECK
    const settings = await getAppSettings();
    if (settings.global_email_paused) {
      return NextResponse.json(
        {
          error:
            'All outbound email sending is currently PAUSED by global safety control. Sending is blocked.',
          paused: true,
        },
        { status: 403 }
      );
    }

    // 3. DAILY SENDING RATE LIMIT CHECK
    const rateLimit = await checkDailySendLimit();
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Conservative daily sending limit reached (${rateLimit.sentToday} of ${rateLimit.limit} sent in the last 24h). Outreach paused for safety.`,
          dailyLimitReached: true,
        },
        { status: 429 }
      );
    }

    // 4. VERIFY LEAD & DRAFT APPROVAL
    const { data: lead, error: leadErr } = await db.from('leads').select('*').eq('id', id).single();
    if (leadErr || !lead) {
      return NextResponse.json({ error: 'Lead not found.' }, { status: 404 });
    }

    if (!lead.email) {
      return NextResponse.json({ error: 'Lead has no email address configured.' }, { status: 400 });
    }

    // 5. SUPPRESSION & OPT-OUT CHECK
    if (lead.opted_out || lead.status === 'do_not_contact') {
      return NextResponse.json(
        { error: 'This recipient has opted out and is permanently suppressed from outreach.' },
        { status: 409 }
      );
    }

    const isSuppressed = await isEmailSuppressed(lead.email);
    if (isSuppressed) {
      return NextResponse.json(
        { error: 'This email is on the central suppression list. Sending is blocked.' },
        { status: 409 }
      );
    }

    // 5. DURABLE IDEMPOTENCY RECORD CHECK
    const effectiveKey = idempotency_key || `send_${id}_${Date.now()}`;
    const { data: existingAttempt } = await db
      .from('send_attempts')
      .select('*')
      .eq('idempotency_key', effectiveKey)
      .maybeSingle();

    if (existingAttempt) {
      if (existingAttempt.status === 'sent') {
        return NextResponse.json({
          message: 'This email was already sent successfully (idempotent response).',
          resendId: existingAttempt.provider_message_id,
          lead,
        });
      }
      if (existingAttempt.status === 'pending') {
        return NextResponse.json(
          { error: 'A send attempt with this key is already in progress. Please wait.' },
          { status: 409 }
        );
      }
    }

    // 6. APPROVAL CHECK
    if (!lead.email_subject || !lead.email_body || !lead.approved_at || lead.status !== 'approved') {
      return NextResponse.json(
        { error: 'Draft must be generated, reviewed, and explicitly approved before sending.' },
        { status: 409 }
      );
    }

    // 8. RECORD PENDING SEND ATTEMPT
    const { data: attemptRecord, error: attemptErr } = await db
      .from('send_attempts')
      .upsert(
        {
          idempotency_key: effectiveKey,
          lead_id: id,
          recipient_email: lead.email,
          status: 'pending',
          provider: 'resend',
          attempted_at: new Date().toISOString(),
        },
        { onConflict: 'idempotency_key' }
      )
      .select('*')
      .single();

    if (attemptErr) throw attemptErr;

    // 9. RESEND PROVIDER SEND
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      await db
        .from('send_attempts')
        .update({ status: 'failed', error_message: 'Resend API credentials not configured.' })
        .eq('id', attemptRecord.id);

      return NextResponse.json(
        { error: 'Email configuration is incomplete. RESEND_API_KEY or RESEND_FROM_EMAIL is missing.' },
        { status: 503 }
      );
    }

    const baseUrl = (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const optoutUrl = `${baseUrl}/api/optout/${lead.optout_token}`;
    const htmlContent = formatEmailBodyToHtml(lead.email_body, optoutUrl);

    const resend = new Resend(process.env.RESEND_API_KEY);

    let sendResult;
    try {
      sendResult = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: lead.email,
        subject: lead.email_subject,
        text: `${lead.email_body}\n\nStop future emails: ${optoutUrl}`,
        html: htmlContent,
        headers: {
          'List-Unsubscribe': `<${optoutUrl}>`,
        },
      });
    } catch (providerError) {
      const errMsg = providerError instanceof Error ? providerError.message : 'Provider network error';
      await db
        .from('send_attempts')
        .update({ status: 'failed', error_message: errMsg })
        .eq('id', attemptRecord.id);

      return NextResponse.json({ error: `Provider delivery failed: ${errMsg}` }, { status: 400 });
    }

    if (sendResult.error) {
      await db
        .from('send_attempts')
        .update({ status: 'failed', error_message: sendResult.error.message })
        .eq('id', attemptRecord.id);

      return NextResponse.json({ error: sendResult.error.message }, { status: 400 });
    }

    const providerMessageId = sendResult.data?.id || 'resend_' + Date.now();
    const sentAt = new Date().toISOString();

    // 10. UPDATE ATTEMPT RECORD
    await db
      .from('send_attempts')
      .update({
        status: 'sent',
        provider_message_id: providerMessageId,
      })
      .eq('id', attemptRecord.id);

    // 11. UPDATE DRAFT RECORD
    await db
      .from('email_drafts')
      .update({
        status: 'sent',
        sent_at: sentAt,
        updated_at: sentAt,
      })
      .eq('lead_id', id)
      .eq('status', 'approved');

    // 12. UPDATE LEAD STATUS & AUTO-SCHEDULE 5-DAY FOLLOW-UP
    const defaultNextFollowup = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString();
    const { data: updatedLead, error: updateLeadErr } = await db
      .from('leads')
      .update({
        status: 'contacted',
        sent_at: sentAt,
        last_contact_date: sentAt,
        next_follow_up_date: defaultNextFollowup,
        updated_at: sentAt,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateLeadErr) throw updateLeadErr;

    // Record follow-up entry
    await db.from('follow_ups').insert({
      lead_id: id,
      scheduled_at: defaultNextFollowup,
      notes: 'Initial outreach sent via Resend. Check for reply or follow up.',
      status: 'pending',
    });

    // 13. AUDIT ACTIVITY LOG
    await logActivity({
      lead_id: id,
      action: 'email_sent',
      description: `Approved outreach sent to ${lead.email} via Resend (ID: ${providerMessageId})`,
      actor: auth.user.email || 'Owner',
      metadata: { resendId: providerMessageId, recipient: lead.email },
    });

    return NextResponse.json({
      success: true,
      lead: updatedLead,
      resendId: providerMessageId,
      message: 'Email successfully accepted by Resend for delivery.',
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Email sending failed' },
      { status: 400 }
    );
  }
}
