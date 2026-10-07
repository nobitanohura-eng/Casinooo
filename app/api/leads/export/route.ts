import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { Lead } from '@/lib/types';

function escapeCsvField(val: unknown): string {
  if (val === null || val === undefined) return '';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');

    const db = adminDb();
    let query = db.from('leads').select('*').order('created_at', { ascending: false });

    if (status && status !== 'all') query = query.eq('status', status);
    if (category && category !== 'all') query = query.eq('category', category);

    const { data: leads, error } = await query;
    if (error) throw error;

    const allLeads: Lead[] = (leads || []) as Lead[];

    const headers = [
      'Company Name',
      'Contact Person',
      'Category',
      'Email',
      'Phone',
      'City',
      'Address',
      'Website',
      'Vehicle Requirement',
      'Route Area',
      'Frequency',
      'Status',
      'Priority',
      'Follow-up Date',
      'Actual Revenue',
      'Estimated Value',
      'Opted Out',
      'Created Date',
    ];

    const rows: string[][] = allLeads.map((l: Lead) => [
      escapeCsvField(l.company_name),
      escapeCsvField(l.contact_name),
      escapeCsvField(l.category),
      escapeCsvField(l.email),
      escapeCsvField(l.phone),
      escapeCsvField(l.city),
      escapeCsvField(l.address),
      escapeCsvField(l.website),
      escapeCsvField(l.vehicle_requirement),
      escapeCsvField(l.route_area),
      escapeCsvField(l.frequency),
      escapeCsvField(l.status),
      escapeCsvField(l.priority),
      escapeCsvField(l.next_follow_up_date),
      escapeCsvField(l.actual_revenue),
      escapeCsvField(l.estimated_value),
      escapeCsvField(l.opted_out ? 'Yes' : 'No'),
      escapeCsvField(l.created_at ? l.created_at.slice(0, 10) : ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r: string[]) => r.join(','))].join('\r\n');

    return new NextResponse(csvContent, {
      headers: {
        'content-type': 'text/csv; charset=utf-8',
        'content-disposition': `attachment; filename="papa-transport-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'CSV export failed' },
      { status: 500 }
    );
  }
}
