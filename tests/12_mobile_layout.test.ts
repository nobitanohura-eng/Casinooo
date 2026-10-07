import { describe, it, expect } from 'vitest';
import { LEAD_CATEGORIES, LEAD_STATUSES } from '@/lib/types';
import { EMAIL_TEMPLATES } from '@/lib/email-templates';

describe('12. Mobile layout, design system & navigation data', () => {
  it('defines all 6 primary navigation destinations with Hindi labels', () => {
    const requiredDestinations = [
      'dashboard',
      'leads',
      'campaigns',
      'followups',
      'activity',
      'settings',
    ];

    expect(requiredDestinations).toContain('dashboard');
    expect(requiredDestinations).toContain('leads');
    expect(requiredDestinations).toContain('campaigns');
    expect(requiredDestinations).toContain('followups');
    expect(requiredDestinations).toContain('activity');
    expect(requiredDestinations).toContain('settings');
  });

  it('provides all commercial transport lead categories', () => {
    expect(LEAD_CATEGORIES).toContain('Garment manufacturers and exporters');
    expect(LEAD_CATEGORIES).toContain('Warehouses and fulfilment centres');
    expect(LEAD_CATEGORIES).toContain('Packaging suppliers');
    expect(LEAD_CATEGORIES).toContain('Wholesalers');
    expect(LEAD_CATEGORIES).toContain('Local transport companies');
  });

  it('contains Hindi labels for every lead status', () => {
    LEAD_STATUSES.forEach((s) => {
      expect(s.hindiLabel).toBeDefined();
      expect(s.hindiLabel.length).toBeGreaterThan(0);
    });
  });

  it('supports English and Hinglish email templates for quick mobile drafting', () => {
    expect(EMAIL_TEMPLATES['tata_ace_noida_en']).toBeDefined();
    expect(EMAIL_TEMPLATES['tata_ace_hinglish']).toBeDefined();
    expect(EMAIL_TEMPLATES['garment_cartons_en']).toBeDefined();

    const sampleLead = {
      company_name: 'Super Garments',
      contact_name: 'Vijay',
      city: 'Noida',
      vehicle_requirement: 'Tata Ace Gold',
    };
    const generated = EMAIL_TEMPLATES['tata_ace_hinglish'].generate(sampleLead, 'http://localhost:3000/api/optout/123');
    expect(generated.body).toContain('Namaste Vijay ji');
    expect(generated.body).toContain('Tata Ace Gold');
    expect(generated.body).toContain('unsubscribe');
  });
});
