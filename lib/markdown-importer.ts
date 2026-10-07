import { ParsedAiLead, AiImportResult } from '@/lib/types';
import { adminDb } from '@/lib/admin';

// Cleans phone to 10-digit or E.164
function normalizePhone(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return digits;
}

// Cleans email
function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

// Detect industrial hub / city
function detectCity(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('okhla') || lower.includes('patparganj') || lower.includes('mayapuri') || lower.includes('naraina') || lower.includes('delhi') || lower.includes('chandni chowk') || lower.includes('gandhi nagar')) {
    return 'Delhi';
  }
  if (lower.includes('greater noida') || lower.includes('kasna') || lower.includes('ecotech') || lower.includes('surajpur')) {
    return 'Greater Noida';
  }
  if (lower.includes('noida') || lower.includes('sector 63') || lower.includes('sector 65') || lower.includes('sector 80') || lower.includes('sector 83') || lower.includes('phase 2')) {
    return 'Noida';
  }
  if (lower.includes('sahibabad') || lower.includes('ghaziabad') || lower.includes('loni') || lower.includes('kavi nagar')) {
    return 'Ghaziabad';
  }
  if (lower.includes('gurgaon') || lower.includes('gurugram') || lower.includes('manesar') || lower.includes('udyog vihar')) {
    return 'Gurgaon';
  }
  return 'Noida';
}

// Detect commercial category
function detectCategory(text: string): string {
  const lower = text.toLowerCase();
  if (lower.includes('garment') || lower.includes('textile') || lower.includes('apparel') || lower.includes('fabric') || lower.includes('hosiery')) {
    return 'Garment manufacturers and exporters';
  }
  if (lower.includes('auto') || lower.includes('machin') || lower.includes('fastener') || lower.includes('sheet metal') || lower.includes('bearing') || lower.includes('die')) {
    return 'Auto components and machine shops';
  }
  if (lower.includes('packag') || lower.includes('box') || lower.includes('corrugat') || lower.includes('carton') || lower.includes('plastic')) {
    return 'Packaging suppliers';
  }
  if (lower.includes('food') || lower.includes('fmcg') || lower.includes('sweet') || lower.includes('beverage') || lower.includes('bakery') || lower.includes('snack')) {
    return 'FMCG and packaged food distributors';
  }
  if (lower.includes('pharma') || lower.includes('medic') || lower.includes('drug') || lower.includes('surgical')) {
    return 'Pharmaceutical and surgical distributors';
  }
  if (lower.includes('warehouse') || lower.includes('logistics') || lower.includes('fulfilment') || lower.includes('trans')) {
    return 'Warehouses and fulfilment centres';
  }
  return 'Other relevant businesses';
}

// Parse Markdown Table lines: | Col 1 | Col 2 | Col 3 |
function parseMarkdownTable(content: string): ParsedAiLead[] {
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('|') && l.endsWith('|'));

  if (lines.length < 2) return [];

  // Parse header
  const headerCols = lines[0]
    .split('|')
    .map((c) => c.trim().toLowerCase())
    .filter((c) => c.length > 0);

  // Skip divider line (e.g. |---|---|)
  const dataLines = lines.slice(1).filter((l) => !l.replace(/[|\s-:]/g, '').length === false);

  const results: ParsedAiLead[] = [];

  for (const line of dataLines) {
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((c) => c.trim().replace(/^[*_~`]+|[*_~`]+$/g, ''));

    if (cells.length === 0 || !cells[0]) continue;

    let company = '';
    let contact = '';
    let phone = '';
    let email = '';
    let address = '';
    let city = '';
    let category = '';
    let route = '';
    let notes = '';

    headerCols.forEach((header, idx) => {
      const val = cells[idx] || '';
      if (header.includes('company') || header.includes('name') || header.includes('firm') || header.includes('business')) {
        company = val;
      } else if (header.includes('contact') || header.includes('person') || header.includes('owner') || header.includes('manager')) {
        contact = val;
      } else if (header.includes('phone') || header.includes('mobile') || header.includes('contact no') || header.includes('tel')) {
        phone = val;
      } else if (header.includes('email') || header.includes('mail')) {
        email = val;
      } else if (header.includes('address') || header.includes('location') || header.includes('sector') || header.includes('area')) {
        address = val;
      } else if (header.includes('city')) {
        city = val;
      } else if (header.includes('category') || header.includes('industry') || header.includes('type')) {
        category = val;
      } else if (header.includes('route') || header.includes('requirement')) {
        route = val;
      } else if (header.includes('note') || header.includes('remark') || header.includes('detail')) {
        notes = val;
      }
    });

    // If company not mapped, use first column
    if (!company && cells[0]) company = cells[0];

    // Fallback checks
    if (!phone) {
      const phoneMatch = line.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
      if (phoneMatch) phone = phoneMatch[0];
    }
    if (!email) {
      const emailMatch = line.match(/[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) email = emailMatch[0];
    }

    if (company && company !== 'Company Name' && !company.includes('---')) {
      const cleanCity = city || detectCity(`${address} ${notes}`);
      const cleanCat = category || detectCategory(`${company} ${notes}`);
      results.push({
        company_name: company,
        contact_name: contact || null,
        phone: phone || null,
        email: email || null,
        category: cleanCat,
        address: address || null,
        city: cleanCity,
        route_area: route || `${cleanCity} to Delhi NCR`,
        vehicle_requirement: 'Tata Ace Gold (Chota Hathi)',
        frequency: 'Regular / On-demand',
        estimated_value: 18000,
        notes: notes || `Researched via AI for ${cleanCat}`,
      });
    }
  }

  return results;
}

// Parse Markdown Lists or unstructured blocks
function parseUnstructuredOrList(content: string): ParsedAiLead[] {
  // Try JSON first
  try {
    const trimmed = content.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item: any) => ({
          company_name: item.company_name || item.company || item.name || 'Unknown Business',
          contact_name: item.contact_name || item.contact || null,
          phone: item.phone || item.mobile || null,
          email: item.email || null,
          category: item.category || detectCategory(item.company_name || ''),
          address: item.address || null,
          city: item.city || detectCity(item.address || ''),
          route_area: item.route_area || item.route || 'Local Delhi NCR',
          vehicle_requirement: item.vehicle_requirement || 'Tata Ace Gold',
          frequency: item.frequency || 'Weekly / Regular',
          estimated_value: Number(item.estimated_value) || 15000,
          notes: item.notes || null,
        }));
      }
    }
  } catch {
    // Continue to text parsing
  }

  // Parse by double-newline or bullet chunks
  const chunks = content.split(/\n\s*\n/g);
  const results: ParsedAiLead[] = [];

  for (const chunk of chunks) {
    if (!chunk.trim() || chunk.length < 15) continue;

    // Search for company name: prioritize markdown bold **Company**
    const companyMatch =
      chunk.match(/\*\*([A-Za-z0-9\s&.,'-]{3,60})\*\*/) ||
      chunk.match(/(?:Company|Firm|Business|Name)[:\s]+([^\n\r]+)/i) ||
      chunk.match(/^\s*(?:[-*#]|\d+\.)\s*([A-Za-z0-9\s&.,'-]{3,60})/m);

    const phoneMatch =
      chunk.match(/(?:Phone|Mobile|Tel|Contact No)?[:\s]*((?:\+91[\s-]?)?[6-9][\d\s-]{8,13}\d)/i) ||
      chunk.match(/(?:\+91[\s-]?)?[6-9]\d{9}/);
    const emailMatch = chunk.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    const addressMatch = chunk.match(/(?:Address|Location|Sector|Area|City)[:\s]+([^\n\r]+)/i);
    const contactMatch = chunk.match(/(?:Contact Person|Person|Contact|Owner|Manager)[:\s]+([^\n\r]+)/i);

    if (companyMatch) {
      const company = companyMatch[1].replace(/[*_~`]/g, '').trim();
      const phone = phoneMatch ? phoneMatch[1].trim() : null;
      const email = emailMatch ? emailMatch[1].trim() : null;
      const address = addressMatch ? addressMatch[1].trim() : null;
      const contact = contactMatch ? contactMatch[1].trim() : null;

      if (company && company.length > 2 && !company.toLowerCase().includes('company name')) {
        const detectedCity = detectCity(`${chunk} ${address || ''}`);
        const detectedCat = detectCategory(`${company} ${chunk}`);
        results.push({
          company_name: company,
          contact_name: contact,
          phone: phone,
          email: email,
          category: detectedCat,
          address: address,
          city: detectedCity,
          route_area: `${detectedCity} to Delhi NCR`,
          vehicle_requirement: 'Tata Ace Gold (Chota Hathi)',
          frequency: 'Regular dispatch',
          estimated_value: 20000,
          notes: chunk.slice(0, 300).replace(/\n/g, ' ').trim(),
        });
      }
    }
  }

  return results;
}

// Universal AI Lead Parser & Deduplicator
export async function parseAiLeads(content: string): Promise<AiImportResult> {
  let leads: ParsedAiLead[] = [];

  // Check if content has a Markdown table
  if (content.includes('|') && content.split('\n').filter((l) => l.trim().startsWith('|')).length >= 2) {
    leads = parseMarkdownTable(content);
  }

  // If table found nothing or not a table, fallback to chunk parser
  if (leads.length === 0) {
    leads = parseUnstructuredOrList(content);
  }

  // Load existing leads for deduplication
  const db = adminDb();
  const { data: existingLeads } = await db
    .from('leads')
    .select('normalized_phone, normalized_email, company_name');

  const existingPhoneSet = new Set<string>();
  const existingEmailSet = new Set<string>();
  const existingNameSet = new Set<string>();

  (existingLeads || []).forEach((l: any) => {
    if (l.normalized_phone) existingPhoneSet.add(normalizePhone(l.normalized_phone));
    if (l.normalized_email) existingEmailSet.add(normalizeEmail(l.normalized_email));
    if (l.company_name) existingNameSet.add(l.company_name.toLowerCase().trim());
  });

  const processedLeads: ParsedAiLead[] = leads.map((lead) => {
    let isDup = false;
    let reason = '';

    const normPhone = lead.phone ? normalizePhone(lead.phone) : '';
    const normEmail = lead.email ? normalizeEmail(lead.email) : '';
    const normName = lead.company_name.toLowerCase().trim();

    if (normPhone && existingPhoneSet.has(normPhone)) {
      isDup = true;
      reason = `Phone number already exists in CRM (${lead.phone})`;
    } else if (normEmail && existingEmailSet.has(normEmail)) {
      isDup = true;
      reason = `Email address already exists in CRM (${lead.email})`;
    } else if (existingNameSet.has(normName)) {
      isDup = true;
      reason = `Company name already exists in CRM (${lead.company_name})`;
    }

    return {
      ...lead,
      is_duplicate: isDup,
      duplicate_reason: reason,
      confidence: normPhone && normEmail ? 'high' : normPhone || normEmail ? 'medium' : 'low',
    };
  });

  const validCount = processedLeads.filter((l) => !l.is_duplicate).length;
  const dupCount = processedLeads.filter((l) => l.is_duplicate).length;

  return {
    total_found: processedLeads.length,
    valid_count: validCount,
    duplicate_count: dupCount,
    leads: processedLeads,
  };
}
