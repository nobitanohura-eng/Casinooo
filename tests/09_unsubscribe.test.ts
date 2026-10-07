import { describe, it, expect, beforeEach } from 'vitest';
import { GET as optoutGet } from '@/app/api/optout/[token]/route';
import { POST as createLead } from '@/app/api/leads/route';
import { globalMockDb } from '@/lib/mock-db';
import { isEmailSuppressed } from '@/lib/suppression';

describe('9. Unsubscribe flow & Idempotency', () => {
  beforeEach(() => {
    globalMockDb.reset();
    process.env.APP_ALLOWED_EMAILS = 'owner@papatransport.com';
    process.env.TEST_USER_EMAIL = 'owner@papatransport.com';
  });

  it('unsubscribes public recipient without login and records central suppression', async () => {
    // Create lead
    const leadRes = await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Unsubscribe Test Co',
          email: 'unsub@testco.com',
          city: 'Noida',
        }),
      })
    );
    const { lead } = await leadRes.json();
    const token = lead.optout_token;

    // Simulate public user clicking link (NO auth headers)
    process.env.TEST_AUTH_REJECT = 'true'; // Verify no auth required!

    const optoutRes = await optoutGet(
      new Request(`http://localhost:3000/api/optout/${token}`),
      { params: Promise.resolve({ token }) }
    );

    expect(optoutRes.status).toBe(200);
    const htmlText = await optoutRes.text();
    expect(htmlText).toContain('You have been unsubscribed');

    // Verify lead status in database
    const { data: updatedLead } = await globalMockDb.from('leads').select('*').eq('id', lead.id).single();
    expect(updatedLead!.opted_out).toBe(true);
    expect(updatedLead!.status).toBe('do_not_contact');
    expect(updatedLead!.next_follow_up_date).toBeNull();

    // Verify email is in central suppression table
    const suppressed = await isEmailSuppressed('unsub@testco.com');
    expect(suppressed).toBe(true);
  });

  it('is idempotent across multiple repeated clicks', async () => {
    delete process.env.TEST_AUTH_REJECT;
    const leadRes = await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Repeated Click Co',
          email: 'repeat@click.com',
          city: 'Noida',
        }),
      })
    );
    const { lead } = await leadRes.json();
    const token = lead.optout_token;

    // Hit 1
    const res1 = await optoutGet(new Request(`http://localhost:3000/api/optout/${token}`), {
      params: Promise.resolve({ token }),
    });
    expect(res1.status).toBe(200);

    // Hit 2
    const res2 = await optoutGet(new Request(`http://localhost:3000/api/optout/${token}`), {
      params: Promise.resolve({ token }),
    });
    expect(res2.status).toBe(200);

    // Verify central suppression list has only 1 unique normalized entry
    const { data: records } = await globalMockDb
      .from('suppressions')
      .select('*')
      .eq('normalized_email', 'repeat@click.com');
    expect(records.length).toBe(1);
  });
});
