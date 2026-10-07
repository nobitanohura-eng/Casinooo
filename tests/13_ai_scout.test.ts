import { describe, it, expect, beforeEach } from 'vitest';
import { runAiLeadScout } from '@/lib/ai-agent';
import { globalMockDb } from '@/lib/mock-db';

describe('13. Autonomous AI Lead Scout Agent', () => {
  beforeEach(() => {
    globalMockDb.reset();
  });

  it('autonomously generates requested number of verified Delhi NCR leads', async () => {
    const result = await runAiLeadScout({ count: 4, target_area: 'Noida' });

    expect(result.ok).toBe(true);
    expect(result.count).toBe(4);
    expect(result.leads.length).toBe(4);

    const firstLead = result.leads[0];
    expect(firstLead.company_name).toBeDefined();
    expect(firstLead.phone).toBeDefined();
    expect(firstLead.vehicle_requirement).toContain('Tata Ace');
    expect(firstLead.route_area).toBeDefined();
    expect(firstLead.source).toBe('🤖 AI Lead Scout');
    expect(firstLead.status).toBe('ready_for_review');
  });

  it('automatically crafts email drafts and schedules phone follow-ups', async () => {
    await runAiLeadScout({ count: 2, auto_draft: true, auto_followup: true });

    // Check email drafts were generated
    const { data: drafts } = await globalMockDb.from('email_drafts').select();
    expect(drafts.length).toBeGreaterThanOrEqual(1);
    expect(drafts[0].body).toContain('Tata Ace');

    // Check follow-ups were scheduled
    const { data: followups } = await globalMockDb.from('follow_ups').select();
    expect(followups.length).toBeGreaterThanOrEqual(1);
    expect(followups[0].type).toBe('phone_call');
  });

  it('skips duplicates when phone or email already exists in CRM', async () => {
    // Generate 3 leads
    const firstRun = await runAiLeadScout({ count: 3 });
    expect(firstRun.count).toBe(3);

    // Second run
    const secondRun = await runAiLeadScout({ count: 2 });
    expect(secondRun.ok).toBe(true);

    const { data: allLeads } = await globalMockDb.from('leads').select();
    const phones = allLeads.map((l: any) => l.normalized_phone).filter(Boolean);
    const uniquePhones = new Set(phones);
    expect(phones.length).toBe(uniquePhones.size);
  });
});
