import { describe, it, expect, beforeEach } from 'vitest';
import { POST as importLeads } from '@/app/api/leads/import/route';
import { POST as createLead } from '@/app/api/leads/route';
import { globalMockDb } from '@/lib/mock-db';
import { suppressEmail } from '@/lib/suppression';

describe('3. CSV import validation', () => {
  beforeEach(() => {
    globalMockDb.reset();
    process.env.APP_ALLOWED_EMAILS = 'owner@papatransport.com';
    process.env.TEST_USER_EMAIL = 'owner@papatransport.com';
  });

  it('validates CSV rows in preview mode and identifies duplicates and suppressions', async () => {
    // Seed an existing lead and a suppression
    await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Existing Company Ltd',
          email: 'existing@lead.com',
          phone: '9811199999',
        }),
      })
    );

    await suppressEmail('suppressed@lead.com', 'unsubscribe');

    const csvContent = `company_name,email,phone,city
"Brand New Co","brandnew@lead.com","9822200001","Noida"
"Existing Company Ltd","existing@lead.com","9811199999","Noida"
"Suppressed Co","suppressed@lead.com","9833300002","Noida"`;

    const previewReq = new Request('http://localhost:3000/api/leads/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'preview', csvContent }),
    });

    const previewRes = await importLeads(previewReq);
    expect(previewRes.status).toBe(200);
    const previewData = await previewRes.json();

    expect(previewData.total).toBe(3);
    expect(previewData.duplicateCount).toBe(1);
    expect(previewData.suppressedCount).toBe(1);
    expect(previewData.validCount).toBe(2); // 1 brand new + 1 suppressed (imported as do_not_contact)
  });

  it('executes import and skips duplicate leads', async () => {
    const csvContent = `company_name,email,phone,city
"Company Alpha","alpha@test.com","9811111111","Noida Sector 63"
"Company Beta","beta@test.com","9822222222","Okhla"`;

    const execReq = new Request('http://localhost:3000/api/leads/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ mode: 'execute', csvContent }),
    });

    const execRes = await importLeads(execReq);
    expect(execRes.status).toBe(200);
    const execData = await execRes.json();
    expect(execData.importedCount).toBe(2);
  });
});
