import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';

export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');

    const db = adminDb();
    let query = db
      .from('email_drafts')
      .select('*, lead:leads(company_name, contact_name, city, category, opted_out, status)')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: drafts, error } = await query;
    if (error) throw error;

    return NextResponse.json({ drafts: drafts || [] });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not load campaign drafts' },
      { status: 500 }
    );
  }
}
