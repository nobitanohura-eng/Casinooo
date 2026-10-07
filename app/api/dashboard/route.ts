import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { DashboardMetrics, Lead } from '@/lib/types';

export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const range = url.searchParams.get('range') || 'all';

    const db = adminDb();

    // Fetch leads
    let query = db.from('leads').select('*');

    if (range === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      query = query.gte('created_at', today.toISOString());
    } else if (range === '7d') {
      const past7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      query = query.gte('created_at', past7.toISOString());
    } else if (range === '30d') {
      const past30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      query = query.gte('created_at', past30.toISOString());
    }

    const { data: leads, error: leadsErr } = await query;
    if (leadsErr) throw leadsErr;

    const allLeads: Lead[] = (leads || []) as Lead[];
    const now = new Date();

    const totalLeads = allLeads.length;
    const newLeads = allLeads.filter((l: Lead) => l.status === 'new').length;
    const contactedLeads = allLeads.filter((l: Lead) => l.status === 'contacted').length;
    const interestedLeads = allLeads.filter((l: Lead) => l.status === 'interested').length;
    const repliesReceived = allLeads.filter((l: Lead) => l.status === 'replied').length;
    const followupsDue = allLeads.filter(
      (l: Lead) => l.next_follow_up_date && new Date(l.next_follow_up_date) <= now && !l.opted_out
    ).length;
    const optedOutCount = allLeads.filter((l: Lead) => l.opted_out || l.status === 'do_not_contact').length;
    const confirmedEnquiries = allLeads.filter((l: Lead) => l.status === 'quotation_requested' || l.status === 'interested').length;
    const confirmedOrders = allLeads.filter((l: Lead) => l.status === 'order_confirmed' || l.status === 'customer').length;

    // Distinguish actual revenue from estimated opportunity value
    const actualRevenue = allLeads
      .filter((l: Lead) => l.status === 'order_confirmed' || l.status === 'customer')
      .reduce((sum: number, l: Lead) => sum + (Number(l.actual_revenue) || 0), 0);

    const estimatedOpportunityValue = allLeads
      .filter((l: Lead) => !['not_interested', 'do_not_contact'].includes(l.status))
      .reduce((sum: number, l: Lead) => sum + (Number(l.estimated_value) || 0), 0);

    // Fetch recent activity
    const { data: activities } = await db
      .from('activity_logs')
      .select('*, lead:leads(company_name)')
      .order('created_at', { ascending: false })
      .limit(10);

    // Build weekly activity chart for past 7 days based on real activity logs or lead creations
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weeklyMap = new Map<string, number>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      weeklyMap.set(dateKey, 0);
    }

    allLeads.forEach((l: Lead) => {
      const dateKey = l.created_at ? l.created_at.slice(0, 10) : '';
      if (weeklyMap.has(dateKey)) {
        weeklyMap.set(dateKey, (weeklyMap.get(dateKey) || 0) + 1);
      }
    });

    const weeklyActivity = Array.from(weeklyMap.entries()).map(([dateStr, count]) => {
      const d = new Date(dateStr);
      return {
        day: days[d.getDay()],
        count,
        date: dateStr,
      };
    });

    const metrics: DashboardMetrics = {
      totalLeads,
      newLeads,
      contactedLeads,
      interestedLeads,
      repliesReceived,
      followupsDue,
      optedOutCount,
      confirmedEnquiries,
      confirmedOrders,
      actualRevenue,
      estimatedOpportunityValue,
      recentActivity: activities || [],
      weeklyActivity,
    };

    return NextResponse.json({ metrics });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not load dashboard data' },
      { status: 500 }
    );
  }
}
