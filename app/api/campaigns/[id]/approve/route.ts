import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { draftApproveSchema } from '@/lib/validations';
import { isEmailSuppressed } from '@/lib/suppression';
import { logActivity } from '@/lib/activity';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await ctx.params; // draft id
    const body = await req.json();

    const parsed = draftApproveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Valid subject and body required' },
        { status: 400 }
      );
    }

    const db = adminDb();
    const { data: draft, error: draftErr } = await db.from('email_drafts').select('*, lead:leads(*)').eq('id', id).single();
    if (draftErr || !draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 });
    }

    if (draft.lead?.opted_out || draft.lead?.status === 'do_not_contact') {
      return NextResponse.json({ error: 'Recipient has opted out and is suppressed.' }, { status: 409 });
    }

    if (draft.recipient_email) {
      const suppressed = await isEmailSuppressed(draft.recipient_email);
      if (suppressed) {
        return NextResponse.json({ error: 'Recipient email is globally suppressed.' }, { status: 409 });
      }
    }

    const now = new Date().toISOString();
    const actor = auth.user.email || 'Owner';

    // Update draft
    const { data: updatedDraft, error: updateDraftErr } = await db
      .from('email_drafts')
      .update({
        subject: parsed.data.subject,
        body: parsed.data.body,
        status: 'approved',
        approved_by: actor,
        approved_at: now,
        updated_at: now,
      })
      .eq('id', id)
      .select('*')
      .single();

    if (updateDraftErr) throw updateDraftErr;

    // Update lead
    if (draft.lead_id) {
      await db
        .from('leads')
        .update({
          email_subject: parsed.data.subject,
          email_body: parsed.data.body,
          status: 'approved',
          approved_at: now,
          updated_at: now,
        })
        .eq('id', draft.lead_id);
    }

    await logActivity({
      lead_id: draft.lead_id,
      action: 'draft_approved',
      description: `Draft approved for ${draft.recipient_email}`,
      actor,
    });

    return NextResponse.json({ draft: updatedDraft });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Approval failed' },
      { status: 400 }
    );
  }
}
