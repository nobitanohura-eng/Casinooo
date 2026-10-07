import { describe, it, expect, beforeEach } from 'vitest';
import { POST as resendWebhook } from '@/app/api/webhooks/resend/route';
import { POST as createLead } from '@/app/api/leads/route';
import { globalMockDb } from '@/lib/mock-db';
import { isEmailSuppressed } from '@/lib/suppression';

describe('10. Bounce and complaint webhook suppression', () => {
  beforeEach(() => {
    globalMockDb.reset();
    process.env.APP_ALLOWED_EMAILS = 'owner@papatransport.com';
    process.env.TEST_USER_EMAIL = 'owner@papatransport.com';
    delete process.env.RESEND_WEBHOOK_SECRET; // Test direct payload processing
  });

  it('records delivery event without suppressing recipient', async () => {
    const leadRes = await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Delivered Co',
          email: 'delivered@test.com',
        }),
      })
    );
    const { lead } = await leadRes.json();

    const webhookReq = new Request('http://localhost:3000/api/webhooks/resend', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'email.delivered',
        data: {
          id: 'msg_del_123',
          to: ['delivered@test.com'],
          created_at: new Date().toISOString(),
        },
      }),
    });

    const res = await resendWebhook(webhookReq);
    expect(res.status).toBe(200);

    const isSuppressed = await isEmailSuppressed('delivered@test.com');
    expect(isSuppressed).toBe(false);
  });

  it('permanently suppresses recipient upon email bounce', async () => {
    const leadRes = await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Bounced Co',
          email: 'bounce@test.com',
        }),
      })
    );
    const { lead } = await leadRes.json();

    const webhookReq = new Request('http://localhost:3000/api/webhooks/resend', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'email.bounced',
        data: {
          id: 'msg_bounce_999',
          to: ['bounce@test.com'],
          created_at: new Date().toISOString(),
        },
      }),
    });

    const res = await resendWebhook(webhookReq);
    expect(res.status).toBe(200);

    // Verify recipient is now globally suppressed
    const isSuppressed = await isEmailSuppressed('bounce@test.com');
    expect(isSuppressed).toBe(true);

    // Verify lead status is do_not_contact
    const { data: updatedLead } = await globalMockDb.from('leads').select('*').eq('id', lead.id).single();
    expect(updatedLead!.status).toBe('do_not_contact');
    expect(updatedLead!.opted_out).toBe(true);
  });

  it('permanently suppresses recipient upon email complaint', async () => {
    await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Complainant Co',
          email: 'complain@test.com',
        }),
      })
    );

    const webhookReq = new Request('http://localhost:3000/api/webhooks/resend', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'email.complained',
        data: {
          id: 'msg_complaint_456',
          to: ['complain@test.com'],
          created_at: new Date().toISOString(),
        },
      }),
    });

    const res = await resendWebhook(webhookReq);
    expect(res.status).toBe(200);

    const isSuppressed = await isEmailSuppressed('complain@test.com');
    expect(isSuppressed).toBe(true);
  });
});
