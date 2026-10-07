import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/admin';
import { suppressEmail } from '@/lib/suppression';
import { logActivity } from '@/lib/activity';
import { Webhook } from 'svix';

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
    const headersList = req.headers;

    // 1. Signature Verification with Svix if secret is set
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (webhookSecret) {
      const svixId = headersList.get('svix-id');
      const svixTimestamp = headersList.get('svix-timestamp');
      const svixSignature = headersList.get('svix-signature');

      if (!svixId || !svixTimestamp || !svixSignature) {
        return NextResponse.json({ error: 'Missing svix signature headers' }, { status: 401 });
      }

      try {
        const wh = new Webhook(webhookSecret);
        wh.verify(rawBody, {
          'svix-id': svixId,
          'svix-timestamp': svixTimestamp,
          'svix-signature': svixSignature,
        });
      } catch (err) {
        console.error('Resend webhook signature verification failed:', err);
        return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const { type, data } = payload;

    if (!type || !data) {
      return NextResponse.json({ error: 'Invalid webhook payload structure' }, { status: 400 });
    }

    const emailId = data.email_id || data.id;
    const recipient = Array.isArray(data.to) ? data.to[0] : data.to;
    const db = adminDb();

    // 2. IDEMPOTENT EVENT CHECK
    // Check if this exact event for this email was already logged
    const { data: existingEvent } = await db
      .from('email_events')
      .select('id')
      .eq('provider_message_id', emailId)
      .eq('event_type', type)
      .maybeSingle();

    if (existingEvent) {
      return NextResponse.json({ message: 'Event already processed' });
    }

    // Find associated lead from send_attempts or recipient email
    let leadId = null;
    const { data: attempt } = await db
      .from('send_attempts')
      .select('lead_id, draft_id')
      .eq('provider_message_id', emailId)
      .maybeSingle();

    if (attempt) {
      leadId = attempt.lead_id;
    } else if (recipient) {
      const { data: lead } = await db.from('leads').select('id').eq('email', recipient).maybeSingle();
      if (lead) leadId = lead.id;
    }

    // 3. LOG EVENT
    await db.from('email_events').insert({
      provider_message_id: emailId,
      event_type: type.replace('email.', ''),
      recipient_email: recipient || null,
      lead_id: leadId,
      payload,
      occurred_at: data.created_at || new Date().toISOString(),
    });

    // 4. HANDLE EVENT TYPES
    if (type === 'email.delivered') {
      if (attempt?.draft_id) {
        await db.from('email_drafts').update({ updated_at: new Date().toISOString() }).eq('id', attempt.draft_id);
      }
      await logActivity({
        lead_id: leadId,
        action: 'email_delivered',
        description: `Email delivered to ${recipient} (Provider ID: ${emailId})`,
        actor: 'Resend Webhook',
      });
    } else if (type === 'email.bounced' || type === 'email.complained') {
      // PERMANENT SUPPRESSION ON BOUNCE OR COMPLAINT
      const reason = type === 'email.bounced' ? 'bounce' : 'complaint';
      if (recipient) {
        await suppressEmail(recipient, reason, 'resend_webhook');
      }

      if (attempt?.draft_id) {
        await db
          .from('email_drafts')
          .update({ status: 'failed', error_message: `Provider reported: ${type}` })
          .eq('id', attempt.draft_id);
      }

      await logActivity({
        lead_id: leadId,
        action: `email_${reason}`,
        description: `Recipient ${recipient} generated a ${reason}. Permanently suppressed.`,
        actor: 'Resend Webhook',
      });
    }

    return NextResponse.json({ success: true, processed: type });
  } catch (err) {
    console.error('Error handling Resend webhook:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Webhook handling failed' },
      { status: 500 }
    );
  }
}
