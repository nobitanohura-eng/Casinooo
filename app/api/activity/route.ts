import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';

export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100);

    const db = adminDb();
    const { data: activities, error } = await db
      .from('activity_logs')
      .select('*, lead:leads(company_name, category, city)')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ activities: activities || [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not load activities' },
      { status: 500 }
    );
  }
}
