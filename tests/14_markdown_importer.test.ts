import { describe, it, expect, beforeEach } from 'vitest';
import { parseAiLeads } from '@/lib/markdown-importer';
import { globalMockDb } from '@/lib/mock-db';

describe('14. Universal Markdown & AI Research Importer', () => {
  beforeEach(() => {
    globalMockDb.reset();
  });

  it('parses Markdown tables extracted from AI chatbot output', async () => {
    const tableMarkdown = `
| Company Name | Contact Person | Phone | Email | Address / Area | Category |
| Apex Textile Mills | Sanjay Singhania | +91 98112 34567 | sanjay@apexmills.in | Sector 63, Noida | Garments |
| Superfast Auto Parts | Manoj Gupta | 9899122334 | manoj@superfast.co.in | Phase 2, Okhla | Auto components |
    `.trim();

    const result = await parseAiLeads(tableMarkdown);
    expect(result.total_found).toBe(2);
    expect(result.valid_count).toBe(2);
    expect(result.leads[0].company_name).toBe('Apex Textile Mills');
    expect(result.leads[0].contact_name).toBe('Sanjay Singhania');
    expect(result.leads[0].city).toBe('Noida');
    expect(result.leads[1].company_name).toBe('Superfast Auto Parts');
    expect(result.leads[1].city).toBe('Delhi');
  });

  it('detects and flags duplicates against existing CRM database', async () => {
    // Insert an existing lead in DB
    await globalMockDb.from('leads').insert({
      id: 'existing_lead_1',
      company_name: 'Existing Noida Factory',
      normalized_phone: '9876543210',
      normalized_email: 'dispatch@existing.com',
    });

    const markdownWithDuplicate = `
| Company Name | Contact | Phone | Email |
| Duplicate Factory | Ramesh | 9876543210 | test@test.com |
| Fresh New Company | Suresh | 9811001122 | suresh@fresh.com |
    `.trim();

    const result = await parseAiLeads(markdownWithDuplicate);
    expect(result.total_found).toBe(2);
    expect(result.valid_count).toBe(1);
    expect(result.duplicate_count).toBe(1);
    expect(result.leads[0].is_duplicate).toBe(true);
    expect(result.leads[1].is_duplicate).toBe(false);
  });

  it('parses bulleted or unstructured AI research text', async () => {
    const unstructuredText = `
Here are the leads you requested:

1. **Bharat Packaging Works**
   Contact Person: Vinod Kumar
   Phone: 98101 22334
   Email: vinod@bharatpack.com
   Location: Ecotech 3, Greater Noida
   Notes: Corrugated box daily dispatch

2. **Kiran Pharma Logistics**
   Phone: 98188 55667
   Email: dispatch@kiranpharma.in
   Area: Patparganj Industrial Area Delhi
    `.trim();

    const result = await parseAiLeads(unstructuredText);
    expect(result.total_found).toBeGreaterThanOrEqual(2);
    expect(result.leads[0].company_name).toBe('Bharat Packaging Works');
    expect(result.leads[0].city).toBe('Greater Noida');
  });
});
