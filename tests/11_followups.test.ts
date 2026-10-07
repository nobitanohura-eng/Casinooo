import { describe, it, expect, beforeEach } from 'vitest';
import { POST as createFollowup, GET as getFollowups } from '@/app/api/followups/route';
import { PATCH as updateFollowup } from '@/app/api/followups/[id]/route';
import { POST as createLead } from '@/app/api/leads/route';
import { globalMockDb } from '@/lib/mock-db';

describe('11. Follow-up scheduling and completion', () => {
  beforeEach(() => {
    globalMockDb.reset();
    process.env.APP_ALLOWED_EMAILS = 'owner@papatransport.com';
    process.env.TEST_USER_EMAIL = 'owner@papatransport.com';
  });

  it('schedules a follow-up and updates lead next follow-up date', async () => {
    const leadRes = await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Follow-up Client',
          phone: '9811155555',
        }),
      })
    );
    const { lead } = await leadRes.json();

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const scheduleRes = await createFollowup(
      new Request('http://localhost:3000/api/followups', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          scheduled_at: tomorrow,
          notes: 'Call dispatch manager regarding Tata Ace rate per carton',
        }),
      })
    );

    expect(scheduleRes.status).toBe(201);
    const scheduleData = await scheduleRes.json();
    expect(scheduleData.followup.status).toBe('pending');
    expect(scheduleData.followup.notes).toContain('Tata Ace rate');

    // Verify lead next_follow_up_date was synced
    const { data: updatedLead } = await globalMockDb.from('leads').select('*').eq('id', lead.id).single();
    expect(updatedLead!.next_follow_up_date).toBe(tomorrow);
  });

  it('blocks follow-up scheduling for suppressed/opted-out leads', async () => {
    const leadRes = await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          company_name: 'Opted Out Party',
          email: 'optout@followup.com',
          status: 'do_not_contact',
        }),
      })
    );
    const { lead } = await leadRes.json();

    const blockedRes = await createFollowup(
      new Request('http://localhost:3000/api/followups', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          scheduled_at: new Date().toISOString(),
          notes: 'Attempt call',
        }),
      })
    );

    expect(blockedRes.status).toBe(409);
    const blockedBody = await blockedRes.json();
    expect(blockedBody.error).toContain('Cannot schedule follow-up for a suppressed');
  });

  it('marks follow-up completed with recorded outcome note', async () => {
    const leadRes = await createLead(
      new Request('http://localhost:3000/api/leads', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ company_name: 'Done Follow-up Co' }),
      })
    );
    const { lead } = await leadRes.json();

    const schedRes = await createFollowup(
      new Request('http://localhost:3000/api/followups', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lead_id: lead.id,
          scheduled_at: new Date().toISOString(),
        }),
      })
    );
    const { followup } = await schedRes.json();

    // Mark complete
    const completeRes = await updateFollowup(
      new Request(`http://localhost:3000/api/followups/${followup.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          outcome: 'Customer agreed on ₹1,200 trip rate. Gaddi booked for tomorrow.',
        }),
      }),
      { params: Promise.resolve({ id: followup.id }) }
    );

    expect(completeRes.status).toBe(200);
    const completeData = await completeRes.json();
    expect(completeData.followup.status).toBe('completed');
    expect(completeData.followup.outcome).toContain('Gaddi booked');
  });
});
