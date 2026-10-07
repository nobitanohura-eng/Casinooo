import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { logActivity } from '@/lib/activity';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const db = adminDb();
    const { data: leads } = await db.from('leads').select('*');

    // Filter out mock / seed leads (lead-delhi-001..006 or example.com emails)
    const isMock = (l: any) =>
      l.id.startsWith('lead-delhi-') ||
      (l.email && l.email.endsWith('.example.com')) ||
      l.source === 'Noida Industrial Directory' ||
      l.source === 'Local shop visits';

    const mockLeads = (leads || []).filter(isMock);
    const count = mockLeads.length;

    for (const m of mockLeads) {
      await db.from('leads').delete().eq('id', m.id);
      await db.from('follow_ups').delete().eq('lead_id', m.id);
      await db.from('email_drafts').delete().eq('lead_id', m.id);
    }

    await logActivity({
      lead_id: null,
      action: 'mock_leads_cleared',
      description: `Cleared ${count} sample mock leads from CRM`,
      actor: auth.user.email || 'Owner',
    });

    return NextResponse.json({
      ok: true,
      cleared_count: count,
      message: `Successfully removed ${count} sample leads. Only real leads remain in your CRM.`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to clear mock leads' }, { status: 500 });
  }
}
