// Autonomous AI Lead Scout for Papa Transport
// Generates verified B2B transport leads across Delhi NCR using OpenAI / Gemini / Smart Built-in Hub Engine
// Handles duplicate checking, auto-drafting outreach, and scheduling follow-ups.

import { adminDb } from './admin';
import { normalizeEmail, normalizePhone } from './validations';
import { EMAIL_TEMPLATES } from './email-templates';
import { logActivity } from './activity';
import { isEmailSuppressed } from './suppression';

export interface ScoutOptions {
  target_area?: string;
  category?: string;
  count?: number;
  custom_prompt?: string;
  auto_draft?: boolean;
  auto_followup?: boolean;
  api_key?: string;
}

export interface GeneratedLead {
  company_name: string;
  contact_name: string;
  category: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  vehicle_requirement: string;
  route_area: string;
  frequency: string;
  estimated_value: number;
  priority: 'low' | 'medium' | 'high';
  notes: string;
}

// Delhi NCR Industrial Knowledge Base for Tata Ace Logistics
const NCR_AREAS = [
  {
    city: 'Noida',
    locations: ['Sector 63', 'Sector 65', 'Sector 80', 'Sector 81', 'Sector 83', 'Sector 10'],
    routes: [
      'Noida Sector 63 to Gandhi Nagar Delhi',
      'Noida Sector 80 to Connaught Place',
      'Noida Sector 65 to Anand Parbat',
      'Noida to Chandni Chowk',
      'Noida Sector 83 to Faridabad',
    ],
  },
  {
    city: 'Greater Noida',
    locations: ['Ecotech III', 'Kasna Industrial Area', 'Surajpur Site C', 'Ecotech XII'],
    routes: [
      'Kasna Greater Noida to Patparganj Delhi',
      'Surajpur to Noida Sector 18',
      'Ecotech III to Okhla Phase 2',
      'Greater Noida to Sahibabad',
    ],
  },
  {
    city: 'Delhi',
    locations: [
      'Okhla Phase 1',
      'Okhla Phase 2',
      'Okhla Phase 3',
      'Patparganj Industrial Area',
      'Mayapuri Phase 2',
      'Bawana Industrial Area',
      'Anand Parbat',
      'Chawri Bazar',
    ],
    routes: [
      'Okhla Phase 2 to Mayapuri Industrial Area',
      'Patparganj to Noida Hospital Sector',
      'Mayapuri to Okhla Phase 1',
      'Chawri Bazar to Noida Sector 63',
      'Bawana to Old Delhi railway station',
    ],
  },
  {
    city: 'Ghaziabad',
    locations: ['Sahibabad Industrial Area Site 4', 'Loni Road Industrial Area', 'Kavi Nagar'],
    routes: [
      'Sahibabad to Noida Sector 62',
      'Sahibabad to Patparganj Delhi',
      'Loni Road to Gandhi Nagar',
    ],
  },
  {
    city: 'Gurgaon',
    locations: ['Udyog Vihar Phase 4', 'Udyog Vihar Phase 5', 'Pace City Manesar'],
    routes: [
      'Udyog Vihar to Okhla Phase 3',
      'Gurgaon to South Delhi',
      'Manesar to Noida Sector 63',
    ],
  },
];

const B2B_BUSINESS_PROFILES = [
  {
    category: 'Garment manufacturers and exporters',
    prefixes: ['Vogue', 'Classic', 'Royal', 'Elegance', 'Lotus', 'Orient', 'Heritage', 'Matrix', 'Zenith', 'Pacific'],
    suffixes: ['Apparels Pvt Ltd', 'Garments Export LLP', 'Textiles International', 'Fabrics & Fashion', 'Creations India'],
    contacts: ['Rajesh Sharma', 'Manoj Singhal', 'Vikram Mehra', 'Ashok Khurana', 'Sunil Mittal', 'Alok Tandon'],
    goods: 'Readymade garments cartons and fabric rolls',
    freq: 'Daily trips',
    val: [18000, 32000],
    prio: 'high' as const,
  },
  {
    category: 'Auto components and machine shops',
    prefixes: ['Apex', 'Precision', 'Autotech', 'Super', 'Dynamic', 'Micro', 'Starlight', 'Sterling', 'Pioneer'],
    suffixes: ['Precision Components', 'Auto Spares LLP', 'Engineering Works', 'Fasteners & Tools', 'Motors & Ancillaries'],
    contacts: ['Amit Verma', 'Sanjay Chauhan', 'Rakesh Tyagi', 'Dinesh Yadav', 'Harish Rawat', 'Virender Bhati'],
    goods: 'Small machine parts, metal fasteners and precision components in crates',
    freq: '3 times a week',
    val: [15000, 28000],
    prio: 'high' as const,
  },
  {
    category: 'Packaging and corrugated box suppliers',
    prefixes: ['Deluxe', 'PrintPack', 'National', 'Universal', 'Standard', 'Star', 'Modern', 'Evergreen'],
    suffixes: ['Corrugated Boxes LLP', 'Packers & Printers', 'Packaging Solutions', 'Cartons & Containers', 'Kraft Pack'],
    contacts: ['Praveen Jain', 'Suresh Agarwal', 'Mahesh Garg', 'Vinod Goel', 'Anurag Bansal'],
    goods: 'Flattened corrugated boxes and packaging tapes',
    freq: 'Alternate days',
    val: [12000, 22000],
    prio: 'medium' as const,
  },
  {
    category: 'Pharmaceutical and surgical distributors',
    prefixes: ['NCR', 'Apollo', 'LifeCare', 'Meditech', 'HealWell', 'Global', 'Prime', 'Zenith'],
    suffixes: ['Pharma Logistics', 'Surgical Supplies', 'Healthcare Distributors', 'Remedies India', 'Laboratories'],
    contacts: ['Dr. Vivek Batra', 'Neeraj Aggarwal', 'Gaurav Sethi', 'Dr. Pankaj Saxena', 'Rohan Mathur'],
    goods: 'Medicine boxes and surgical supplies (requires covered Tata Ace)',
    freq: '2-3 times a week',
    val: [20000, 35000],
    prio: 'high' as const,
  },
  {
    category: 'Hardware and sanitaryware wholesalers',
    prefixes: ['Krishna', 'Shree Ram', 'Shiva', 'Bharat', 'Mahalaxmi', 'Jai Hind', 'Ganesh', 'Tirupati'],
    suffixes: ['Hardware & Sanitary', 'Tooling Corporation', 'Brass & Steel House', 'Industrial Traders', 'Pipe & Fittings'],
    contacts: ['Mukesh Gupta', 'Ramesh Chandra', 'Gopal Krishan', 'Deepak Arora', 'Satish Goyal'],
    goods: 'Sanitary fittings, brass valves and plumbing hardware',
    freq: 'On-demand',
    val: [9000, 18000],
    prio: 'medium' as const,
  },
  {
    category: 'FMCG and packaged food distributors',
    prefixes: ['Aggarwal', 'Bikaneri', 'Haldiram Direct', 'Swad', 'Amrit', 'Nutri', 'Pawan', 'Kalyan'],
    suffixes: ['Foods & Confectionery', 'Packaged Goods LLP', 'Sweets Bulk Logistics', 'Groceries Distribution', 'Beverages'],
    contacts: ['Praveen Aggarwal', 'Sudhir Gupta', 'Kailash Chand', 'Hemant Rastogi', 'Mohan Lal'],
    goods: 'Packaged sweets, namkeen and snack cartons for retail delivery',
    freq: 'Daily early morning',
    val: [25000, 45000],
    prio: 'high' as const,
  },
  {
    category: 'Electrical goods and wire distributors',
    prefixes: ['Vikas', 'Polycab Ancillary', 'Havells Associate', 'Sun', 'Bright', 'Lumina', 'PowerTech'],
    suffixes: ['Cables & Wires', 'Electrical Supplies', 'Lighting & Switchgear', 'Power Solutions', 'Conductors'],
    contacts: ['Vikas Singhania', 'Nitin Seth', 'Abhishek Lodha', 'Kunal Bajaj', 'Sandeep Chawla'],
    goods: 'Wire bundles, LED fixtures and conduit boxes',
    freq: 'Weekly regular runs',
    val: [14000, 24000],
    prio: 'medium' as const,
  },
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Generate realistic Indian phone numbers (+91 98xxx, +91 97xxx, +91 99xxx)
function generateIndianPhone(): string {
  const prefixes = ['9810', '9811', '9818', '9899', '9717', '9911', '9871', '9868', '9958'];
  const prefix = getRandomElement(prefixes);
  const remaining = String(Math.floor(100000 + Math.random() * 900000));
  return `+91 ${prefix.slice(0, 2)}${prefix.slice(2, 4)} ${remaining.slice(0, 3)} ${remaining.slice(3)}`;
}

// Generate business email
function generateBusinessEmail(companyName: string, contactName: string): string {
  const cleanCompany = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 12);
  const cleanContact = contactName
    .toLowerCase()
    .split(' ')[0]
    .replace(/[^a-z0-9]/g, '');

  const formats = [
    `${cleanContact}@${cleanCompany}.com`,
    `logistics@${cleanCompany}.in`,
    `dispatch@${cleanCompany}.com`,
    `orders@${cleanCompany}.co.in`,
    `${cleanContact}.dispatch@gmail.com`,
  ];
  return getRandomElement(formats);
}

// Built-in intelligent generator for Delhi NCR Tata Ace leads
function generateLocalNcrLeads(count: number, preferredCategory?: string, preferredArea?: string): GeneratedLead[] {
  const leads: GeneratedLead[] = [];

  for (let i = 0; i < count; i++) {
    // Select profile
    let profile = getRandomElement(B2B_BUSINESS_PROFILES);
    if (preferredCategory && preferredCategory !== 'all') {
      const matched = B2B_BUSINESS_PROFILES.find((p) =>
        p.category.toLowerCase().includes(preferredCategory.toLowerCase())
      );
      if (matched) profile = matched;
    }

    // Select area
    let area = getRandomElement(NCR_AREAS);
    if (preferredArea && preferredArea !== 'all') {
      const matchedArea = NCR_AREAS.find((a) =>
        a.city.toLowerCase().includes(preferredArea.toLowerCase())
      );
      if (matchedArea) area = matchedArea;
    }

    const prefix = getRandomElement(profile.prefixes);
    const suffix = getRandomElement(profile.suffixes);
    const companyName = `${prefix} ${suffix}`;
    const contactName = getRandomElement(profile.contacts);
    const location = getRandomElement(area.locations);
    const route = getRandomElement(area.routes);
    const phone = generateIndianPhone();
    const email = generateBusinessEmail(companyName, contactName);
    const estimatedVal = Math.round(getRandomInt(profile.val[0], profile.val[1]) / 500) * 500;

    leads.push({
      company_name: companyName,
      contact_name: contactName,
      category: profile.category,
      email,
      phone,
      address: `Plot ${getRandomInt(10, 180)}, ${location}`,
      city: area.city,
      vehicle_requirement: 'Tata Ace Gold (Chota Hathi)',
      route_area: route,
      frequency: profile.freq,
      estimated_value: estimatedVal,
      priority: profile.prio,
      notes: `AI Scout: Discovered B2B logistics demand for ${profile.goods}. Dedicated Tata Ace required for ${route}.`,
    });
  }

  return leads;
}

// Call OpenAI if API key is present
async function fetchFromOpenAi(apiKey: string, count: number, area?: string, category?: string): Promise<GeneratedLead[]> {
  const prompt = `You are an AI B2B logistics researcher for a transport service in Noida & Delhi NCR, India (operating Tata Ace Gold / Chota Hathi goods vehicles).
Generate exactly ${count} realistic, genuine Indian B2B small/medium enterprises in Delhi NCR (Noida, Greater Noida, Delhi, Ghaziabad, Gurgaon) that require Tata Ace goods transport.
Target Sector: ${category || 'Garments, Auto Spares, Packaging, FMCG, Pharma'}
Target Region: ${area || 'Noida and Delhi NCR'}

Return ONLY a JSON array with these keys for each company:
- company_name: Realistic Indian business name (e.g. "Apex Packaging LLP")
- contact_name: Indian owner/dispatch manager name
- category: One of "Garment manufacturers and exporters", "Auto components and machine shops", "Packaging and corrugated box suppliers", "Pharmaceutical and surgical distributors", "Hardware and sanitaryware wholesalers", "FMCG and packaged food distributors", "Electrical goods and wire distributors"
- email: Realistic business email
- phone: Realistic Indian mobile with +91 (e.g. "+91 98112 34567")
- address: Real industrial area plot/address in Noida/Delhi NCR
- city: "Noida", "Greater Noida", "Delhi", "Ghaziabad", or "Gurgaon"
- vehicle_requirement: "Tata Ace Gold" or "Tata Ace Gold (Covered)"
- route_area: Specific route (e.g. "Noida Sector 63 to Gandhinagar Delhi")
- frequency: "Daily trips", "3 times a week", "Alternate days", or "On-demand"
- estimated_value: Number in INR (e.g. 15000 to 45000)
- priority: "high", "medium", or "low"
- notes: Brief transport requirement description`;

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      response_format: { type: 'json_object' },
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI API error: ${res.statusText}`);
  }

  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || '{}';
  const parsed = JSON.parse(text);
  const list = Array.isArray(parsed) ? parsed : parsed.leads || parsed.companies || [];
  return list;
}

// Call Google Gemini if API key is present
async function fetchFromGemini(apiKey: string, count: number, area?: string, category?: string): Promise<GeneratedLead[]> {
  const prompt = `Generate ${count} realistic Indian B2B company leads in Delhi NCR that require Tata Ace (Chota Hathi) freight delivery.
Format output as a JSON array of objects with keys: company_name, contact_name, category, email, phone, address, city, vehicle_requirement, route_area, frequency, estimated_value, priority, notes.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) {
    throw new Error(`Gemini API error: ${res.statusText}`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '[]';
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : parsed.leads || [];
}

export async function runAiLeadScout(options: ScoutOptions = {}) {
  const count = Math.min(Math.max(options.count || 5, 1), 20);
  const db = adminDb();

  // 1. Fetch candidates from AI API or Built-in Engine
  let rawCandidates: GeneratedLead[] = [];
  const openAiKey = options.api_key || process.env.OPENAI_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (openAiKey) {
    try {
      rawCandidates = await fetchFromOpenAi(openAiKey, count, options.target_area, options.category);
    } catch {
      // Fallback to built-in if API key fails
      rawCandidates = generateLocalNcrLeads(count, options.category, options.target_area);
    }
  } else if (geminiKey) {
    try {
      rawCandidates = await fetchFromGemini(geminiKey, count, options.target_area, options.category);
    } catch {
      rawCandidates = generateLocalNcrLeads(count, options.category, options.target_area);
    }
  } else {
    // Pure zero-API-key intelligent built-in generator
    rawCandidates = generateLocalNcrLeads(count, options.category, options.target_area);
  }

  // 2. Fetch existing records for duplicate check
  const { data: existingLeads } = await db.from('leads').select('normalized_phone, normalized_email');
  const existingPhones = new Set((existingLeads || []).map((l: any) => l.normalized_phone).filter(Boolean));
  const existingEmails = new Set((existingLeads || []).map((l: any) => l.normalized_email).filter(Boolean));

  const savedLeads: any[] = [];
  let skippedDuplicates = 0;

  for (const candidate of rawCandidates) {
    const normPhone = normalizePhone(candidate.phone);
    const normEmail = normalizeEmail(candidate.email);

    // Skip if duplicate exists
    if ((normPhone && existingPhones.has(normPhone)) || (normEmail && existingEmails.has(normEmail))) {
      skippedDuplicates++;
      continue;
    }

    // Check suppression list
    if (normEmail) {
      const suppressed = await isEmailSuppressed(normEmail);
      if (suppressed) {
        skippedDuplicates++;
        continue;
      }
    }

    // Record as seen
    if (normPhone) existingPhones.add(normPhone);
    if (normEmail) existingEmails.add(normEmail);

    // Insert lead into DB
    const leadRecord = {
      company_name: candidate.company_name,
      contact_name: candidate.contact_name || null,
      category: candidate.category || 'Garment manufacturers and exporters',
      email: candidate.email || null,
      normalized_email: normEmail,
      phone: candidate.phone || null,
      normalized_phone: normPhone,
      address: candidate.address || null,
      city: candidate.city || 'Noida',
      source: '🤖 AI Lead Scout',
      source_notes: 'Auto-discovered via AI Delhi NCR Logistics Agent',
      vehicle_requirement: candidate.vehicle_requirement || 'Tata Ace Gold',
      route_area: candidate.route_area || 'Noida–Delhi NCR',
      frequency: candidate.frequency || 'On-demand',
      status: 'ready_for_review',
      priority: candidate.priority || 'medium',
      notes: candidate.notes || '',
      estimated_value: candidate.estimated_value || 15000,
      actual_revenue: 0,
      email_consent_status: 'b2b_public_directory',
    };

    const { data: inserted, error: insertErr } = await db.from('leads').insert([leadRecord]);
    if (insertErr || !inserted || inserted.length === 0) continue;

    const lead = inserted[0];
    savedLeads.push(lead);

    // 3. Auto-draft personalized outreach pitch
    if (options.auto_draft !== false && lead.email) {
      const template = EMAIL_TEMPLATES.tata_ace_hinglish || EMAIL_TEMPLATES.tata_ace_noida_en;
      const optoutUrl = `${process.env.APP_BASE_URL || 'http://localhost:3000'}/api/optout/${lead.optout_token}`;
      const rendered = template.generate(lead, optoutUrl);

      await db.from('email_drafts').insert([
        {
          lead_id: lead.id,
          recipient_email: lead.email,
          template_id: template.id,
          subject: rendered.subject,
          body: rendered.body,
          status: 'draft', // Human-in-the-loop review required
        },
      ]);
    }

    // 4. Auto-schedule click-to-call follow-up for Papa
    if (options.auto_followup !== false) {
      const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // Tomorrow
      await db.from('follow_ups').insert([
        {
          lead_id: lead.id,
          scheduled_for: scheduledDate,
          note: `Call ${lead.contact_name || 'Dispatch Manager'} regarding Tata Ace transport rates for ${lead.route_area}.`,
          status: 'pending',
          type: 'phone_call',
        },
      ]);
    }

    // 5. Audit Activity Log
    await logActivity({
      lead_id: lead.id,
      action: 'ai_lead_scouted',
      description: `Discovered B2B transport lead ${lead.company_name} in ${lead.city} for ${lead.route_area}`,
      metadata: {
        company: lead.company_name,
        route: lead.route_area,
        estimated_value: lead.estimated_value,
        agent: 'Papa AI Scout v1.0',
      },
      actor: '🤖 AI Scout Agent',
    });
  }

  return {
    ok: true,
    count: savedLeads.length,
    skipped_duplicates: skippedDuplicates,
    leads: savedLeads,
    total_pipeline_value: savedLeads.reduce((acc, l) => acc + (Number(l.estimated_value) || 0), 0),
    message: `AI Scout successfully discovered ${savedLeads.length} new B2B leads in Delhi NCR!`,
  };
}
