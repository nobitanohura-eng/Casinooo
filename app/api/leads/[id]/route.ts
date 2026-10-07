import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { leadUpdateSchema, normalizeEmail, normalizePhone } from '@/lib/validations';
import { suppressEmail } from '@/lib/suppression';
import { logActivity } from '@/lib/activity';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    const db = adminDb();

    const { data: lead, error: leadErr } = await db.from('leads').select('*').eq('id', id).single();
    if (leadErr || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    const { data: drafts } = await db.from('email_drafts').select('*').eq('lead_id', id).order('created_at', { ascending: false });
    const { data: followups } = await db.from('follow_ups').select('*').eq('lead_id', id).order('scheduled_at', { ascending: false });
    const { data: activities } = await db.from('activity_logs').select('*').eq('lead_id', id).order('created_at', { ascending: false });

    return NextResponse.json({ lead, drafts: drafts || [], followups: followups || [], activities: activities || [] });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Failed to retrieve lead' }, { status: 500 });
  }
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    const raw = await req.json();

    const parsed = leadUpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid update data' },
        { status: 400 }
      );
    }

    const val = parsed.data;
    const db = adminDb();

    // Check existing lead
    const { data: currentLead, error: currentErr } = await db.from('leads').select('*').eq('id', id).single();
    if (currentErr || !currentLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const update: Record<string, unknown> = { ...val, updated_at: new Date().toISOString() };

    // Check normalized email duplicate if email changed
    if (val.email !== undefined) {
      const normEmail = normalizeEmail(val.email);
      update.normalized_email = normEmail;
      if (normEmail && normEmail !== currentLead.normalized_email) {
        const { data: dup } = await db
          .from('leads')
          .select('id, company_name')
          .eq('normalized_email', normEmail)
          .neq('id', id)
          .maybeSingle();

        if (dup) {
          return NextResponse.json(
            { error: `Another company "${dup.company_name}" is already registered with email ${val.email}.` },
            { status: 409 }
          );
        }
      }
    }

    // Check normalized phone duplicate if phone changed
    if (val.phone !== undefined) {
      const normPhone = normalizePhone(val.phone);
      update.normalized_phone = normPhone;
      if (normPhone && normPhone !== currentLead.normalized_phone) {
        const { data: dup } = await db
          .from('leads')
          .select('id, company_name')
          .eq('normalized_phone', normPhone)
          .neq('id', id)
          .maybeSingle();

        if (dup) {
          return NextResponse.json(
            { error: `Another company "${dup.company_name}" is already registered with phone ${val.phone}.` },
            { status: 409 }
          );
        }
      }
    }

    // If status marked as do_not_contact or opted_out set to true, trigger central suppression!
    if (val.status === 'do_not_contact') {
      update.opted_out = true;
      update.next_follow_up_date = null;
      if (currentLead.email) {
        await suppressEmail(currentLead.email, 'manual_request', 'admin_edit');
      }
    }

    const { data: updatedLead, error: updateErr } = await db
      .from('leads')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();

    if (updateErr) throw updateErr;

    await logActivity({
      lead_id: id,
      action: 'lead_updated',
      description: `Lead updated for ${updatedLead.company_name}`,
      actor: auth.user.email || 'Owner',
      metadata: val,
    });

    return NextResponse.json({ lead: updatedLead });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Update failed' },
      { status: 400 }
    );
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    const db = adminDb();

    const { data: lead } = await db.from('leads').select('company_name').eq('id', id).maybeSingle();

    const { error } = await db.from('leads').delete().eq('id', id);
    if (error) throw error;

    await logActivity({
      lead_id: null,
      action: 'lead_deleted',
      description: `Lead for ${lead?.company_name || id} was deleted`,
      actor: auth.user.email || 'Owner',
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Delete failed' },
      { status: 400 }
    );
  }
}
