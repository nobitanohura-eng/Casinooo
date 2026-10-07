import { describe, it, expect, beforeEach } from 'vitest';
import { POST as createLead } from '@/app/api/leads/route';
import { POST as generateDraft } from '@/app/api/leads/[id]/draft/route';
import { globalMockDb } from '@/lib/mock-db';

describe('4. Draft creation without sending', () => {
  beforeEach(() => {
    globalMockDb.reset();
    process.env.APP_ALLOWED_EMAILS = 'owner@papatransport.com';
    process.env.TEST_USER_EMAIL = 'owner@papatransport.com';
  });

  it('generates personalized draft without sending any email', async () => {
    // Create lead
    const leadRes = await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Fabrics Export Hub',
          contact_name: 'Anil Gupta',
          email: 'anil@fabricshub.com',
          city: 'Noida Sector 59',
          vehicle_requirement: 'Tata Ace Gold',
        }),
      })
    );
    const { lead } = await leadRes.json();

    // Generate draft
    const draftReq = new Request(`http://localhost:3000/api/leads/${lead.id}/draft`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ template_id: 'tata_ace_noida_en' }),
    });

    const draftRes = await generateDraft(draftReq, { params: Promise.resolve({ id: lead.id }) });
    expect(draftRes.status).toBe(200);
    const draftData = await draftRes.json();

    expect(draftData.draft).toBeDefined();
    expect(draftData.draft.status).toBe('draft');
    expect(draftData.draft.subject).toContain('Local Goods Delivery Vehicle Available — Noida Sector 59');
    expect(draftData.draft.body).toContain('Namaste Anil Gupta');
    expect(draftData.draft.body).toContain('Tata Ace Gold');

    // CRITICAL: Verify NO email sending attempt was made!
    const sendAttempts = globalMockDb.from('send_attempts').select('*');
    const { data: attempts } = await sendAttempts;
    expect(attempts.length).toBe(0);
  });

  it('supports Hinglish template generation', async () => {
    const leadRes = await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Desi Box Packaging',
          contact_name: 'Mohan Sharma',
          email: 'mohan@desibox.com',
          city: 'Noida',
        }),
      })
    );
    const { lead } = await leadRes.json();

    const draftRes = await generateDraft(
      new Request(`http://localhost:3000/api/leads/${lead.id}/draft`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ template_id: 'tata_ace_hinglish' }),
      }),
      { params: Promise.resolve({ id: lead.id }) }
    );

    const draftData = await draftRes.json();
    expect(draftData.draft.body).toContain('Namaste Mohan Sharma ji');
    expect(draftData.draft.body).toContain('gaddi ki requirement');
  });
});
