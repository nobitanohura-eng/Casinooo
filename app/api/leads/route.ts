import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { leadCreateSchema, normalizeEmail, normalizePhone } from '@/lib/validations';
import { isEmailSuppressed } from '@/lib/suppression';
import { logActivity } from '@/lib/activity';

export async function GET(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search')?.trim().toLowerCase() || '';
    const status = url.searchParams.get('status') || 'all';
    const category = url.searchParams.get('category') || 'all';
    const priority = url.searchParams.get('priority') || 'all';
    const sort = url.searchParams.get('sort') || 'created_at';
    const order = url.searchParams.get('order') === 'asc' ? { ascending: true } : { ascending: false };
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    const db = adminDb();
    let query = db.from('leads').select('*', { count: 'exact' });

    if (status !== 'all') {
      query = query.eq('status', status);
    }
    if (category !== 'all') {
      query = query.eq('category', category);
    }
    if (priority !== 'all') {
      query = query.eq('priority', priority);
    }

    if (search) {
      // Search across company name, city, contact, email, phone, notes
      query = query.or(
        `company_name.ilike.%${search}%,city.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%,notes.ilike.%${search}%`
      );
    }

    query = query.order(sort, order).range(offset, offset + limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({
      leads: data || [],
      total: count || 0,
      limit,
      offset,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not load leads' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const raw = await req.json();
    const parsed = leadCreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || 'Invalid input data', details: parsed.error.format() },
        { status: 400 }
      );
    }

    const val = parsed.data;
    const normEmail = normalizeEmail(val.email);
    const normPhone = normalizePhone(val.phone);
    const db = adminDb();

    // 1. DUPLICATE DETECTION BY NORMALIZED EMAIL
    if (normEmail) {
      const { data: existingEmailLead } = await db
        .from('leads')
        .select('id, company_name, email, phone')
        .eq('normalized_email', normEmail)
        .maybeSingle();

      if (existingEmailLead) {
        return NextResponse.json(
          {
            error: `Duplicate lead found: Company "${existingEmailLead.company_name}" already exists with email ${val.email}.`,
            duplicateLead: existingEmailLead,
          },
          { status: 409 }
        );
      }
    }

    // 2. DUPLICATE DETECTION BY NORMALIZED PHONE
    if (normPhone) {
      const { data: existingPhoneLead } = await db
        .from('leads')
        .select('id, company_name, email, phone')
        .eq('normalized_phone', normPhone)
        .maybeSingle();

      if (existingPhoneLead) {
        return NextResponse.json(
          {
            error: `Duplicate lead found: Company "${existingPhoneLead.company_name}" already exists with phone ${val.phone}.`,
            duplicateLead: existingPhoneLead,
          },
          { status: 409 }
        );
      }
    }

    // 3. CHECK SUPPRESSION STATUS
    let isSuppressed = false;
    if (normEmail) {
      isSuppressed = await isEmailSuppressed(normEmail);
    }

    const row = {
      company_name: val.company_name,
      contact_name: val.contact_name || null,
      category: val.category,
      email: val.email || null,
      normalized_email: normEmail,
      phone: val.phone || null,
      normalized_phone: normPhone,
      website: val.website || null,
      address: val.address || null,
      city: val.city,
      source: val.source,
      source_url: val.source_url || null,
      source_notes: val.source_notes || null,
      vehicle_requirement: val.vehicle_requirement,
      route_area: val.route_area,
      frequency: val.frequency,
      status: isSuppressed ? 'do_not_contact' : val.status,
      priority: val.priority,
      notes: val.notes || null,
      estimated_value: val.estimated_value,
      actual_revenue: val.actual_revenue,
      email_consent_status: val.email_consent_status,
      opted_out: isSuppressed,
      next_follow_up_date: val.next_follow_up_date || null,
    };

    const { data: newLead, error } = await db.from('leads').insert(row).select('*').single();
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This email is already in your leads.' }, { status: 409 });
      }
      throw error;
    }

    await logActivity({
      lead_id: newLead.id,
      action: 'lead_created',
      description: `Lead created for ${newLead.company_name} (${newLead.category})`,
      actor: auth.user.email || 'Owner',
    });

    return NextResponse.json({ lead: newLead }, { status: 201 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Could not save lead' },
      { status: 500 }
    );
  }
}
