import { describe, it, expect, beforeEach, vi } from 'vitest';
import { POST as createLead } from '@/app/api/leads/route';
import { POST as generateDraft } from '@/app/api/leads/[id]/draft/route';
import { POST as approveStatus } from '@/app/api/leads/[id]/status/route';
import { POST as sendEmail } from '@/app/api/leads/[id]/send/route';
import { globalMockDb } from '@/lib/mock-db';
import { suppressEmail } from '@/lib/suppression';

// Mock Resend SDK
vi.mock('resend', () => {
  return {
    Resend: vi.fn().mockImplementation(() => ({
      emails: {
        send: vi.fn().mockResolvedValue({
          data: { id: 'mock_resend_msg_12345' },
          error: null,
        }),
      },
    })),
  };
});

describe('5-8. Mandatory Email Send Guards & Controls', () => {
  beforeEach(() => {
    globalMockDb.reset();
    process.env.APP_ALLOWED_EMAILS = 'owner@papatransport.com';
    process.env.TEST_USER_EMAIL = 'owner@papatransport.com';
    process.env.RESEND_API_KEY = 're_test_key_mock';
    process.env.RESEND_FROM_EMAIL = 'transport@verifieddomain.com';
    process.env.GLOBAL_EMAIL_PAUSED = 'false';
    globalMockDb.from('app_settings').update({ value: false }).eq('key', 'global_email_paused');
  });

  async function createReadyLead() {
    const leadRes = await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Ready Transport Client',
          contact_name: 'Pooja Rawat',
          email: 'pooja@readyclient.com',
          city: 'Noida',
        }),
      })
    );
    const { lead } = await leadRes.json();

    // Generate draft
    await generateDraft(
      new Request(`http://localhost:3000/api/leads/${lead.id}/draft`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
      }),
      { params: Promise.resolve({ id: lead.id }) }
    );

    return lead;
  }

  it('5. blocks sending without explicit user approval (confirm: true and status: approved)', async () => {
    const lead = await createReadyLead();

    // Attempt to send without approving draft first
    const unapprovedSendRes = await sendEmail(
      new Request(`http://localhost:3000/api/leads/${lead.id}/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: true, idempotency_key: 'test_key_1' }),
      }),
      { params: Promise.resolve({ id: lead.id }) }
    );

    expect(unapprovedSendRes.status).toBe(409);
    const body = await unapprovedSendRes.json();
    expect(body.error).toContain('must be generated, reviewed, and explicitly approved');

    // Attempt to send with confirm: false
    const noConfirmRes = await sendEmail(
      new Request(`http://localhost:3000/api/leads/${lead.id}/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: false, idempotency_key: 'test_key_1' }),
      }),
      { params: Promise.resolve({ id: lead.id }) }
    );
    expect(noConfirmRes.status).toBe(400);
  });

  it('6. blocks sending while global pause switch is enabled (403)', async () => {
    const lead = await createReadyLead();

    // Approve draft
    await approveStatus(
      new Request(`http://localhost:3000/api/leads/${lead.id}/status`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          subject: 'Local Goods Delivery Vehicle Available — Noida',
          body: 'Namaste Pooja, we have vehicle available.',
        }),
      }),
      { params: Promise.resolve({ id: lead.id }) }
    );

    // Turn ON global pause switch
    process.env.GLOBAL_EMAIL_PAUSED = 'true';
    globalMockDb.from('app_settings').update({ value: true }).eq('key', 'global_email_paused');

    const pausedRes = await sendEmail(
      new Request(`http://localhost:3000/api/leads/${lead.id}/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: true, idempotency_key: 'test_key_paused' }),
      }),
      { params: Promise.resolve({ id: lead.id }) }
    );

    expect(pausedRes.status).toBe(403);
    const body = await pausedRes.json();
    expect(body.error).toContain('PAUSED by global safety control');
  });

  it('7. blocks sending for opted-out and suppressed recipients (409)', async () => {
    const lead = await createReadyLead();

    // Mark recipient as opted out / suppressed
    await suppressEmail(lead.email, 'unsubscribe');

    // Attempt to approve/send
    const sendRes = await sendEmail(
      new Request(`http://localhost:3000/api/leads/${lead.id}/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: true, idempotency_key: 'test_key_optout' }),
      }),
      { params: Promise.resolve({ id: lead.id }) }
    );

    expect(sendRes.status).toBe(409);
    const body = await sendRes.json();
    expect(body.error).toContain('suppressed');
  });

  it('8. prevents duplicate sends using durable idempotency records', async () => {
    const lead = await createReadyLead();

    // Approve draft
    await approveStatus(
      new Request(`http://localhost:3000/api/leads/${lead.id}/status`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          action: 'approve',
          subject: 'Local Goods Delivery Vehicle Available — Noida',
          body: 'Namaste Pooja, we have vehicle available.',
        }),
      }),
      { params: Promise.resolve({ id: lead.id }) }
    );

    const idempotencyKey = 'unique_idempotency_key_999';

    // First send
    const firstRes = await sendEmail(
      new Request(`http://localhost:3000/api/leads/${lead.id}/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: true, idempotency_key: idempotencyKey }),
      }),
      { params: Promise.resolve({ id: lead.id }) }
    );

    expect(firstRes.status).toBe(200);
    const firstBody = await firstRes.json();
    expect(firstBody.success).toBe(true);
    expect(firstBody.resendId).toBe('mock_resend_msg_12345');

    // Second send attempt with the EXACT same idempotency key (e.g. accidental double-click)
    const secondRes = await sendEmail(
      new Request(`http://localhost:3000/api/leads/${lead.id}/send`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ confirm: true, idempotency_key: idempotencyKey }),
      }),
      { params: Promise.resolve({ id: lead.id }) }
    );

    expect(secondRes.status).toBe(200);
    const secondBody = await secondRes.json();
    expect(secondBody.message).toContain('already sent successfully (idempotent response)');

    // Verify only ONE attempt record exists in send_attempts
    const { data: attempts } = await globalMockDb
      .from('send_attempts')
      .select('*')
      .eq('idempotency_key', idempotencyKey);
    expect(attempts.length).toBe(1);
  });
});
