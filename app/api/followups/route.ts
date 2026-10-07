import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { followupCreateSchema } from '@/lib/validations';
import { logActivity } from '@/lib/activity';
import { FollowUp } from '@/lib/types';

export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const db = adminDb();
    const { data: followups, error } = await db
      .from('follow_ups')
      .select('*, lead:leads(id, company_name, contact_name, phone, email, status, city, category, opted_out)')
      .order('scheduled_at', { ascending: true });

    if (error) throw error;

    const all: FollowUp[] = (followups || []) as FollowUp[];
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const overdue = all.filter(
      (f: FollowUp) => f.status === 'pending' && new Date(f.scheduled_at).getTime() < todayStart
    );
    const today = all.filter((f: FollowUp) => {
      const t = new Date(f.scheduled_at).getTime();
      return f.status === 'pending' && t >= todayStart && t < todayEnd;
    });
    const upcoming = all.filter(
      (f: FollowUp) => f.status === 'pending' && new Date(f.scheduled_at).getTime() >= todayEnd
    );
    const completed = all.filter((f: FollowUp) => f.status === 'completed');

    return NextResponse.json({
      all,
      overdue,
      today,
      upcoming,
      completed,
      counts: {
        overdue: overdue.length,
        today: today.length,
        upcoming: upcoming.length,
        completed: completed.length,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not load follow-ups' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const raw = await req.json();
    const parsed = followupCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data' },
        { status: 400 }
      );
    }

    const val = parsed.data;
    const db = adminDb();

    // Check if lead opted out
    const { data: lead } = await db.from('leads').select('company_name, opted_out, status').eq('id', val.lead_id).single();
    if (lead?.opted_out || lead?.status === 'do_not_contact') {
      return NextResponse.json(
        { error: 'Cannot schedule follow-up for a suppressed / opted-out lead.' },
        { status: 409 }
      );
    }

    const { data: followup, error } = await db
      .from('follow_ups')
      .insert({
        lead_id: val.lead_id,
        scheduled_at: new Date(val.scheduled_at).toISOString(),
        notes: val.notes || null,
        status: 'pending',
      })
      .select('*')
      .single();

    if (error) throw error;

    // Update lead next_follow_up_date
    await db
      .from('leads')
      .update({
        next_follow_up_date: new Date(val.scheduled_at).toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', val.lead_id);

    await logActivity({
      lead_id: val.lead_id,
      action: 'followup_created',
      description: `Scheduled follow-up for ${lead?.company_name || val.lead_id} on ${new Date(val.scheduled_at).toLocaleDateString('en-IN')}`,
      actor: auth.user.email || 'Owner',
    });

    return NextResponse.json({ followup }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not create follow-up' },
      { status: 500 }
    );
  }
}
