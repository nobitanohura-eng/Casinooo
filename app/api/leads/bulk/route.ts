import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { suppressEmail } from '@/lib/suppression';
import { logActivity } from '@/lib/activity';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const { action, leadIds, status } = await req.json();

    if (!Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'No leads selected' }, { status: 400 });
    }

    // MANDATORY SECURITY CONTROL: Bulk sending is strictly forbidden!
    if (action === 'send' || action === 'email') {
      return NextResponse.json(
        {
          error:
            'Bulk email sending is strictly disabled by policy. Each outreach message requires individual human review, personalization, and explicit approval.',
        },
        { status: 403 }
      );
    }

    const db = adminDb();

    if (action === 'update_status') {
      if (!status) return NextResponse.json({ error: 'Status is required' }, { status: 400 });

      const { error } = await db
        .from('leads')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', leadIds);

      if (error) throw error;

      await logActivity({
        action: 'bulk_status_update',
        description: `Updated status to "${status}" for ${leadIds.length} leads`,
        actor: auth.user.email || 'Owner',
      });

      return NextResponse.json({ success: true, count: leadIds.length });
    }

    if (action === 'suppress') {
      const { data: leadsToSuppress } = await db.from('leads').select('email').in('id', leadIds);

      for (const l of leadsToSuppress || []) {
        if (l.email) {
          await suppressEmail(l.email, 'manual_request', 'bulk_action');
        }
      }

      await logActivity({
        action: 'bulk_suppress',
        description: `Permanently suppressed ${leadIds.length} leads`,
        actor: auth.user.email || 'Owner',
      });

      return NextResponse.json({ success: true, count: leadIds.length });
    }

    if (action === 'delete') {
      const { error } = await db.from('leads').delete().in('id', leadIds);
      if (error) throw error;

      await logActivity({
        action: 'bulk_delete',
        description: `Deleted ${leadIds.length} leads`,
        actor: auth.user.email || 'Owner',
      });

      return NextResponse.json({ success: true, count: leadIds.length });
    }

    return NextResponse.json({ error: 'Invalid bulk action' }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Bulk action failed' },
      { status: 500 }
    );
  }
}
