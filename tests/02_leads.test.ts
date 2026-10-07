import { describe, it, expect, beforeEach } from 'vitest';
import { POST as createLead, GET as getLeads } from '@/app/api/leads/route';
import { PATCH as updateLead } from '@/app/api/leads/[id]/route';
import { globalMockDb } from '@/lib/mock-db';

describe('2. Lead creation, editing, filtering, and duplicate detection', () => {
  beforeEach(() => {
    globalMockDb.reset();
    process.env.APP_ALLOWED_EMAILS = 'owner@papatransport.com';
    process.env.TEST_USER_EMAIL = 'owner@papatransport.com';
  });

  it('creates a new lead with full commercial vehicle specs', async () => {
    const req = new Request('http://localhost:3000/api/leads', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        company_name: 'Apex Garments Noida',
        contact_name: 'Sunil Kumar',
        category: 'Garment manufacturers and exporters',
        email: 'sunil@apexgarments.com',
        phone: '+91 98110 12345',
        city: 'Noida Sector 63',
        vehicle_requirement: 'Tata Ace Gold',
        route_area: 'Noida to Okhla Phase 2',
        frequency: 'Daily regular trips',
        priority: 'high',
      }),
    });

    const res = await createLead(req);
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.lead.company_name).toBe('Apex Garments Noida');
    expect(body.lead.vehicle_requirement).toBe('Tata Ace Gold');
    expect(body.lead.normalized_email).toBe('sunil@apexgarments.com');
  });

  it('blocks duplicate lead creation with matching normalized email (409)', async () => {
    // Insert initial lead
    await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'First Company',
          email: 'test@dup.com',
          phone: '9811100000',
        }),
      })
    );

    // Attempt second lead with same email but different casing & spacing
    const dupRes = await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Second Company',
          email: '  TEST@DUP.COM ',
          phone: '9822200000',
        }),
      })
    );

    expect(dupRes.status).toBe(409);
    const dupBody = await dupRes.json();
    expect(dupBody.error).toContain('Duplicate lead found');
  });

  it('blocks duplicate lead creation with matching normalized phone (409)', async () => {
    // Insert initial lead with phone
    await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Original Phone Co',
          email: 'original@phone.com',
          phone: '+91 98111 22334',
        }),
      })
    );

    // Attempt second lead with same phone formatted differently (09811122334)
    const dupRes = await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Copycat Phone Co',
          email: 'copycat@phone.com',
          phone: '09811122334',
        }),
      })
    );

    expect(dupRes.status).toBe(409);
    const dupBody = await dupRes.json();
    expect(dupBody.error).toContain('Duplicate lead found');
  });

  it('updates lead status and vehicle requirement', async () => {
    const createRes = await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Update Target Co',
          email: 'target@update.com',
          phone: '9811133333',
        }),
      })
    );
    const { lead } = await createRes.json();

    const patchReq = new Request(`http://localhost:3000/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        status: 'interested',
        vehicle_requirement: 'Pickup 8ft',
      }),
    });

    const patchRes = await updateLead(patchReq, { params: Promise.resolve({ id: lead.id }) });
    expect(patchRes.status).toBe(200);
    const patchBody = await patchRes.json();
    expect(patchBody.lead.status).toBe('interested');
    expect(patchBody.lead.vehicle_requirement).toBe('Pickup 8ft');
  });

  it('filters leads by search query and category', async () => {
    await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Packaging World Noida',
          category: 'Packaging suppliers',
          email: 'pack@world.com',
        }),
      })
    );

    const getRes = await getLeads(new Request('http://localhost:3000/api/leads?search=Packaging&category=Packaging+suppliers'));
    expect(getRes.status).toBe(200);
    const getBody = await getRes.json();
    expect(getBody.leads.length).toBeGreaterThan(0);
    expect(getBody.leads[0].company_name).toContain('Packaging');
  });
});
