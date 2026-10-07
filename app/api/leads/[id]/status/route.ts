import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { draftApproveSchema } from '@/lib/validations';
import { isEmailSuppressed, suppressEmail } from '@/lib/suppression';
import { logActivity } from '@/lib/activity';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    const body = await req.json();
    const { action, next_follow_up_date, next_follow_up_at, actual_revenue, estimated_value } = body;
    const db = adminDb();

    const { data: lead, error: readErr } = await db.from('leads').select('*').eq('id', id).single();
    if (readErr || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    // 1. APPROVAL ACTION
    if (action === 'approve') {
      if (lead.opted_out || lead.status === 'do_not_contact') {
        return NextResponse.json({ error: 'This lead has opted out and is suppressed from outreach.' }, { status: 409 });
      }

      if (lead.email) {
        const suppressed = await isEmailSuppressed(lead.email);
        if (suppressed) {
          return NextResponse.json({ error: 'This recipient is globally suppressed.' }, { status: 409 });
        }
      }

      const parsed = draftApproveSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: parsed.error.errors[0]?.message || 'Valid subject and body required' },
          { status: 400 }
        );
      }

      const now = new Date().toISOString();
      const userActor = auth.user.email || 'Owner';

      // Update lead
      const { data: updatedLead, error: leadErr } = await db
        .from('leads')
        .update({
          email_subject: parsed.data.subject,
          email_body: parsed.data.body,
          approved_at: now,
          status: 'approved',
          updated_at: now,
        })
        .eq('id', id)
        .select('*')
        .single();

      if (leadErr) throw leadErr;

      // Update or create approved draft in email_drafts
      await db
        .from('email_drafts')
        .update({
          subject: parsed.data.subject,
          body: parsed.data.body,
          status: 'approved',
          approved_by: userActor,
          approved_at: now,
          updated_at: now,
        })
        .eq('lead_id', id)
        .eq('status', 'draft');

      await logActivity({
        lead_id: id,
        action: 'draft_approved',
        description: `Draft approved for ${lead.company_name} (Subject: "${parsed.data.subject.slice(0, 40)}...")`,
        actor: userActor,
      });

      return NextResponse.json({ lead: updatedLead });
    }

    // 2. SCHEDULE FOLLOW-UP
    if (action === 'followup') {
      const followUpTime = next_follow_up_date || next_follow_up_at;
      const { data: updatedLead, error } = await db
        .from('leads')
        .update({
          next_follow_up_date: followUpTime || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      if (followUpTime) {
        await db.from('follow_ups').insert({
          lead_id: id,
          scheduled_at: new Date(followUpTime).toISOString(),
          notes: body.notes || 'Follow-up scheduled',
          status: 'pending',
        });
      }

      await logActivity({
        lead_id: id,
        action: 'followup_scheduled',
        description: `Follow-up set for ${new Date(followUpTime).toLocaleDateString('en-IN')}`,
        actor: auth.user.email || 'Owner',
      });

      return NextResponse.json({ lead: updatedLead });
    }

    // 3. OPT-OUT / SUPPRESSION ACTION
    if (action === 'optout' || action === 'do_not_contact') {
      if (lead.email) {
        await suppressEmail(lead.email, 'manual_request', 'status_route');
      }

      const { data: updatedLead, error } = await db
        .from('leads')
        .update({
          opted_out: true,
          status: 'do_not_contact',
          next_follow_up_date: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      await logActivity({
        lead_id: id,
        action: 'lead_opted_out',
        description: `Marked as do-not-contact / suppressed: ${lead.company_name}`,
        actor: auth.user.email || 'Owner',
      });

      return NextResponse.json({ lead: updatedLead });
    }

    // 4. GENERAL STATUS UPDATES
    const validStatuses = [
      'new',
      'researching',
      'ready_for_review',
      'contacted',
      'replied',
      'interested',
      'quotation_requested',
      'order_confirmed',
      'not_interested',
      'do_not_contact',
      'customer',
      'drafted',
      'approved',
    ];

    if (!validStatuses.includes(action)) {
      return NextResponse.json({ error: `Unknown status action: ${action}` }, { status: 400 });
    }

    const updates: Record<string, unknown> = {
      status: action,
      updated_at: new Date().toISOString(),
    };

    if (actual_revenue !== undefined) updates.actual_revenue = Number(actual_revenue);
    if (estimated_value !== undefined) updates.estimated_value = Number(estimated_value);

    const { data: updatedLead, error } = await db
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) throw error;

    await logActivity({
      lead_id: id,
      action: 'status_changed',
      description: `Status changed to "${action}" for ${lead.company_name}`,
      actor: auth.user.email || 'Owner',
    });

    return NextResponse.json({ lead: updatedLead });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Status update failed' },
      { status: 400 }
    );
  }
}
