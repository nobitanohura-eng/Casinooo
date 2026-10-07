import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { followupUpdateSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity';

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    const body = await req.json();

    const parsed = followupUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.errors[0]?.message || 'Invalid update' }, { status: 400 });
    }

    const val = parsed.data;
    const db = adminDb();

    const { data: existing, error: readErr } = await db.from('follow_ups').select('*, lead:leads(company_name)').eq('id', id).single();
    if (readErr || !existing) return NextResponse.json({ error: 'Follow-up not found' }, { status: 404 });

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (val.status) {
      updates.status = val.status;
      if (val.status === 'completed') {
        updates.completed_at = new Date().toISOString();
      }
    }
    if (val.outcome !== undefined) updates.outcome = val.outcome;
    if (val.scheduled_at !== undefined) updates.scheduled_at = new Date(val.scheduled_at).toISOString();
    if (val.notes !== undefined) updates.notes = val.notes;

    const { data: updated, error } = await db.from('follow_ups').update(updates).eq('id', id).select('*').single();
    if (error) throw error;

    // If completed or cancelled, check if we need to clear or update the lead's next_follow_up_date
    if (val.status === 'completed' || val.status === 'cancelled') {
      // Find next pending follow-up if any
      const { data: nextPending } = await db
        .from('follow_ups')
        .select('scheduled_at')
        .eq('lead_id', existing.lead_id)
        .eq('status', 'pending')
        .order('scheduled_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      await db
        .from('leads')
        .update({
          next_follow_up_date: nextPending ? nextPending.scheduled_at : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.lead_id);
    } else if (val.scheduled_at) {
      await db
        .from('leads')
        .update({
          next_follow_up_date: new Date(val.scheduled_at).toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.lead_id);
    }

    await logActivity({
      lead_id: existing.lead_id,
      action: `followup_${val.status || 'updated'}`,
      description: `Follow-up for ${existing.lead?.company_name || 'lead'} marked as ${val.status || 'updated'}`,
      actor: auth.user.email || 'Owner',
    });

    return NextResponse.json({ followup: updated });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not update follow-up' },
      { status: 500 }
    );
  }
}
