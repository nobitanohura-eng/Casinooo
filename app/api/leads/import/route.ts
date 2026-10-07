import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { normalizeEmail, normalizePhone } from '@/lib/validations';
import { isEmailSuppressed } from '@/lib/suppression';
import { logActivity } from '@/lib/activity';

interface CsvRow {
  company_name: string;
  contact_name?: string;
  category?: string;
  email?: string;
  phone?: string;
  city?: string;
  notes?: string;
  vehicle_requirement?: string;
  route_area?: string;
  frequency?: string;
  priority?: string;
  source?: string;
}

function parseCsvText(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  // Parse header
  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase());

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Simple CSV parser handling quotes
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let c = 0; c < rawLine.length; c++) {
      const char = rawLine[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = values[idx] ? values[idx].replace(/^["']|["']$/g, '').trim() : '';
    });
    rows.push(rowObj);
  }
  return rows;
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await req.json();
    const mode = body.mode || 'preview'; // 'preview' | 'execute'
    const csvContent = body.csvContent;
    const rawRows = body.rows || (csvContent ? parseCsvText(csvContent) : []);

    if (!rawRows || rawRows.length === 0) {
      return NextResponse.json({ error: 'No CSV rows provided or file is empty.' }, { status: 400 });
    }

    const db = adminDb();

    // Fetch existing emails and phones to detect duplicates
    const { data: existingLeads } = await db.from('leads').select('normalized_email, normalized_phone');
    const existingEmails = new Set(
      ((existingLeads || []) as any[]).map((l: any) => l.normalized_email).filter(Boolean) as string[]
    );
    const existingPhones = new Set(
      ((existingLeads || []) as any[]).map((l: any) => l.normalized_phone).filter(Boolean) as string[]
    );

    const validRows: any[] = [];
    const duplicateRows: any[] = [];
    const suppressedRows: any[] = [];
    const invalidRows: any[] = [];

    const seenInBatchEmails = new Set<string>();
    const seenInBatchPhones = new Set<string>();

    for (let index = 0; index < rawRows.length; index++) {
      const r = rawRows[index];

      // Map common column headers
      const company_name = r.company_name || r['company name'] || r.company || r.business || '';
      if (!company_name.trim()) {
        invalidRows.push({ row: index + 1, data: r, reason: 'Missing company name' });
        continue;
      }

      const email = r.email || r['business email'] || r['contact email'] || '';
      const phone = r.phone || r['mobile'] || r['contact number'] || r.telephone || '';
      const normEmail = normalizeEmail(email);
      const normPhone = normalizePhone(phone);

      // Check duplicates
      let isDuplicate = false;
      let dupReason = '';

      if (normEmail && (existingEmails.has(normEmail) || seenInBatchEmails.has(normEmail))) {
        isDuplicate = true;
        dupReason = `Email ${email} already exists`;
      } else if (normPhone && (existingPhones.has(normPhone) || seenInBatchPhones.has(normPhone))) {
        isDuplicate = true;
        dupReason = `Phone ${phone} already exists`;
      }

      if (isDuplicate) {
        duplicateRows.push({ row: index + 1, company_name, email, phone, reason: dupReason });
        continue;
      }

      // Check suppression
      let isSuppressed = false;
      if (normEmail) {
        isSuppressed = await isEmailSuppressed(normEmail);
      }

      if (normEmail) seenInBatchEmails.add(normEmail);
      if (normPhone) seenInBatchPhones.add(normPhone);

      const mapped = {
        company_name: company_name.trim(),
        contact_name: r.contact_name || r['contact person'] || r.contact || null,
        category: r.category || 'Garment manufacturers and exporters',
        email: email.trim() || null,
        normalized_email: normEmail,
        phone: phone.trim() || null,
        normalized_phone: normPhone,
        city: r.city || 'Noida',
        notes: r.notes || r.comments || null,
        vehicle_requirement: r.vehicle_requirement || r.vehicle || 'Tata Ace Gold',
        route_area: r.route_area || r.route || 'Noida–Delhi NCR',
        frequency: r.frequency || 'On-demand',
        source: r.source || 'CSV Import',
        status: isSuppressed ? 'do_not_contact' : 'new',
        opted_out: isSuppressed,
        priority: (['low', 'medium', 'high'].includes(r.priority?.toLowerCase()) ? r.priority.toLowerCase() : 'medium'),
      };

      if (isSuppressed) {
        suppressedRows.push({ row: index + 1, company_name, email, reason: 'Recipient is suppressed from outreach' });
      }

      validRows.push(mapped);
    }

    if (mode === 'preview') {
      return NextResponse.json({
        mode: 'preview',
        total: rawRows.length,
        validCount: validRows.length,
        duplicateCount: duplicateRows.length,
        suppressedCount: suppressedRows.length,
        invalidCount: invalidRows.length,
        sampleValid: validRows.slice(0, 5),
        duplicates: duplicateRows.slice(0, 10),
        invalid: invalidRows.slice(0, 10),
      });
    }

    // mode === 'execute'
    if (validRows.length === 0) {
      return NextResponse.json(
        { error: 'No valid non-duplicate rows to import.', duplicateCount: duplicateRows.length },
        { status: 400 }
      );
    }

    const { data: inserted, error: insertErr } = await db.from('leads').insert(validRows).select('id');
    if (insertErr) throw insertErr;

    await logActivity({
      action: 'leads_imported',
      description: `Imported ${inserted.length} leads from CSV (Skipped ${duplicateRows.length} duplicates, ${suppressedRows.length} suppressed)`,
      actor: auth.user.email || 'Owner',
      metadata: { importedCount: inserted.length, duplicateCount: duplicateRows.length },
    });

    return NextResponse.json({
      success: true,
      importedCount: inserted.length,
      duplicateCount: duplicateRows.length,
      suppressedCount: suppressedRows.length,
      invalidCount: invalidRows.length,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'CSV import failed' },
      { status: 500 }
    );
  }
}
