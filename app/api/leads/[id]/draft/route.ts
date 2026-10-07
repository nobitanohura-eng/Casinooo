import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { adminDb } from '@/lib/admin';
import { EMAIL_TEMPLATES } from '@/lib/email-templates';
import { isEmailSuppressed } from '@/lib/suppression';
import { logActivity } from '@/lib/activity';

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const { id } = await ctx.params;
    let templateId = 'tata_ace_noida_en';

    try {
      const body = await req.json();
      if (body.template_id) templateId = body.template_id;
    } catch {
      // Empty body is acceptable, uses default template
    }

    const db = adminDb();
    const { data: lead, error: readErr } = await db.from('leads').select('*').eq('id', id).single();
    if (readErr || !lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    // Suppression Check
    if (lead.opted_out || lead.status === 'do_not_contact') {
      return NextResponse.json({ error: 'This contact is suppressed from outreach.' }, { status: 409 });
    }

    if (lead.email) {
      const suppressed = await isEmailSuppressed(lead.email);
      if (suppressed) {
        return NextResponse.json({ error: 'This email is globally suppressed from outreach.' }, { status: 409 });
      }
    }

    const template = EMAIL_TEMPLATES[templateId] || EMAIL_TEMPLATES['tata_ace_noida_en'];
    const baseUrl = (process.env.APP_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, '');
    const optoutUrl = `${baseUrl}/api/optout/${lead.optout_token}`;

    const generated = template.generate(lead, optoutUrl);

    // Create or update draft in email_drafts table
    const { data: draftRow, error: draftErr } = await db
      .from('email_drafts')
      .insert({
        lead_id: id,
        recipient_email: lead.email || '',
        subject: generated.subject,
        body: generated.body,
        template_id: template.id,
        status: 'draft',
      })
      .select('*')
      .single();

    if (draftErr) throw draftErr;

    // Update lead record with draft copy
    const { data: updatedLead, error: leadUpdateErr } = await db
      .from('leads')
      .update({
        email_subject: generated.subject,
        email_body: generated.body,
        status: 'drafted',
        approved_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*')
      .single();

    if (leadUpdateErr) throw leadUpdateErr;

    await logActivity({
      lead_id: id,
      action: 'draft_created',
      description: `Generated email draft for ${lead.company_name} using template "${template.name}"`,
      actor: auth.user.email || 'Owner',
    });

    return NextResponse.json({ lead: updatedLead, draft: draftRow });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Draft generation failed' },
      { status: 400 }
    );
  }
}
