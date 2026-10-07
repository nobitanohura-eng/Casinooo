import { Lead } from './types';

export interface EmailTemplate {
  id: string;
  name: string;
  language: 'English' | 'Hinglish / Hindi';
  description: string;
  generate: (lead: Partial<Lead>, optoutUrl: string) => { subject: string; body: string; html: string };
}

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function formatEmailBodyToHtml(textBody: string, optoutUrl: string): string {
  const paragraphs = textBody
    .split('\n\n')
    .map((p) => `<p style="margin: 0 0 16px 0; line-height: 1.6; color: #172033; font-size: 15px;">${escapeHtml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Local Goods Delivery Vehicle</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f5f7fb; margin: 0; padding: 24px;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border: 1px solid #e7ebf2; border-radius: 12px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <div style="border-bottom: 2px solid #3659e3; padding-bottom: 12px; margin-bottom: 24px;">
      <span style="font-size: 13px; font-weight: 700; color: #3659e3; letter-spacing: 0.5px; text-transform: uppercase;">Papa Transport Services · Noida NCR</span>
    </div>
    ${paragraphs}
    <div style="margin-top: 36px; padding-top: 20px; border-top: 1px solid #e7ebf2; font-size: 12px; color: #748096; line-height: 1.5;">
      <p style="margin: 0 0 8px 0;">This email was sent regarding B2B commercial transport services in Delhi NCR.</p>
      <p style="margin: 0;">If this service is not relevant to your business, you can safely <a href="${escapeHtml(optoutUrl)}" style="color: #3659e3; text-decoration: underline;">unsubscribe</a> or reply "unsubscribe" and you will not be contacted again.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  tata_ace_noida_en: {
    id: 'tata_ace_noida_en',
    name: 'Tata Ace Gold Local Delivery (Standard English)',
    language: 'English',
    description: 'Official direct outreach for factory/warehouse cartons and local cargo in Noida NCR.',
    generate: (lead: Partial<Lead>, optoutUrl: string) => {
      const greeting = lead.contact_name ? `Namaste ${lead.contact_name},` : 'Namaste,';
      const city = lead.city || 'Noida–Delhi NCR';
      const vehicle = lead.vehicle_requirement || 'Tata Ace Gold';
      const category = lead.category ? lead.category.toLowerCase() : 'garment cartons and packaging material';

      const subject = `Local Goods Delivery Vehicle Available — ${city}`;
      const body = `${greeting}

We provide small commercial vehicle transportation for local goods movement in the ${city} area.

Our ${vehicle} may be suitable for ${category}, packaging material, and factory-to-warehouse deliveries, subject to load and route requirements.

If you need an additional vehicle for local deliveries, please let us know. We would be happy to discuss your route, schedule, and transport rates.

Regards,
Transport Services
${city}

---
To stop future emails, click here: ${optoutUrl}`;

      return {
        subject,
        body,
        html: formatEmailBodyToHtml(body, optoutUrl),
      };
    },
  },

  tata_ace_hinglish: {
    id: 'tata_ace_hinglish',
    name: 'Local Transport Outreach (Simple Hinglish)',
    language: 'Hinglish / Hindi',
    description: 'Clear, polite conversational Hindi/English for direct local factory owners and dispatch managers.',
    generate: (lead: Partial<Lead>, optoutUrl: string) => {
      const greeting = lead.contact_name ? `Namaste ${lead.contact_name} ji,` : 'Namaste ji,';
      const city = lead.city || 'Noida–Delhi NCR';
      const vehicle = lead.vehicle_requirement || 'Tata Ace Gold (Chota Hathi)';

      const subject = `Local Delivery Gaddi Requirement — ${lead.company_name || city}`;
      const body = `${greeting}

Hum ${city} area mein local factory aur warehouse delivery ke liye ${vehicle} transport service provide karte hain.

Agar aapko cartons, packaging material ya local dispatch ke liye regular ya trip-basis gaddi ki requirement rehti ho, to kripya batayein.

Hum aapke route aur transport rates discuss karne ke liye uplabdh hain.

Dhanyawaad,
Papa Transport Services
${city}

---
Agar aapko dobara email nahi chahiye, to yahan unsubscribe karein: ${optoutUrl}`;

      return {
        subject,
        body,
        html: formatEmailBodyToHtml(body, optoutUrl),
      };
    },
  },

  garment_cartons_en: {
    id: 'garment_cartons_en',
    name: 'Garments & Export Dispatch (English)',
    language: 'English',
    description: 'Tailored for garment exporters and manufacturing units in Noida Sectors 57-65 & Okhla.',
    generate: (lead: Partial<Lead>, optoutUrl: string) => {
      const greeting = lead.contact_name ? `Namaste ${lead.contact_name},` : 'Namaste,';
      const city = lead.city || 'Noida–Delhi NCR';

      const subject = `Local Garment Carton Transport Support — ${lead.company_name || 'Noida Sector'}`;
      const body = `${greeting}

We operate dedicated small commercial vehicles for garment cartons and production movements across ${city}.

Our vehicle is available for export carton dispatches, washing unit transfers, and fabric pickup with punctual loading and careful handling.

If you have an immediate or upcoming requirement, please share your preferred route and timings.

Regards,
Papa Transport Services
${city}

---
To stop future emails, click here: ${optoutUrl}`;

      return {
        subject,
        body,
        html: formatEmailBodyToHtml(body, optoutUrl),
      };
    },
  },
};
