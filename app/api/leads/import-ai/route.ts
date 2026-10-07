import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { parseAiLeads } from '@/lib/markdown-importer';
import { adminDb } from '@/lib/admin';
import { logActivity } from '@/lib/activity';
import { EMAIL_TEMPLATES } from '@/lib/email-templates';

export async function POST(req: Request) {
  const auth = await requireUser();
  if (auth.error) return auth.error;

  try {
    const body = await req.json().catch(() => ({}));
    const { content, mode, leads_to_import } = body;

    // Mode 1: Preview parsing
    if (mode === 'preview') {
      if (!content || typeof content !== 'string' || content.trim().length === 0) {
        return NextResponse.json({ error: 'Please provide text, Markdown table, or notes to parse.' }, { status: 400 });
      }

      const parseResult = await parseAiLeads(content);
      return NextResponse.json({
        ok: true,
        preview: parseResult,
      });
    }

    // Mode 2: Commit / Insert into CRM
    if (mode === 'commit') {
      const candidates = leads_to_import || (content ? (await parseAiLeads(content)).leads.filter((l) => !l.is_duplicate) : []);

      if (!Array.isArray(candidates) || candidates.length === 0) {
        return NextResponse.json({ error: 'No valid leads provided to import.' }, { status: 400 });
      }

      const db = adminDb();
      const insertedLeads: any[] = [];
      const now = new Date().toISOString();

      for (const item of candidates) {
        // Skip duplicates if not forced
        if (item.is_duplicate && !body.force) continue;

        const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const optoutToken = `token_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

        const newLead = {
          id: leadId,
          optout_token: optoutToken,
          created_at: now,
          updated_at: now,
          company_name: item.company_name,
          contact_name: item.contact_name || null,
          category: item.category || 'Other relevant businesses',
          email: item.email || null,
          normalized_email: item.email ? item.email.trim().toLowerCase() : null,
          phone: item.phone || null,
          normalized_phone: item.phone ? item.phone.replace(/[^\d]/g, '') : null,
          address: item.address || null,
          city: item.city || 'Noida',
          source: '📋 AI Research / Markdown Import',
          source_notes: item.notes || 'Imported from AI Research table',
          vehicle_requirement: item.vehicle_requirement || 'Tata Ace Gold (Chota Hathi)',
          route_area: item.route_area || `${item.city || 'Noida'} to Delhi NCR`,
          frequency: item.frequency || 'Regular dispatch',
          status: 'ready_for_review' as const,
          priority: 'high' as const,
          notes: item.notes || null,
          estimated_value: item.estimated_value || 18000,
          actual_revenue: 0,
          email_consent_status: 'b2b_public_directory',
        };

        await db.from('leads').insert(newLead);
        insertedLeads.push(newLead);

        // Auto-generate outreach draft
        const tmpl = EMAIL_TEMPLATES.tata_ace_hinglish || Object.values(EMAIL_TEMPLATES)[0];
        const draft = tmpl.generate(
          newLead,
          `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/optout/${newLead.optout_token}`
        );

        await db.from('email_drafts').insert({
          id: `draft_${leadId}`,
          lead_id: leadId,
          recipient_email: newLead.email || 'pending@contact.local',
          subject: draft.subject,
          body: draft.body,
          template_id: 'tata_ace_hinglish',
          status: 'draft',
          created_at: now,
          updated_at: now,
        });

        // Auto-schedule phone follow-up
        const tomorrow = new Date(Date.now() + 24 * 3600000).toISOString();
        await db.from('follow_ups').insert({
          id: `fu_${leadId}`,
          lead_id: leadId,
          scheduled_at: tomorrow,
          notes: `Follow up on AI-researched lead for ${newLead.company_name} (${newLead.phone || 'No phone'})`,
          status: 'pending',
          created_at: now,
        });
      }

      await logActivity({
        lead_id: null,
        action: 'ai_leads_imported',
        description: `Imported ${insertedLeads.length} leads from AI research / Markdown`,
        actor: auth.user.email || 'Owner',
      });

      return NextResponse.json({
        ok: true,
        imported_count: insertedLeads.length,
        leads: insertedLeads,
        message: `Successfully imported ${insertedLeads.length} leads into CRM!`,
      });
    }

    return NextResponse.json({ error: 'Invalid mode. Use "preview" or "commit".' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Import failed' }, { status: 500 });
  }
}
